import type { GraphqlEnum, GraphqlEnumConfig } from './types';

export function createGraphqlEnum(config: GraphqlEnumConfig): GraphqlEnum {
  return {
    name: config.name,
    values: config.values,
  };
}
