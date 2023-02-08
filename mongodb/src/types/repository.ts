import type { FilterQuery, Schema, Document, Model } from 'mongoose';
import type { Logger } from '@becomes/purple-cheetah/types';
import type { MongoDBEntity } from './entity';

/**
 * Configuration object for creating MongoDB repository.
 */
export interface MongoDBRepositoryConfig<
  Entity extends MongoDBEntity,
  Methods,
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
   * Custom repository methods.
   */
  methods?(data: {
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
    repo: MongoDBRepository<Entity, unknown>;
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
 * MongoDB repository methods.
 */
export interface MongoDBRepository<Entity extends MongoDBEntity, Methods> {
  collection: string;
  /**
   * Custom repository methods.
   */
  methods: Methods;
  /**
   * Will return the first entity which matches the query.
   */
  findBy(query: FilterQuery<unknown>): Promise<Entity | null>;
  /**
   * Will return all entities which match the query.
   */
  findAllBy(query: FilterQuery<unknown>): Promise<Entity[]>;
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
  add(entity: Entity, manualCU?: boolean): Promise<Entity>;
  /**
   * Add many new entities to the database. If ID is not available in entity,
   * it will be automatically created. `createdAt` and `updatedAt` properties
   * will be overwritten.
   */
  addMany(entities: Entity[], manualCU?: boolean): Promise<Entity[]>;
  /**
   * Update existing entity in the database. `createdAt` and `updatedAt`
   * properties will be overwritten.
   */
  update(entity: Entity, manualCU?: boolean): Promise<Entity>;
  /**
   * Update existing entities in the database. `createdAt` and `updatedAt`
   * properties will be overwritten.
   */
  updateMany(entities: Entity[], manualCU?: boolean): Promise<Entity[]>;
  /**
   * Delete an entity with the specified ID.
   */
  deleteById(id: string): Promise<boolean>;
  /**
   * Delete all entities with matching IDs.
   */
  deleteAllById(ids: string[]): Promise<boolean>;
  /**
   * Delete a first entity which matches the query.
   */
  deleteOne(query: FilterQuery<unknown>): Promise<boolean>;
  /**
   * Delete all entities which match the query.
   */
  deleteMany(query: FilterQuery<unknown>): Promise<boolean>;
  /**
   * Return number of entities.
   */
  count(): Promise<number>;
}
