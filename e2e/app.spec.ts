import { test, expect } from "@playwright/test";

// ============================================================
// 1. LOGIN PAGE TESTS
// ============================================================
test.describe("Login Page", () => {
  test("shows login page with team code input", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Domstad");
    await expect(page.getByPlaceholder(/DOMSTAD/i)).toBeVisible();
  });

  test("shows error on invalid team code", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/DOMSTAD/i).fill("FOUTCODE");
    await page.getByRole("button", { name: /volgende|bevestig|ga verder/i }).click();
    await expect(page.getByText(/ongeldig/i)).toBeVisible({ timeout: 10000 });
  });

  test("team code button is disabled when empty", async ({ page }) => {
    await page.goto("/login");
    const btn = page.getByRole("button", { name: /volgende|bevestig|ga verder/i });
    await expect(btn).toBeDisabled();
  });
});

// ============================================================
// 2. REDIRECT – unauthenticated users go to /login
// ============================================================
test.describe("Auth redirects", () => {
  const protectedRoutes = [
    "/",
    "/kalender",
    "/trainingen",
    "/wedstrijden",
    "/spelers",
    "/boetes",
    "/prikbord",
    "/statistieken",
    "/leaderboards",
    "/rotatie",
    "/stemmen",
    "/admin",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login when not authenticated`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/login/, { timeout: 10000 });
      expect(page.url()).toContain("/login");
    });
  }
});

// ============================================================
// 3. GENERAL UI TESTS
// ============================================================
test.describe("General UI", () => {
  test("unknown route redirects to login (not authenticated)", async ({ page }) => {
    await page.goto("/deze-pagina-bestaat-niet");
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain("/login");
  });

  test("page has correct title or heading", async ({ page }) => {
    await page.goto("/login");
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });

  test("login page is responsive (mobile viewport)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByPlaceholder(/DOMSTAD/i)).toBeVisible();
  });
});
