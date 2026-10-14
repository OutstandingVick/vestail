#!/usr/bin/env node
import { createKeyStore } from "./key-store.js";

const [command, ...args] = process.argv.slice(2);
const option = name => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const store = createKeyStore();

async function main() {
  if (command === "issue") {
    const mode = option("mode") || "test";
    if (!new Set(["test", "live"]).has(mode)) throw new Error("--mode must be test or live");
    const rateLimit = Number(option("limit") || 60);
    if (!Number.isInteger(rateLimit) || rateLimit < 1) throw new Error("--limit must be a positive integer");
    const issued = await store.issue({ mode, label: option("label") || "Design partner", rateLimit });
    console.log(JSON.stringify(issued, null, 2));
    console.error("Store this key now. Vestail stores only its hash and cannot show it again.");
    return;
  }
  if (command === "list") {
    console.log(JSON.stringify(await store.list(), null, 2));
    return;
  }
  if (command === "revoke") {
    const id = args[0];
    if (!id) throw new Error("Usage: npm run keys -- revoke <key_id>");
    const revoked = await store.revoke(id);
    if (!revoked) throw new Error(`Unknown key: ${id}`);
    console.log(JSON.stringify(revoked, null, 2));
    return;
  }
  if (command === "usage") {
    const id = args[0];
    if (!id) throw new Error("Usage: npm run keys -- usage <key_id>");
    console.log(JSON.stringify(await store.usage(id), null, 2));
    return;
  }
  console.error("Usage:\n  npm run keys -w @vestail/api -- issue --mode test --label Partner --limit 60\n  npm run keys -w @vestail/api -- list\n  npm run keys -w @vestail/api -- revoke <key_id>\n  npm run keys -w @vestail/api -- usage <key_id>");
  process.exitCode = 1;
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
