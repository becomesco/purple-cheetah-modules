import type { FSDBEntity } from './entity';
import type { FSDBRepository } from './repository';

/**
 * Collection of objects. For example: `users`
 */
export interface FSDBCacheCollection<T extends FSDBEntity> {
  [id: string]: T;
}

/**
 * FSDB cache object. Used for internal logic and to minimize file
 * system read/write operations.
 */
export interface FSDBCache {
  [collection: string]: FSDBCacheCollection<FSDBEntity>;
}

/**
 * FSDB manager object. Should not be used directly.
 */
export interface FSDB {
  register<T extends FSDBEntity>(
    collection: string,
  ): {
    get(): FSDBCacheCollection<T>;
    set(entity: T): void;
    remove(id: string): void;
  };
  repo: {
    create<T extends FSDBEntity, K>(
      collection: string,
      repo: FSDBRepository<T, K>,
    ): void;
    use<T extends FSDBEntity, K>(
      collection: string,
    ): FSDBRepository<T, K> | null;
  };
}

/**
 * Configuration object for creating FSDB.
 */
export interface FSDBConfig {
  /**
   * Path to file which manager will use as storage. If string starts with
   * "/", path will be used as absolute.
   *
   * For example: `db/example` ---> results in: `${process.cwd()}/db/example.fsdb.json`
   * Default: `${process.cwd()}/.fsdb.json`
   */
  output?: string;
  /**
   * Time in milliseconds. How often will changes be saved to the output file.
   * Lower time results in more checks and faster output file updates but
   * can also result in more file system writes.
   *
   * Default: 10000
   */
  saveInterval?: number;
}
