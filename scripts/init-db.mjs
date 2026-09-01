import { DatabaseSync } from "node:sqlite";
import { mkdir, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const rootUrl = new URL("../", import.meta.url);
const dataUrl = new URL("data/", rootUrl);
const databaseUrl = new URL("workshop.db", dataUrl);
const schemaUrl = new URL("database/sqlite/schema.sql", rootUrl);
const seedUrl = new URL("database/sqlite/seed.sql", rootUrl);

await mkdir(dataUrl, { recursive: true });
await rm(databaseUrl, { force: true });

const [schema, seed] = await Promise.all([
  readFile(schemaUrl, "utf8"),
  readFile(seedUrl, "utf8"),
]);

const database = new DatabaseSync(fileURLToPath(databaseUrl));

try {
  database.exec("PRAGMA foreign_keys = ON; BEGIN IMMEDIATE;");
  database.exec(schema);
  database.exec(seed);
  database.exec("COMMIT;");

  const integrity = database.prepare("PRAGMA integrity_check").get();
  const foreignKeyErrors = database.prepare("PRAGMA foreign_key_check").all();

  if (integrity.integrity_check !== "ok" || foreignKeyErrors.length > 0) {
    throw new Error("Database validation failed.");
  }

  const counts = database.prepare(`
    SELECT
      (SELECT COUNT(*) FROM customers) AS customers,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COUNT(*) FROM order_items) AS order_items
  `).get();

  console.log(`Database initialized: ${fileURLToPath(databaseUrl)}`);
  console.table([counts]);
} catch (error) {
  if (database.isTransaction) {
    database.exec("ROLLBACK;");
  }
  await rm(databaseUrl, { force: true });
  throw error;
} finally {
  database.close();
}