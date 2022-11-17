import type { ObjectSchema } from '@becomes/purple-cheetah/types';
import { objectSchemaToGraphqlFields } from './main';
import type { GraphqlObject, GraphqlObjectConfig } from './types';

export function objectSchemaToGraphqlObject(config: {
  name: string;
  schema: ObjectSchema;
  type?: string;
  description?: string;
}): GraphqlObject {
  return createGraphqlObject({
    name: config.name,
    type: config.type,
    description: config.description,
    fields: objectSchemaToGraphqlFields(config.schema),
  });
}

export function createGraphqlResponseObject(config: {
  name: string;
  type?: string;
}): { name: string; object: GraphqlObject } {
  const name = `${config.name.replace(/\[/g, '').replace(/\]/g, '')}Response`;
  const type = typeof config.type !== 'string' ? config.name : config.type;

  return {
    name,
    object: {
      name,
      fields: {
        error: 'GraphqlError',
        result: type,
      },
    },
  };
}
export function createGraphqlObject(
  config: GraphqlObjectConfig,
): GraphqlObject {
  return {
    name: config.name,
    type: config.type,
    description: config.description,
    fields: config.fields,
    wrapperObjects: [
      createGraphqlResponseObject({
        name: config.name,
        type: config.type,
      }).object,
      createGraphqlResponseObject({
        name: config.name + 'Array',
        type: `[${config.name}!]`,
      }).object,
    ],
  };
}
