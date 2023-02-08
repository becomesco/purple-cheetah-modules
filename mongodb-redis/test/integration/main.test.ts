import { createPurpleCheetah } from '@becomes/purple-cheetah';
import { createMongoDB } from '@becomes/purple-cheetah-mod-mongodb';
import { createRedis } from '@becomes/purple-cheetah-mod-redis';
import type { ObjectSchema } from '@becomes/purple-cheetah/types';
import { expect } from 'chai';
import {
  createMongoDBRedisRepository,
  MongoDBRedisEntitySchema,
} from '../../src';
import type {
  MongoDBRedisEntity,
  MongoDBRedisRepository,
} from '../../src/types';

interface Test extends MongoDBRedisEntity {
  name: string;
}
const TestSchema: ObjectSchema = {
  ...MongoDBRedisEntitySchema,
  name: {
    __type: 'string',
    __required: true,
  },
};

const entityId = '635faafa796a0a1958cfe7b2';
let testRepo: MongoDBRedisRepository<Test> = null as never;

describe('MongoDB with Redis caching', async () => {
  before(async () => {
    await new Promise<void>((resolve, reject) => {
      try {
        createPurpleCheetah({
          port: 1280,
          modules: [
            createMongoDB({
              selfHosted: {
                db: {
                  host: 'localhost',
                  port: 27017,
                  name: 'test',
                },
              },
            }),
            createRedis({}),
            ...createMongoDBRedisRepository<Test>({
              name: 'Test repo',
              collection: 'mr_tests',
              schema: TestSchema,
              onReady(repo) {
                testRepo = repo;
                resolve();
              },
            }),
          ],
        });
      } catch (error) {
        reject(error);
      }
    });
  });

  it('should create an entity', async () => {
    await testRepo.add({
      _id: entityId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: 'Test',
    });
  });

  it('should get the entity', async () => {
    const entity = await testRepo.findById(entityId);
    expect(entity).to.have.property('_id').to.equal(entityId);
    expect(entity).to.have.property('name').to.equal('Test');
  });

  it('should delete the entity', async () => {
    await testRepo.deleteById(entityId);
    const entity = await testRepo.findById(entityId);
    expect(entity).to.equal(null);
  });
});
