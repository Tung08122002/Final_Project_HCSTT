import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const adminHeaders = { "X-Demo-Role": "admin" };
async function switchRole(page: Page, name: "Người dùng" | "Quản trị demo") {
  await page.getByRole("button", { name: "Đổi tài khoản" }).click();
  await page.getByRole("menuitemradio", { name: new RegExp(name) }).click();
}

test("admin selects history across pages, cancels then deletes only selected sessions", async ({
  page,
  request,
}) => {
  const ids: number[] = [];
  for (let i = 0; i < 17; i++) {
    const response = await request.post("/api/consultations", {
      headers: adminHeaders,
      data: { facts: { purpose: "office" } },
    });
    expect(response.status()).toBe(201);
    ids.push((await response.json()).session_id);
  }
  try {
    await page.goto("/#history");
    await expect(page.getByRole("button", { name: /Xóa đã chọn/ })).toHaveCount(
      0,
    );
    await page.getByLabel("Chọn tất cả phiên trên trang này").check();
    await expect(
      page.getByRole("button", { name: "Xóa đã chọn (15)" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Trang 2", exact: true }).click();
    await page.getByLabel(`Chọn phiên #${ids[0]}`, { exact: true }).check();
    await page.getByRole("button", { name: "Xóa đã chọn (16)" }).click();
    await expect(page.getByRole("dialog")).toContainText("Không thể hoàn tác");
    await page.getByRole("button", { name: "Hủy", exact: true }).click();
    expect(
      (
        await request.get(`/api/consultations/${ids[0]}`, {
          headers: adminHeaders,
        })
      ).status(),
    ).toBe(200);
    await page.getByRole("button", { name: "Xóa đã chọn (16)" }).click();
    await page
      .getByRole("button", { name: "Xóa 16 phiên", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Đã xóa 16 phiên");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Xóa đã chọn/ })).toHaveCount(
      0,
    );
    expect(
      (
        await request.get(`/api/consultations/${ids[1]}`, {
          headers: adminHeaders,
        })
      ).status(),
    ).toBe(200);
    for (const id of [ids[0], ...ids.slice(2)]) {
      expect(
        (
          await request.get(`/api/consultations/${id}`, {
            headers: adminHeaders,
          })
        ).status(),
      ).toBe(404);
    }
  } finally {
    for (const id of ids)
      await request.delete("/api/consultations", {
        headers: adminHeaders,
        data: { ids: [id] },
      });
  }
});

test("user history persists on reload and is isolated from admin and another browser", async ({
  page,
  request,
  browser,
}) => {
  await page.goto("/#history");
  await switchRole(page, "Người dùng");
  await expect(page.getByText("Chưa có phiên tư vấn được lưu.")).toBeVisible();
  const userId = await page.evaluate(() =>
    localStorage.getItem("laptop-advisor.demo-user"),
  );
  const headers = { "X-Demo-Role": "user", "X-Demo-User": userId! };
  const created = await request.post("/api/consultations", {
    headers,
    data: { facts: { purpose: "programming" } },
  });
  const id = (await created.json()).session_id;
  await page.reload();
  await expect(
    page.getByRole("cell", { name: `#${id}`, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Chi tiết", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất log JSON" }).click();
  const exported = await download;
  const json = JSON.parse(await readFile((await exported.path())!, "utf8"));
  expect(json.session_id).toBe(id);
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await switchRole(page, "Quản trị demo");
  await expect(
    page.getByRole("cell", { name: `#${id}`, exact: true }),
  ).toHaveCount(0);
  await switchRole(page, "Người dùng");
  await expect(
    page.getByRole("cell", { name: `#${id}`, exact: true }),
  ).toBeVisible();
  const context = await browser.newContext();
  try {
    const other = await context.newPage();
    await other.goto(new URL("/#history", page.url()).toString());
    await switchRole(other, "Người dùng");
    await expect(
      other.getByText("Chưa có phiên tư vấn được lưu."),
    ).toBeVisible();
    expect(
      await other.evaluate(() =>
        localStorage.getItem("laptop-advisor.demo-user"),
      ),
    ).not.toBe(userId);
  } finally {
    await context.close();
  }
});

test("user details and both help views hide admin content; header stays visible on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/#catalog");
  await page
    .getByRole("button", { name: "Xem chi tiết", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Dữ liệu gốc từ Excel", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await switchRole(page, "Người dùng");
  await page
    .getByRole("button", { name: "Xem chi tiết", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByText("Dữ liệu gốc từ Excel", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page
    .getByRole("button", { name: "Hướng dẫn sử dụng", exact: true })
    .click();
  await expect(page.locator("main .help-list > details")).toHaveCount(2);
  await expect(page.locator("main .help-list summary").nth(0)).toContainText(
    "Cách tư vấn laptop",
  );
  await expect(page.locator("main .help-list summary").nth(1)).toContainText(
    "Cách tìm laptop",
  );
  await expect(page.locator("main .architecture-flow")).toHaveCount(0);
  await expect(page.locator("main .help-callout").first()).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 1300));
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(500);
    await expect
      .poll(() =>
        page
          .locator(".topbar")
          .evaluate((el) => el.getBoundingClientRect().top),
      )
      .toBe(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Đổi tài khoản" }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Trợ giúp" }).click();
  await expect(
    page.locator('[role="dialog"] .help-list > details'),
  ).toHaveCount(2);
  await expect(
    page.getByRole("dialog").getByText("Import Excel", { exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await switchRole(page, "Quản trị demo");
  await expect(page.locator("main .help-list > details")).toHaveCount(13);
  await page.screenshot({
    path: test.info().outputPath("admin-help-mobile.png"),
    fullPage: true,
  });
});

test("Excel template download provides an xlsx attachment", async ({
  page,
}) => {
  await page.goto("/#import");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Tải file Excel mẫu" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("Laptop_template.xlsx");
  const bytes = await readFile((await file.path())!);
  expect(bytes.subarray(0, 2).toString()).toBe("PK");
  expect(bytes.length).toBeGreaterThan(1000);
});
