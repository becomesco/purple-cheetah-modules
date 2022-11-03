import type { Module, ObjectSchema } from '@becomes/purple-cheetah/types';
import type {
  MongoDBRedisEntity,
  MongoDBRedisRepository,
  MongoDBRedisRepositoryConfig,
} from './types';
import { useLogger } from '@becomes/purple-cheetah';
import {
  FilterQuery,
  model,
  Schema,
  SchemaDefinitionProperty,
  Types,
  UpdateQuery,
} from 'mongoose';
import type { RedisRepository } from '@becomes/purple-cheetah-mod-redis/types';
import { createRedisRepository } from '@becomes/purple-cheetah-mod-redis';

function objectSchemaToMongoDBSchema(oSchema: ObjectSchema): Schema {
  const schema: SchemaDefinitionProperty<undefined> = {};
  for (const osKey in oSchema) {
    const osItem = oSchema[osKey];
    if (osItem.__type === 'string') {
      schema[osKey] = {
        type: String,
        required: osItem.__required,
      };
    } else if (osItem.__type === 'number') {
      schema[osKey] = {
        type: Number,
        required: osItem.__required,
      };
    } else if (osItem.__type === 'boolean') {
      schema[osKey] = {
        type: Boolean,
        required: osItem.__required,
      };
    } else if (osItem.__type === 'object') {
      if (osItem.__child) {
        schema[osKey] = {
          type: objectSchemaToMongoDBSchema(osItem.__child as ObjectSchema),
          required: osItem.__required,
        };
      }
    } else if (osItem.__type === 'array') {
      if (osItem.__child) {
        if (osItem.__child.__type === 'string') {
          schema[osKey] = {
            type: [String],
            required: osItem.__required,
          };
        } else if (osItem.__child.__type === 'number') {
          schema[osKey] = {
            type: [Number],
            required: osItem.__required,
          };
        } else if (osItem.__child.__type === 'boolean') {
          schema[osKey] = {
            type: [Boolean],
            required: osItem.__required,
          };
        } else if (osItem.__child.__type === 'object') {
          schema[osKey] = {
            type: [
              objectSchemaToMongoDBSchema(
                osItem.__child.__content as ObjectSchema,
              ),
            ],
            required: osItem.__required,
          };
        }
      }
    }
  }
  return new Schema(schema);
}

export function createMongoDBRedisRepository<
  Entity extends MongoDBRedisEntity = MongoDBRedisEntity,
  Methods = unknown,
>(config: MongoDBRedisRepositoryConfig<Entity, Methods>): [Module, Module] {
  const logger = useLogger({ name: config.name });
  const intf = model<Entity & Document>(
    config.collection,
    objectSchemaToMongoDBSchema(config.schema),
  );
  let redisRepo: RedisRepository<Entity> = null as never;
  const redisModule = createRedisRepository<Entity>(
    {
      name: `Redis ${config.name}`,
      collection: config.collection,
      schema: config.schema,
    },
    (repo) => {
      redisRepo = repo;
    },
  );
  let findAllLath = false;

  const self: MongoDBRedisRepository<Entity, Methods> = {
    name: config.name,
    collection: config.collection,
    methods: {} as never,

    async findAll() {
      if (findAllLath) {
        return await redisRepo.findAll();
      }
      const entities = await intf.find().exec();
      await redisRepo.setMany(JSON.parse(JSON.stringify(entities)));
      findAllLath = true;
      return entities;
    },

    async findById(id) {
      const cacheHit = await redisRepo.findById(id);
      if (cacheHit) {
        return cacheHit;
      }
      const entity = await intf
        .findOne({ _id: id } as FilterQuery<unknown>)
        .exec();
      if (entity) {
        await redisRepo.set(JSON.parse(JSON.stringify(entity)));
      }
      return entity;
    },

    async findAllById(ids) {
      const cacheHit = await redisRepo.findAllById(ids);
      if (cacheHit.length === ids.length) {
        return cacheHit;
      }
      const entities = await intf
        .find({ _id: { $in: ids } } as FilterQuery<unknown>)
        .exec();
      await redisRepo.setMany(JSON.parse(JSON.stringify(entities)));
      return entities;
    },

    async add(entity) {
      if (!entity._id || !Types.ObjectId.isValid(entity._id)) {
        entity._id = `${new Types.ObjectId()}`;
      }
      entity.createdAt = Date.now();
      entity.updatedAt = Date.now();
      const ent = await intf.create(entity);
      if (ent) {
        redisRepo.set(JSON.parse(JSON.stringify(ent)));
      }
      return ent;
    },

    async addMany(entities) {
      const output: Entity[] = [];
      for (let i = 0; i < entities.length; i++) {
        output.push(await self.add(entities[i]));
      }
      return output;
    },

    async update(entity) {
      if (!Types.ObjectId.isValid(entity._id)) {
        throw Error('Invalid ID');
      }
      entity.updatedAt = Date.now();
      await intf
        .updateOne(
          { _id: entity._id } as FilterQuery<unknown>,
          entity as UpdateQuery<unknown>,
        )
        .exec();
      await redisRepo.set(JSON.parse(JSON.stringify(entity)));
      return entity;
    },

    async updateMany(entities) {
      const output: Entity[] = [];
      for (let i = 0; i < entities.length; i++) {
        output.push(await self.update(entities[i]));
      }
      return output;
    },

    async deleteById(id) {
      const result = await intf
        .deleteOne({ _id: id } as FilterQuery<unknown>)
        .exec();
      const ok = result.deletedCount === 1;
      if (ok) {
        await redisRepo.deleteById(id);
      }
      return ok;
    },

    async deleteAllById(ids) {
      const result = await intf
        .deleteMany({ _id: { $in: ids } } as FilterQuery<unknown>)
        .exec();
      await redisRepo.deleteAllById(ids);
      return result.deletedCount === ids.length;
    },

    async count() {
      if (findAllLath) {
        return await redisRepo.count();
      }
      return await intf.countDocuments().exec();
    },
  };

  return [
    redisModule,
    {
      name: config.name,
      initialize({ next }) {
        if (config.methods) {
          self.methods = config.methods({
            collection: config.collection,
            logger,
            mongoDBInterface: intf,
            repo: self,
            name: config.name,
            redisRepo,
            schema: config.schema,
          });
        }
        if (config.onReady) {
          config.onReady(self);
        }
        next();
      },
    },
  ];
}
