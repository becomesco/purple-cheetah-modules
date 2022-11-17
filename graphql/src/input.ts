import type { ObjectSchema } from '@becomes/purple-cheetah/types';
import { objectSchemaToGraphqlFields } from './main';
import type { GraphqlInput, GraphqlInputConfig } from './types';

export function objectSchemaToGraphqlInput(config: {
  name: string;
  schema: ObjectSchema;
  description?: string;
}): GraphqlInput {
  return createGraphqlInput({
    name: config.name,
    description: config.description,
    fields: objectSchemaToGraphqlFields(config.schema),
  });
}

export function createGraphqlInput(config: GraphqlInputConfig): GraphqlInput {
  return {
    name: config.name,
    description: config.description,
    fields: config.fields,
  };
}
