import type { MongoDBEntity } from "@becomes/purple-cheetah-mod-mongodb/types";

export interface MongoDBRedisEntity extends Omit<MongoDBEntity, '_id'> {
  _id: string
}