import { DatabaseSync } from "node:sqlite";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const databaseUrl = new URL("../data/workshop.db", import.meta.url);
const databasePath = fileURLToPath(databaseUrl);
const defaultQuery = `
  SELECT order_id, full_name, order_status, order_total, items
  FROM customer_order_products
  ORDER BY order_id
`;
const query = process.argv.slice(2).join(" ").trim() || defaultQuery;

try {
  await access(databaseUrl);
} catch {
  throw new Error("Database not found. Run npm run db:init first.");
}

if (!/^\s*(SELECT|WITH|PRAGMA)\b/i.test(query)) {
  throw new Error("Only read-only SELECT, WITH, or PRAGMA queries are allowed.");
}

const database = new DatabaseSync(databasePath, { readOnly: true });

try {
  const rows = database.prepare(query).all();
  console.table(rows);
  console.log(`${rows.length} row(s)`);
} finally {
  database.close();
}