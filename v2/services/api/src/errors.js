/** The one error shape from docs/api/API.md: { error: { code, message } }. */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const errorBody = (code, message) => ({ error: { code, message } });

export function onError(err, c) {
  if (err instanceof ApiError) return c.json(errorBody(err.code, err.message), err.status);
  console.error(err);
  return c.json(errorBody("internal", "Something went wrong."), 500);
}

export const notFound = c => c.json(errorBody("not_found", `No route for ${c.req.method} ${c.req.path}.`), 404);
