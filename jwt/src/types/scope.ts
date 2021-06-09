import type { JWTAlgorithm } from './header';

export interface JWTScope {
  secret: string;
  expIn: number;
  issuer: string;
  alg: JWTAlgorithm;
}
