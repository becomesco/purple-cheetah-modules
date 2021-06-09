export function useGraphqlResponsePrimitives(): string {
  return `type GraphqlError {
    status: Int!
    message: String!
    stack: [String!]
  }
  type StringResponse {
    error: GraphqlError
    result: String
  }
  type StringArrayResponse {
    error: GraphqlError
    result: [String!]
  }
  type IntResponse {
    error: GraphqlError
    result: Int
  }
  type IntArrayResponse {
    error: GraphqlError
    result: [Int!]
  }
  type BooleanResponse {
    error: GraphqlError
    result: Boolean
  }
  type BooleanArrayResponse {
    error: GraphqlError
    result: [Boolean!]
  }
  type FloatResponse {
    error: GraphqlError
    result: Float
  }
  type FloatArrayResponse {
    error: GraphqlError
    result: [Float!]
  }
  `;
}
