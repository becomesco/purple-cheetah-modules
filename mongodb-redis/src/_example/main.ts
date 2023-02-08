import {
  createBodyParserMiddleware,
  createCorsMiddleware,
  createPurpleCheetah,
  createRequestLoggerMiddleware,
} from '@becomes/purple-cheetah';
import { createMongoDB } from '@becomes/purple-cheetah-mod-mongodb';
import { createRedis } from '@becomes/purple-cheetah-mod-redis';
import { TodoController } from './todo/controller';
import { TodoRepoModules } from './todo/repository';

createPurpleCheetah({
  port: 1280,
  controllers: [TodoController],
  middleware: [
    createBodyParserMiddleware(),
    createCorsMiddleware(),
    createRequestLoggerMiddleware(),
  ],
  modules: [
    createMongoDB({
      selfHosted: {
        db: {
          name: 'test',
          host: 'localhost',
        },
      },
    }),
    createRedis({}),
    ...TodoRepoModules,
  ],
});
