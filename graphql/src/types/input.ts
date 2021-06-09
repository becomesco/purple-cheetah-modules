import type { GraphqlFields } from './field';

export interface GraphqlInputConfig {
  name: string;
  fields: GraphqlFields;
  description?: string;
}
export interface GraphqlInput {
  name: string;
  fields: GraphqlFields;
  description?: string;
}
