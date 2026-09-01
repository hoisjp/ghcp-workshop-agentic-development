import { DatabaseSync } from "node:sqlite";

export const ORDER_STATUSES = [
  "OPEN",
  "PAID",
  "SHIPPED",
  "COMPLETE",
  "CANCELLED",
  "REFUNDED",
];

const STATUS_TRANSITIONS = {
  OPEN: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["COMPLETE", "REFUNDED"],
  COMPLETE: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export class ApplicationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ApplicationError";
    this.statusCode = statusCode;
  }
}

function plainRow(row) {
  return row ? { ...row } : null;
}

function plainRows(rows) {
  return rows.map((row) => ({ ...row }));
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function assertPositiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ApplicationError(`${label} must be a positive integer.`);
  }
}

export function openWorkshopDatabase(databasePath) {
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  return database;
}

export function createOrderManager(database) {
  function getDashboard() {
    const summary = plainRow(database.prepare(`
      SELECT
        (SELECT COUNT(*) FROM orders) AS total_orders,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'OPEN') AS open_orders,
        (SELECT COUNT(*) FROM customers) AS total_customers,
        (SELECT COUNT(*) FROM products) AS total_products,
        (
          SELECT ROUND(COALESCE(SUM(order_total), 0), 2)
          FROM customer_order_products
          WHERE order_status NOT IN ('CANCELLED', 'REFUNDED')
        ) AS order_value
    `).get());

    const recentOrders = plainRows(database.prepare(`
      SELECT order_id, order_tms, order_status, full_name, order_total, items
      FROM customer_order_products
      ORDER BY order_tms DESC, order_id DESC
      LIMIT 5
    `).all());

    const lowInventory = plainRows(database.prepare(`
      SELECT
        s.store_name,
        p.product_name,
        i.product_inventory
      FROM inventory AS i
      JOIN stores AS s ON s.store_id = i.store_id
      JOIN products AS p ON p.product_id = i.product_id
      WHERE i.product_inventory <= 10
      ORDER BY i.product_inventory, s.store_name, p.product_name
    `).all());

    return { summary, recentOrders, lowInventory };
  }

  function listOrders({ status = "", query = "" } = {}) {
    const normalizedStatus = status.trim().toUpperCase();
    const normalizedQuery = query.trim().slice(0, 100);

    if (normalizedStatus && !ORDER_STATUSES.includes(normalizedStatus)) {
      throw new ApplicationError("The requested order status is not valid.");
    }

    const search = `%${escapeLike(normalizedQuery)}%`;
    return plainRows(database.prepare(`
      SELECT
        order_id,
        order_tms,
        order_status,
        customer_id,
        full_name,
        email_address,
        order_total,
        items
      FROM customer_order_products
      WHERE (? = '' OR order_status = ?)
        AND (
          ? = ''
          OR CAST(order_id AS TEXT) LIKE ? ESCAPE '\\'
          OR full_name LIKE ? ESCAPE '\\' COLLATE NOCASE
          OR email_address LIKE ? ESCAPE '\\' COLLATE NOCASE
        )
      ORDER BY order_tms DESC, order_id DESC
    `).all(
      normalizedStatus,
      normalizedStatus,
      normalizedQuery,
      search,
      search,
      search,
    ));
  }

  function getOrder(orderId) {
    assertPositiveInteger(orderId, "Order ID");

    const order = plainRow(database.prepare(`
      SELECT
        summary.order_id,
        summary.order_tms,
        summary.order_status,
        summary.customer_id,
        summary.email_address,
        summary.full_name,
        summary.order_total,
        summary.items,
        o.store_id,
        s.store_name
      FROM customer_order_products AS summary
      JOIN orders AS o ON o.order_id = summary.order_id
      JOIN stores AS s ON s.store_id = o.store_id
      WHERE summary.order_id = ?
    `).get(orderId));

    if (!order) {
      throw new ApplicationError("Order not found.", 404);
    }

    const items = plainRows(database.prepare(`
      SELECT
        oi.line_item_id,
        oi.product_id,
        p.product_name,
        oi.unit_price,
        oi.quantity,
        ROUND(oi.unit_price * oi.quantity, 2) AS line_total,
        oi.shipment_id,
        sh.shipment_status
      FROM order_items AS oi
      JOIN products AS p ON p.product_id = oi.product_id
      LEFT JOIN shipments AS sh ON sh.shipment_id = oi.shipment_id
      WHERE oi.order_id = ?
      ORDER BY oi.line_item_id
    `).all(orderId));

    return {
      order,
      items,
      allowedTransitions: [...STATUS_TRANSITIONS[order.order_status]],
    };
  }

  function listCustomers() {
    return plainRows(database.prepare(`
      SELECT
        c.customer_id,
        c.full_name,
        c.email_address,
        COUNT(DISTINCT o.order_id) AS order_count,
        ROUND(COALESCE(SUM(oi.quantity * oi.unit_price), 0), 2) AS order_value
      FROM customers AS c
      LEFT JOIN orders AS o ON o.customer_id = c.customer_id
      LEFT JOIN order_items AS oi ON oi.order_id = o.order_id
      GROUP BY c.customer_id, c.full_name, c.email_address
      ORDER BY c.full_name
    `).all());
  }

  function listProducts() {
    return plainRows(database.prepare(`
      SELECT
        p.product_id,
        p.product_name,
        p.unit_price,
        json_extract(p.product_details, '$.colour') AS colour,
        COALESCE((
          SELECT SUM(i.product_inventory)
          FROM inventory AS i
          WHERE i.product_id = p.product_id
        ), 0) AS inventory_units,
        (
          SELECT COUNT(*)
          FROM json_each(p.product_details, '$.reviews')
        ) AS review_count,
        (
          SELECT ROUND(AVG(CAST(json_extract(review.value, '$.rating') AS INTEGER)), 2)
          FROM json_each(p.product_details, '$.reviews') AS review
        ) AS average_rating
      FROM products AS p
      ORDER BY p.product_name
    `).all());
  }

  function listInventory() {
    return plainRows(database.prepare(`
      SELECT
        i.inventory_id,
        s.store_id,
        s.store_name,
        p.product_id,
        p.product_name,
        i.product_inventory
      FROM inventory AS i
      JOIN stores AS s ON s.store_id = i.store_id
      JOIN products AS p ON p.product_id = i.product_id
      ORDER BY s.store_name, p.product_name
    `).all());
  }

  function listShipments() {
    return plainRows(database.prepare(`
      SELECT
        sh.shipment_id,
        sh.shipment_status,
        sh.delivery_address,
        s.store_name,
        c.full_name,
        COUNT(oi.line_item_id) AS line_item_count
      FROM shipments AS sh
      JOIN stores AS s ON s.store_id = sh.store_id
      JOIN customers AS c ON c.customer_id = sh.customer_id
      LEFT JOIN order_items AS oi ON oi.shipment_id = sh.shipment_id
      GROUP BY
        sh.shipment_id,
        sh.shipment_status,
        sh.delivery_address,
        s.store_name,
        c.full_name
      ORDER BY sh.shipment_id DESC
    `).all());
  }

  function listStores() {
    return plainRows(database.prepare(`
      SELECT
        s.store_id,
        s.store_name,
        s.web_address,
        s.physical_address,
        (
          SELECT COUNT(*)
          FROM orders AS o
          WHERE o.store_id = s.store_id
        ) AS order_count,
        COALESCE((
          SELECT SUM(i.product_inventory)
          FROM inventory AS i
          WHERE i.store_id = s.store_id
        ), 0) AS inventory_units
      FROM stores AS s
      ORDER BY s.store_name
    `).all());
  }

  function getNewOrderData() {
    const customers = plainRows(database.prepare(`
      SELECT customer_id, full_name, email_address
      FROM customers
      ORDER BY full_name
    `).all());

    const stores = plainRows(database.prepare(`
      SELECT store_id, store_name
      FROM stores
      ORDER BY store_name
    `).all());

    const products = plainRows(database.prepare(`
      SELECT
        p.product_id,
        p.product_name,
        p.unit_price,
        COALESCE((
          SELECT group_concat(s.store_name || ': ' || i.product_inventory, ' / ')
          FROM inventory AS i
          JOIN stores AS s ON s.store_id = i.store_id
          WHERE i.product_id = p.product_id
          ORDER BY s.store_name
        ), 'No stock') AS stock_summary
      FROM products AS p
      ORDER BY p.product_name
    `).all());

    return { customers, stores, products };
  }

  function createOrder({ customerId, storeId, items }) {
    assertPositiveInteger(customerId, "Customer ID");
    assertPositiveInteger(storeId, "Store ID");

    if (!Array.isArray(items) || items.length === 0) {
      throw new ApplicationError("Select at least one product quantity.");
    }

    const quantities = new Map();
    for (const item of items) {
      assertPositiveInteger(item.productId, "Product ID");
      assertPositiveInteger(item.quantity, "Quantity");
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    }

    database.exec("BEGIN IMMEDIATE;");

    try {
      const customer = database.prepare(`
        SELECT customer_id
        FROM customers
        WHERE customer_id = ?
      `).get(customerId);
      if (!customer) {
        throw new ApplicationError("Customer not found.");
      }

      const store = database.prepare(`
        SELECT store_id
        FROM stores
        WHERE store_id = ?
      `).get(storeId);
      if (!store) {
        throw new ApplicationError("Store not found.");
      }

      const selectedProducts = [];
      const productStatement = database.prepare(`
        SELECT
          p.product_id,
          p.product_name,
          p.unit_price,
          COALESCE(i.product_inventory, 0) AS available_quantity
        FROM products AS p
        LEFT JOIN inventory AS i
          ON i.product_id = p.product_id
         AND i.store_id = ?
        WHERE p.product_id = ?
      `);

      for (const [productId, quantity] of quantities) {
        const product = plainRow(productStatement.get(storeId, productId));
        if (!product) {
          throw new ApplicationError(`Product ${productId} was not found.`);
        }
        if (product.available_quantity < quantity) {
          throw new ApplicationError(
            `${product.product_name} has only ${product.available_quantity} units available at this store.`,
          );
        }
        selectedProducts.push({ ...product, quantity });
      }

      const orderResult = database.prepare(`
        INSERT INTO orders (order_tms, customer_id, order_status, store_id)
        VALUES (?, ?, 'OPEN', ?)
      `).run(new Date().toISOString(), customerId, storeId);
      const orderId = Number(orderResult.lastInsertRowid);

      const insertItem = database.prepare(`
        INSERT INTO order_items (
          order_id,
          line_item_id,
          product_id,
          unit_price,
          quantity,
          shipment_id
        ) VALUES (?, ?, ?, ?, ?, NULL)
      `);
      const reduceInventory = database.prepare(`
        UPDATE inventory
        SET product_inventory = product_inventory - ?
        WHERE store_id = ? AND product_id = ?
      `);

      selectedProducts.forEach((product, index) => {
        insertItem.run(
          orderId,
          index + 1,
          product.product_id,
          product.unit_price,
          product.quantity,
        );
        reduceInventory.run(product.quantity, storeId, product.product_id);
      });

      database.exec("COMMIT;");
      return orderId;
    } catch (error) {
      if (database.isTransaction) {
        database.exec("ROLLBACK;");
      }
      throw error;
    }
  }

  function updateOrderStatus(orderId, nextStatus) {
    assertPositiveInteger(orderId, "Order ID");
    const normalizedStatus = nextStatus.trim().toUpperCase();

    if (!ORDER_STATUSES.includes(normalizedStatus)) {
      throw new ApplicationError("The requested order status is not valid.");
    }

    database.exec("BEGIN IMMEDIATE;");

    try {
      const currentOrder = plainRow(database.prepare(`
        SELECT order_status, store_id
        FROM orders
        WHERE order_id = ?
      `).get(orderId));

      if (!currentOrder) {
        throw new ApplicationError("Order not found.", 404);
      }

      if (!STATUS_TRANSITIONS[currentOrder.order_status].includes(normalizedStatus)) {
        throw new ApplicationError(
          `Order status cannot change from ${currentOrder.order_status} to ${normalizedStatus}.`,
        );
      }

      if (normalizedStatus === "CANCELLED") {
        const unshippedItems = plainRows(database.prepare(`
          SELECT product_id, quantity
          FROM order_items
          WHERE order_id = ? AND shipment_id IS NULL
        `).all(orderId));
        const restoreInventory = database.prepare(`
          UPDATE inventory
          SET product_inventory = product_inventory + ?
          WHERE store_id = ? AND product_id = ?
        `);

        for (const item of unshippedItems) {
          restoreInventory.run(
            item.quantity,
            currentOrder.store_id,
            item.product_id,
          );
        }
      }

      database.prepare(`
        UPDATE orders
        SET order_status = ?
        WHERE order_id = ?
      `).run(normalizedStatus, orderId);

      database.exec("COMMIT;");
      return normalizedStatus;
    } catch (error) {
      if (database.isTransaction) {
        database.exec("ROLLBACK;");
      }
      throw error;
    }
  }

  return {
    getDashboard,
    listOrders,
    getOrder,
    listCustomers,
    listProducts,
    listInventory,
    listShipments,
    listStores,
    getNewOrderData,
    createOrder,
    updateOrderStatus,
  };
}
