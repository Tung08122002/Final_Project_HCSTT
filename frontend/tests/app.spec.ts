import { test, expect } from "@playwright/test";

test("dashboard, consultation, explanation and persisted history", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Tổng quan hệ thống" }),
  ).toBeVisible();
  await expect(page.getByText("Laptop trong danh mục")).toBeVisible();
  await page.screenshot({ path: "../docs/dashboard.png", fullPage: true });
  await page.getByRole("button", { name: "Bắt đầu tư vấn" }).click();
  await expect(
    page.getByRole("heading", { name: "Tư vấn laptop", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Ngân sách tối thiểu (VND)").fill("123456");
  await expect(page.getByLabel("Ngân sách tối thiểu (VND)")).toHaveValue(
    "123.456",
  );
  await page.getByLabel("Ngân sách tối đa (VND)").fill("31234567");
  await expect(page.getByLabel("Ngân sách tối đa (VND)")).toHaveValue(
    "31.234.567",
  );
  await page
    .getByLabel("Mục đích chính", { exact: true })
    .selectOption("gaming");
  await page
    .getByLabel("Mức độ chơi game", { exact: true })
    .selectOption("medium");
  const consultationRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith("/api/consultations") &&
      request.method() === "POST",
  );
  await page.getByRole("button", { name: "Tìm laptop phù hợp" }).click();
  const sentFacts = (await consultationRequest).postDataJSON().facts;
  expect(sentFacts.budget_min).toBe(123456);
  expect(sentFacts.budget_max).toBe(31234567);
  await expect(
    page.getByRole("heading", { name: "Những lựa chọn phù hợp" }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).not.toHaveCount(0);
  await page
    .getByRole("button", { name: "Xem cách suy luận", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page
      .locator(".trace-step")
      .filter({ has: page.getByText("R002", { exact: true }) }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Working Memory", exact: true })
    .click();
  await expect(
    page.getByText("require_dedicated_gpu", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "../docs/inference.png", fullPage: true });
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page
    .getByRole("button", { name: "Xem chi tiết & điểm phù hợp" })
    .first()
    .click();
  await expect(
    page.getByRole("columnheader", { name: "Nguồn suy luận" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page
    .getByRole("button", { name: "Lịch sử suy diễn", exact: true })
    .click();
  await expect(page.getByText("31.234.567 ₫").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Chi tiết", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("Đã áp dụng");
  expect(errors).toEqual([]);
});

test("product CRUD and deletion from laptop catalog", async ({ page }) => {
  const code = "E2E-" + Date.now();
  await page.goto("/#products");
  await page.getByRole("button", { name: "Thêm laptop", exact: true }).click();
  await page.getByLabel("Mã sản phẩm", { exact: true }).fill(code);
  await page
    .getByLabel("Tên sản phẩm", { exact: true })
    .fill("Laptop kiểm thử giao diện");
  await page.getByLabel("Giá (VND)", { exact: true }).fill("15000000");
  await expect(page.getByLabel("Giá (VND)", { exact: true })).toHaveValue(
    "15.000.000",
  );
  await page.getByLabel("RAM (GB)", { exact: true }).fill("16");
  await page.getByRole("button", { name: "Lưu laptop", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByPlaceholder("Tìm tên, mã sản phẩm, CPU, GPU…").fill(code);
  await expect(page.getByText(code, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sửa " + code, exact: true }).click();
  await page.getByLabel("Giá (VND)", { exact: true }).fill("16000000");
  await expect(page.getByLabel("Giá (VND)", { exact: true })).toHaveValue(
    "16.000.000",
  );
  await page.getByRole("button", { name: "Lưu laptop", exact: true }).click();
  await expect(page.getByText("16.000.000 ₫", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Danh sách laptop" }).click();
  await page.getByPlaceholder("Tìm tên, mã sản phẩm, CPU, GPU…").fill(code);
  const card = page.locator(".product-card").filter({ hasText: code });
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: "Đổi tài khoản" }).click();
  await page.getByRole("menuitemradio", { name: /Người dùng/ }).click();
  await expect(
    card.getByRole("checkbox", { name: "Chọn " + code }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Đổi tài khoản" }).click();
  await page.getByRole("menuitemradio", { name: /Quản trị demo/ }).click();
  await expect(card.getByRole("button", { name: "Xóa " + code })).toHaveCount(
    0,
  );
  await card.getByRole("checkbox", { name: "Chọn " + code }).check();
  await page.getByRole("button", { name: "Xóa đã chọn (1)" }).click();
  await expect(page.getByRole("dialog")).toContainText(code);
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: "Xóa đã chọn (1)" }).click();
  await page.getByRole("button", { name: "Xóa 1 laptop", exact: true }).click();
  await expect(
    page.getByText("Không tìm thấy laptop phù hợp bộ lọc."),
  ).toBeVisible();
});

test("account dropdown and compact numbered pagination", async ({ page }) => {
  await page.route(/\/api\/products\?.*/, async (route) => {
    const url = new URL(route.request().url());
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        total: 1200,
        page: Number(url.searchParams.get("page") || 1),
        page_size: 12,
      }),
    });
  });
  await page.goto("/#catalog");
  await expect(
    page.getByRole("button", { name: "Đổi tài khoản" }),
  ).toBeVisible();
  await expect(page.getByText("Quản trị demo", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đổi tài khoản" }).click();
  await expect(
    page.getByRole("menu", { name: "Chọn tài khoản" }),
  ).toBeVisible();
  await page.getByRole("menuitemradio", { name: /Người dùng/ }).click();
  await expect(page.getByText("Người dùng", { exact: true })).toBeVisible();

  await expect(
    page.getByRole("button", { name: "Trang 1", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByRole("button", { name: "Trang 100", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".page-ellipsis")).toHaveCount(1);
  await page.getByRole("button", { name: "Trang 100", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Trang 100", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".page-ellipsis")).toHaveCount(1);
});

test("bulk deletion appears after selection and removes selected laptops", async ({
  page,
  request,
}) => {
  const prefix = "BULK-E2E-" + Date.now();
  const created: { id: number; product_code: string }[] = [];
  try {
    for (const index of [1, 2]) {
      const response = await request.post("/api/products", {
        data: {
          product_code: `${prefix}-${index}`,
          product_name: `Laptop xóa hàng loạt ${index}`,
          price: 15000000 + index,
        },
      });
      expect(response.status()).toBe(201);
      created.push(await response.json());
    }
    await page.goto("/#catalog");
    await page.getByPlaceholder("Tìm tên, mã sản phẩm, CPU, GPU…").fill(prefix);
    const first = page
      .locator(".product-card")
      .filter({ hasText: created[0].product_code });
    const second = page
      .locator(".product-card")
      .filter({ hasText: created[1].product_code });
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();
    await expect(page.getByRole("button", { name: /Xóa đã chọn/ })).toHaveCount(
      0,
    );
    const selectPage = page.getByRole("checkbox", {
      name: "Chọn tất cả trên trang này",
    });
    await selectPage.check();
    await expect(
      first.getByRole("checkbox", { name: "Chọn " + created[0].product_code }),
    ).toBeChecked();
    await expect(
      page.getByRole("button", { name: "Xóa đã chọn (2)" }),
    ).toBeVisible();
    await selectPage.uncheck();
    await expect(page.getByRole("button", { name: /Xóa đã chọn/ })).toHaveCount(
      0,
    );

    await first
      .getByRole("checkbox", { name: "Chọn " + created[0].product_code })
      .check();
    await expect(
      page.getByRole("button", { name: "Xóa đã chọn (1)" }),
    ).toBeVisible();
    await second
      .getByRole("checkbox", { name: "Chọn " + created[1].product_code })
      .check();
    await page.getByRole("button", { name: "Xóa đã chọn (2)" }).click();
    await expect(page.getByRole("dialog")).toContainText(
      created[0].product_code,
    );
    await expect(page.getByRole("dialog")).toContainText(
      created[1].product_code,
    );
    await page.getByRole("button", { name: "Hủy", exact: true }).click();
    await expect(first).toBeVisible();
    await expect(second).toBeVisible();

    await page.getByRole("button", { name: "Xóa đã chọn (2)" }).click();
    await page
      .getByRole("button", { name: "Xóa 2 laptop", exact: true })
      .click();
    await expect(
      page.getByText("Không tìm thấy laptop phù hợp bộ lọc."),
    ).toBeVisible();
    for (const product of created) {
      expect((await request.get(`/api/products/${product.id}`)).status()).toBe(
        404,
      );
    }
  } finally {
    for (const product of created) {
      await request.delete(`/api/products/${product.id}`);
    }
  }
});

test("visual rule builder, disable and clone", async ({ page, request }) => {
  const code = "E2E_RULE_" + Date.now();
  try {
    await page.goto("/#rules");
    await page
      .getByRole("button", { name: "Tạo luật mới", exact: true })
      .click();
    await page.getByLabel("Mã luật", { exact: true }).fill(code);
    await page
      .getByLabel("Tên luật", { exact: true })
      .fill("Luật kiểm thử giao diện");
    await page.getByLabel("Thuộc tính điều kiện 1").selectOption("budget_max");
    await page.getByLabel("Toán tử", { exact: true }).selectOption("<=");
    await page.getByLabel("Giá trị VND").fill("30000000");
    await expect(page.getByLabel("Giá trị VND")).toHaveValue("30.000.000");
    await page.getByRole("button", { name: "Lưu luật", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByPlaceholder("Tìm mã luật, tên hoặc nhóm…").fill(code);
    const card = page
      .locator(".rule-card")
      .filter({ has: page.getByText(code, { exact: true }) });
    await expect(card).toBeVisible();
    await expect(card).toContainText("30.000.000 ₫");
    await expect(card.getByRole("button", { name: "Kiểm thử" })).toHaveCount(0);
    await card.getByRole("button", { name: "Tắt", exact: true }).click();
    await expect(card.getByText("Đã tắt", { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Nhân bản", exact: true }).click();
    await page.getByRole("button", { name: "Lưu luật", exact: true }).click();
    await expect(page.getByText(code + "_COPY", { exact: true })).toBeVisible();
  } finally {
    const rows = await (await request.get("/api/rules")).json();
    for (const row of rows.filter((r: { rule_code: string }) =>
      r.rule_code.startsWith(code),
    ))
      await request.delete("/api/rules/" + row.id);
  }
});

test("attribute acquisition and help, mobile layout", async ({
  page,
  request,
}) => {
  const name = "e2e_attribute_" + Date.now();
  try {
    await page.goto("/#acquisition");
    await page
      .getByRole("button", { name: "Thêm thuộc tính", exact: true })
      .click();
    await page.getByLabel("Tên fact (snake_case)").fill(name);
    await page.getByLabel("Nhãn hiển thị").fill("Thuộc tính demo");
    await page
      .getByRole("button", { name: "Lưu thuộc tính", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByPlaceholder("Tìm thuộc tính…").fill(name);
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "Sửa " + name, exact: true })
      .click();
    await page.getByLabel("Nhãn hiển thị").fill("Đã chỉnh sửa");
    await page
      .getByRole("button", { name: "Lưu thuộc tính", exact: true })
      .click();
    await expect(page.getByText("Đã chỉnh sửa", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Trợ giúp", exact: true }).click();
    await expect(
      page.getByText("Kiến trúc Knowledge-Based System"),
    ).toBeVisible();
    await page.getByRole("button", { name: "Đóng", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#dashboard");
    await expect(
      page.getByRole("heading", { name: "Tổng quan hệ thống" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({ path: "../docs/mobile.png", fullPage: true });
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await page
      .getByRole("button", { name: "Tư vấn laptop", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Tư vấn laptop", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  } finally {
    const rows = await (await request.get("/api/attributes")).json();
    const attr = rows.find((a: { name: string }) => a.name === name);
    if (attr) await request.delete("/api/attributes/" + attr.id);
  }
});

test("Excel UI reimport is idempotent", async ({ page }) => {
  await page.goto("/#import");
  await page
    .getByLabel("File Excel", { exact: true })
    .setInputFiles("../Laptop_data.xlsx");
  await page
    .getByRole("button", { name: "Import vào cơ sở dữ liệu", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Báo cáo import" }),
  ).toBeVisible();
  await expect(
    page.getByText("Tổng 50 dòng · 50 thành công · 0 mã lặp trong file"),
  ).toBeVisible();
});
