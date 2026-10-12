/** Parse the server-only owner allowlist without ever exposing it to the client. */
export function adminUserIds(value = ""): Set<string> {
  return new Set(value.split(",").map(id => id.trim()).filter(Boolean));
}

export function isAdminUser(userId: string | null, value = process.env.VESTAIL_ADMIN_USER_IDS): boolean {
  return !!userId && adminUserIds(value).has(userId);
}
