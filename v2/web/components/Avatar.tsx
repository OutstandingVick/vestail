import { AVATAR_HEX, initials, type AvatarColor } from "@/lib/account";

/** Initials on the user's chosen colour. Decorative: the name always sits beside it. */
export function Avatar({ label, color, size = 36 }: { label: string; color: AvatarColor; size?: number }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: AVATAR_HEX[color], fontSize: size * 0.38 }}>
      {initials(label)}
    </span>
  );
}
