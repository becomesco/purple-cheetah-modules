import type { Model } from 'mongoose';
import type { MongoDBRepositoryConfig } from '@becomes/purple-cheetah-mod-mongodb/types';
import type {
  RedisRepositoryConfig,
  RedisRepository,
} from '@becomes/purple-cheetah-mod-redis/types';
import type { MongoDBRedisEntity } from './entity';
import type { Logger, ObjectSchema } from '@becomes/purple-cheetah/types';
import type { MongoDBRedisCacheUtil } from '../cache-util';

export interface MongoDBRedisRepositoryConfig<
  Entity extends MongoDBRedisEntity = MongoDBRedisEntity,
  Methods = unknown,
> extends Omit<
    MongoDBRepositoryConfig<Entity, Methods> &
      RedisRepositoryConfig<Entity, unknown>,
    'methods' | 'schema'
  > {
  schema: ObjectSchema;
  onReady?: (repo: MongoDBRedisRepository<Entity, Methods>) => void;
  methods?(config: {
    name: string;
    collection: string;
    schema: ObjectSchema;
    repo: MongoDBRedisRepository<Entity, Methods>;
    mongoDBInterface: Model<Entity & Document>;
    logger: Logger;
    redisRepo: RedisRepository<Entity, unknown>;
    cacheUtil: MongoDBRedisCacheUtil<Entity>;
  }): Methods;
}

export interface MongoDBRedisRepository<
  Entity extends MongoDBRedisEntity = MongoDBRedisEntity,
  Methods = unknown,
> {
  name: string;
  collection: string;
  /**
   * Custom repository methods.
   */
  methods: Methods;
  /**
   * Will return all entities in the database.
   */
  findAll(): Promise<Entity[]>;
  /**
   * Will return all entities with matching IDs.
   */
  findAllById(ids: string[]): Promise<Entity[]>;
  /**
   * Will return en entity with the specified ID.
   */
  findById(id: string): Promise<Entity | null>;
  /**
   * Add new entity to the database. If ID is not available, it will be
   * automatically created. `createdAt` and `updatedAt` properties will be
   * overwritten.
   */
  add(entity: Entity): Promise<Entity>;
  /**
   * Add many new entities to the database. If ID is not available in entity,
   * it will be automatically created. `createdAt` and `updatedAt` properties
   * will be overwritten.
   */
  addMany(entities: Entity[]): Promise<Entity[]>;
  /**
   * Update existing entity in the database. `createdAt` and `updatedAt`
   * properties will be overwritten.
   */
  update(entity: Entity): Promise<Entity>;
  /**
   * Update existing entities in the database. `createdAt` and `updatedAt`
   * properties will be overwritten.
   */
  updateMany(entities: Entity[]): Promise<Entity[]>;
  /**
   * Delete an entity with the specified ID.
   */
  deleteById(id: string): Promise<boolean>;
  /**
   * Delete all entities with matching IDs.
   */
  deleteAllById(ids: string[]): Promise<boolean>;
  /**
   * Return number of entities.
   */
  count(): Promise<number>;
}
