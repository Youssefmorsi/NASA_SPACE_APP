import os from "node:os";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";

export type CacheKind = "horizons-cache" | "geometry-cache";

// Vercel's /tmp is isolated and ephemeral. Shipped examples remain read-only.
function writableDirectory(kind: CacheKind) {
  return process.env.VERCEL
    ? path.join(os.tmpdir(), "lunarsight", kind)
    : path.join("data", kind);
}

export async function readCachedRecord(kind: CacheKind, key: string) {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("Invalid cache identifier");
  try {
    return await readFile(path.join(writableDirectory(kind), `${key}.json`), "utf8");
  } catch (error) {
    if (!process.env.VERCEL) throw error;
    return readFile(path.join("data", kind, `${key}.json`), "utf8");
  }
}

export async function writeCachedRecord(kind: CacheKind, key: string, data: string) {
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("Invalid cache identifier");
  const directory = writableDirectory(kind);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, `${key}.json`), data);
}
