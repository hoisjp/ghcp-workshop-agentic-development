import { ORDER_STATUSES } from "./database.mjs";
import { formatDateTime, localizeHtml, statusLabel } from "./i18n.mjs";

const THEME_SCRIPT = `<script>
  (() => {
    const param = new URLSearchParams(window.location.search).get("scoutTheme");
    const theme =
      param || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  })();
</script>`;

const THEME_VARIABLES = `<style>
:root {
  color-scheme: light;
  --cp-bg: #f7f4ef;
  --cp-bg-elevated: #fcfbf8;
  --cp-surface: #ffffff;
  --cp-surface-soft: #f5f5f5;
  --cp-border: #dedede;
  --cp-border-strong: #919191;
  --cp-text: #242424;
  --cp-text-muted: #5c5c5c;
  --cp-text-soft: #6f6f6f;
  --cp-accent: #b11f4b;
  --cp-accent-hover: #9a1a41;
  --cp-accent-soft: rgba(177, 31, 75, 0.08);
  --cp-accent-fg: #ffffff;
  --cp-success: #16a34a;
  --cp-danger: #dc2626;
  --cp-warning: #f59e0b;
  --cp-link: #0078d4;
  --cp-shadow: 0 18px 48px rgba(0, 0, 0, 0.12);
  --cp-overlay: rgba(255, 255, 255, 0.8);
  --cp-panel: rgba(255, 255, 255, 0.86);
  --cp-panel-strong: rgba(255, 255, 255, 0.96);
  --cp-sheen: rgba(255, 255, 255, 0.55);
  --cp-highlight: rgba(177, 31, 75, 0.12);
}
html[data-theme="dark"] {
  color-scheme: dark;
  --cp-bg: #3d3b3a;
  --cp-bg-elevated: #343231;
  --cp-surface: #292929;
  --cp-surface-soft: #2e2e2e;
  --cp-border: #474747;
  --cp-border-strong: #5f5f5f;
  --cp-text: #dedede;
  --cp-text-muted: #919191;
  --cp-text-soft: #b0b0b0;
  --cp-accent: #fd8ea1;
  --cp-accent-hover: #fb7b91;
  --cp-accent-soft: rgba(253, 142, 161, 0.14);
  --cp-accent-fg: #1a1a1a;
  --cp-success: #4ade80;
  --cp-danger: #f87171;
  --cp-warning: #fbbf24;
  --cp-link: #4da6ff;
  --cp-shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
  --cp-overlay: rgba(41, 41, 41, 0.88);
  --cp-panel: rgba(41, 41, 41, 0.72);
  --cp-panel-strong: rgba(41, 41, 41, 0.96);
  --cp-sheen: rgba(255, 255, 255, 0.04);
  --cp-highlight: rgba(253, 142, 161, 0.12);
}
</style>`;

const NAVIGATION = [
  ["dashboard", "/", "Dashboard"],
  ["orders", "/orders", "Orders"],
  ["customers", "/customers", "Customers"],
  ["products", "/products", "Products"],
  ["inventory", "/inventory", "Inventory"],
  ["shipments", "/shipments", "Shipments"],
  ["stores", "/stores", "Stores"],
];

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function formatMoney(value) {
  return moneyFormatter.format(Number(value ?? 0));
}

function formatDate(value, locale) {
  return escapeHtml(formatDateTime(value, locale));
}

function statusBadge(status, locale) {
  const className = String(status).toLowerCase().replace(/[^a-z-]/g, "");
  return `<span class="status status-${className}">${escapeHtml(statusLabel(status, locale))}</span>`;
}

function pageHeader(eyebrow, title, description, action = "") {
  return `<header class="page-heading">
    <div>
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h1>${escapeHtml(title)}</h1>
      <p class="page-description">${escapeHtml(description)}</p>
    </div>
    ${action}
  </header>`;
}

