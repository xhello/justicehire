import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3000",
  },
  projects: [
    {
      name: "desktop-chrome",
      testIgnore: "**/mobile.spec.ts",
      use: {
        browserName: "chromium",
        channel: "chrome",
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: "mobile-chrome",
      testMatch: "**/mobile.spec.ts",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
        channel: "chrome",
      },
    },
    {
      name: "mobile-webkit",
      testMatch: "**/mobile.spec.ts",
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
});
