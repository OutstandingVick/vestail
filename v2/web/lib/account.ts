/** Avatar colours a user can pick. Not verdict colours: those mean something. */
export const AVATAR_COLORS = ["purple", "orange", "blue", "pink", "teal", "slate"] as const;
export type AvatarColor = (typeof AVATAR_COLORS)[number];
export const AVATAR_HEX: Record<AvatarColor, string> = {
  purple: "#7C5CFF", orange: "#FF580A", blue: "#3B82F6", pink: "#E0529C", teal: "#14A3A3", slate: "#4B5563",
};

export interface Account { name: string; avatar: AvatarColor; email: string | null; label: string }

/** What to call the user: their chosen name, else their email's first part, else their wallet. */
export function accountOf(user: { customMetadata?: Record<string, unknown>; email?: { address: string }; wallet?: { address: string } } | null): Account {
  const meta = (user?.customMetadata ?? {}) as { name?: string; avatar?: string };
  const email = user?.email?.address ?? null;
  const wallet = user?.wallet?.address;
  const name = meta.name?.trim() ?? "";
  const label = name || (email ? email.split("@")[0] : wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "You");
  const avatar = (AVATAR_COLORS as readonly string[]).includes(meta.avatar ?? "") ? (meta.avatar as AvatarColor) : "purple";
  return { name, avatar, email, label };
}

export const initials = (label: string) => label.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join("") || "V";
