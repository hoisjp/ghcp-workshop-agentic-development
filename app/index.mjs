import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createWorkshopApplication } from "./server.mjs";

const databasePath = fileURLToPath(new URL("../data/workshop.db", import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);

if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer from 1 to 65535.");
}

if (!existsSync(databasePath)) {
  throw new Error('Database not found. Run "npm run db:init" before starting the application.');
}

const application = createWorkshopApplication({ databasePath });
const server = createServer(application.handle);
let closing = false;

server.on("clientError", (error, socket) => {
  console.error("Client connection error:", error.message);
  socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
});

server.listen(port, host, () => {
  console.log(`Customer Orders is running at http://${host}:${port}`);
  console.log("Press Ctrl+C to stop the server.");
});

function shutdown(signal) {
  if (closing) {
    return;
  }
  closing = true;
  console.log(`\nReceived ${signal}. Shutting down.`);

  server.close((error) => {
    application.close();
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
