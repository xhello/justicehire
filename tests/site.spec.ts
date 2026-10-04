import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-04T12:00:00Z") });
});

test("home trip details use the correct payment link and keyboard dialog controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Good people.",
  );
  await page.getByRole("button", { name: "Trip details" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Manisero trip details" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "View SumUp booking link" }),
  ).toHaveAttribute("href", "https://pay.sumup.com/b2c/QJKX7KNW");
  await expect(dialog).toContainText("03:45 (next day)");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Trip details" }).first(),
  ).toBeFocused();
});

test("weekly calendar navigation, empty days, and list view stay consistent", async ({
  page,
}) => {
  await page.goto("/calendar");
  await expect(
    page.getByRole("heading", { name: "October 2026" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Saturday 10 October: Manisero, 23:45" })
    .click();
  await expect(page.locator(".selected-trip")).toContainText(
    "Saturday 10 October",
  );
  await page.getByRole("button", { name: "View trip & booking" }).click();
  await expect(page.getByRole("dialog")).toContainText("Saturday 10 October");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Monday 12 October: no trip scheduled" })
    .click();
  await expect(page.locator(".selected-trip")).toContainText(
    "No trip this day.",
  );
  await page.getByRole("button", { name: "Next month" }).click();
  await expect(
    page.getByRole("heading", { name: "November 2026" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: "List view", exact: true }).click();
  await expect(page.locator(".list-trip")).toHaveCount(8);
  await page
    .getByRole("button", { name: "Sunday 11 October: Quechimba", exact: true })
    .click();
  await page.getByRole("button", { name: "View trip & booking" }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: "View SumUp booking link" }),
  ).toHaveAttribute("href", "https://pay.sumup.com/b2c/QTN3EOLR");
});

test("past trips cannot start the booking flow and month rollover works", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-20T12:00:00Z"));
  await page.goto("/calendar");
  await page
    .getByRole("button", { name: "Saturday 10 October: Manisero, 23:45" })
    .click();
  await expect(page.locator(".selected-trip")).toContainText(
    "This trip date has passed",
  );
  await expect(
    page.getByRole("button", { name: "View trip & booking" }),
  ).toHaveCount(0);
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Next month" }).click();
  await expect(
    page.getByRole("heading", { name: "January 2027" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(
    page.getByRole("heading", { name: "December 2026" }),
  ).toBeVisible();
});

test("FAQ answers expand and the community fallback links to the business", async ({
  page,
}) => {
  await page.goto("/faq");
  const question = page
    .locator("details")
    .filter({ hasText: "How do I book a seat?" });
  await question.locator("summary").click();
  await expect(question).toHaveAttribute("open", "");
  await expect(question.locator("p")).toBeVisible();
  await page
    .getByRole("button", { name: "Join the community", exact: true })
    .first()
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("link", { name: "Contact us on Instagram" }),
  ).toHaveAttribute("href", "https://www.instagram.com/bachatavan_official/");
});

test("mobile navigation and all routes fit narrow screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Trip calendar" })
    .click();
  await expect(page).toHaveURL(/\/calendar$/);
  for (const route of ["/", "/calendar", "/faq"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          image.evaluate(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        )
        .toBeTruthy();
    }
  }
});
