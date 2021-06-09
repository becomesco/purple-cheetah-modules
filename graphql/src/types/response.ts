import type { GraphqlError } from './error';

export interface GraphqlResponse<T> {
  error?: GraphqlError;
  result?: T;
}
