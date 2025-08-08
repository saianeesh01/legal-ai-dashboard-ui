import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// For development, use SQLite instead of PostgreSQL for easier setup
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://legal_ai_user:legal_ai_password@localhost:5432/legal_ai_db';

// Check if we should use SQLite for development
const useSQLite = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

if (useSQLite) {
  console.log('ℹ️ Using SQLite for development (no setup required)');
  console.log('ℹ️ To use PostgreSQL, set DATABASE_URL environment variable');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10,
  min: 0
});

export const db = drizzle(pool, { schema });

// Test connection only if DATABASE_URL is actually set
if (process.env.DATABASE_URL) {
  pool.connect((err, client, release) => {
    if (err) {
      console.warn('⚠️ Database connection failed, but continuing in development mode');
      console.warn('💡 To fix this, either:');
      console.warn('   1. Install PostgreSQL and set up the database');
      console.warn('   2. Or remove DATABASE_URL to use SQLite');
    } else {
      console.log('✅ Database connected successfully');
      release();
    }
  });
} else {
  console.log('ℹ️ Running in development mode with SQLite (no database setup required)');
}