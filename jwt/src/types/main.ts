import type { ObjectSchema } from "@becomes/purple-cheetah/types";
import { JWTHeader, JWTHeaderSchema } from './header';
import { JWTPayload, JWTPayloadSchema } from './payload';
import type { JWTRole, JWTRoleName } from './role';
import type { JWTPermissionName } from './permission';
import type { JWTScope } from './scope';

export interface JWT<T> {
  header: JWTHeader;
  payload: JWTPayload<T>;
  signature: string;
}
export const JWTSchema: ObjectSchema = {
  header: {
    __type: 'object',
    __required: true,
    __child: JWTHeaderSchema,
  },
  payload: {
    __type: 'object',
    __required: true,
    __child: JWTPayloadSchema,
  },
};

export interface JWTManagerConfig {
  scopes: JWTScope[];
}

export interface JWTManagerCreateData<T> {
  issuer: string;
  userId: string;
  roles: JWTRole[];
  props?: T;
}
export interface JWTManagerCheckPermissionsData<T> {
  jwt: JWT<T>;
  roleNames: JWTRoleName[];
  permissionName: JWTPermissionName;
}
export interface JWTManagerGetData {
  jwtString: string;
  roleNames: JWTRoleName[];
  permissionName: JWTPermissionName;
}

export type JWTErrorCode =
  | 'e1'
  | 'e2'
  | 'e3'
  | 'e4'
  | 'e5'
  | 'e6'
  | 'e7'
  | 'e8'
  | 'e9'
  | 'e10';
export class JWTError {
  constructor(public errorCode: JWTErrorCode, public message: string) {}
}

export interface JWTManager {
  create<T>(data: JWTManagerCreateData<T>): JWT<T> | JWTError;
  sign<T>(jwt: JWT<T>): JWT<T> | JWTError;
  validate<T>(jwt: JWT<T>): void | JWTError;
  checkPermissions<T>(data: JWTManagerCheckPermissionsData<T>): void | JWTError;
  validateAndCheckPermissions<T>(
    data: JWTManagerCheckPermissionsData<T>,
  ): void | JWTError;
  get<T>(data: JWTManagerGetData): JWTError | JWT<T>;
}
