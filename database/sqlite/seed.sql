INSERT INTO customers (customer_id, email_address, full_name) VALUES
  (1, 'alex@example.com', 'Alex Morgan'),
  (2, 'jamie@example.com', 'Jamie Chen'),
  (3, 'taylor@example.com', 'Taylor Kim');

INSERT INTO stores (
  store_id,
  store_name,
  web_address,
  physical_address,
  latitude,
  longitude
) VALUES
  (1, 'Online', 'https://www.example.com', NULL, NULL, NULL),
  (2, 'Tokyo', NULL, 'Tokyo, Japan', 35.6762, 139.6503);

INSERT INTO products (product_id, product_name, unit_price, product_details) VALUES
  (1, 'Workshop Hoodie', 48.00, '{"colour":"navy","reviews":[{"rating":5,"review":"Comfortable and durable."},{"rating":4,"review":"Good for cool offices."}]}'),
  (2, 'Developer Mug', 14.50, '{"colour":"white","reviews":[{"rating":5,"review":"A useful desk companion."}]}'),
  (3, 'USB-C Cable', 9.80, '{"colour":"black","reviews":[]}');

INSERT INTO orders (order_id, order_tms, customer_id, order_status, store_id) VALUES
  (1001, '2026-08-28T09:15:00Z', 1, 'COMPLETE', 1),
  (1002, '2026-08-29T10:30:00Z', 2, 'SHIPPED', 1),
  (1003, '2026-08-30T04:10:00Z', 3, 'OPEN', 2);

INSERT INTO shipments (
  shipment_id,
  store_id,
  customer_id,
  delivery_address,
  shipment_status
) VALUES
  (2001, 1, 1, 'Seattle, WA, USA', 'DELIVERED'),
  (2002, 1, 2, 'Sydney, NSW, Australia', 'IN-TRANSIT');

INSERT INTO order_items (
  order_id,
  line_item_id,
  product_id,
  unit_price,
  quantity,
  shipment_id
) VALUES
  (1001, 1, 1, 48.00, 1, 2001),
  (1001, 2, 2, 14.50, 2, 2001),
  (1002, 1, 3, 9.80, 3, 2002),
  (1003, 1, 1, 48.00, 2, NULL),
  (1003, 2, 3, 9.80, 1, NULL);

INSERT INTO inventory (
  inventory_id,
  store_id,
  product_id,
  product_inventory
) VALUES
  (3001, 1, 1, 12),
  (3002, 1, 2, 30),
  (3003, 1, 3, 45),
  (3004, 2, 1, 5),
  (3005, 2, 2, 10),
  (3006, 2, 3, 20);