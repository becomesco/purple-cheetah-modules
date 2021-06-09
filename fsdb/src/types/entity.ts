import type { ObjectSchema } from '@becomes/purple-cheetah/types';

export interface FSDBEntity {
  _id: string;
  createdAt: number;
  updatedAt: number;
}
export const FSDBEntitySchema: ObjectSchema = {
  _id: {
    __type: 'string',
    __required: true,
  },
  createdAt: {
    __type: 'number',
    __required: true,
  },
  updatedAt: {
    __type: 'number',
    __required: true,
  },
};
