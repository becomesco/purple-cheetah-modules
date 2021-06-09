import type { GraphqlFields } from './field';

export interface GraphqlObject {
  name: string;
  type?: string;
  fields: GraphqlFields;
  description?: string;
  wrapperObjects?: GraphqlObject[];
}

export interface GraphqlObjectConfig {
  name: string;
  type?: string;
  fields: GraphqlFields;
  description?: string;
}
