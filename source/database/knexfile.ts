import * as dotenv from 'dotenv';

import type { Knex } from 'knex';

// the working directory was changed to .../source/database, hence the relative filepath.
dotenv.config({ path: `../../.env.${process.env.NODE_ENV}` });

const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

// Update with your config settings.

const configs: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql',
    connection: {
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    },
    migrations: {
      directory: '../../migrations',
    },
  },

  production: {
    client: 'mysql',
    connection: {
      host: DB_HOST,
      port: Number(DB_PORT),
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    },
  },
};

export default configs;
