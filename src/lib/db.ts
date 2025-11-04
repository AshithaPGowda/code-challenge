import { createPool } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
});

export const db = pool;

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function getClient() {
  return await pool.connect();
}