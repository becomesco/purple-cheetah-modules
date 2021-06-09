import type { ObjectSchema } from "@becomes/purple-cheetah/types";
import { JWTRole, JWTRoleSchema } from './role';

export interface JWTPayload<T> {
  jti: string;
  iss: string;
  iat: number;
  exp: number;
  userId: string;
  rls: JWTRole[];
  props: T;
}
export const JWTPayloadSchema: ObjectSchema = {
  jti: {
    __type: 'string',
    __required: true,
  },
  iss: {
    __type: 'string',
    __required: true,
  },
  iat: {
    __type: 'number',
    __required: true,
  },
  exp: {
    __type: 'number',
    __required: true,
  },
  rls: {
    __type: 'array',
    __required: true,
    __child: {
      __type: 'object',
      __content: JWTRoleSchema,
    },
  },
};
