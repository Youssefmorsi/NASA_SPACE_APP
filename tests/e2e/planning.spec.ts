import { expect, test } from "@playwright/test";

test("polar map selects a reference location", async ({ page }) => {
  await page.goto("/");
  await page.locator('[aria-label="Select Southern reference · 45°E"]').click();
  await expect(page.getByRole("heading", { name: "Southern reference · 45°E" })).toBeVisible();
  await expect(page.getByLabel("Latitude (°N)", { exact: true })).toHaveValue("-85");
  await expect(page.getByLabel("Longitude (°E)", { exact: true })).toHaveValue("45");
});

test("sky view and playback follow the selected cached sample", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan this location" }).click();
  await page.getByRole("button", { name: "Calculate conditions" }).click();
  const sky = page.getByRole("img", { name: /Sky plot\. Sun/ });
  await expect(sky).toBeVisible();
  const initial = await sky.getAttribute("aria-label");
  const slider = page.getByLabel(/Inspect time/);
  await slider.fill("5");
  await expect(sky).not.toHaveAttribute("aria-label", initial!);
  await page.getByRole("button", { name: "Play samples" }).click();
  await expect(page.getByRole("button", { name: "Pause playback" })).toBeVisible();
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(5);
  await page.getByRole("button", { name: "Pause playback" }).click();
  await expect(page.getByText("Sun threshold crossing")).toBeVisible();
});

test("start shift and shared scenario links round trip validated inputs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan this location" }).click();
  await page.getByLabel("Shift start (hours)").fill("24");
  await page.getByRole("button", { name: "Shift start" }).click();
  await expect(page.getByLabel("Start date & time (UTC)")).toHaveValue("2026-11-14T00:00");
  await page.getByRole("button", { name: "Create scenario link" }).click();
  const link = await page.getByLabel("Scenario link").inputValue();
  expect(new URL(link).searchParams.has("scenario")).toBeTruthy();
  await page.getByLabel("Latitude (°N)").fill("-88");
  await expect(page.getByLabel("Scenario link")).toHaveCount(0);
  await page.goto(link);
  await expect(page.getByLabel("Start date & time (UTC)")).toHaveValue("2026-11-14T00:00");
  await expect(page.getByText("Shared inputs loaded", { exact: false })).toBeVisible();
});

test("scenario backups restore as explicitly unverified data", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open example comparison" }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export scenario backup" }).click();
  const backupPath = await (await pending).path();
  if (!backupPath) throw Error("Scenario backup was not saved");
  await page.evaluate(() => localStorage.removeItem("lunarsight-horizons-v3"));
  await page.reload();
  await page.getByRole("button", { name: /Compare/ }).click();
  await page.getByLabel("Import scenario backup").setInputFiles(backupPath);
  await expect(page.getByRole("status")).toContainText("Imported 3 scenario(s)");
  await expect(page.getByText("Imported backup (unverified)").first()).toBeVisible();
});

test("shared comparison tracks switch between UTC and elapsed axes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open example comparison" }).click();
  await expect(page.getByRole("heading", { name: "Shared UTC visibility tracks" })).toBeVisible();
  await page.getByLabel("Time axis").selectOption("elapsed");
  await expect(page.getByRole("heading", { name: "Shared elapsed time visibility tracks" })).toBeVisible();
});

test("copying a scenario keeps its settings for another location", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open example comparison" }).click();
  await page.getByRole("button", { name: "Compare another location using South polar reference settings" }).click();
  await expect(page.getByRole("status")).toContainText("Mission settings copied");
  await page.locator("button.site").filter({ hasText: "Southern reference · 45°E" }).click();
  await page.getByRole("button", { name: "Plan this location" }).click();
  await expect(page.getByLabel("Start date & time (UTC)")).toHaveValue("2026-11-13T00:00");
  await expect(page.getByLabel("Duration (hours)")).toHaveValue("168");
  await expect(page.getByLabel("Longitude (°E)")).toHaveValue("45");
});

test("polar map explains coordinate changes and locations outside its coverage", async ({ page }) => {
  await page.goto("/");
  const map = page.getByRole("region", { name: "Reference map" });
  const ring = map.locator('svg > circle[r="12"]');
  const initialX = await ring.getAttribute("cx");
  await page.getByLabel("Latitude (°N)", { exact: true }).fill("-85");
  await page.getByLabel("Longitude (°E)", { exact: true }).fill("45");
  await expect(map.getByText(/Selected location: 85\.000°S \/ 45\.000°E/)).toBeVisible();
  await expect(ring).not.toHaveAttribute("cx", initialX!);
  await page.getByLabel("Latitude (°N)", { exact: true }).fill("-60");
  await expect(map.getByText(/Location cannot be shown/)).toBeVisible();
  await expect(ring).toHaveCount(0);
});
