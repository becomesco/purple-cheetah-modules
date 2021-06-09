import type { MemCacheItems } from './main';

export type MemCacheHandlerQuery<Item> = (item: Item) => boolean;

export type MemCacheEventType = 'add' | 'update' | 'remove';

export type MemCacheEventHandler<Item> = (
  type: MemCacheEventType,
  item: Item,
) => Promise<void> | void;

export type MemCacheHandlerMethodsFunction<Item, Methods> = (data: {
  cache: MemCacheItems<Item>;
  self: MemCacheHandler<Item, unknown>;
  config: MemCacheHandlerConfig<Item, Methods>;
}) => Methods;

/**
 * Configuration object for the mem-cache handler.
 */
export interface MemCacheHandlerConfig<Item, Methods> {
  /**
   * Name of the handler. Used for organizing logs and errors.
   */
  name: string;
  /**
   * Custom methods for the mem-cache handler.
   */
  methods?: MemCacheHandlerMethodsFunction<Item, Methods>;
}

export interface MemCacheHandler<Item, Methods> {
  /**
   * Returns a name of the handler.
   */
  name(): string;
  /**
   * Returns all items that match the query.
   */
  find(query: MemCacheHandlerQuery<Item>): Item[];
  /**
   * Returns a first items which matches the query.
   */
  findOne(query: MemCacheHandlerQuery<Item>): Item | null;
  /**
   * Returns all items.
   */
  findAll(): Item[];
  /**
   * Returns all items with matching IDs.
   */
  findAllById(ids: string[]): Item[];
  /**
   * Returns item with matching ID.
   */
  findById(id: string): Item | null;
  /**
   * Add new item or update existing.
   */
  set(id: string, item: Item): void;
  /**
   * Remove existing item by its ID.
   */
  remove(id: string): void;
  /**
   * Subscribe to events. This method returns a function which should be
   * called to unsubscribe the handler.
   */
  subscribe(handler: MemCacheEventHandler<Item>): () => void;
  /**
   * Custom methods specified in the handler configuration object.
   */
  methods: Methods;
}
