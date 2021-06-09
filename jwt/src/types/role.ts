import type { ObjectSchema } from "@becomes/purple-cheetah/types";
import { JWTPermission, JWTPermissionSchema } from './permission';

// eslint-disable-next-line no-shadow
export enum JWTRoleName {
  SUDO = 'SUDO',
  DEV = 'DEV',

  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  SERVICE = 'SERVICE',

  EDITOR = 'EDITOR',
  SUPPORT = 'SUPPORT',
  USER = 'USER',
  GUEST = 'GUEST',
}

export interface JWTRole {
  name: JWTRoleName;
  permissions: JWTPermission[];
}

export const JWTRoleSchema: ObjectSchema = {
  name: {
    __type: 'string',
    __required: true,
    __validate(value: string) {
      const keys = Object.keys(JWTRoleName);
      return keys.includes(value);
    },
  },
  permissions: {
    __type: 'array',
    __required: true,
    __child: {
      __type: 'object',
      __content: JWTPermissionSchema,
    },
  },
};
