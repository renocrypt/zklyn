import { expect, test } from "@playwright/test";

test("landing page renders primary mint CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/zklyn — spatial access pass/i);

  const iconHref = await page
    .locator('link[rel="icon"]')
    .first()
    .getAttribute("href");
  expect(iconHref).toBeTruthy();

  await expect(
    page.getByRole("heading", { name: /access the vault/i })
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /connect/i })
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /claim free pass/i })
  ).toBeVisible();

  await expect(
    page.getByRole("button", { name: /approve usdc|mint premium/i })
  ).toBeVisible();

  await expect(page.getByText(/free gallery/i)).toBeVisible();
  await expect(page.getByText(/premium vault/i)).toBeVisible();

  await expect(page.locator("header")).toBeVisible();
  await expect(page.getByRole("img", { name: /zklyn/i })).toBeVisible();
});
