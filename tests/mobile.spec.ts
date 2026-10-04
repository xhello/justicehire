import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-04T12:00:00Z") });
});

test("all pages fit small phones, tablets, and enlarged text", async ({
  page,
}) => {
  for (const width of [320, 375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ["/", "/calendar", "/faq"]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/", "/calendar", "/faq"]) {
    await page.goto(route);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  }
});

test("phone calendar opens bookings directly and keeps the close control reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/calendar");
  await expect(
    page.getByRole("button", { name: "List view", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  for (const name of [
    "Previous month",
    "Next month",
    "Today",
    "Month view",
    "List view",
  ]) {
    const box = await page
      .getByRole("button", { name, exact: true })
      .boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  }
  await page
    .getByRole("button", { name: "Sunday 11 October: Quechimba", exact: true })
    .tap();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "View SumUp booking link" }),
  ).toHaveAttribute("href", "https://pay.sumup.com/b2c/QTN3EOLR");
  await dialog.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const close = dialog.getByRole("button", { name: "Close dialog" });
  const box = await close.boundingBox();
  expect(box?.y).toBeGreaterThanOrEqual(0);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(844);
  await close.tap();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Month view", exact: true }).tap();
  await page
    .getByRole("button", {
      name: "Saturday 10 October: Manisero, 23:45",
      exact: true,
    })
    .tap();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).tap();
  await page.clock.setFixedTime(new Date("2026-10-20T12:00:00Z"));
  await page.reload();
  await page
    .getByRole("button", { name: "Saturday 10 October: Manisero", exact: true })
    .tap();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".selected-trip")).toContainText(
    "This trip date has passed",
  );
  await expect(
    page.getByRole("button", { name: "View trip & booking" }),
  ).toHaveCount(0);
});

test("phone navigation and FAQs work with touch and short screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 568 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).tap();
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(
    menu.getByRole("link", { name: "Join the community" }),
  ).toHaveAttribute("href", "https://chat.whatsapp.com/KkE6kn56sAh6m4tEDtL08K");
  await menu.getByRole("link", { name: "FAQs", exact: true }).tap();
  await expect(menu).not.toBeVisible();
  const question = page
    .locator("details")
    .filter({ hasText: "Can I bring food or drinks into the van?" });
  await question.locator("summary").tap();
  await expect(question.locator("p")).toBeVisible();
  await page.setViewportSize({ width: 568, height: 320 });
  await page.getByRole("button", { name: "Open menu" }).tap();
  const invite = menu.getByRole("link", { name: "Join the community" });
  await invite.scrollIntoViewIfNeeded();
  const box = await invite.boundingBox();
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(320);
});
