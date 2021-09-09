import { model, Document, FilterQuery, Types, UpdateQuery } from 'mongoose';
import { useLogger } from '@becomes/purple-cheetah';
import type {
  MongoDBEntity,
  MongoDBRepository,
  MongoDBRepositoryConfig,
} from './types';

export function createMongoDBRepository<Entity extends MongoDBEntity, Methods>({
  name,
  collection,
  schema,
  methods,
}: MongoDBRepositoryConfig<Entity, Methods>): MongoDBRepository<
  Entity,
  Methods
> {
  const logger = useLogger({ name });

  const intf = model<Entity & Document>(collection, schema);
  const self: MongoDBRepository<Entity, Methods> = {
    methods: undefined as never,
    async findBy(query) {
      return intf.findOne(query).exec();
    },
    async findAllBy(query) {
      return intf.find(query).exec();
    },
    async findAll() {
      return await intf.find().exec();
    },
    async findById(id) {
      return await intf.findOne({ _id: id } as FilterQuery<unknown>).exec();
    },
    async findAllById(ids) {
      return await intf
        .find({ _id: { $in: ids } } as FilterQuery<unknown>)
        .exec();
    },
    async add(entity) {
      if (!entity._id || !Types.ObjectId.isValid(entity._id)) {
        entity._id = new Types.ObjectId();
      }
      entity.createdAt = Date.now();
      entity.updatedAt = Date.now();
      return await intf.create(entity);
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
      return result.ok === 1;
    },
    async deleteAllById(ids) {
      const result = await intf
        .deleteMany({ _id: { $in: ids } } as FilterQuery<unknown>)
        .exec();
      return result.ok === 1;
    },
    async deleteOne(query) {
      const result = await intf.deleteOne(query).exec();
      return result.ok === 1;
    },
    async deleteMany(query) {
      const result = await intf.deleteMany(query).exec();
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
      mongoDBInterface: intf,
      logger,
    });
  }
  return self;
}
