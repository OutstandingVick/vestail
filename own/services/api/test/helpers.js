import { createApp } from "../src/app.js";

export const app = createApp();
export const get = (path, init) => app.request(`/v1${path}`, init);
export const json = async (path, init) => {
  const res = await get(path, init);
  return { res, body: await res.json() };
};
