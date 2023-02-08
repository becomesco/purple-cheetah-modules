import { createPurpleCheetah, ObjectUtility } from '@becomes/purple-cheetah';
import {
  ObjectSchema,
  ObjectUtilityError,
  PurpleCheetah,
} from '@becomes/purple-cheetah/types';
import { expect } from 'chai';
import { before } from 'mocha';
import {
  createRedis,
  createRedisRepository,
  RedisEntitySchema,
} from '../../src';
import type { RedisEntity, RedisRepository } from '../../src/types';

interface UserObj {
  str: string;
  strArr: string[];
  num: number;
  numArr: number[];
  bool: boolean;
  boolArr: boolean[];
}
const UserObjSchema: ObjectSchema = {
  str: {
    __type: 'string',
    __required: true,
  },
  strArr: {
    __type: 'array',
    __required: true,
    __child: {
      __type: 'string',
    },
  },
  num: {
    __type: 'number',
    __required: true,
  },
  numArr: {
    __type: 'array',
    __required: true,
    __child: {
      __type: 'number',
    },
  },
  bool: {
    __type: 'boolean',
    __required: true,
  },
  boolArr: {
    __type: 'array',
    __required: true,
    __child: {
      __type: 'boolean',
    },
  },
};

interface User extends RedisEntity, UserObj {
  obj: UserObj & {
    obj: UserObj;
    objArr: UserObj[];
  };
  objArr: UserObj[];
}
const UserSchema: ObjectSchema = {
  ...RedisEntitySchema,
  ...UserObjSchema,
  obj: {
    __type: 'object',
    __required: true,
    __child: {
      ...UserObjSchema,
      obj: {
        __type: 'object',
        __required: true,
        __child: UserObjSchema,
      },
      objArr: {
        __type: 'array',
        __required: true,
        __child: {
          __type: 'object',
          __content: UserObjSchema,
        },
      },
    },
  },
  objArr: {
    __type: 'array',
    __required: true,
    __child: {
      __type: 'object',
      __content: UserObjSchema,
    },
  },
};

let userRepo: RedisRepository<User> = null as never;
const userRepoModule = createRedisRepository<User>(
  {
    name: 'Redis user repo',
    collection: 'user',
    schema: UserSchema,
  },
  (repo) => {
    userRepo = repo;
  },
);

let pc: PurpleCheetah = null as never;

describe('Redis core functionality', async () => {
  before(async () => {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject('Timeout');
      }, 10000);
      pc = createPurpleCheetah({
        port: 1280,
        modules: [createRedis({}), userRepoModule],
        onReady() {
          clearTimeout(timeout);
          resolve();
        },
      });
    });
  });

  after(async () => {
    pc.getServer().close();
  });

  it('should create an object', async () => {
    await userRepo.set({
      _id: '123456',
      str: 's1',
      strArr: ['s11', 's12'],
      num: 1,
      numArr: [11, 12],
      bool: true,
      boolArr: [false, true],
      obj: {
        str: 's2',
        strArr: ['s21', 's22'],
        num: 2,
        numArr: [21, 22],
        bool: true,
        boolArr: [false, true],
        obj: {
          str: 's5',
          strArr: ['s51', 's52'],
          num: 5,
          numArr: [51, 52],
          bool: true,
          boolArr: [false, true],
        },
        objArr: [
          {
            str: 's6',
            strArr: ['s61', 's62'],
            num: 6,
            numArr: [61, 62],
            bool: true,
            boolArr: [false, true],
          },
          {
            str: 's4',
            strArr: ['s41', 's42'],
            num: 4,
            numArr: [41, 42],
            bool: true,
            boolArr: [false, true],
          },
        ],
      },
      objArr: [
        {
          str: 's3',
          strArr: ['s31', 's32'],
          num: 3,
          numArr: [31, 32],
          bool: true,
          boolArr: [false, true],
        },
        {
          str: 's4',
          strArr: ['s41', 's42'],
          num: 4,
          numArr: [41, 42],
          bool: true,
          boolArr: [false, true],
        },
      ],
    });
  });

  it('should get an object', async () => {
    const user = await userRepo.findById('123456');
    const check = ObjectUtility.compareWithSchema(user, UserSchema, 'model');
    if (check instanceof ObjectUtilityError) {
      throw Error(check.message);
    }
  });

  it('should delete an object', async () => {
    await userRepo.deleteById('123456');
    const user = await userRepo.findById('123456');
    expect(user).to.equal(null);
  });
});
