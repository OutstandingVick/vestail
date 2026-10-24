import test from "node:test";
import assert from "node:assert/strict";
import { encryptInviteCode, decryptInviteCode } from "./invite-code-crypto.ts";

test("invitation codes round-trip encrypted with unique nonces", () => {
  const code = "VESTAIL-1234-5678-ABCD";
  const first = encryptInviteCode(code);
  assert.equal(first.includes(code), false);
  assert.notEqual(first, encryptInviteCode(code));
  assert.equal(decryptInviteCode(first), code);
});

test("legacy and corrupted invite records do not expose a replacement code", () => {
  assert.equal(decryptInviteCode(undefined), undefined);
  assert.equal(decryptInviteCode("invalid"), undefined);
  const encrypted = encryptInviteCode("VESTAIL-1234-5678-ABCD");
  const parts = encrypted.split(".");
  parts[3] = Buffer.from("tampered").toString("base64url");
  assert.equal(decryptInviteCode(parts.join(".")), undefined);
});
