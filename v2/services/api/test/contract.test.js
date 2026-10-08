import { test } from "node:test";
import assert from "node:assert/strict";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { createApp } from "../src/app.js";
import { loadSpec } from "../src/spec.js";

/**
 * Smoke-test every operation in openapi.yaml: each must be routed, answer
 * with a documented 2xx status, and return a body that matches its schema.
 * A new path in the spec without a working route fails here.
 */
const spec = loadSpec();
const app = createApp({ apiKeys: ["k"] });
const ajv = new Ajv({ strict: false });
addFormats(ajv);
ajv.addSchema({ $id: "spec", components: spec.components });
const rebase = n => Array.isArray(n) ? n.map(rebase) : n && typeof n === "object"
  ? Object.fromEntries(Object.entries(n).map(([k, v]) => [k, k === "$ref" ? "spec" + v : rebase(v)])) : n;

const SAMPLE_PATH = { country: "NG", asset: "cryptocurrency", symbol: "NVDA", id: "xyz:GOLD" };
const SAMPLE_QUERY = { "/resolve": "?q=tesla%20shares", "/matrix": "?q=Google", "/venues/{asset}": "?country=NG", "/tokens/{symbol}": "?country=NG", "/orders": "?session=s1", "/derivatives/{id}": "?country=NG" };
const CLICK = { country: "NG", asset: "cryptocurrency", who: "citizen", venue: "Luno", acknowledged: true };

for (const [path, ops] of Object.entries(spec.paths)) {
  for (const [method, op] of Object.entries(ops)) {
    test(`${method.toUpperCase()} ${path} matches the contract`, async () => {
      const url = "/v1" + path.replace(/\{(\w+)\}/g, (_, k) => SAMPLE_PATH[k]) + (SAMPLE_QUERY[path] || "");
      const init = method === "post"
        ? { method: "POST", headers: { Authorization: "Bearer k", "Content-Type": "application/json" }, body: JSON.stringify(CLICK) }
        : path.startsWith("/orders") ? { headers: { Authorization: "Bearer k" } } : {};
      const res = await app.request(url, init);
      const body = await res.json();

      const documented = Object.keys(op.responses).filter(s => s.startsWith("2"));
      assert.ok(documented.includes(String(res.status)), `${res.status} ${JSON.stringify(body)}`);
      const schema = op.responses[res.status].content["application/json"].schema;
      const check = ajv.compile(rebase(schema));
      assert.ok(check(body), JSON.stringify(check.errors));
    });
  }
}
