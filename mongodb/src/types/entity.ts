import { Types } from 'mongoose';

/**
 * Default MongoDB entity. All entities written to the database
 * must have those properties.
 */
export interface MongoDBEntity {
  _id: string | Types.ObjectId;
  createdAt: number;
  updatedAt: number;
}

/**
 * Default MongoDB entity schema. Useful for defining schemas for
 * custom entities.
 */
export const MongoDBEntitySchema = {
  _id: {
    type: Types.ObjectId,
    required: true,
  },
  createdAt: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Number,
    required: true,
  },
};

/**
 * Default MongoDB entity schema with String ID property.
 * Useful for defining schemas for custom entities.
 */
export const MongoDBEntitySchemaString = {
  _id: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Number,
    required: true,
  },
};
