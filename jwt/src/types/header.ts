import type { ObjectSchema } from '@becomes/purple-cheetah/types';

// eslint-disable-next-line no-shadow
export enum JWTAlgorithm {
  HMACSHA256 = 'HS256',
  HMACSHA512 = 'HS512',
}
// eslint-disable-next-line no-shadow
export enum JWTType {
  JWT = 'JWT',
}

export interface JWTHeader {
  typ: JWTType;
  alg: JWTAlgorithm;
}
export const JWTHeaderSchema: ObjectSchema = {
  typ: {
    __type: 'string',
    __required: true,
    __validate(value: string): boolean {
      const types = Object.keys(JWTType);
      return types.includes(value);
    },
  },
  alg: {
    __type: 'string',
    __required: true,
    __validate(value: string): boolean {
      const algs = Object.keys(JWTAlgorithm);
      return algs.includes(value);
    },
  },
};
