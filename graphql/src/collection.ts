import { createHTTPError, useLogger } from '@becomes/purple-cheetah';
import type {
  GraphqlCollection,
  GraphqlCollectionConfig,
  GraphqlResolverFunction,
} from './types';

export function createGraphqlCollection(
  config: GraphqlCollectionConfig,
): GraphqlCollection {
  return () => {
    const resolvers = config.resolvers
      ? config.resolvers.map((e) => e(config.name))
      : [];
    for (let i = 0; i < resolvers.length; i++) {
      resolvers[i].logger = useLogger({ name: `GQL_${config.name}` });
      resolvers[i].errorHandler = createHTTPError({
        place: resolvers[i].name,
        logger: resolvers[i].logger,
      });
    }
    return {
      name: config.name,
      enums: config.enums ? config.enums : [],
      inputs: config.inputs ? config.inputs : [],
      objects: config.objects ? config.objects : [],
      resolvers,
      unions: config.unions ? config.unions : [],
      collectionResolve() {
        const output: {
          [name: string]: GraphqlResolverFunction<unknown, unknown>;
        } = {};
        for (let i = 0; i < resolvers.length; i++) {
          const resolver = resolvers[i];
          output[resolver.name] = resolver.resolve;
        }
        return output;
      },
    };
  };
}
