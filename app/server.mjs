import { readFile } from "node:fs/promises";
import { createOrderManager, ApplicationError, openWorkshopDatabase } from "./database.mjs";
import { localeFromCookie, normalizeLocale } from "./i18n.mjs";
import {
  renderCustomersPage,
  renderDashboardPage,
  renderErrorPage,
  renderInventoryPage,
  renderNewOrderPage,
  renderOrderDetailPage,
  renderOrdersPage,
  renderProductsPage,
  renderShipmentsPage,
  renderStoresPage,
} from "./views.mjs";

const stylesheet = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
const MAX_FORM_SIZE = 64 * 1024;

const HTML_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function send(response, statusCode, contentType, body, extraHeaders = {}) {
  const payload = Buffer.from(body);
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Content-Length": payload.byteLength,
    ...extraHeaders,
  });
  response.end(payload);
}

function sendHtml(response, statusCode, body) {
  send(response, statusCode, "text/html; charset=utf-8", body, HTML_HEADERS);
}

function sendJson(response, statusCode, value) {
  send(
    response,
    statusCode,
    "application/json; charset=utf-8",
    `${JSON.stringify(value)}\n`,
    { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  );
}

function redirect(response, location, extraHeaders = {}) {
  response.writeHead(303, {
    Location: location,
    "Cache-Control": "no-store",
    "Content-Length": "0",
    ...extraHeaders,
  });
  response.end();
}

async function readForm(request) {
  const contentType = request.headers["content-type"] ?? "";
  if (!contentType.startsWith("application/x-www-form-urlencoded")) {
    throw new ApplicationError("Form content type is not supported.", 415);
  }

  const declaredLength = Number(request.headers["content-length"] ?? 0);
  if (declaredLength > MAX_FORM_SIZE) {
    throw new ApplicationError("The submitted form is too large.", 413);
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_FORM_SIZE) {
      throw new ApplicationError("The submitted form is too large.", 413);
    }
    chunks.push(chunk);
  }

  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function requiredInteger(form, name, label) {
  const rawValue = form.get(name);
  const value = Number(rawValue);
  if (!rawValue || !Number.isSafeInteger(value) || value <= 0) {
    throw new ApplicationError(`${label} is required.`);
  }
  return value;
}

function orderItemsFromForm(form) {
  const items = [];

  for (const [name, rawValue] of form.entries()) {
    if (!name.startsWith("quantity_") || rawValue.trim() === "") {
      continue;
    }

    const productId = Number(name.slice("quantity_".length));
    const quantity = Number(rawValue);
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      throw new ApplicationError("A product selection is not valid.");
    }
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 999) {
      throw new ApplicationError("Product quantities must be whole numbers from 0 to 999.");
    }
    if (quantity > 0) {
      items.push({ productId, quantity });
    }
  }

  return items;
}

function formValues(form) {
  return Object.fromEntries(form.entries());
}

function parseOrderId(value) {
  const orderId = Number(value);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new ApplicationError("Order ID is not valid.", 404);
  }
  return orderId;
}

