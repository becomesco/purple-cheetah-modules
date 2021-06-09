import {
  ControllerMethodPreRequestHandler,
  HTTPStatus,
} from '@becomes/purple-cheetah/types';
import { useJwt } from '../main';
import {
  JWTError,
  JWTPermissionName,
  JWTPreRequestHandlerResult,
  JWTRoleName,
} from '../types';

/**
 * Creates a Controller pre request handler function which will
 * authenticate a request using specified configuration.
 */
export function createJwtProtectionPreRequestHandler<Props>(
  /**
   * JWT from a request will need to have at least 1 of the specified
   * roles to access protected resource.
   */
  roles: JWTRoleName[],
  /**
   * JWT from a request will need to have specified permission in the matching
   * role to access protected resource.
   */
  permission: JWTPermissionName,
): ControllerMethodPreRequestHandler<JWTPreRequestHandlerResult<Props>> {
  const jwt = useJwt();
  return async ({ request, errorHandler }) => {
    const accessToken = jwt.get<Props>({
      jwtString: request.headers.authorization as string,
      roleNames: roles,
      permissionName: permission,
    });
    if (accessToken instanceof JWTError) {
      throw errorHandler.occurred(HTTPStatus.UNAUTHORIZED, accessToken.message);
    }
    return { accessToken };
  };
}
