import type { ObjectSchema } from '@becomes/purple-cheetah/types';

export const RedisEntitySchema: ObjectSchema = {
  _id: {
    __type: 'string',
    __required: true,
  },
};
