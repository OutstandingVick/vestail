import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { updateMetadata, userFrom } from "@/lib/server/privy";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const avatarDir = path.join(process.cwd(), ".data", "avatars");

function isExpectedImage(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).every((byte, i) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][i]);
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

async function removeStoredAvatar(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f-]+\.(jpg|png|webp)$/.test(value)) return;
  await unlink(path.join(avatarDir, value)).catch(() => undefined);
}

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const data = await request.formData().catch(() => null);
  const photo = data?.get("photo");
  if (!(photo instanceof File)) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  const extension = TYPES.get(photo.type);
  if (!extension || photo.size === 0 || photo.size > MAX_BYTES) return NextResponse.json({ error: "Use a JPG, PNG or WebP image up to 5 MB." }, { status: 400 });
  const bytes = new Uint8Array(await photo.arrayBuffer());
  if (!isExpectedImage(bytes, photo.type)) return NextResponse.json({ error: "That file is not a valid image." }, { status: 400 });

  const filename = `${randomUUID()}.${extension}`;
  await mkdir(avatarDir, { recursive: true });
  await writeFile(path.join(avatarDir, filename), bytes, { flag: "wx" });
  try {
    const previous = await updateMetadata(userId, { avatarImage: filename });
    await removeStoredAvatar(previous.avatarImage);
  } catch (error) {
    await removeStoredAvatar(filename);
    throw error;
  }
  return NextResponse.json({ url: `/api/account/avatar/${filename}` });
}

export async function DELETE(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const previous = await updateMetadata(userId, { avatarImage: "" });
  await removeStoredAvatar(previous.avatarImage);
  return NextResponse.json({ ok: true });
}
