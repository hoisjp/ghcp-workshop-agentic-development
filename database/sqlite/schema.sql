PRAGMA foreign_keys = ON;

CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  email_address TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL
) STRICT;

CREATE TABLE stores (
  store_id INTEGER PRIMARY KEY,
  store_name TEXT NOT NULL UNIQUE,
  web_address TEXT,
  physical_address TEXT,
  latitude REAL,
  longitude REAL,
  CHECK (web_address IS NOT NULL OR physical_address IS NOT NULL)
) STRICT;

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  unit_price REAL CHECK (unit_price >= 0),
  product_details TEXT CHECK (product_details IS NULL OR json_valid(product_details))
) STRICT;

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  order_tms TEXT NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  order_status TEXT NOT NULL CHECK (
    order_status IN ('CANCELLED', 'COMPLETE', 'OPEN', 'PAID', 'REFUNDED', 'SHIPPED')
  ),
  store_id INTEGER NOT NULL REFERENCES stores(store_id)
) STRICT;

CREATE TABLE shipments (
  shipment_id INTEGER PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(store_id),
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  delivery_address TEXT NOT NULL,
  shipment_status TEXT NOT NULL CHECK (
    shipment_status IN ('CREATED', 'SHIPPED', 'IN-TRANSIT', 'DELIVERED')
  )
) STRICT;

CREATE TABLE order_items (
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  line_item_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  shipment_id INTEGER REFERENCES shipments(shipment_id),
  PRIMARY KEY (order_id, line_item_id),
  UNIQUE (product_id, order_id)
) STRICT;

CREATE TABLE inventory (
  inventory_id INTEGER PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(store_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  product_inventory INTEGER NOT NULL CHECK (product_inventory >= 0),
  UNIQUE (store_id, product_id)
) STRICT;

CREATE INDEX customers_name_i ON customers(full_name);
CREATE INDEX orders_customer_id_i ON orders(customer_id);
CREATE INDEX orders_store_id_i ON orders(store_id);
CREATE INDEX shipments_store_id_i ON shipments(store_id);
CREATE INDEX shipments_customer_id_i ON shipments(customer_id);
CREATE INDEX order_items_shipment_id_i ON order_items(shipment_id);
CREATE INDEX inventory_product_id_i ON inventory(product_id);

CREATE VIEW customer_order_products AS
SELECT
  o.order_id,
  o.order_tms,
  o.order_status,
  c.customer_id,
  c.email_address,
  c.full_name,
  ROUND(SUM(oi.quantity * oi.unit_price), 2) AS order_total,
  group_concat(p.product_name, ', ') AS items
FROM orders AS o
JOIN order_items AS oi ON o.order_id = oi.order_id
JOIN customers AS c ON o.customer_id = c.customer_id
JOIN products AS p ON oi.product_id = p.product_id
GROUP BY
  o.order_id,
  o.order_tms,
  o.order_status,
  c.customer_id,
  c.email_address,
  c.full_name;

CREATE VIEW product_orders AS
SELECT
  p.product_name,
  o.order_status,
  ROUND(SUM(oi.quantity * oi.unit_price), 2) AS total_sales,
  COUNT(*) AS order_count
FROM orders AS o
JOIN order_items AS oi ON o.order_id = oi.order_id
JOIN products AS p ON oi.product_id = p.product_id
GROUP BY p.product_name, o.order_status;

CREATE VIEW product_reviews AS
SELECT
  p.product_name,
  CAST(json_extract(review.value, '$.rating') AS INTEGER) AS rating,
  ROUND(AVG(CAST(json_extract(review.value, '$.rating') AS INTEGER)) OVER (
    PARTITION BY p.product_name
  ), 2) AS avg_rating,
  json_extract(review.value, '$.review') AS review
FROM products AS p
JOIN json_each(p.product_details, '$.reviews') AS review
WHERE p.product_details IS NOT NULL;