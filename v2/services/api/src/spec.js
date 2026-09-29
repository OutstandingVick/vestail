import { readFileSync } from "node:fs";
import { parse } from "yaml";

const SPEC_URL = new URL("../../../docs/api/openapi.yaml", import.meta.url);

/** docs/api/openapi.yaml is the contract; load it once and serve it as JSON. */
export const loadSpec = () => parse(readFileSync(SPEC_URL, "utf8"));
