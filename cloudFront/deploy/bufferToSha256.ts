import crypto from "crypto";

/** Generates a sha256 string of a given buffer */
export function bufferToSha256(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("base64");
}
