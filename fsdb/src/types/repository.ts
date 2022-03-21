import type { FSDBEntity } from './entity';
import type { Logger, ObjectSchema } from '@becomes/purple-cheetah/types';

export type FSDBRepositoryQuery<Entity> = (entity: Entity) => boolean;

export interface FSDBRepositoryConfig<Entity extends FSDBEntity, Methods> {
  /**
   * Name of the repository. Used for organizing logs and errors.
   */
  name: string;
  /**
   * All objects written to this repository will have to follow
   * specified schema.
   */
  schema: ObjectSchema;
  /**
   * Name of the collection where objects/entities will be stores.
   * For example: `users`
   */
  collection: string;

  /**
   * Specify custom methods for this repository.
   */
  methods?(data: {
    /**
     * Repository name (specified in `config`).
     */
    name: string;
    /**
     * Repository schema (specified in `config`).
     */
    schema: ObjectSchema;
    /**
     * Repository collection name (specified in `config`).
     */
    collection: string;
    /**
     * Repository itself. Useful for accessing default methods.
     */
    repo: FSDBRepository<Entity, unknown>;
    /**
     * Repository logger.
     */
    logger: Logger;
  }): Methods;
}

/**
 * FSDB repository methods.
 */
export interface FSDBRepository<Entity extends FSDBEntity, Methods> {
  collection: string;
  /**
   * Custom repository methods.
   */
  methods: Methods;
  /**
   * Will return the first entity which matches the query.
   */
  findBy(query: FSDBRepositoryQuery<Entity>): Promise<Entity | null>;
  /**
   * Will return all entities which match the query.
   */
  findAllBy(query: FSDBRepositoryQuery<Entity>): Promise<Entity[]>;
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
  updateMany(
    query: FSDBRepositoryQuery<Entity>,
    update: (entity: Entity) => Entity,
  ): Promise<Entity[]>;
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
  deleteOne(query: FSDBRepositoryQuery<Entity>): Promise<boolean>;
  /**
   * Delete all entities which match the query.
   */
  deleteMany(query: FSDBRepositoryQuery<Entity>): Promise<boolean>;
  /**
   * Return number of entities.
   */
  count(): Promise<number>;
}
