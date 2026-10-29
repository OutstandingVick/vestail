import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { SOCIAL_DESCRIPTION, SOCIAL_TITLE } from "./seo.ts";

test("the static homepage and app share one social message", async () => {
  const homepage = await readFile(path.resolve(process.cwd(), "../site/index.html"), "utf8");

  assert.match(homepage, new RegExp(`property="og:title" content="${SOCIAL_TITLE}"`));
  assert.match(homepage, new RegExp(`property="og:description" content="${SOCIAL_DESCRIPTION}"`));
  assert.match(homepage, /property="og:image:width" content="1200"/);
  assert.match(homepage, /property="og:image:height" content="630"/);
});
