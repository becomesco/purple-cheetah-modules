import { buildSchema } from 'graphql';
import { graphqlHTTP } from 'express-graphql';
import type { Module } from '@becomes/purple-cheetah/types';
import { createMiddleware } from '@becomes/purple-cheetah';
import { useGraphqlResponsePrimitives } from './response';
import {
  GraphqlArgs,
  GraphqlConfig,
  GraphqlObject,
  GraphqlResolverFunction,
  GraphqlResolverType,
} from './types';

export function createGraphql(config: GraphqlConfig): Module {
  const collections = config.collections;
  const rootName = config.rootName ? config.rootName : '';

  return {
    name: 'Graphql',
    initialize(moduleConfig) {
      function createObjectSchema(obj: GraphqlObject): string {
        let output = '';
        if (obj.description) {
          output = `
            """
            ${obj.description}
            """
            `;
        }
        output += `type ${obj.name} {
            ${Object.keys(obj.fields)
              .map((fieldKey) => {
                let fieldOutput = '';
                fieldOutput += `${fieldKey}@args: ${obj.fields[fieldKey]}`;
                // let args = '';
                // if (field.args) {
                //   args =
                //     '(' +
                //     Object.keys(field.args)
                //       .map((argKey) => {
                //         const fieldArgs = field.args as GraphqlArgs;
                //         return `${argKey}: ${fieldArgs[argKey]}`;
                //       })
                //       .join(', ') +
                //     ')';
                // }
                return fieldOutput.replace('@args', '');
              })
              .join('\n')}
          }
          
          `;
        return output;
      }

      let objectsSchema = useGraphqlResponsePrimitives();
      let inputsSchema = '';
      let enumsSchema = '';
      let unionsSchema = '';
      let rootQuerySchema = '';
      let rootMutationSchema = '';
      let rootQuery = '';
      let rootMutation = '';
      const rootValue: {
        [collectionResolver: string]: {
          [resolverName: string]: GraphqlResolverFunction<unknown, unknown>;
        };
      } = {};

      for (let i = 0; i < collections.length; i++) {
        const collection = collections[i]();
        for (let j = 0; j < collection.objects.length; j++) {
          const obj = collection.objects[j];
          objectsSchema += createObjectSchema(obj);
          if (obj.wrapperObjects) {
            for (let k = 0; k < obj.wrapperObjects.length; k++) {
              objectsSchema += createObjectSchema(obj.wrapperObjects[k]);
            }
          }
        }
        for (let j = 0; j < collection.enums.length; j++) {
          const enuM = collection.enums[j];
          enumsSchema += `enum ${enuM.name} {
          ${enuM.values.join('\n')}
          }
          
          `;
        }
        for (let j = 0; j < collection.unions.length; j++) {
          const union = collection.unions[j];
          unionsSchema += `union ${union.name} = ${union.types.join(' | ')}
          
          `;
          objectsSchema += createObjectSchema(union.wrapperObject);
        }
        for (let j = 0; j < collection.inputs.length; j++) {
          const input = collection.inputs[j];
          let output = '';
          if (input.description) {
            output = `
            """
            ${input.description}
            """
            `;
          }
          output += `input ${input.name} {
            ${Object.keys(input.fields)
              .map((fieldKey) => {
                return `${fieldKey}: ${input.fields[fieldKey]}`;
              })
              .join('\n')}
          }
          
          `;
          inputsSchema += output;
        }
        let collectionQueryType = `type ${collection.name}Query {
        `;
        let collectionMutationType = `type ${collection.name}Mutation {
        `;
        rootValue[collection.name] = {};
        let addQuery = false;
        let addMutation = false;
        for (let j = 0; j < collection.resolvers.length; j++) {
          const resolver = collection.resolvers[j];
          rootValue[collection.name][resolver.name] = resolver.resolve;
          let output = '';
          if (resolver.description) {
            output = `"""
            ${resolver.description}
            """
            ${resolver.name}@args: ${resolver.root.return.type}
            
            `;
          } else {
            output += `${resolver.name}@args: ${resolver.root.return.type}
            
            `;
          }
          let args = '';
          if (resolver.root.args) {
            args =
              '(' +
              Object.keys(resolver.root.args)
                .map((argKey) => {
                  const rootArgs = resolver.root.args as GraphqlArgs;
                  return `${argKey}: ${rootArgs[argKey]}`;
                })
                .join(', ') +
              ')';
          }
          output = output.replace('@args', args === '()' ? '' : args);
          switch (resolver.type) {
            case GraphqlResolverType.QUERY:
              {
                collectionQueryType += output;
                addQuery = true;
              }
              break;
            case GraphqlResolverType.MUTATION:
              {
                collectionMutationType += output;
                addMutation = true;
              }
              break;
          }
        }
        collectionQueryType += `
        }
        
        `;
        collectionMutationType += `
        }
        
        `;
        if (addQuery) {
          rootQuerySchema += `${collection.name}: ${collection.name}Query
        `;
          objectsSchema += collectionQueryType;
        }
        if (addMutation) {
          rootMutationSchema += `${collection.name}: ${collection.name}Mutation
        `;
          objectsSchema += collectionMutationType;
        }
      }

      if (rootQuerySchema !== '') {
        rootQuery = `
        """
        Root Query for ${rootName}
        """
        type ${rootName}Query {
          ${rootQuerySchema}
        }
      `;
      }
      if (rootMutationSchema !== '') {
        rootMutation = `
        """
        Root Mutation for ${rootName}
        """
        type ${rootName}Mutation {
          ${rootMutationSchema}
        }
      `;
      }

      let schemaAvailable = false;
      let schema = `
        schema {
          @query
          @mutation
        }
      `;
      if (rootMutation !== '') {
        schema = schema.replace('@mutation', `mutation: ${rootName}Mutation`);
        schemaAvailable = true;
      } else {
        schema = schema.replace('@mutation', '');
      }
      if (rootQuery !== '') {
        schema = schema.replace('@query', `query: ${rootName}Query`);
        schemaAvailable = true;
      } else {
        schema = schema.replace('@query', '');
      }

      const fullSchema = `
        ${enumsSchema}
  
        ${objectsSchema}
  
        ${unionsSchema}
  
        ${inputsSchema}
  
        ${rootQuery}
  
        ${rootMutation}
  
        ${schemaAvailable ? schema : ''}
      `;

      try {
        const gqlSchema = buildSchema(fullSchema);
        moduleConfig.next(undefined, {
          middleware: [
            createMiddleware({
              name: 'Graphql',
              after: false,
              path: config.uri ? config.uri : '/graphql',
              handler: () =>
                graphqlHTTP({
                  schema: gqlSchema,
                  rootValue,
                  graphiql: config.graphiql,
                }),
            }),
          ],
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(fullSchema);
        moduleConfig.next(e as Error);
      }
    },
  };
}
