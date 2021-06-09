import type { GraphqlObject } from './object';
import type { GraphqlInput } from './input';
import type { GraphqlEnum } from './enum';
import type { GraphqlUnion } from './union';
import type { GraphqlResolver, GraphqlResolverFunction } from './resolver';

export interface GraphqlCollectionConfig {
  name: string;
  objects?: GraphqlObject[];
  inputs?: GraphqlInput[];
  enums?: GraphqlEnum[];
  unions?: GraphqlUnion[];
  resolvers?: Array<GraphqlResolver<unknown>>;
}
export type GraphqlCollectionResolve = () => {
  [name: string]: GraphqlResolverFunction<unknown, unknown>;
};
export interface GraphqlCollection {
  name: string;
  objects: GraphqlObject[];
  inputs: GraphqlInput[];
  enums: GraphqlEnum[];
  unions: GraphqlUnion[];
  resolvers: Array<GraphqlResolver<unknown>>;
  collectionResolve: GraphqlCollectionResolve;
}
