import type { MongoDBEntity } from './entiry';
import type { Schema, Model, Document } from 'mongoose';
import type {
  MemCacheHandler,
  MemCacheHandlerMethodsFunction
} from "@becomes/purple-cheetah-mod-mem-cache";
import type { Logger } from "@becomes/purple-cheetah/types";

/**
 * Configuration object for cached MongoDB repository.
 */
export interface MongoDBCachedRepositoryConfig<
  Entity extends MongoDBEntity,
  Methods,
  CacheMethods,
> {
  /**
   * Name of the repository. Used for organizing logs and errors.
   */
  name: string;
  /**
   * Schema which all entities written to the database must follow.
   */
  schema: Schema;
  /**
   * Name of the collection the entities will be saved.
   * For example: `users`
   */
  collection: string;
  /**
   * Custom methods for mem-cache handler.
   */
  cacheMethods?: MemCacheHandlerMethodsFunction<Entity, CacheMethods>;
  /**
   * Custom repository methods.
   */
  methods?(data: {
    /**
     * Mem-cache handler.
     */
    cacheHandler: MemCacheHandler<Entity, CacheMethods>;
    /**
     * Repository name (specified in `config`).
     */
    name: string;
    /**
     * Repository schema (specified in `config`).
     */
    schema: Schema;
    /**
     * Repository collection name (specified in `config`).
     */
    collection: string;
    /**
     * Repository itself. Useful for accessing default methods.
     */
    repo: MongoDBCachedRepository<Entity, unknown>;
    /**
     * Mongoose model interface.
     */
    mongoDBInterface: Model<Entity & Document>;
    /**
     * Repository logger.
     */
    logger: Logger;
  }): Methods;
}

/**
 * Cached MongoDB repository methods.
 */
export interface MongoDBCachedRepository<
  Entity extends MongoDBEntity,
  Methods,
> {
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