function renderLayout({ title, active, content, locale, currentPath }) {
  const navigation = NAVIGATION.map(([key, href, label]) => {
    const current = key === active ? ' aria-current="page" class="active"' : "";
    return `<li><a href="${href}"${current}>${label}</a></li>`;
  }).join("");

  const returnPath = encodeURIComponent(currentPath);
  const html = `<!doctype html>
<html lang="en">
<head>
${THEME_SCRIPT}
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Customer order management workshop application">
  <title>${escapeHtml(title)} | Customer Orders</title>
${THEME_VARIABLES}
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="topbar">
    <div class="shell topbar-inner">
      <a class="brand" href="/" aria-label="Customer Orders home">
        <span class="brand-mark" aria-hidden="true">CO</span>
        <span>
          <strong>Customer Orders</strong>
          <small>Workshop system</small>
        </span>
      </a>
      <nav aria-label="Primary navigation">
        <ul>${navigation}</ul>
      </nav>
      <div class="language-switch" aria-label="Language">
        <a href="/language?lang=ja&amp;return=${returnPath}"${locale === "ja" ? ' aria-current="true"' : ""}>日本語</a>
        <a href="/language?lang=en&amp;return=${returnPath}"${locale === "en" ? ' aria-current="true"' : ""}>English</a>
      </div>
    </div>
  </header>
  <main id="main-content" class="shell main-content">
    ${content}
  </main>
  <footer class="footer">
    <div class="shell footer-inner">
      <span>Local workshop environment</span>
      <span>SQLite | Node.js standard library</span>
    </div>
  </footer>
</body>
</html>`;

  return localizeHtml(html, locale);
}

function orderRows(orders, locale) {
  if (orders.length === 0) {
    return '<tr><td colspan="6" class="empty-cell">No orders match the current filters.</td></tr>';
  }

  return orders.map((order) => `<tr>
    <td><a class="record-link" href="/orders/${order.order_id}">#${order.order_id}</a></td>
    <td>
      <strong>${escapeHtml(order.full_name)}</strong>
      <span class="secondary-line">${escapeHtml(order.email_address ?? "")}</span>
    </td>
    <td>${formatDate(order.order_tms, locale)}</td>
    <td>${statusBadge(order.order_status, locale)}</td>
    <td class="numeric">${formatMoney(order.order_total)}</td>
    <td class="truncate-cell">${escapeHtml(order.items)}</td>
  </tr>`).join("");
}

function orderTable(orders, locale) {
  return `<div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th scope="col">Order</th>
          <th scope="col">Customer</th>
          <th scope="col">Placed</th>
          <th scope="col">Status</th>
          <th scope="col" class="numeric">Total</th>
          <th scope="col">Items</th>
        </tr>
      </thead>
      <tbody>${orderRows(orders, locale)}</tbody>
    </table>
  </div>`;
}

export function renderDashboardPage({ summary, recentOrders, lowInventory, locale, currentPath }) {
  const lowInventoryRows = lowInventory.length === 0
    ? '<tr><td colspan="3" class="empty-cell">No low-stock products.</td></tr>'
    : lowInventory.map((item) => `<tr>
        <td>${escapeHtml(item.store_name)}</td>
        <td>${escapeHtml(item.product_name)}</td>
        <td class="numeric"><strong>${item.product_inventory}</strong></td>
      </tr>`).join("");

  const content = `${pageHeader(
    "Operations overview",
    "Dashboard",
    "Monitor orders, customers, products, and stock from one place.",
    '<a class="button primary" href="/orders/new">Create order</a>',
  )}
  <section class="metric-grid" aria-label="Key metrics">
    <article class="metric-card">
      <span>Total orders</span>
      <strong>${summary.total_orders}</strong>
      <small>${summary.open_orders} currently open</small>
    </article>
    <article class="metric-card">
      <span>Order value</span>
      <strong>${formatMoney(summary.order_value)}</strong>
      <small>Excludes cancelled and refunded orders</small>
    </article>
    <article class="metric-card">
      <span>Customers</span>
      <strong>${summary.total_customers}</strong>
      <small>Active customer records</small>
    </article>
    <article class="metric-card">
      <span>Products</span>
      <strong>${summary.total_products}</strong>
      <small>Products in the catalog</small>
    </article>
  </section>
  <div class="content-grid">
    <section class="panel panel-wide">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Latest activity</p>
          <h2>Recent orders</h2>
        </div>
        <a href="/orders">View all</a>
      </div>
      ${orderTable(recentOrders, locale)}
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Attention</p>
          <h2>Low inventory</h2>
        </div>
        <a href="/inventory">Inventory</a>
      </div>
      <div class="table-wrap compact-table">
        <table>
          <thead><tr><th scope="col">Store</th><th scope="col">Product</th><th scope="col" class="numeric">Units</th></tr></thead>
          <tbody>${lowInventoryRows}</tbody>
        </table>
      </div>
    </section>
  </div>`;

  return renderLayout({ title: "Dashboard", active: "dashboard", content, locale, currentPath });
}

