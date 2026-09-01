import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { createWorkshopApplication } from "../app/server.mjs";

let application;
let baseUrl;
let databasePath;
let server;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), "customer-orders-test-"));
  databasePath = join(temporaryDirectory, "workshop.db");

  const [schema, seed] = await Promise.all([
    readFile(new URL("../database/sqlite/schema.sql", import.meta.url), "utf8"),
    readFile(new URL("../database/sqlite/seed.sql", import.meta.url), "utf8"),
  ]);

  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA foreign_keys = ON; BEGIN IMMEDIATE;");
    database.exec(schema);
    database.exec(seed);
    database.exec("COMMIT;");
  } finally {
    database.close();
  }

  application = createWorkshopApplication({
    databasePath,
    logger: { error() {} },
  });
  server = createServer(application.handle);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  application?.close();
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test("health endpoint reports a valid database", async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    database: "ok",
  });
});

test("dashboard defaults to Japanese and renders summary data", async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<html lang="ja">/);
  assert.match(html, /<title>ダッシュボード \| 顧客注文管理<\/title>/);
  assert.match(html, /<h1>ダッシュボード<\/h1>/);
  assert.match(html, />3<\/strong>\s*<small>未処理 1件<\/small>/);
  assert.match(html, /Workshop Hoodie, USB-C Cable/);
  assert.match(html, />日本語<\/a>/);
  assert.match(html, />English<\/a>/);
  assert.match(html, /--cp-accent: #b11f4b/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /顧客注文管理/);
});

test("language selection switches to English and persists in a cookie", async () => {
  const switchResponse = await fetch(
    `${baseUrl}/language?lang=en&return=${encodeURIComponent("/orders?status=OPEN")}`,
    { redirect: "manual" },
  );

  assert.equal(switchResponse.status, 303);
  assert.equal(switchResponse.headers.get("location"), "/orders?status=OPEN");
  const cookie = switchResponse.headers.get("set-cookie");
  assert.match(cookie, /^workshop_language=en;/);
  assert.match(cookie, /SameSite=Lax/);

  const englishResponse = await fetch(`${baseUrl}/orders?status=OPEN`, {
    headers: { Cookie: cookie },
  });
  const englishHtml = await englishResponse.text();

  assert.equal(englishResponse.status, 200);
  assert.match(englishHtml, /<html lang="en">/);
  assert.match(englishHtml, /<title>Orders \| Customer Orders<\/title>/);
  assert.match(englishHtml, /<h1>Orders<\/h1>/);
  assert.match(englishHtml, />OPEN<\/span>/);
  assert.doesNotMatch(englishHtml, /<h1>注文<\/h1>/);
});

test("language selection rejects an external return location", async () => {
  const response = await fetch(
    `${baseUrl}/language?lang=unknown&return=${encodeURIComponent("//example.com")}`,
    { redirect: "manual" },
  );

  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/");
  assert.match(response.headers.get("set-cookie"), /^workshop_language=ja;/);
});

test("all primary pages render in Japanese and English", async () => {
  const pages = [
    ["/", "ダッシュボード", "Dashboard"],
    ["/orders", "注文", "Orders"],
    ["/orders/new", "注文を登録", "Create order"],
    ["/orders/1001", "注文 #1001", "Order #1001"],
    ["/customers", "顧客", "Customers"],
    ["/products", "商品", "Products"],
    ["/inventory", "在庫", "Inventory"],
    ["/shipments", "出荷", "Shipments"],
    ["/stores", "店舗", "Stores"],
  ];

  for (const [path, japaneseHeading, englishHeading] of pages) {
    const japaneseResponse = await fetch(`${baseUrl}${path}`);
    const japaneseHtml = await japaneseResponse.text();
    assert.equal(japaneseResponse.status, 200, path);
    assert.match(japaneseHtml, /<html lang="ja">/, path);
    assert.match(japaneseHtml, new RegExp(`<h1>${japaneseHeading}<\\/h1>`), path);

    const englishResponse = await fetch(`${baseUrl}${path}`, {
      headers: { Cookie: "workshop_language=en" },
    });
    const englishHtml = await englishResponse.text();
    assert.equal(englishResponse.status, 200, path);
    assert.match(englishHtml, /<html lang="en">/, path);
    assert.match(englishHtml, new RegExp(`<h1>${englishHeading}<\\/h1>`), path);
  }
});

test("orders can be filtered and inspected", async () => {
  const listResponse = await fetch(`${baseUrl}/orders?status=OPEN&q=Taylor`);
  const listHtml = await listResponse.text();

  assert.equal(listResponse.status, 200);
  assert.match(listHtml, /Order #?1003|#1003/);
  assert.match(listHtml, /Taylor Kim/);
  assert.doesNotMatch(listHtml, /Alex Morgan/);

  const detailResponse = await fetch(`${baseUrl}/orders/1001`);
  const detailHtml = await detailResponse.text();

  assert.equal(detailResponse.status, 200);
  assert.match(detailHtml, /Workshop Hoodie/);
  assert.match(detailHtml, /Developer Mug/);
  assert.match(detailHtml, /\$77\.00/);
});

test("new orders reserve inventory and can advance status", async () => {
  const createResponse = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    body: new URLSearchParams({
      customer_id: "1",
      store_id: "1",
      quantity_2: "2",
    }),
    redirect: "manual",
  });

  assert.equal(createResponse.status, 303);
  assert.equal(createResponse.headers.get("location"), "/orders/1004?created=1");

  const detailResponse = await fetch(`${baseUrl}/orders/1004?created=1`);
  const detailHtml = await detailResponse.text();
  assert.equal(detailResponse.status, 200);
  assert.match(detailHtml, /注文を登録しました/);
  assert.match(detailHtml, /Developer Mug/);
  assert.match(detailHtml, /\$29\.00/);

  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const order = database.prepare(`
      SELECT order_status
      FROM orders
      WHERE order_id = 1004
    `).get();
    const inventory = database.prepare(`
      SELECT product_inventory
      FROM inventory
      WHERE store_id = 1 AND product_id = 2
    `).get();
    assert.equal(order.order_status, "OPEN");
    assert.equal(inventory.product_inventory, 28);
  } finally {
    database.close();
  }

  const statusResponse = await fetch(`${baseUrl}/orders/1004/status`, {
    method: "POST",
    body: new URLSearchParams({ status: "PAID" }),
    redirect: "manual",
  });
  assert.equal(statusResponse.status, 303);
  assert.equal(statusResponse.headers.get("location"), "/orders/1004?updated=1");

  const verificationDatabase = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const updated = verificationDatabase.prepare(`
      SELECT order_status
      FROM orders
      WHERE order_id = 1004
    `).get();
    assert.equal(updated.order_status, "PAID");
  } finally {
    verificationDatabase.close();
  }
});

test("invalid orders return a validation message without changing data", async () => {
  const response = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    body: new URLSearchParams({
      customer_id: "1",
      store_id: "1",
      quantity_1: "999",
    }),
  });
  const html = await response.text();

  assert.equal(response.status, 400);
  assert.match(html, /在庫は12個です/);

  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const result = database.prepare("SELECT COUNT(*) AS count FROM orders").get();
    assert.equal(result.count, 4);
  } finally {
    database.close();
  }
});

test("search values are escaped before rendering", async () => {
  const response = await fetch(`${baseUrl}/orders?q=${encodeURIComponent("<script>alert(1)</script>")}`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.doesNotMatch(html, /value="<script>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});
