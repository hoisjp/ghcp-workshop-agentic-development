import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(new URL("../data/workshop.db", import.meta.url));

function openDatabase() {
  return new DatabaseSync(databasePath, { readOnly: true });
}

test("database passes integrity and foreign key checks", () => {
  const database = openDatabase();

  try {
    const integrity = database.prepare("PRAGMA integrity_check").get();
    assert.deepEqual({ ...integrity }, {
      integrity_check: "ok",
    });
    assert.deepEqual(database.prepare("PRAGMA foreign_key_check").all(), []);
  } finally {
    database.close();
  }
});

test("seed data contains the expected row counts", () => {
  const database = openDatabase();

  try {
    const counts = database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM customers) AS customers,
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM order_items) AS order_items
    `).get();

    assert.deepEqual({ ...counts }, {
      customers: 3,
      products: 3,
      orders: 3,
      order_items: 5,
    });
  } finally {
    database.close();
  }
});

test("customer order summary returns the expected totals", () => {
  const database = openDatabase();

  try {
    const orders = database.prepare(`
      SELECT order_id, order_status, order_total
      FROM customer_order_products
      ORDER BY order_id
    `).all().map((row) => ({ ...row }));

    assert.deepEqual(orders, [
      { order_id: 1001, order_status: "COMPLETE", order_total: 77 },
      { order_id: 1002, order_status: "SHIPPED", order_total: 29.4 },
      { order_id: 1003, order_status: "OPEN", order_total: 105.8 },
    ]);
  } finally {
    database.close();
  }
});