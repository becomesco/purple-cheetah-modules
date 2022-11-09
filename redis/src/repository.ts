import * as crypto from 'crypto';
import { ObjectUtility, useLogger } from '@becomes/purple-cheetah';
import { Module, ObjectUtilityError } from '@becomes/purple-cheetah/types';
import { useRedis } from './main';
import type {
  Redis,
  RedisEntity,
  RedisRepository,
  RedisRepositoryConfig,
} from './types';
import { RedisIndexingHelper } from './indexing-helper';

export function createRedisRepository<
  Model extends RedisEntity = RedisEntity,
  Methods = unknown,
>(
  config: RedisRepositoryConfig<Model, Methods>,
  onReady?: (repo: RedisRepository<Model, Methods>) => void,
): Module {
  const indexesCollection = `${config.collection}:indexes`;
  const logger = useLogger({ name: config.name });
  let redis: Redis;

  function checkSchema(entity: Model) {
    const result = ObjectUtility.compareWithSchema(
      entity,
      config.schema,
      `${config.collection}`,
    );
    if (result instanceof ObjectUtilityError) {
      throw new Error(`Invalid Entity schema: ${result.message}`);
    }
  }

  async function addIndex(id: string) {
    if (id) {
      await redis.client.lPush(indexesCollection, id);
    }
  }

  async function removeIndex(id: string) {
    await redis.client.lRem(indexesCollection, 0, id);
  }

  let indexingHelper: RedisIndexingHelper;

  const repo: RedisRepository<Model, Methods> = {
    name: config.name,
    collection: config.collection,
    schema: config.schema,
    methods: {} as never,
    indexingHelper: null as never,

    async findById(id) {
      const result = await redis.client.hGetAll(`${config.collection}:${id}`);
      if (JSON.stringify(result) === '{}') {
        return null;
      }
      const output = redis.remakeH<Model>(config.schema, result);
      output._id = id;
      return output;
    },

    async findAll() {
      const output: Model[] = [];
      const indexes = await redis.client.lRange(
        indexesCollection,
        0,
        await redis.client.lLen(indexesCollection),
      );
      for (let i = 0; i < indexes.length; i++) {
        const id = indexes[i];
        const entity = await repo.findById(id);
        if (entity) {
          output.push(entity);
        } else {
          removeIndex(id);
        }
      }
      return output;
    },

    async findAllById(ids) {
      const output: Model[] = [];
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const entity = await repo.findById(id);
        if (entity) {
          output.push(entity);
        } else {
          removeIndex(id);
        }
      }
      return output;
    },

    async findOne(indexingKey, query, type) {
      const result = await repo.findOneByIndexingKey(indexingKey, type);
      if (result) {
        return result;
      }
      const allEntityIndexes = await redis.client.lRange(
        indexesCollection,
        0,
        await redis.client.lLen(indexesCollection),
      );
      for (let i = 0; i < allEntityIndexes.length; i++) {
        const id = allEntityIndexes[i];
        const entity = await repo.findById(id);
        if (entity) {
          if (query(entity)) {
            await indexingHelper.addIds(indexingKey, entity._id);
            await indexingHelper.setQueryState(indexingKey, true);
            await indexingHelper.addQueryKey(indexingKey);
            return entity;
          }
        } else {
          removeIndex(id);
        }
      }
      return null;
    },

    async find(indexingKey, query, type) {
      const result = await repo.findByIndexingKey(indexingKey, type);
      if (result) {
        return result;
      }
      const allEntityIndexes = await redis.client.lRange(
        indexesCollection,
        0,
        await redis.client.lLen(indexesCollection),
      );
      const output: Model[] = [];
      for (let i = 0; i < allEntityIndexes.length; i++) {
        const id = allEntityIndexes[i];
        const entity = await repo.findById(id);
        if (entity) {
          if (query(entity)) {
            output.push(entity);
          }
        } else {
          removeIndex(id);
        }
      }
      await indexingHelper.addIds(
        indexingKey,
        output.map((e) => e._id),
      );
      await indexingHelper.setQueryState(indexingKey, true);
      await indexingHelper.addQueryKey(indexingKey);
      return output;
    },

    async findByIndexingKey(indexingKey) {
      if (!(await indexingHelper.getQueryState(indexingKey))) {
        return null;
      }
      const output: Model[] = [];
      const indexes = await indexingHelper.getIndexes(indexingKey);
      for (let i = 0; i < indexes.length; i++) {
        const id = indexes[i];
        const entity = await repo.findById(id);
        if (entity) {
          output.push(entity);
        } else {
          removeIndex(id);
        }
      }
      return output;
    },

    async findOneByIndexingKey(indexingKey) {
      if (!(await indexingHelper.getQueryState(indexingKey))) {
        return null;
      }
      const indexes = await indexingHelper.getIndexes(indexingKey);
      return await repo.findById(indexes[0]);
    },

    async set(entity) {
      if (!entity._id) {
        entity._id = crypto
          .createHash('sha1')
          .update(Date.now() + crypto.randomBytes(8).toString('hex'))
          .digest('hex');
      }
      try {
        checkSchema(entity);
      } catch (error) {
        logger.error('add', error);
        throw error;
      }
      if (!(await repo.findById(entity._id))) {
        await addIndex(entity._id);
      }

      await redis.hSetObject(entity._id, config.collection, '', {
        ...entity,
        _id: undefined,
      });
      return entity;
    },

    async setMany(entities) {
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        await repo.set(entity);
      }
      return entities;
    },

    async deleteById(id) {
      const result = await redis.client.hGetAll(`${config.collection}:${id}`);
      if (JSON.stringify(result) === '{}') {
        return;
      }
      await removeIndex(id);
      const keys = Object.keys(result);
      await redis.client.hDel(`${config.collection}:${id}`, keys);
    },

    async deleteAllById(ids) {
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        await repo.deleteById(id);
      }
    },

    async count() {
      return await redis.client.lLen(indexesCollection);
    },
  };

  async function init() {
    redis = useRedis();
    indexingHelper = new RedisIndexingHelper(config.collection, redis);
    repo.indexingHelper = indexingHelper;
    if (config.methods) {
      repo.methods = await config.methods({
        repo,
        redis,
        indexingHelper,
        collection: config.collection,
        name: config.name,
      });
    }
    if (onReady) {
      onReady(repo);
    }
  }

  return {
    name: config.name,
    initialize({ next }) {
      init()
        .then(() => {
          next();
        })
        .catch((err) => {
          next(err);
        });
    },
  };
}
