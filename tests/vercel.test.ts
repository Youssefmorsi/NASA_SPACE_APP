import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readCachedRecord, writeCachedRecord } from "../science/cache.ts";
import app from "../api/[...path].ts";

test("serverless API exports an Express handler without starting a listener", async () => {
  const server = app.listen(0, "127.0.0.1");
  try {
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const base = `http://127.0.0.1:${address.port}`;
    const response = await fetch(`${base}/api/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", mode: "horizons" });
    assert.equal((await fetch(`${base}/api/sites`)).status, 200);
    assert.equal((await fetch(`${base}/api/does-not-exist`)).status, 404);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("Vercel cache reads bundled examples and writes only temporary files", async () => {
  const before = process.cwd();
  const oldVercel = process.env.VERCEL;
  const temporary = await mkdtemp(path.join(os.tmpdir(), "lunarsight-vercel-test-"));
  const key = "a".repeat(64);
  const uniqueKey = crypto.randomUUID().replaceAll("-", "").repeat(2);
  const tempFile = path.join(os.tmpdir(), "lunarsight", "horizons-cache", `${uniqueKey}.json`);
  try {
    await mkdir(path.join(temporary, "data", "horizons-cache"), { recursive: true });
    await writeFile(path.join(temporary, "data", "horizons-cache", `${key}.json`), "bundled");
    process.chdir(temporary);
    process.env.VERCEL = "1";
    assert.equal(await readCachedRecord("horizons-cache", key), "bundled");
    await writeCachedRecord("horizons-cache", uniqueKey, "temporary");
    assert.equal(await readFile(tempFile, "utf8"), "temporary");
    await assert.rejects(readCachedRecord("horizons-cache", "../invalid"));
  } finally {
    process.chdir(before);
    if (oldVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = oldVercel;
    await rm(tempFile, { force: true });
    await rm(temporary, { recursive: true, force: true });
  }
});
