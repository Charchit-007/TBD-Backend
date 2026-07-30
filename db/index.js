import pg from 'pg';

const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      database: process.env.DB_NAME || 'reddit_db',
      user: process.env.DB_USER || 'charchit',
      password: process.env.DB_PASSWORD || '123',
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[pg pool] Unexpected error on idle client:', err);
});

export default pool;