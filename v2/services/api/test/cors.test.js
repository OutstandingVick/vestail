import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

test("reads allow any origin by default, including file:// pages", async () => {
  const res = await createApp().request("/v1/assets", { headers: { Origin: "null" } });
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
});

test("the click preflight allows Authorization", async () => {
  const res = await createApp().request("/v1/orders/click", {
    method: "OPTIONS",
    headers: { Origin: "https://vestail.example", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,content-type" },
  });
  assert.equal(res.status, 204);
  assert.match(res.headers.get("access-control-allow-headers").toLowerCase(), /authorization/);
});

test("VESTAIL_CORS_ORIGINS-style lists only allow those origins", async () => {
  const app = createApp({ corsOrigins: ["https://vestail.example"] });
  const ok = await app.request("/v1/assets", { headers: { Origin: "https://vestail.example" } });
  const other = await app.request("/v1/assets", { headers: { Origin: "https://evil.example" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://vestail.example");
  assert.equal(other.headers.get("access-control-allow-origin"), null);
});
