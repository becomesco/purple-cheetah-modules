import * as crypto from 'crypto';
import type { Redis } from './types';

export class RedisIndexingHelper {
  private items: {
    [key: string]: string;
  } = {};

  constructor(private collection: string, private redis: Redis) {}

  getKey(indexingKey: string): string {
    if (this.items[indexingKey]) {
      return this.items[indexingKey];
    }
    const keyHash = crypto.createHash('sha1').update(indexingKey).digest('hex');
    const key = `${this.collection}:query:${keyHash}`;
    this.items[indexingKey] = key;
    return key;
  }

  async getIndexes(indexingKey: string): Promise<string[]> {
    const key = this.getKey(indexingKey);
    return await this.redis.client.lRange(
      key,
      0,
      await this.redis.client.lLen(key),
    );
  }

  async addIds(indexingKey: string, ids: string | string[]): Promise<void> {
    const key = this.getKey(indexingKey);
    await this.redis.client.lPush(key, ids);
  }

  async removeId(indexingKey: string, id: string): Promise<void> {
    const key = this.getKey(indexingKey);
    await this.redis.client.lRem(key, 0, id);
  }
}
