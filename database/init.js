// Usage: node database/init.js
// Reads .env for DB_HOST/DB_PORT/DB_USER/DB_PASSWORD, then executes schema.sql.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  console.log("Running schema.sql against MySQL...");
  await connection.query(sql);
  console.log("Done. Database 'flexhome' is ready.");
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
