import type { ObjectSchema } from '@becomes/purple-cheetah/types';
import type {
  RedisClientOptions,
  RedisFunctions,
  RedisModules,
  RedisScripts,
  RedisClientType,
} from 'redis';
import type { RedisEntity } from './entity';
import type { RedisRepository } from './repository';

export interface RedisConfig<
  Modules extends RedisModules = RedisModules,
  Functions extends RedisFunctions = RedisFunctions,
  Scripts extends RedisScripts = RedisScripts,
> extends RedisClientOptions<Modules, Functions, Scripts> {
  name?: string;
}

export interface Redis<
  Modules extends RedisModules = RedisModules,
  Functions extends RedisFunctions = RedisFunctions,
  Scripts extends RedisScripts = RedisScripts,
> {
  client: RedisClientType<Modules, Functions, Scripts>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hSetObject(
    id: string,
    collection: string,
    baseKey: string,
    obj: any,
  ): Promise<void>;
  hSet(hash: string, key: string, item: unknown): Promise<void>;
  remakeH<Model extends RedisEntity = RedisEntity>(
    schema: ObjectSchema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    obj: any,
    baseKey?: string,
  ): Model;
  repo: {
    register(collection: string, repo: RedisRepository): void;
    use<Model extends RedisEntity = RedisEntity>(
      collection: string,
    ): RedisRepository<Model> | null;
  };
}
