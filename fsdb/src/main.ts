import * as crypto from 'crypto';
import * as path from 'path';
import type {
  FSDB,
  FSDBCache,
  FSDBCacheCollection,
  FSDBConfig,
  FSDBEntity,
  FSDBRepository,
} from './types';
import { useFS, useLogger } from '@becomes/purple-cheetah';
import type { Module } from '@becomes/purple-cheetah/types';

let output = path.join(process.cwd(), '.fsdb.json');
let saveInterval: NodeJS.Timeout;
let cache: FSDBCache = {};
let cacheHash = '';
const logger = useLogger({
  name: 'FSDB',
});
const fs = useFS();
const repos: {
  [collection: string]: FSDBRepository<FSDBEntity, unknown>;
} = {};
const fsdb: FSDB = {
  register<T extends FSDBEntity>(collection: string) {
    if (!cache[collection]) {
      cache[collection] = {};
    }
    return {
      get() {
        if (!cache[collection]) {
          cache[collection] = {};
        }
        return cache[collection] as FSDBCacheCollection<T>;
      },
      set(entity) {
        if (!cache[collection]) {
          cache[collection] = {};
        }
        cache[collection][entity._id] = entity;
      },
      remove(id) {
        if (!cache[collection]) {
          cache[collection] = {};
        }
        delete cache[collection][id];
      },
    };
  },
  _setCache(c) {
    cache = JSON.parse(JSON.stringify(c));
  },
  repo: {
    create<T extends FSDBEntity, K>(
      collection: string,
      repo: FSDBRepository<T, K>,
    ): void {
      if (!repos[collection]) {
        repos[collection] = repo;
      }
    },
    use<T extends FSDBEntity, K>(
      collection: string,
    ): FSDBRepository<T, K> | null {
      if (repos[collection]) {
        return repos[collection] as FSDBRepository<T, K>;
      }
      return null;
    },
  },
};

async function save(): Promise<void> {
  const cacheString = JSON.stringify(cache);
  const hash = crypto.createHash('sha256').update(cacheString).digest('hex');
  if (hash !== cacheHash) {
    await fs.save(output, cacheString);
    cacheHash = hash;
  }
}
async function init(config: FSDBConfig): Promise<void> {
  if (await fs.exist(output, true)) {
    const temp = (await fs.read(output)).toString();
    if (!temp.startsWith('{}')) {
      cache = JSON.parse(temp);
    }
  } else {
    await fs.save(output, '{}');
  }
  cacheHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(cache))
    .digest('hex');
  saveInterval = setInterval(async () => {
    try {
      await save();
    } catch (e) {
      logger.error('save', e);
    }
  }, config.saveInterval);
}

/**
 * Returns an FSDB object created by mounting FSDB module. FSDB module is
 * created by calling `createFSDB` from Purple Cheetah configuration
 * module array.
 */
export function useFSDB(): FSDB {
  return fsdb;
}

/**
 * Creates a FSDB module which is a simple file system database.
 */
export function createFSDB(config: FSDBConfig): Module {
  if (config.output) {
    if (config.output.startsWith('/')) {
      output = config.output + '.fsdb.json';
    } else {
      output = path.join(process.cwd(), config.output + '.fsdb.json');
    }
  }
  if (!config.saveInterval) {
    config.saveInterval = 10000;
  }

  return {
    name: 'FSDB',
    initialize(moduleConfig) {
      init(config)
        .then(() => {
          moduleConfig.next();
        })
        .catch((error) => {
          moduleConfig.next(error);
        });
    },
  };
}

export function deleteFSDB() {
  clearInterval(saveInterval);
}
