import type { ObjectSchema } from '@becomes/purple-cheetah/types';
import type { RedisIndexingHelper } from 'src/indexing-helper';
import type { RedisEntity } from './entity';
import type { Redis } from './main';

export interface RedisRepositoryConfig<
  Model extends RedisEntity = RedisEntity,
  Methods = unknown,
> {
  name: string;
  collection: string;
  schema: ObjectSchema;
  methods?: (config: {
    redis: Redis;
    indexingHelper: RedisIndexingHelper;
    collection: string;
    name: string;
    repo: RedisRepository<Model, Methods>;
  }) => Promise<Methods>;
}

export interface RedisRepository<
  Model extends RedisEntity = RedisEntity,
  Methods = unknown,
> {
  name: string;
  collection: string;
  schema: ObjectSchema;
  methods: Methods;

  findById(id: string): Promise<Model | null>;
  findAll(): Promise<Model[]>;
  findAllById(ids: string[]): Promise<Model[]>;
  find(indexingKey: string, query: (item: Model) => boolean): Promise<Model[]>;
  findOne(
    indexingKey: string,
    query: (item: Model) => boolean,
  ): Promise<Model | null>;
  set(entity: Model): Promise<Model>;
  setMany(entities: Model[]): Promise<Model[]>;
  deleteById(id: string): Promise<void>;
  deleteAllById(ids: string[]): Promise<void>;
  count(): Promise<number>;
}
