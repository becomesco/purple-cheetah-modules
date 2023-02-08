import * as crypto from 'crypto';
import { createMongoDBRedisRepository } from '../../main';
import type { MongoDBRedisRepository } from '../../types';
import { Repo } from '../repo';
import { Todo, TodoSchema } from './model';

export type TodoRepo = MongoDBRedisRepository<Todo, TodoRepoMethods>;

export interface TodoRepoMethods {
  findAllByDone(done: boolean): Promise<Todo[]>;
  search(text: string): Promise<Todo[]>;
}

export const TodoRepoModules = createMongoDBRedisRepository<
  Todo,
  TodoRepoMethods
>({
  name: 'Todo repo',
  collection: 'todos',
  schema: TodoSchema,
  onReady(repo) {
    Repo.todo = repo;
  },
  methods({ mongoDBInterface, cacheUtil }) {
    return {
      async search(text) {
        return cacheUtil.fromResources(
          `search:${crypto.createHash('sha1').update(text).digest('hex')}`,
          async () => {
            return await mongoDBInterface.find({
              description: { $regex: text },
            });
          },
          'set_sensitive',
        );
      },

      findAllByDone(done) {
        return cacheUtil.fromResources(`findAllByDone:${done}`, async () => {
          return await mongoDBInterface.find({ done });
        });
      },
    };
  },
});
