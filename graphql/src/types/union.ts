import type { GraphqlObject } from './object';

export interface GraphqlUnionConfig {
  name: string;
  types: string[];
}

export interface GraphqlUnion {
  name: string;
  types: string[];
  wrapperObject: GraphqlObject;
}
