import type {
  RedisIndexingHelperKeyType,
  RedisRepository,
} from '@becomes/purple-cheetah-mod-redis/types';
import type { MongoDBRedisEntity } from './types';

export class MongoDBRedisCacheUtil<
  Entity extends MongoDBRedisEntity = MongoDBRedisEntity,
> {
  constructor(private redisRepo: RedisRepository<Entity, any>) {}

  async fromResources(
    indexingKey: string,
    handler: () => Promise<Entity[]>,
    type?: RedisIndexingHelperKeyType,
  ): Promise<Entity[]> {
    const cacheHit = await this.redisRepo.findByIndexingKey(indexingKey);
    if (cacheHit) {
      return cacheHit;
    }
    const result = await handler();
    await this.redisRepo.indexingHelper.addIds(
      indexingKey,
      result.map((e) => e._id),
    );
    await this.redisRepo.indexingHelper.setQueryState(indexingKey, true);
    await this.redisRepo.indexingHelper.addQueryKey(indexingKey, type);
    await this.redisRepo.setMany(JSON.parse(JSON.stringify(result)));
    return result;
  }

  async fromResource(
    indexingKey: string,
    handler: () => Promise<Entity>,
    type?: RedisIndexingHelperKeyType,
  ): Promise<Entity> {
    const cacheHit = await this.redisRepo.findOneByIndexingKey(indexingKey);
    if (cacheHit) {
      return cacheHit;
    }
    const result = await handler();
    await this.redisRepo.indexingHelper.addIds(indexingKey, result._id);
    await this.redisRepo.indexingHelper.addQueryKey(indexingKey, type);
    await this.redisRepo.set(JSON.parse(JSON.stringify(result)));
    return result;
  }
}
