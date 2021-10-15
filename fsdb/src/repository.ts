import * as crypto from 'crypto';
import { useFSDB } from './main';
import { useLogger, useObjectUtility } from '@becomes/purple-cheetah';
import type {
  FSDBCacheCollection,
  FSDBEntity,
  FSDBRepository,
  FSDBRepositoryConfig,
} from './types';
import { ObjectUtilityError } from '@becomes/purple-cheetah/types';

const objectUtility = useObjectUtility();

/**
 * Get an instance of previously created FSDB repository.
 */
export function useFSDBRepository<T extends FSDBEntity, K>(
  /**
   * Name of the collection to which target repository is connected.
   */
  collection: string,
): FSDBRepository<T, K> | null {
  return useFSDB().repo.use<T, K>(collection);
}

/**
 * Create the FSDB repository. To call this function successfully,
 * FSDB module must be mounted.
 */
export function createFSDBRepository<T extends FSDBEntity, K>({
  name,
  collection,
  schema,
  methods,
}: FSDBRepositoryConfig<T, K>): FSDBRepository<T, K> {
  const logger = useLogger({ name });
  const fsdb = useFSDB().register<T>(collection);

  function checkSchema(entity: T) {
    const result = objectUtility.compareWithSchema(entity, schema, 'entity');
    if (result instanceof ObjectUtilityError) {
      throw new Error(`Invalid Entity schema: ${result.message}`);
    }
  }
  function throwError(place: string, message: unknown) {
    logger.error(place, message);
    return Error(message as string);
  }
  function getAllEntities(): T[] {
    const output: T[] = [];
    const entities: FSDBCacheCollection<T> = JSON.parse(
      JSON.stringify(fsdb.get()),
    );
    const entityIds = Object.keys(entities);
    for (let i = 0; i < entityIds.length; i++) {
      output.push(entities[entityIds[i]]);
    }
    return output;
  }

  const self: FSDBRepository<T, K> = {
    methods: undefined as never,
    async findBy(query) {
      const entities = getAllEntities();
      for (let i = 0; i < entities.length; i++) {
        if (query(entities[i])) {
          return entities[i];
        }
      }
      return null;
    },
    async findAllBy(query) {
      const entities = getAllEntities();
      const output: T[] = [];
      for (let i = 0; i < entities.length; i++) {
        if (query(entities[i])) {
          output.push(entities[i]);
        }
      }
      return output;
    },
    async findAll() {
      return getAllEntities();
    },
    async findById(id) {
      return self.findBy((e) => e._id === id);
    },
    async findAllById(ids) {
      return self.findAllBy((e) => ids.includes(e._id));
    },
    async add(entity) {
      if (!entity._id) {
        entity._id = crypto
          .createHash('sha256')
          .update(Date.now() + crypto.randomBytes(8).toString('hex'))
          .digest('hex');
      } else {
        if (await self.findById(entity._id)) {
          throw throwError(
            'add',
            `Entity with ID "${entity._id}" already exist. ` +
              `Please use "update" method.`,
          );
        }
      }
      entity.createdAt = Date.now();
      entity.updatedAt = Date.now();
      try {
        checkSchema(entity);
      } catch (e) {
        logger.error('add', e);
        throw e;
      }
      fsdb.set(JSON.parse(JSON.stringify(entity)));
      return entity;
    },
    async addMany(entities) {
      const output: T[] = [];
      for (let i = 0; i < entities.length; i++) {
        output.push(await self.add(entities[i]));
      }
      return output;
    },
    async update(entity) {
      const targetEntity = await self.findById(entity._id);
      if (!targetEntity) {
        throw throwError(
          'update',
          `Entity with ID "${entity._id}" does not exist. ` +
            `Please use "add" method.`,
        );
      }
      entity.createdAt = targetEntity.createdAt;
      entity.updatedAt = Date.now();
      try {
        checkSchema(entity);
      } catch (e) {
        logger.error('update', e);
        throw e;
      }
      fsdb.set(JSON.parse(JSON.stringify(entity)));
      return entity;
    },
    async updateMany(query, update) {
      const output: T[] = [];
      const entities = getAllEntities();
      for (let i = 0; i < entities.length; i++) {
        let entity = entities[i];
        const targetEntity: T = JSON.parse(JSON.stringify(entity));
        if (query(entity)) {
          entity = update(entity);
          entity._id = targetEntity._id;
          entity.createdAt = targetEntity.createdAt;
          entity.updatedAt = Date.now();
          try {
            checkSchema(entity);
          } catch (e) {
            logger.error('updateMany', e);
            throw e;
          }
          fsdb.set(JSON.parse(JSON.stringify(entity)));
          output.push(entity);
        }
      }
      return output;
    },
    async deleteById(id: string) {
      return self.deleteOne((e) => e._id === id);
    },
    async deleteAllById(ids) {
      return self.deleteMany((e) => ids.includes(e._id));
    },
    async deleteOne(query) {
      const entities = getAllEntities();
      for (let i = 0; i < entities.length; i++) {
        if (query(entities[i])) {
          fsdb.remove(entities[i]._id);
          return true;
        }
      }
      return false;
    },
    async deleteMany(query) {
      const entities = getAllEntities();
      for (let i = 0; i < entities.length; i++) {
        if (query(entities[i])) {
          fsdb.remove(entities[i]._id);
        }
      }
      return true;
    },
    async count() {
      return Object.keys(fsdb.get()).length;
    },
  };
  if (methods) {
    self.methods = methods({
      name,
      collection,
      schema,
      repo: self,
      logger,
    });
  }
  useFSDB().repo.create(collection, self);
  return self;
}
