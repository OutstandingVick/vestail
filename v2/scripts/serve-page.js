// Local preview of app/index.html connected to a running API.
//   node scripts/serve-page.js            -> http://localhost:8080, API at http://localhost:8787/v1
// Env: PORT, VESTAIL_API (API base), VESTAIL_API_KEY (to record Buy presses).
// The page file is read on every request, so edits show on reload. For development only.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const port = Number(process.env.PORT) || 8080;
const api = process.env.VESTAIL_API || "http://localhost:8787/v1";
const key = process.env.VESTAIL_API_KEY || "";
const page = new URL("../app/index.html", import.meta.url);
const config = `<script>window.VESTAIL_API = ${JSON.stringify(api)};${key ? ` window.VESTAIL_API_KEY = ${JSON.stringify(key)};` : ""}</script>\n`;

createServer((req, res) => {
  if (req.url !== "/" && !req.url.startsWith("/?") && req.url !== "/index.html") {
    res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    return;
  }
  // Insert the config before the page's own script so it is set when that script runs.
  const html = readFileSync(page, "utf8").replace("<script>", config + "<script>");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }).end(html);
}).listen(port, "127.0.0.1", () => console.log(`Vestail page on http://localhost:${port} (API ${api})`));
