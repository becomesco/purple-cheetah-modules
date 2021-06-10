import type { GraphqlObject } from './object';
import type { GraphqlInput } from './input';
import type { GraphqlEnum } from './enum';
import type { GraphqlUnion } from './union';
import type {
  GraphqlResolver,
  GraphqlResolverData,
  GraphqlResolverFunction,
} from './resolver';

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
  (): GraphqlCollectionData;
}
export interface GraphqlCollectionData {
  name: string;
  objects: GraphqlObject[];
  inputs: GraphqlInput[];
  enums: GraphqlEnum[];
  unions: GraphqlUnion[];
  resolvers: Array<GraphqlResolverData<unknown>>;
  collectionResolve: GraphqlCollectionResolve;
}
