/**
 * MongoDB configuration object.
 */
export interface MongoDBConfig {
  strictQuery?: boolean;
  /**
   * Method which will be called when handler is successfully
   * connected to the MongoDB database.
   */
  onConnection?(): void;
  /**
   * Configuration for self hosted MongoDB database.
   */
  selfHosted?: {
    user?: {
      name: string;
      password: string;
    };
    db: {
      name: string;
      host: string;
      port?: number;
    };
  };
  /**
   * Configuration for MongoDB Atlas, cloud database.
   */
  atlas?: {
    user: {
      name: string;
      password: string;
    };
    db: {
      name: string;
      cluster: string;
      readWrite?: boolean;
    };
  };
}

/**
 * MongoDB object.
 */
export interface MongoDB {
  /**
   * Returns `true` if handler is connected to the MongoDB database.
   */
  isConnected(): void;
}
