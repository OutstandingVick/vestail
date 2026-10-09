import { AVATAR_HEX, initials, type AvatarColor } from "@/lib/account";

/** Initials on the user's chosen colour. Decorative: the name always sits beside it. */
export function Avatar({ label, color, imageUrl, size = 36 }: { label: string; color: AvatarColor; imageUrl?: string | null; size?: number }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white"
      style={{ width: size, height: size, background: AVATAR_HEX[color], fontSize: size * 0.38 }}>
      {/* User uploads are already bounded; a plain img also supports the authenticated app's dynamic API route. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : initials(label)}
    </span>
  );
}