export function renderOrdersPage({ orders, status = "", query = "", locale, currentPath }) {
  const options = ["", ...ORDER_STATUSES].map((value) => {
    const label = value ? statusLabel(value, locale) : "All statuses";
    const selected = value === status ? " selected" : "";
    return `<option value="${value}"${selected}>${label}</option>`;
  }).join("");

  const content = `${pageHeader(
    "Order management",
    "Orders",
    "Search orders by customer or order number and review their current status.",
    '<a class="button primary" href="/orders/new">Create order</a>',
  )}
  <section class="panel">
    <form class="filter-bar" method="get" action="/orders">
      <label>
        <span>Search</span>
        <input type="search" name="q" value="${escapeHtml(query)}" placeholder="Order number, name, or email">
      </label>
      <label>
        <span>Status</span>
        <select name="status">${options}</select>
      </label>
      <button class="button secondary" type="submit">Apply filters</button>
      <a class="button text-button" href="/orders">Clear</a>
    </form>
    <div class="result-count">${orders.length} order${orders.length === 1 ? "" : "s"}</div>
    ${orderTable(orders, locale)}
  </section>`;

  return renderLayout({ title: "Orders", active: "orders", content, locale, currentPath });
}

export function renderOrderDetailPage({ order, items, allowedTransitions, notice = "", locale, currentPath }) {
  const itemRows = items.map((item) => `<tr>
    <td>${item.line_item_id}</td>
    <td>
      <strong>${escapeHtml(item.product_name)}</strong>
      <span class="secondary-line">Product #${item.product_id}</span>
    </td>
    <td class="numeric">${formatMoney(item.unit_price)}</td>
    <td class="numeric">${item.quantity}</td>
    <td class="numeric">${formatMoney(item.line_total)}</td>
        <td>${item.shipment_id
      ? `<a href="/shipments">#${item.shipment_id}</a> ${statusBadge(item.shipment_status, locale)}`
      : '<span class="muted">Not assigned</span>'}</td>
  </tr>`).join("");

  const statusControl = allowedTransitions.length > 0
    ? `<form class="status-form" method="post" action="/orders/${order.order_id}/status">
        <label>
          <span>Next status</span>
          <select name="status" required>
            ${allowedTransitions.map((status) => `<option value="${status}">${statusLabel(status, locale)}</option>`).join("")}
          </select>
        </label>
        <button class="button primary" type="submit">Update status</button>
      </form>`
    : '<p class="muted">This order has no available status transitions.</p>';

  const noticeMarkup = notice
    ? `<div class="alert success" role="status">${escapeHtml(notice)}</div>`
    : "";

  const content = `${pageHeader(
    "Order detail",
    `Order #${order.order_id}`,
    `Placed ${formatDate(order.order_tms, locale)} at ${order.store_name}.`,
    '<a class="button secondary" href="/orders">Back to orders</a>',
  )}
  ${noticeMarkup}
  <div class="detail-grid">
    <section class="panel">
      <div class="panel-header"><h2>Summary</h2>${statusBadge(order.order_status, locale)}</div>
      <dl class="detail-list">
        <div><dt>Customer</dt><dd>${escapeHtml(order.full_name)}</dd></div>
        <div><dt>Email</dt><dd><a href="mailto:${escapeHtml(order.email_address)}">${escapeHtml(order.email_address)}</a></dd></div>
        <div><dt>Store</dt><dd>${escapeHtml(order.store_name)}</dd></div>
        <div><dt>Order total</dt><dd class="total-value">${formatMoney(order.order_total)}</dd></div>
      </dl>
    </section>
    <section class="panel">
      <div class="panel-header"><h2>Workflow</h2></div>
      <p class="muted">Move the order to its next operational state.</p>
      ${statusControl}
    </section>
  </div>
  <section class="panel">
    <div class="panel-header">
      <div><p class="eyebrow">Line items</p><h2>Products</h2></div>
      <strong>${items.length} item type${items.length === 1 ? "" : "s"}</strong>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th scope="col">Line</th><th scope="col">Product</th><th scope="col" class="numeric">Unit price</th><th scope="col" class="numeric">Quantity</th><th scope="col" class="numeric">Line total</th><th scope="col">Shipment</th></tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot><tr><th colspan="4" scope="row">Order total</th><td class="numeric"><strong>${formatMoney(order.order_total)}</strong></td><td></td></tr></tfoot>
      </table>
    </div>
  </section>`;

  return renderLayout({ title: `Order #${order.order_id}`, active: "orders", content, locale, currentPath });
}

