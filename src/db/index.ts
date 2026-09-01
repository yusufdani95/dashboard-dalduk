import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '../config/env';
import * as schema from './schema';

// Create MySQL connection pool
export const poolConnection = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialize Drizzle ORM instance
export const db = drizzle(poolConnection, { schema, mode: 'default' });

/**
 * Health check helper to test database connectivity
 */
export async function checkDbConnection(): Promise<{ connected: boolean; message?: string }> {
  try {
    const connection = await poolConnection.getConnection();
    await connection.ping();
    connection.release();
    return { connected: true };
  } catch (error: any) {
    return { connected: false, message: error?.message || 'Database connection error' };
  }
}
