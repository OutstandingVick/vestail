const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function decodeBase58(value: string): Uint8Array | null {
  if (!value || [...value].some(character => !BASE58.includes(character))) return null;
  const bytes = [0];
  for (const character of value) {
    let carry = BASE58.indexOf(character);
    for (let index = 0; index < bytes.length; index += 1) {
      carry += bytes[index] * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
  }
  for (let index = 0; value[index] === "1" && index < value.length - 1; index += 1) bytes.push(0);
  return Uint8Array.from(bytes.reverse());
}

export function isSolanaPublicKey(value: string): boolean {
  const decoded = decodeBase58(value.trim());
  return decoded?.length === 32;
}