export function renderNewOrderPage({ customers, stores, products, error = "", values = {}, locale, currentPath }) {
  const customerOptions = customers.map((customer) => {
    const selected = String(customer.customer_id) === String(values.customer_id ?? "") ? " selected" : "";
    return `<option value="${customer.customer_id}"${selected}>${escapeHtml(customer.full_name)} | ${escapeHtml(customer.email_address)}</option>`;
  }).join("");
  const storeOptions = stores.map((store) => {
    const selected = String(store.store_id) === String(values.store_id ?? "") ? " selected" : "";
    return `<option value="${store.store_id}"${selected}>${escapeHtml(store.store_name)}</option>`;
  }).join("");
  const productRows = products.map((product) => {
    const quantity = values[`quantity_${product.product_id}`] ?? "";
    return `<tr>
      <td><strong>${escapeHtml(product.product_name)}</strong><span class="secondary-line">${escapeHtml(product.stock_summary)}</span></td>
      <td class="numeric">${formatMoney(product.unit_price)}</td>
      <td class="quantity-cell"><label class="visually-hidden" for="quantity-${product.product_id}">Quantity for ${escapeHtml(product.product_name)}</label><input id="quantity-${product.product_id}" type="number" name="quantity_${product.product_id}" value="${escapeHtml(quantity)}" min="0" max="999" step="1" inputmode="numeric"></td>
    </tr>`;
  }).join("");
  const errorMarkup = error
    ? `<div class="alert danger" role="alert"><strong>Order could not be created.</strong><span>${escapeHtml(error)}</span></div>`
    : "";

  const content = `${pageHeader(
    "Order management",
    "Create order",
    "Choose a customer, store, and one or more product quantities.",
    '<a class="button secondary" href="/orders">Cancel</a>',
  )}
  ${errorMarkup}
  <form class="panel form-stack" method="post" action="/orders">
    <div class="form-grid">
      <label>
        <span>Customer</span>
        <select name="customer_id" required>
          <option value="">Select a customer</option>
          ${customerOptions}
        </select>
      </label>
      <label>
        <span>Fulfillment store</span>
        <select name="store_id" required>
          <option value="">Select a store</option>
          ${storeOptions}
        </select>
      </label>
    </div>
    <div>
      <div class="section-intro">
        <div><p class="eyebrow">Catalog</p><h2>Product quantities</h2></div>
        <p>Inventory is validated against the selected store when the order is submitted.</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th scope="col">Product</th><th scope="col" class="numeric">Unit price</th><th scope="col" class="quantity-cell">Quantity</th></tr></thead>
          <tbody>${productRows}</tbody>
        </table>
      </div>
    </div>
    <div class="form-actions">
      <a class="button text-button" href="/orders">Cancel</a>
      <button class="button primary" type="submit">Create order</button>
    </div>
  </form>`;

  return renderLayout({ title: "Create order", active: "orders", content, locale, currentPath });
}

