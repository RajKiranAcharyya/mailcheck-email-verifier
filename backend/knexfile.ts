import type { Knex } from 'knex';
import path from 'path';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_FILE || path.join(__dirname, 'dev.sqlite3'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src', 'database', 'migrations'),
      extension: 'ts',
    },
    pool: {
      afterCreate: (conn: any, cb: any) => conn.run('PRAGMA foreign_keys = ON', cb),
    },
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src', 'database', 'migrations'),
      extension: 'ts',
    },
    pool: {
      afterCreate: (conn: any, cb: any) => conn.run('PRAGMA foreign_keys = ON', cb),
    },
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_FILE || path.join(__dirname, 'prod.sqlite3'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'dist', 'database', 'migrations'),
      extension: 'js',
    },
    pool: {
      afterCreate: (conn: any, cb: any) => conn.run('PRAGMA foreign_keys = ON', cb),
    },
  },
};

export default config;
