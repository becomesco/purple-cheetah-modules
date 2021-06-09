import type { HTTPError, Logger } from "@becomes/purple-cheetah/types";
import type { GraphqlResponse } from './response';
import type { GraphqlArgs } from './arg';

// eslint-disable-next-line no-shadow
export enum GraphqlResolverType {
  QUERY = 'QUERY',
  MUTATION = 'MUTATION',
}
export type GraphqlResolverFunction<T, K> = (args: K) => Promise<T>;

export interface GraphqlResolverConfig<ReturnType, DataType> {
  name: string;
  type: GraphqlResolverType;
  args?: GraphqlArgs;
  return: {
    type: string;
  };
  description?: string;
  includeErrorStack?: boolean;
  unionTypeResolve?(input: ReturnType): ReturnType & { __typename: string };
  resolve(
    data: DataType & {
      __logger: Logger;
      __errorHandler: HTTPError;
      __resolverName: string;
    },
  ): Promise<ReturnType>;
}

export interface GraphqlResolver<ReturnType> {
  name: string;
  type: GraphqlResolverType;
  logger: Logger;
  errorHandler: HTTPError;
  root: {
    args?: GraphqlArgs;
    return: {
      type: string;
    };
  };
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve(...args: any[]): Promise<GraphqlResponse<ReturnType>>;
}
