import { createPurpleCheetah } from '@becomes/purple-cheetah';
import { expect } from 'chai';
import { Schema } from 'mongoose';
import { createMongoDB, createMongoDBRepository } from '../../src';
import { MongoDBEntitySchemaString } from '../../src/types';

interface Test {
  _id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
}

const repo = createMongoDBRepository<Test, unknown>({
  name: 'Test repo',
  collection: 'test',
  schema: new Schema({
    ...MongoDBEntitySchemaString,
    name: {
      type: String,
      required: true,
    },
  }),
});

describe('MongoDB', async () => {
  before(async () => {
    createPurpleCheetah({
      port: 1280,
      modules: [
        createMongoDB({
          selfHosted: {
            db: {
              host: 'localhost',
              name: 'test',
              port: 27017,
            },
          },
        }),
      ],
    });
  });

  it('should add entity', async () => {
    await repo.add({
      _id: '635faafa796a0a1958cfe7b2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: 'Bane',
    });
  });

  it('should get entity', async () => {
    const entity = await repo.findById('635faafa796a0a1958cfe7b2');
    expect(entity).to.have.property('_id').to.equal('635faafa796a0a1958cfe7b2')
  });

  it('should delete entity', async () => {
    await repo.deleteById('635faafa796a0a1958cfe7b2')
  })
});
