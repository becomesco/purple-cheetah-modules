import type { JWT } from './main';

export interface JWTEncoding {
  /**
   * Converts JWT object into JWT string. See [jwt.io](https://jwt.io/) for
   * more information about JWT encoding.
   */
  encode<T>(jwt: JWT<T>): string;
  /**
   * Converts JWT string into JWT object. See [jwt.io](https://jwt.io/) for
   * more information about JWT encoding.
   */
  decode<T>(encodedJwt: string): JWT<T> | Error;

  /**
   * Encodes the text in a Base64 string which is suitable for
   * usage in URL.
   */
  b64Url(text: string): string;
}
