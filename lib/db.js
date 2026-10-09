// Raw MySQL access via mysql2, no ORM.
// Import `query` inside app/api/* route handlers (server-side only —
// never import this file from a "use client" component).

import mysql from "mysql2/promise";

// Next.js dev re-evaluates this module on every hot reload; caching the pool
// on globalThis (instead of a module-level variable) keeps it a true
// singleton across reloads so we don't leak a fresh batch of connections
// on every file save.
const globalForDb = globalThis;

function getPool() {
  if (!globalForDb.__mysqlPool) {
    globalForDb.__mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "flexhome",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
    });
  }
  return globalForDb.__mysqlPool;
}

// query("SELECT * FROM properties WHERE id = ?", [id])
export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

export default getPool;
