import { model, Document, FilterQuery, Types, UpdateQuery } from 'mongoose';
import type {
  MongoDBCachedRepository,
  MongoDBCachedRepositoryConfig,
  MongoDBEntity,
} from './types';
import { useLogger } from '@becomes/purple-cheetah';
import { createMemCacheHandler } from '@becomes/purple-cheetah-mod-mem-cache/handler';

export function createMongoDBCachedRepository<
  Entity extends MongoDBEntity,
  Methods,
  CacheMethods,
>({
  name,
  collection,
  schema,
  cacheMethods,
  methods,
}: MongoDBCachedRepositoryConfig<Entity, Methods, CacheMethods>) {
  const logger = useLogger({ name });

  const cacheHandler = createMemCacheHandler<Entity, CacheMethods>({
    name: 'Cache_' + name,
    methods: cacheMethods,
  });
  let findAllLath = false;

  const intf = model<Entity & Document>(collection, schema);
  const self: MongoDBCachedRepository<Entity, Methods> = {
    methods: undefined as never,
    async findAll() {
      if (findAllLath) {
        return cacheHandler.findAll();
      }
      const entities = await intf.find().exec();
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        cacheHandler.set(entity._id.toHexString(), entity);
      }
      findAllLath = true;
      return entities;
    },
    async findById(id) {
      const cacheHit = cacheHandler.findById(id);
      if (cacheHit) {
        return cacheHit;
      }
      const entity = await intf
        .findOne({ _id: id } as FilterQuery<unknown>)
        .exec();
      if (entity) {
        cacheHandler.set(entity._id.toHexString(), entity);
      }
      return entity;
    },
    async findAllById(ids) {
      const cacheHit = cacheHandler.findAllById(ids);
      if (cacheHit.length === ids.length) {
        return cacheHit;
      }
      const entities = await intf
        .find({ _id: { $in: ids } } as FilterQuery<unknown>)
        .exec();
      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        cacheHandler.set(entity._id.toHexString(), entity);
      }
      return entities;
    },
    async add(entity) {
      if (!entity._id || !Types.ObjectId.isValid(entity._id)) {
        entity._id = new Types.ObjectId();
      }
      entity.createdAt = Date.now();
      entity.updatedAt = Date.now();
      const ent = await intf.create(entity);
      if (ent) {
        cacheHandler.set(ent._id.toHexString(), ent);
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
      cacheHandler.set(entity._id.toHexString(), entity);
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
      const ok = result.ok === 1;
      if (ok) {
        cacheHandler.remove(id);
      }
      return ok;
    },
    async deleteAllById(ids) {
      const result = await intf
        .deleteMany({ _id: { $in: ids } } as FilterQuery<unknown>)
        .exec();
      const ok = result.ok === 1;
      if (ok) {
        for (let i = 0; i < ids.length; i++) {
          cacheHandler.remove(ids[i]);
        }
      }
      return result.ok === 1;
    },
    async count() {
      return await intf.countDocuments().exec();
    },
  };
  if (methods) {
    self.methods = methods({
      name,
      collection,
      schema,
      repo: self,
      logger,
      mongoDBInterface: intf,
      cacheHandler,
    });
  }
  return self;
}
