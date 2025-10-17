import mysql from 'mysql2/promise';
import 'dotenv/config';

const { DATABASE_CEIAF_URL } = process.env;

if (!DATABASE_CEIAF_URL) {
  throw new Error('DATABASE_CEIAF_URL no está definida en .env');
}

/**
 * Crea un pool de conexiones a MySQL (Railway).
 * Si Railway exige SSL, descomenta la sección ssl.
 */
export const ceiafPool = mysql.createPool({
  uri: DATABASE_CEIAF_URL,
  // ssl: { rejectUnauthorized: true }, // <- habilítalo si te da error de SSL
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});
