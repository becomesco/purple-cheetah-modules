import type { GraphqlInput, GraphqlInputConfig } from './types';

export function createGraphqlInput(config: GraphqlInputConfig): GraphqlInput {
  return {
    name: config.name,
    description: config.description,
    fields: config.fields,
  };
}
