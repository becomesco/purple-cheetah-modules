import { createHTTPError, useLogger } from '@becomes/purple-cheetah';
import type { HTTPException } from '@becomes/purple-cheetah/types';
import { createGraphqlResponseObject } from './object';
import type { GraphqlResolver, GraphqlResolverConfig } from './types';

export function createGraphqlResolver<ReturnType, DataType>(
  config: GraphqlResolverConfig<ReturnType, DataType>,
): GraphqlResolver<ReturnType> {
  const self: GraphqlResolver<ReturnType> = {
    logger: useLogger({ name: `GQL_${config.name}` }),
    errorHandler: createHTTPError({
      place: config.name,
      logger: useLogger({ name: config.name }),
    }),
    name: config.name,
    type: config.type,
    description: config.description,
    root: {
      args: config.args ? config.args : {},
      return: {
        type: createGraphqlResponseObject({
          name: config.return.type,
        }).name,
      },
    },
    async resolve(args) {
      try {
        const data: { [name: string]: unknown } = {};
        const argKeys = config.args ? Object.keys(config.args) : [];
        for (let i = 0; i < argKeys.length; i++) {
          if (args[argKeys[i]]) {
            data[argKeys[i]] = args[argKeys[i]];
          }
        }
        const result = await config.resolve({
          ...data,
          __logger: self.logger,
          __errorHandler: self.errorHandler,
          __resolverName: config.name,
        } as never);
        if (result instanceof Array) {
          if (typeof config.unionTypeResolve === 'function') {
            return {
              result: config.unionTypeResolve(result),
            };
          }
          return {
            result: result,
          };
        }
        if (typeof config.unionTypeResolve === 'function') {
          return {
            result: config.unionTypeResolve(result),
          };
        } else {
          return { result };
        }
      } catch (error) {
        const exception = error as HTTPException<unknown>;
        if (exception.status && exception.message) {
          const err = error as HTTPException<never>;
          return {
            error: {
              status: err.status,
              message:
                err.message && err.message.message ? error.message.message : '',
              stack: config.includeErrorStack ? error.stack : undefined,
            },
          };
        }
        return {
          error: {
            status: 500,
            message: error.message,
            stack:
              error.stack && config.includeErrorStack
                ? error.stack.split('\n')
                : undefined,
          },
        };
      }
    },
  };
  return self;
}
