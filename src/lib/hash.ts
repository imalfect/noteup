import { createHash } from "crypto";

export function hashEditKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}
