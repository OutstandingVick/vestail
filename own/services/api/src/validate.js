import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { ApiError } from "./errors.js";

const SPEC_ID = "own-spec";

/** Point local refs ("#/components/...") at the spec registered under SPEC_ID. */
const rebase = node => {
  if (Array.isArray(node)) return node.map(rebase);
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = k === "$ref" && v.startsWith("#") ? SPEC_ID + v : rebase(v);
  return out;
};

/** Follow a local $ref to the schema it names (used for defaults). */
const deref = (spec, schema) => schema?.$ref ? schema.$ref.slice(2).split("/").reduce((o, k) => o[k], spec) : schema;

/** Map an Ajv failure on a parameter to the error codes documented in API.md. */
const paramError = (name, message) => name === "who"
  ? new ApiError(400, "bad_buyer_type", "who must be citizen or foreigner.")
  : new ApiError(400, "validation", `${name} ${message}.`);

/**
 * Validators built from docs/api/openapi.yaml. `params(specPath, method)`
 * returns a function that takes { path, query } and returns the validated
 * parameters with spec defaults applied, or throws an ApiError.
 */
export function createValidator(spec) {
  const ajv = new Ajv({ strict: false });
  addFormats(ajv);
  ajv.addSchema({ $id: SPEC_ID, components: spec.components });

  function params(specPath, method) {
    const op = spec.paths[specPath]?.[method];
    if (!op) throw new Error(`${method.toUpperCase()} ${specPath} is not in the spec`);
    const checks = (op.parameters || []).map(p => ({
      name: p.name, in: p.in, required: !!p.required,
      default: deref(spec, p.schema)?.default,
      check: ajv.compile(rebase(p.schema || {})),
    }));
    return ({ path = {}, query = {} }) => {
      const out = {};
      for (const p of checks) {
        const v = (p.in === "path" ? path : query)[p.name];
        if (v === undefined || v === "") {
          if (p.required) throw new ApiError(400, "validation", `${p.name} is required.`);
          if (p.default !== undefined) out[p.name] = p.default;
          continue;
        }
        if (!p.check(v)) throw paramError(p.name, p.check.errors[0].message);
        out[p.name] = v;
      }
      return out;
    };
  }

  /** Validator for an operation's JSON request body, or null if it has none. */
  function body(specPath, method) {
    const rb = spec.paths[specPath]?.[method]?.requestBody;
    const schema = rb?.content?.["application/json"]?.schema;
    if (!schema) return null;
    const check = ajv.compile(rebase(schema));
    return value => {
      if (value === undefined) {
        if (rb.required) throw new ApiError(400, "validation", "A JSON body is required.");
        return value;
      }
      if (!check(value)) {
        const e = check.errors[0];
        if (e.instancePath === "/who") throw new ApiError(400, "bad_buyer_type", "who must be citizen or foreigner.");
        throw new ApiError(400, "validation", `body${e.instancePath.replaceAll("/", ".")} ${e.message}.`);
      }
      return value;
    };
  }

  /**
   * Register a handler for a spec operation on a Hono app. The handler gets
   * (c, { params, body }) already validated.
   */
  function route(app, method, specPath, handler) {
    const readParams = params(specPath, method);
    const readBody = body(specPath, method);
    const honoPath = specPath.replace(/\{(\w+)\}/g, ":$1");
    app.on(method.toUpperCase(), honoPath, async c => {
      const p = readParams({ path: c.req.param(), query: c.req.query() });
      let b;
      if (readBody) {
        const text = await c.req.text();
        try { b = text ? JSON.parse(text) : undefined; }
        catch { throw new ApiError(400, "validation", "Body is not valid JSON."); }
        b = readBody(b);
      }
      return handler(c, { params: p, body: b });
    });
  }

  return { params, body, route };
}
