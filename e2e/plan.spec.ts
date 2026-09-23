import { expect, type Page, test } from "@playwright/test";

// Every test gets a fresh browser context, so a fresh plan cookie and a
// brand-new plan. Tests tagged @readonly never write, so they can also run
// against production (E2E_BASE_URL=... pnpm test:e2e --grep @readonly).

const DESKTOP = { width: 1920, height: 1080 };
const PHONE = { width: 390, height: 844 };

const option = (page: Page, label: string) => page.locator(`form.option-form[data-label^="${label}"]`);

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const [name, size] of [
  ["1920×1080", DESKTOP],
  ["390×844", PHONE],
] as const) {
  test.describe(`at ${name}`, () => {
    test.use({ viewport: size });

    // DESIGN.md "Layout": the phone layout must never scroll sideways.
    test("1. no horizontal scroll @readonly", async ({ page }) => {
      await page.goto("/");
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });

    // DESIGN.md "Data": the demo label must be visible, so nobody takes the times as real.
    test("2. 'Demo timetable — times are invented.' is visible @readonly", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText("Demo timetable — times are invented.")).toBeVisible();
    });
  });
}

test.describe("at 1920×1080", () => {
  test.use({ viewport: DESKTOP });

  // Session 5: the grid's time column was empty, and no test noticed.
  test("3. week grid has hour labels 08:00 … 20:00 @readonly", async ({ page }) => {
    await page.goto("/");
    const labels = page.locator(".week-grid-hour");
    const expected = Array.from({ length: 13 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);
    await expect(labels).toHaveText(expected);
    for (const label of await labels.all()) await expect(label).toBeVisible();
  });

  // Session 7: the preview was two day-columns wide (no grid-column end on an absolute block).
  test("4. preview for COMP4020 CRIT 02 is one column wide, in Thu @readonly", async ({ page }) => {
    await page.goto("/");
    await option(page, "COMP4020 CRIT 02").locator(".pick-target").hover();
    const preview = (await page.locator(".week-grid-preview").boundingBox())!;
    const thu = (await page.locator(".week-grid-day", { hasText: "Thu" }).boundingBox())!;
    expect(Math.abs(preview.width - thu.width)).toBeLessThanOrEqual(2);
    expect(preview.x + preview.width / 2).toBeGreaterThan(thu.x);
    expect(preview.x + preview.width / 2).toBeLessThan(thu.x + thu.width);
  });

  // Session 7: the see-through preview overprinted the lecture; then the side-by-side fix first moved the grid.
  test("5. COMP2100 TUT 03 preview and MATH1005 lecture don't overlap, grid height steady @readonly", async ({
    page,
  }) => {
    await page.goto("/");
    const tut03 = option(page, "COMP2100 TUT 03");
    const clashId = await tut03.getAttribute("data-clash-id");
    const lecture = page.locator(`.week-grid-event[data-activity-id="${clashId}"]`);
    const grid = page.locator(".week-grid-body");
    const before = (await grid.boundingBox())!;

    // The button is disabled (it clashes); its wrapper is what the mouse lands on.
    await tut03.locator(".pick-target").hover();

    const preview = (await page.locator(".week-grid-preview").boundingBox())!;
    const lec = (await lecture.boundingBox())!;
    const during = (await grid.boundingBox())!;
    expect(intersects(preview, lec)).toBe(false);
    expect(during.height).toBe(before.height);
  });

  // Session 7: every pick used to reload the page and throw you back to the top.
  test("6. Pick updates in place: no reload, scroll kept, 'Saved.', focus in the same row", async ({ page }) => {
    await page.goto("/");
    const row = option(page, "STAT1003 TUT 02");
    await row.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.evaluate(() => ((window as unknown as { __noReload: boolean }).__noReload = true));
    const scrollBefore = await page.evaluate(() => window.scrollY);

    await row.getByRole("button", { name: "Pick" }).click();

    await expect(page.locator("#plan-status")).toHaveText("Saved.");
    expect(await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload)).toBe(true);
    expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollBefore)).toBeLessThanOrEqual(1);
    const focusedRow = await page.evaluate(
      () => document.activeElement?.closest<HTMLFormElement>("form.option-form")?.dataset.label ?? null,
    );
    expect(focusedRow).toMatch(/^STAT1003 TUT 02/);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BUTTON");
  });

  // Session 7: the fill button had to disappear when complete, and come back.
  test("7. 'Fill the rest for me' completes the plan, button gone; Remove brings it back", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Fill the rest for me" }).click();
    await expect(page.getByText("Your timetable is complete — no clashes.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Fill the rest for me" })).toHaveCount(0);

    await page.getByRole("button", { name: "Remove" }).first().click();
    await expect(page.getByRole("button", { name: "Fill the rest for me" })).toBeVisible();
  });

  // DESIGN.md "The one flow" step 8, the promise the whole app rests on.
  test("8. a pick survives a hard reload", async ({ page }) => {
    await page.goto("/");
    await option(page, "COMP4020 CRIT 02").getByRole("button", { name: "Pick" }).click();
    await expect(page.locator("#plan-status")).toHaveText("Saved.");
    await page.reload();
    await expect(option(page, "COMP4020 CRIT 02").getByRole("button", { name: "Remove" })).toBeVisible();
  });
});

test.describe("at 390×844", () => {
  test.use({ viewport: PHONE });

  // Session 5: the phone list showed a stray bullet on some rows.
  test("9. 'Your week' is a day list, no grid, no bullets @readonly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".week-grid")).toBeHidden();
    await expect(page.locator(".week-list > li > h3")).toHaveText(["Mon", "Tue", "Wed", "Thu", "Fri"]);
    const markers = await page
      .locator(".week-list li")
      .evaluateAll((items) => items.map((li) => getComputedStyle(li).listStyleType));
    expect(markers.length).toBeGreaterThan(5);
    expect(new Set(markers)).toEqual(new Set(["none"]));
  });

  // Session 7: on a phone the status line was off-screen, so it became a toast.
  test("10. after a Pick, the toast shows 'Saved.'", async ({ page }) => {
    await page.goto("/");
    await option(page, "COMP2310 LAB 03").getByRole("button", { name: "Pick" }).click();
    const toast = page.locator("#plan-status");
    await expect(toast).toHaveText("Saved.");
    await expect(toast).toHaveCSS("position", "fixed");
    await expect(toast).toHaveCSS("opacity", "1");
    await expect(toast).toBeInViewport();
  });
});

// Session 8: a wrong address must still look like this site and lead back to the plan.
test("11. unknown address: 404 in the same look, with a way back @readonly", async ({ page }) => {
  const response = await page.goto("/no-such-page");
  expect(response?.status()).toBe(404);
  await expect(page.locator(".site-header")).toContainText("not an official ANU system");
  await page.getByRole("link", { name: "Back to your plan" }).click();
  await expect(page).toHaveURL(/\/$/);
});

// Session 8: every page carries the favicon and the description.
test("12. favicon and description on every page @readonly", async ({ page, request }) => {
  for (const path of ["/", "/about", "/readme/"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "/favicon.svg");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "A clash-aware class picker. Student project, not an official ANU system. Demo timetable.",
    );
  }
  const icon = await request.get("/favicon.svg");
  expect(icon.status()).toBe(200);
  expect(await icon.text()).toContain("<svg");
});
