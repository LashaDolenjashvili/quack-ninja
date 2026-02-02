import { test } from "node:test";

test(
  "xlsx wizard flow (requires PLAYWRIGHT=1 and playwright installed)",
  { skip: !process.env.PLAYWRIGHT },
  async () => {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto("http://localhost:3000/app/console");
    await page.getByRole("button", { name: "Attach file(s)" }).click();
    await page.getByText("Excel import wizard").waitFor();
    await page.getByRole("button", { name: "Next: Detect tables" }).click();
    await page.getByRole("button", { name: "Next: Columns" }).click();
    await page.getByRole("button", { name: "Import selected sheets" }).click();

    await browser.close();
  }
);
