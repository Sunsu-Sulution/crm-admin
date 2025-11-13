/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pool } from 'pg';

// Create a connection pool
// If DATABASE_URL is provided, use it directly
// Otherwise, use individual environment variables
const poolConfig: any = {};

if (process.env.DATABASE_URL) {
  poolConfig.connectionString = process.env.DATABASE_URL;
  // Enable SSL for production (e.g., Vercel, Railway, etc.)
  if (process.env.NODE_ENV === 'production') {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
} else {
  poolConfig.host = process.env.POSTGRES_HOST || 'localhost';
  poolConfig.port = parseInt(process.env.POSTGRES_PORT || '5432', 10);
  poolConfig.database = process.env.POSTGRES_DATABASE;
  poolConfig.user = process.env.POSTGRES_USER;
  poolConfig.password = process.env.POSTGRES_PASSWORD;
  poolConfig.ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}

const pool = new Pool(poolConfig);

// Test connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err.message);
  });

export default pool;

