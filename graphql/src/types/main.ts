import type { GraphqlCollection } from './collection';

export interface GraphqlConfig {
  uri?: string;
  rootName?: string;
  graphiql?: boolean;
  collections: GraphqlCollection[];
}
