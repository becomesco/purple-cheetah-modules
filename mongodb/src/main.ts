import * as mongoose from 'mongoose';
import { useLogger } from '@becomes/purple-cheetah';
import type { Module, ObjectSchema } from '@becomes/purple-cheetah/types';
import type { MongoDB, MongoDBConfig } from './types';

let connected = false;
const mongoDB: MongoDB = {
  isConnected() {
    return connected;
  },
};

export function objectSchemaToMongoDBSchema(
  oSchema: ObjectSchema,
): mongoose.Schema {
  const schema: mongoose.SchemaDefinitionProperty<undefined> = {};
  for (const osKey in oSchema) {
    const osItem = oSchema[osKey];
    if (osItem.__type === 'string') {
      schema[osKey] = {
        type: String,
        required: osItem.__required,
      };
    } else if (osItem.__type === 'number') {
      schema[osKey] = {
        type: Number,
        required: osItem.__required,
      };
    } else if (osItem.__type === 'boolean') {
      schema[osKey] = {
        type: Boolean,
        required: osItem.__required,
      };
    } else if (osItem.__type === 'object') {
      if (osItem.__child) {
        schema[osKey] = {
          type: objectSchemaToMongoDBSchema(osItem.__child as ObjectSchema),
          required: osItem.__required,
        };
      }
    } else if (osItem.__type === 'array') {
      if (osItem.__child) {
        if (osItem.__child.__type === 'string') {
          schema[osKey] = {
            type: [String],
            required: osItem.__required,
          };
        } else if (osItem.__child.__type === 'number') {
          schema[osKey] = {
            type: [Number],
            required: osItem.__required,
          };
        } else if (osItem.__child.__type === 'boolean') {
          schema[osKey] = {
            type: [Boolean],
            required: osItem.__required,
          };
        } else if (osItem.__child.__type === 'object') {
          schema[osKey] = {
            type: [
              objectSchemaToMongoDBSchema(
                osItem.__child.__content as ObjectSchema,
              ),
            ],
            required: osItem.__required,
          };
        }
      }
    }
  }
  return new mongoose.Schema(schema);
}

export function useMongoDB(): MongoDB {
  return mongoDB;
}
export function createMongoDB(config: MongoDBConfig): Module {
  const logger = useLogger({ name: 'MongoDB' });
  mongoose.set(
    'strictQuery',
    typeof config.strictQuery === 'boolean' ? config.strictQuery : false,
  );

  async function openConnection(): Promise<void | Error> {
    if (mongoose.connection.readyState === 0) {
      if (config.selfHosted) {
        let url = `mongodb://${
          config.selfHosted.user
            ? `${config.selfHosted.user.name}:${config.selfHosted.user.password}@`
            : ''
        }${config.selfHosted.db.host}`;
        // let url: string =
        //   'mongodb://' +
        //   `${
        //     config.selfHosted.user.name + ':' + config.selfHosted.user.password
        //   }` +
        //   '@' +
        //   config.selfHosted.db.host;
        if (config.selfHosted.db.port) {
          url = url + ':' + config.selfHosted.db.port;
        }
        url = url + '/' + config.selfHosted.db.name;
        try {
          await mongoose.connect(url);
          logger.info('', 'Successful connection.');
          connected = true;
        } catch (error) {
          connected = false;
          return error as Error;
        }
      } else if (config.atlas) {
        const url: string =
          'mongodb+srv://' +
          config.atlas.user.name +
          ':' +
          config.atlas.user.password +
          '@' +
          config.atlas.db.cluster +
          '/' +
          config.atlas.db.name;
        // '?readWrite=' +
        // config.atlas.db.readWrite +
        // '&w=majority';
        try {
          await mongoose.connect(url);
          logger.info('', 'Successful connection.');
          connected = true;
        } catch (error) {
          connected = false;
          return error as Error;
        }
      } else {
        return Error('Invalid configuration.');
      }
    }
  }

  return {
    name: 'MongoDB',
    initialize(moduleConfig) {
      openConnection()
        .then((error) => {
          if (error) {
            moduleConfig.next(error);
            return;
          }
          setInterval(() => {
            openConnection()
              .then((err) => {
                if (err) {
                  logger.error('.openConnection', err);
                }
              })
              .catch((err) => {
                logger.error('.openConnection', err);
              });
          }, 30000);
          moduleConfig.next();
        })
        .catch((error) => {
          moduleConfig.next(error);
        });
    },
  };
}
