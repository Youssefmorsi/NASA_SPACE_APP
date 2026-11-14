import { expect, test } from "@playwright/test";
test("cached mission start finder applies a ranked start for finer verification", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan this location" }).click();
  await page.getByText("Find a mission start", { exact: true }).click();
  await page
    .getByRole("button", { name: "Try cached nearside example" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Best sampled starts" }),
  ).toBeVisible();
  await expect(
    page.getByText("21 starts checked", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".window-candidates li")).toHaveCount(5);
  await page.screenshot({ path: "docs/window-finder.png", fullPage: true });
  await page
    .getByRole("button", { name: "Use this start", exact: true })
    .first()
    .click();
  await expect(
    page.getByLabel("Duration (hours)", { exact: true }),
  ).toHaveValue("48");
  await expect(page.getByLabel("Latitude (°N)", { exact: true })).toHaveValue(
    "0",
  );
  await expect(
    page.getByRole("combobox", { name: "Sample interval", exact: true }),
  ).toHaveValue("15");
  await expect(page.getByRole("status")).toContainText(
    "Calculate conditions to verify",
  );
  await page.getByRole("button", { name: "Calculate conditions" }).click();
  await expect(
    page.getByText("CACHED HORIZONS RESPONSE", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Requirement checks", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".metrics")).toContainText("48.0");
});
test("verification links reproduce saved requests and finder failure is explicit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Plan this location" }).click();
  await page.getByRole("button", { name: "Calculate conditions" }).click();
  await page.getByText("Verify in Horizons", { exact: true }).click();
  const link = page.getByRole("link", { name: /Open exact Sun request/ });
  const url = new URL((await link.getAttribute("href"))!);
  expect(url.hostname).toBe("ssd.jpl.nasa.gov");
  expect(url.searchParams.get("CENTER")).toBe("'coord@301'");
  expect(url.searchParams.get("COMMAND")).toBe("'10'");
  await page.route("**/api/find-windows", (route) =>
    route.fulfill({
      status: 502,
      json: { error: { message: "Horizons is unavailable" } },
    }),
  );
  await page.getByText("Find a mission start", { exact: true }).click();
  await page.getByRole("button", { name: "Rank mission starts" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Horizons is unavailable",
  );
  await expect(page.locator(".window-candidates li")).toHaveCount(0);
});
test("expanded mission start search fits a mobile screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Plan this location" }).click();
  await page.getByText("Find a mission start", { exact: true }).click();
  await page
    .getByRole("button", { name: "Try cached nearside example" })
    .click();
  await expect(page.locator(".window-candidates li")).toHaveCount(5);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