export function renderCustomersPage(customers, { locale, currentPath }) {
  const rows = customers.map((customer) => `<tr>
    <td><strong>${escapeHtml(customer.full_name)}</strong><span class="secondary-line">Customer #${customer.customer_id}</span></td>
    <td><a href="mailto:${escapeHtml(customer.email_address)}">${escapeHtml(customer.email_address)}</a></td>
    <td class="numeric">${customer.order_count}</td>
    <td class="numeric">${formatMoney(customer.order_value)}</td>
  </tr>`).join("");

  const content = `${pageHeader(
    "Directory",
    "Customers",
    "Customer records and their aggregate order activity.",
  )}
  <section class="panel">
    <div class="table-wrap">
      <table>
        <thead><tr><th scope="col">Customer</th><th scope="col">Email</th><th scope="col" class="numeric">Orders</th><th scope="col" class="numeric">Order value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;

  return renderLayout({ title: "Customers", active: "customers", content, locale, currentPath });
}

export function renderProductsPage(products, { locale, currentPath }) {
  const cards = products.map((product) => `<article class="product-card">
    <div class="product-card-header">
      <span class="record-id">Product #${product.product_id}</span>
      <strong>${formatMoney(product.unit_price)}</strong>
    </div>
    <h2>${escapeHtml(product.product_name)}</h2>
    <dl class="mini-stats">
      <div><dt>Color</dt><dd>${escapeHtml(product.colour ?? "Not specified")}</dd></div>
      <div><dt>Inventory</dt><dd>${product.inventory_units} units</dd></div>
      <div><dt>Reviews</dt><dd>${product.review_count === 0 ? "No reviews" : `${product.average_rating} / 5 (${product.review_count})`}</dd></div>
    </dl>
  </article>`).join("");

  const content = `${pageHeader(
    "Catalog",
    "Products",
    "Pricing, inventory totals, and review data stored in the product catalog.",
  )}
  <section class="product-grid">${cards}</section>`;

  return renderLayout({ title: "Products", active: "products", content, locale, currentPath });
}

export function renderInventoryPage(inventory, { locale, currentPath }) {
  const rows = inventory.map((item) => `<tr>
    <td>${escapeHtml(item.store_name)}</td>
    <td><strong>${escapeHtml(item.product_name)}</strong><span class="secondary-line">Product #${item.product_id}</span></td>
    <td class="numeric"><span class="inventory-value${item.product_inventory <= 10 ? " low" : ""}">${item.product_inventory}</span></td>
  </tr>`).join("");

  const content = `${pageHeader(
    "Stock control",
    "Inventory",
    "Current product quantities by fulfillment store. Ten units or fewer are marked low.",
  )}
  <section class="panel">
    <div class="table-wrap">
      <table>
        <thead><tr><th scope="col">Store</th><th scope="col">Product</th><th scope="col" class="numeric">Available units</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;

  return renderLayout({ title: "Inventory", active: "inventory", content, locale, currentPath });
}

export function renderShipmentsPage(shipments, { locale, currentPath }) {
  const rows = shipments.length === 0
    ? '<tr><td colspan="6" class="empty-cell">No shipments found.</td></tr>'
    : shipments.map((shipment) => `<tr>
      <td><strong>#${shipment.shipment_id}</strong></td>
      <td>${statusBadge(shipment.shipment_status, locale)}</td>
      <td>${escapeHtml(shipment.full_name)}</td>
      <td>${escapeHtml(shipment.store_name)}</td>
      <td>${escapeHtml(shipment.delivery_address)}</td>
      <td class="numeric">${shipment.line_item_count}</td>
    </tr>`).join("");

  const content = `${pageHeader(
    "Fulfillment",
    "Shipments",
    "Shipment progress, delivery destinations, and assigned order lines.",
  )}
  <section class="panel">
    <div class="table-wrap">
      <table>
        <thead><tr><th scope="col">Shipment</th><th scope="col">Status</th><th scope="col">Customer</th><th scope="col">Store</th><th scope="col">Destination</th><th scope="col" class="numeric">Lines</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`;

  return renderLayout({ title: "Shipments", active: "shipments", content, locale, currentPath });
}

export function renderStoresPage(stores, { locale, currentPath }) {
  const cards = stores.map((store) => `<article class="store-card">
    <span class="record-id">Store #${store.store_id}</span>
    <h2>${escapeHtml(store.store_name)}</h2>
    <p>${store.web_address
      ? `<a href="${escapeHtml(store.web_address)}">${escapeHtml(store.web_address)}</a>`
      : escapeHtml(store.physical_address)}</p>
    <dl class="mini-stats horizontal">
      <div><dt>Orders</dt><dd>${store.order_count}</dd></div>
      <div><dt>Inventory</dt><dd>${store.inventory_units} units</dd></div>
    </dl>
  </article>`).join("");

  const content = `${pageHeader(
    "Sales channels",
    "Stores",
    "Online and physical locations that own orders and inventory.",
  )}
  <section class="store-grid">${cards}</section>`;

  return renderLayout({ title: "Stores", active: "stores", content, locale, currentPath });
}

export function renderErrorPage({ statusCode, message, locale, currentPath }) {
  const content = `<section class="error-state">
    <span class="error-code">${statusCode}</span>
    <h1>${statusCode === 404 ? "Page not found" : "Request failed"}</h1>
    <p>${escapeHtml(message)}</p>
    <a class="button primary" href="/">Return to dashboard</a>
  </section>`;

  return renderLayout({ title: `Error ${statusCode}`, active: "", content, locale, currentPath });
}
