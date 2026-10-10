"use client";

import { useUser } from "@privy-io/react-auth";
import { useRef, useState } from "react";

import { Avatar } from "@/components/Avatar";
import { AVATAR_COLORS, AVATAR_HEX, accountOf, type AvatarColor } from "@/lib/account";
import { authedFetch, errorOf } from "@/lib/client";

/** Display name and avatar colour. Cosmetic only: never a legal name, never KYC. */
export function AccountSettings() {
  const { user, refreshUser } = useUser();
  const account = accountOf(user);
  const [name, setName] = useState(account.name);
  const [avatar, setAvatar] = useState<AvatarColor>(account.avatar);
  const [avatarUrl, setAvatarUrl] = useState(account.avatarUrl);
  const [photoState, setPhotoState] = useState<{ kind: "idle" | "saving" | "error"; text?: string }>({ kind: "idle" });
  const photoInput = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<{ kind: "idle" | "saving" | "saved" | "error"; text?: string }>({ kind: "idle" });
  const dirty = name.trim() !== account.name || avatar !== account.avatar;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "saving" });
    const res = await authedFetch("/api/account", { method: "POST", body: JSON.stringify({ name: name.trim(), avatar }) });
    if (!res.ok) return setState({ kind: "error", text: await errorOf(res, "Couldn't save.") });
    await refreshUser();
    setState({ kind: "saved" });
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoState({ kind: "error", text: "Choose a JPG, PNG or WebP image." });
    if (file.size > 5 * 1024 * 1024) return setPhotoState({ kind: "error", text: "Choose an image smaller than 5 MB." });

    setPhotoState({ kind: "saving" });
    const body = new FormData();
    body.set("photo", file);
    const res = await authedFetch("/api/account/avatar", { method: "POST", body });
    if (!res.ok) return setPhotoState({ kind: "error", text: await errorOf(res, "Couldn't upload the photo.") });
    const result = await res.json() as { url: string };
    setAvatarUrl(`${result.url}?v=${Date.now()}`);
    await refreshUser();
    setPhotoState({ kind: "idle" });
  }

  async function removePhoto() {
    setPhotoState({ kind: "saving" });
    const res = await authedFetch("/api/account/avatar", { method: "DELETE" });
    if (!res.ok) return setPhotoState({ kind: "error", text: await errorOf(res, "Couldn't remove the photo.") });
    setAvatarUrl(null);
    await refreshUser();
    setPhotoState({ kind: "idle" });
  }

  return (
    <form onSubmit={save} aria-labelledby="account-title" className="flex flex-col gap-4 rounded-panel bg-surface p-6">
      <div>
        <h2 id="account-title" className="text-lg font-bold">Profile</h2>
        <p className="text-sm text-muted">How Vestail greets you. Optional, and only shown to you.</p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar label={name.trim() || account.label} color={avatar} imageUrl={avatarUrl} size={64} />
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
          <label htmlFor="display-name" className="text-sm font-semibold">Display name</label>
          <input id="display-name" value={name} maxLength={40} placeholder={account.label} onChange={e => { setName(e.target.value); setState({ kind: "idle" }); }}
            className="min-h-11 rounded-field border-[1.5px] border-field bg-wash px-3.5" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} className="sr-only" aria-label="Choose profile photo" />
        <button type="button" onClick={() => photoInput.current?.click()} disabled={photoState.kind === "saving"}
          className="min-h-11 rounded-full border border-field px-4 font-semibold hover:bg-wash disabled:opacity-60">
          {photoState.kind === "saving" ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
        </button>
        {avatarUrl && <button type="button" onClick={removePhoto} disabled={photoState.kind === "saving"} className="min-h-11 px-3 font-semibold text-muted hover:text-ink disabled:opacity-60">Remove photo</button>}
        <span role="status" className={`text-sm ${photoState.kind === "error" ? "text-cannot" : "text-muted"}`}>{photoState.kind === "error" ? photoState.text : "JPG, PNG or WebP, up to 5 MB."}</span>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">Avatar colour</legend>
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map(c => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="avatar" value={c} checked={avatar === c} onChange={() => { setAvatar(c); setState({ kind: "idle" }); }} className="peer sr-only" />
              <span className="flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-surface peer-checked:ring-2 peer-checked:ring-ink peer-focus-visible:ring-2 peer-focus-visible:ring-emphasis">
                <span className="size-8 rounded-full" style={{ background: AVATAR_HEX[c] }} />
                <span className="sr-only">{c}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
        <dt className="text-muted">Email</dt><dd>{account.email ?? "Not linked"}</dd>
      </dl>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={!dirty || state.kind === "saving"} className="min-h-11 rounded-full bg-action px-5 font-semibold text-on-action disabled:bg-field disabled:text-muted">
          {state.kind === "saving" ? "Saving…" : "Save profile"}
        </button>
        <span role="status" className={`text-sm ${state.kind === "error" ? "text-cannot" : "text-muted"}`}>
          {state.kind === "saved" ? "Saved." : state.kind === "error" ? state.text : ""}
        </span>
      </div>
    </form>
  );
}
