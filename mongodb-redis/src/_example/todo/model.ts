import type { ObjectSchema } from '@becomes/purple-cheetah/types';
import { MongoDBRedisEntitySchema } from '../../entity';
import type { MongoDBRedisEntity } from '../../types';

export interface Todo extends MongoDBRedisEntity {
  description: string;
  done: boolean;
}

export const TodoSchema: ObjectSchema = {
  ...MongoDBRedisEntitySchema,
  description: {
    __type: 'string',
    __required: true,
  },
  done: {
    __type: 'boolean',
    __required: true,
  },
};
