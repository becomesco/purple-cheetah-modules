import { useLogger } from '@becomes/purple-cheetah';
import type { Module, ObjectSchema } from '@becomes/purple-cheetah/types';
import {
  createClient,
  RedisClientOptions,
  RedisDefaultModules,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from 'redis';
import type { Redis, RedisEntity, RedisRepository } from './types';

let redis: Redis<
  RedisDefaultModules & RedisModules,
  RedisFunctions,
  RedisScripts
> = null as never;

export function useRedis<
  Modules extends RedisModules = RedisModules,
  Functions extends RedisFunctions = RedisFunctions,
  Scripts extends RedisScripts = RedisScripts,
>(): Redis<RedisDefaultModules & Modules, Functions, Scripts> {
  return redis as never;
}

export function createRedis<
  Modules extends RedisModules = RedisModules,
  Functions extends RedisFunctions = RedisFunctions,
  Scripts extends RedisScripts = RedisScripts,
>(config: RedisClientOptions<Modules, Functions, Scripts>): Module {
  return {
    name: config.name || 'Redis',
    initialize({ next }) {
      const logger = useLogger({ name: 'Redis' });
      const redisClient = createClient<Modules, Functions, Scripts>(config);

      redisClient.on('error', (err) => {
        logger.error('', err);
      });

      const repos: {
        [collection: string]: RedisRepository;
      } = {};

      redisClient
        .connect()
        .then(() => {
          redis = {
            client: redisClient as never,

            async hSet(hash, key, item) {
              await redisClient.hSet(hash, key, item + '');
            },

            async hSetObject(id, collection, baseKey, obj) {
              if (typeof obj !== 'object') {
                await redis.hSet(`${collection}:${id}`, baseKey, obj + '');
              } else {
                for (const key in obj) {
                  const hKey = `${baseKey ? baseKey + ':' : ''}${key}`;
                  if (typeof obj[key] === 'object') {
                    if (obj[key] instanceof Array) {
                      for (let i = 0; i < obj[key].length; i++) {
                        const item = obj[key][i];
                        await redis.hSetObject(
                          id,
                          collection,
                          hKey + ':' + i,
                          item,
                        );
                      }
                    } else {
                      await redis.hSetObject(id, collection, hKey, obj[key]);
                    }
                  } else if (typeof obj[key] !== 'undefined') {
                    await redis.hSet(
                      `${collection}:${id}`,
                      hKey,
                      obj[key] + '',
                    );
                  }
                }
              }
            },

            remakeH(schema, obj, baseKey) {
              const output: any = {};
              for (const schKey in schema) {
                const objKey = `${baseKey ? baseKey + ':' : ''}${schKey}`;
                const schItem = schema[schKey];
                if (schItem.__type === 'object') {
                  output[schKey] = redis.remakeH(
                    schItem.__child as ObjectSchema,
                    obj,
                    objKey,
                  );
                } else if (schItem.__type === 'array') {
                  output[schKey] = [];
                  const arrKeys = Object.keys(obj).filter((e) =>
                    e.startsWith(objKey),
                  );
                  const remaked: {
                    [key: string]: boolean;
                  } = {};
                  for (let i = 0; i < arrKeys.length; i++) {
                    const arrIndex = arrKeys[i]
                      .replace(objKey + ':', '')
                      .split(':')[0];
                    const objArrKey = objKey + ':' + arrIndex;
                    if (!remaked[objArrKey]) {
                      remaked[objArrKey] = true;
                      if (schItem.__child) {
                        if (schItem.__child.__type === 'object') {
                          output[schKey].push(
                            redis.remakeH(
                              schItem.__child.__content as ObjectSchema,
                              obj,
                              objArrKey,
                            ),
                          );
                        } else if (schItem.__child.__type === 'number') {
                          output[schKey].push(parseFloat(obj[objArrKey]));
                        } else if (schItem.__child.__type === 'boolean') {
                          output[schKey].push(
                            obj[objArrKey] === 'true' ? true : false,
                          );
                        } else {
                          output[schKey].push(obj[objArrKey]);
                        }
                      }
                    }
                  }
                } else if (schItem.__type === 'number') {
                  output[schKey] = parseFloat(obj[objKey]);
                } else if (schItem.__type === 'boolean') {
                  output[schKey] = obj[objKey] === 'true' ? true : false;
                } else {
                  output[schKey] = obj[objKey];
                }
              }
              return output;
            },

            repo: {
              register(collection, repo) {
                if (!repos[collection]) {
                  repos[collection] = repo;
                }
              },

              use<Model extends RedisEntity = RedisEntity>(
                collection: string,
              ): RedisRepository<Model> | null {
                if (repos[collection]) {
                  return repos[collection] as RedisRepository<Model>;
                }
                return null;
              },
            },
          };

          next();
        })
        .catch((err) => {
          next(err);
        });
    },
  };
}
