import type { JWT } from '../main';

export interface JWTPreRequestHandlerResult<Props> {
  accessToken: JWT<Props>;
}
