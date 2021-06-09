import { v4 as uuidv4 } from 'uuid';
import { useLogger } from '@becomes/purple-cheetah';
import type {
  MemCacheEventHandler,
  MemCacheEventType,
  MemCacheHandler,
  MemCacheHandlerConfig,
  MemCacheItems,
} from './types';

/**
 * Creates a mem-cache handler.
 */
export function createMemCacheHandler<Item, Methods>(
  config: MemCacheHandlerConfig<Item, Methods>,
): MemCacheHandler<Item, Methods> {
  const cache: MemCacheItems<Item> = {};
  const subscriptions: {
    [id: string]: MemCacheEventHandler<Item>;
  } = {};
  const logger = useLogger({ name: config.name });

  function triggerEvent(type: MemCacheEventType, item: Item) {
    const ids = Object.keys(subscriptions);
    for (let i = 0; i < ids.length; i++) {
      const sub = subscriptions[ids[i]];
      try {
        const result = sub(type, item);
        if (result instanceof Promise) {
          result.catch((e) => {
            logger.error('triggerEvent', e);
          });
        }
      } catch (e) {
        logger.error('triggerEvent', e);
      }
    }
  }

  const self: MemCacheHandler<Item, Methods> = {
    name() {
      return '' + config.name;
    },
    find(query) {
      const output: Item[] = [];
      const ids = Object.keys(cache);
      for (let i = 0; i < ids.length; i++) {
        const item = cache[ids[i]];
        if (query(item)) {
          output.push({ ...item });
        }
      }
      return output;
    },
    findOne(query) {
      const ids = Object.keys(cache);
      for (let i = 0; i < ids.length; i++) {
        const item = cache[ids[i]];
        if (query(item)) {
          return { ...item };
        }
      }
      return null;
    },
    findAll() {
      const output: Item[] = [];
      const ids = Object.keys(cache);
      for (let i = 0; i < ids.length; i++) {
        const item = cache[ids[i]];
        output.push({ ...item });
      }
      return output;
    },
    findAllById(ids) {
      const output: Item[] = [];
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (cache[id]) {
          output.push({ ...cache[id] });
        }
      }
      return output;
    },
    findById(id) {
      if (cache[id]) {
        return { ...cache[id] };
      }
      return null;
    },
    set(id, item) {
      let type: MemCacheEventType;
      if (cache[id]) {
        type = 'update';
      } else {
        type = 'add';
      }
      cache[id] = { ...item };
      triggerEvent(type, { ...item });
    },
    remove(id) {
      if (cache[id]) {
        const item = { ...cache[id] };
        delete cache[id];
        triggerEvent('remove', item);
      }
    },
    subscribe(handler) {
      const id = uuidv4();
      subscriptions[id] = handler;
      return () => {
        delete subscriptions[id];
      };
    },
    methods: undefined as never,
  };
  if (config.methods) {
    self.methods = config.methods({
      cache,
      self,
      config,
    });
  }
  return self;
}
