import { test } from "node:test";

test(
  "csv import sanity (requires PLAYWRIGHT=1 and playwright installed)",
  { skip: !process.env.PLAYWRIGHT },
  async () => {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const fixture = new URL("./fixtures/sample.csv", import.meta.url);

    await page.goto("http://localhost:3000/app/console");

    await page.setInputFiles('input[type="file"]', fixture.pathname);
    await page.getByRole("button", { name: "Attach" }).click();
    await page.getByText("sample").waitFor();

    const editor = page.locator(".monaco-editor textarea");
    await editor.click();
    await editor.fill(
      "SELECT COUNT(*) AS count, MIN(id) AS min_id, MIN(name) AS min_name FROM sample;"
    );
    await page.getByRole("button", { name: "Run" }).click();

    await page.getByText("count").waitFor();
    await page.getByText("1000").waitFor();
    await page.getByText("name_1").waitFor();

    await browser.close();
  }
);