export function createWorkshopApplication({ databasePath, logger = console }) {
  const database = openWorkshopDatabase(databasePath);
  const orders = createOrderManager(database);

  async function handle(request, response) {
    let locale = localeFromCookie(request.headers.cookie);
    let currentPath = "/";

    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const { pathname } = url;
      const method = request.method ?? "GET";
      currentPath = `${pathname}${url.search}`;

      if (method === "GET" && pathname === "/styles.css") {
        send(response, 200, "text/css; charset=utf-8", stylesheet, {
          "Cache-Control": "public, max-age=300",
          "X-Content-Type-Options": "nosniff",
        });
        return;
      }

      if (method === "GET" && pathname === "/favicon.ico") {
        response.writeHead(204, { "Content-Length": "0" });
        response.end();
        return;
      }

      if (method === "GET" && pathname === "/health") {
        const databaseStatus = database.prepare("PRAGMA quick_check").get();
        sendJson(response, 200, {
          status: databaseStatus.quick_check === "ok" ? "ok" : "degraded",
          database: databaseStatus.quick_check,
        });
        return;
      }

      if (method === "GET" && pathname === "/language") {
        locale = normalizeLocale(url.searchParams.get("lang"));
        const requestedReturn = url.searchParams.get("return") ?? "/";
        const returnPath = requestedReturn.startsWith("/") && !requestedReturn.startsWith("//")
          ? requestedReturn
          : "/";
        redirect(response, returnPath, {
          "Set-Cookie": `workshop_language=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`,
        });
        return;
      }

      if (method === "GET" && pathname === "/") {
        sendHtml(response, 200, renderDashboardPage({
          ...orders.getDashboard(),
          locale,
          currentPath,
        }));
        return;
      }

      if (method === "GET" && pathname === "/orders") {
        const status = (url.searchParams.get("status") ?? "").trim().toUpperCase();
        const query = (url.searchParams.get("q") ?? "").trim();
        sendHtml(response, 200, renderOrdersPage({
          orders: orders.listOrders({ status, query }),
          status,
          query,
          locale,
          currentPath,
        }));
        return;
      }

      if (method === "GET" && pathname === "/orders/new") {
        sendHtml(response, 200, renderNewOrderPage({
          ...orders.getNewOrderData(),
          values: {},
          locale,
          currentPath,
        }));
        return;
      }

      if (method === "POST" && pathname === "/orders") {
        const form = await readForm(request);
        const values = formValues(form);

        try {
          const orderId = orders.createOrder({
            customerId: requiredInteger(form, "customer_id", "Customer"),
            storeId: requiredInteger(form, "store_id", "Store"),
            items: orderItemsFromForm(form),
          });
          redirect(response, `/orders/${orderId}?created=1`);
        } catch (error) {
          if (!(error instanceof ApplicationError)) {
            throw error;
          }
          sendHtml(response, error.statusCode, renderNewOrderPage({
            ...orders.getNewOrderData(),
            error: error.message,
            values,
            locale,
            currentPath,
          }));
        }
        return;
      }

      const statusRoute = pathname.match(/^\/orders\/(\d+)\/status$/);
      if (method === "POST" && statusRoute) {
        const orderId = parseOrderId(statusRoute[1]);
        const form = await readForm(request);
        const status = form.get("status") ?? "";
        orders.updateOrderStatus(orderId, status);
        redirect(response, `/orders/${orderId}?updated=1`);
        return;
      }

      const detailRoute = pathname.match(/^\/orders\/(\d+)$/);
      if (method === "GET" && detailRoute) {
        const orderId = parseOrderId(detailRoute[1]);
        const notice = url.searchParams.has("created")
          ? "Order created successfully."
          : url.searchParams.has("updated")
            ? "Order status updated successfully."
            : "";
        sendHtml(response, 200, renderOrderDetailPage({
          ...orders.getOrder(orderId),
          notice,
          locale,
          currentPath,
        }));
        return;
      }

      if (method === "GET" && pathname === "/customers") {
        sendHtml(response, 200, renderCustomersPage(orders.listCustomers(), { locale, currentPath }));
        return;
      }

      if (method === "GET" && pathname === "/products") {
        sendHtml(response, 200, renderProductsPage(orders.listProducts(), { locale, currentPath }));
        return;
      }

      if (method === "GET" && pathname === "/inventory") {
        sendHtml(response, 200, renderInventoryPage(orders.listInventory(), { locale, currentPath }));
        return;
      }

      if (method === "GET" && pathname === "/shipments") {
        sendHtml(response, 200, renderShipmentsPage(orders.listShipments(), { locale, currentPath }));
        return;
      }

      if (method === "GET" && pathname === "/stores") {
        sendHtml(response, 200, renderStoresPage(orders.listStores(), { locale, currentPath }));
        return;
      }

      sendHtml(response, 404, renderErrorPage({
        statusCode: 404,
        message: "The requested page does not exist.",
        locale,
        currentPath,
      }));
    } catch (error) {
      const statusCode = error instanceof ApplicationError ? error.statusCode : 500;
      const message = error instanceof ApplicationError
        ? error.message
        : "An unexpected error occurred.";

      if (statusCode === 500) {
        logger.error(error);
      }

      if (!response.headersSent) {
        sendHtml(response, statusCode, renderErrorPage({
          statusCode,
          message,
          locale,
          currentPath,
        }));
      } else {
        response.destroy();
      }
    }
  }

  return {
    handle,
    close() {
      database.close();
    },
  };
}
