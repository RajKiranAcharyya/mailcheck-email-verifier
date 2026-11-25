import knex, { Knex } from 'knex';
import path from 'path';

const environment = process.env.NODE_ENV || 'development';
const isTypeScript = __filename.endsWith('.ts');

export const knexConfig: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename:
      environment === 'test'
        ? ':memory:'
        : process.env.DATABASE_FILE || path.resolve(__dirname, '../../dev.sqlite3'),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(__dirname, 'migrations'),
    extension: isTypeScript ? 'ts' : 'js',
    loadExtensions: [isTypeScript ? '.ts' : '.js'],
  },
  pool: {
    afterCreate: (conn: any, cb: any) => conn.run('PRAGMA foreign_keys = ON', cb),
  },
};

export const db: Knex = knex(knexConfig);

export async function runMigrations(): Promise<void> {
  await db.migrate.latest();
}

export default db;
