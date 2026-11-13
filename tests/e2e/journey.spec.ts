import { test, expect } from "@playwright/test";
test("real globe, location selection and sourced observation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("Loading LROC imagery…")).toHaveCount(0);
  await page.getByRole("button", { name: /LROC observation center/ }).click();
  await expect(
    page.getByRole("link", { name: "Inspect original image" }),
  ).toBeVisible();
  await expect(
    page.getByText("58.450°S", { exact: false }).first(),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-camera-settled",
    "true",
  );
  await page.screenshot({ path: "docs/explorer.png", fullPage: true });
});
test("Horizons calculation, requirement checks, saving and reload", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan this location" }).click();
  await page.getByRole("button", { name: "Calculate conditions" }).click();
  await expect(
    page.getByText("CACHED HORIZONS RESPONSE", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Requirement checks", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/analysis.png", fullPage: true });
  await page.getByRole("button", { name: "Save scenario" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Compare/ }).click();
  await expect(page.getByLabel("Select for comparison")).toHaveCount(1);
});
test("cached examples compare, rename, export and persist", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open example comparison" }).click();
  await expect(
    page.getByText("Operational trade-offs.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Aligned mission conditions" }),
  ).toBeVisible();
  await page
    .getByLabel("Rename South polar reference", { exact: true })
    .fill("Polar option");
  await page.reload();
  await page.getByRole("button", { name: /Compare/ }).click();
  await expect(
    page.getByLabel("Rename Polar option", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Select for comparison").nth(0).check();
  await page.getByLabel("Select for comparison").nth(1).check();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const dl = await pending;
  expect(dl.suggestedFilename()).toBe("lunarsight-comparison.csv");
  await page.screenshot({ path: "docs/comparison.png", fullPage: true });
});
test("service failure is explicit and no replacement results appear", async ({
  page,
}) => {
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        error: { message: "Horizons is unavailable. Try again." },
      }),
    }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Plan this location" }).click();
  await page.getByRole("button", { name: "Calculate conditions" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Horizons is unavailable",
  );
  await expect(
    page.getByText("Requirement checks", { exact: true }),
  ).toHaveCount(0);
});
test("mobile navigation and comparison have no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("canvas")).toHaveAttribute(
    "data-camera-settled",
    "true",
  );
  await page.screenshot({ path: "docs/mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open example comparison" }).click();
  await expect(
    page.getByText("Operational trade-offs.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Sources", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "THE EVIDENCE." }),
  ).toBeVisible();
});

test("globe raycast selects real surface coordinates and antipodal focus settles", async ({
  page,
}) => {
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toHaveAttribute("data-camera-settled", "true");
  const box = await canvas.boundingBox();
  if (!box) throw Error("No canvas");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(
    page.getByRole("heading", { name: "Custom location" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Farside reference/ }).click();
  await expect(canvas).toHaveAttribute("data-camera-settled", "true");
  await expect(
    page.getByRole("heading", { name: "Farside reference" }),
  ).toBeVisible();
});
test("unavailable WebGL keeps manual mission analysis usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  await expect(
    page.getByText("3D view unavailable.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Plan this location" }).click();
  await page.getByRole("button", { name: "Calculate conditions" }).click();
  await expect(
    page.getByText("Requirement checks", { exact: true }),
  ).toBeVisible();
});
test("cached examples work without external requests and invalid requirements are rejected", async ({
  page,
}) => {
  await page.route("https://**/*", (r) => r.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Open example comparison" }).click();
  await expect(
    page.getByText("Operational trade-offs.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Analyze/ }).click();
  await page
    .getByLabel("Required Sun availability (%)", { exact: true })
    .fill("101");
  await page.getByRole("button", { name: "Calculate conditions" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Enter valid mission requirements",
  );
});
