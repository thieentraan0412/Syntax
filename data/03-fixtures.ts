/**
 * Nhóm 3 — Fixtures.
 *
 * Fixture là thứ Playwright đưa vào test qua tham số destructuring. Điểm quan
 * trọng: nó chỉ được dựng khi test THẬT SỰ khai báo dùng — viết `{ page }` mới
 * mở trang, không viết thì không mở. Nhờ vậy test nhanh và sạch mà không cần
 * beforeEach dài dòng.
 */
import { entry, standalone } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "fixtures" as const;

export const fixtures: CheatEntry[] = [
  entry("Fixtures.page", CAT, {
    id: "page",
    title: "fixture: page",
    description:
      "Một tab trình duyệt sạch, riêng cho mỗi test. Đây là fixture dùng nhiều nhất.",
    code: `test('mở trang chủ', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Cửa hàng/);
});`,
    tags: ["fixture", "page", "core", "recommended"],
    related: ["context", "browser", "page/goto"],
  }),

  entry("Fixtures.context", CAT, {
    id: "context",
    title: "fixture: context",
    description:
      "Context chứa tab đó — nơi giữ cookie, localStorage, quyền. Mỗi test một context riêng nên không dính dữ liệu của nhau.",
    code: `test('mở thêm tab', async ({ context, page }) => {
  await page.goto('/');
  const tabMoi = await context.newPage();
  await tabMoi.goto('/gio-hang');
});`,
    tags: ["fixture", "context", "isolation", "cookie"],
    related: ["page", "browser", "browser-context/new-page"],
  }),

  entry("Fixtures.browser", CAT, {
    id: "browser",
    title: "fixture: browser",
    description:
      "Trình duyệt dùng chung cho cả worker. Hiếm khi cần trực tiếp — chỉ khi muốn tự tạo context với tuỳ chọn riêng.",
    code: `test('context riêng', async ({ browser }) => {
  const context = await browser.newContext({ locale: 'vi-VN' });
  const page = await context.newPage();
  await page.goto('/');
  await context.close();
});`,
    tags: ["fixture", "browser", "worker"],
    related: ["context", "browser-context/new-context"],
  }),

  entry("Fixtures.browserName", CAT, {
    id: "browser-name",
    title: "fixture: browserName",
    description:
      "Tên trình duyệt đang chạy: 'chromium' | 'firefox' | 'webkit'. Dùng để rẽ nhánh hoặc bỏ qua test.",
    code: `test('chỉ Chromium', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'API này chỉ Chromium có');
  await page.goto('/');
});`,
    tags: ["fixture", "browser", "conditional", "skip"],
    related: ["test-structure/skip", "config/projects"],
  }),

  entry("Fixtures.request", CAT, {
    id: "request",
    title: "fixture: request",
    description:
      "Client gọi HTTP thẳng, không qua trình duyệt. Dùng để dựng dữ liệu trước test cho nhanh, hoặc để test API.",
    code: `test('tạo đơn qua API rồi kiểm tra trên web', async ({ request, page }) => {
  const res = await request.post('/api/don-hang', { data: { sanPham: 'ca-phe' } });
  expect(res.ok()).toBeTruthy();

  await page.goto('/don-hang');
  await expect(page.getByText('ca-phe')).toBeVisible();
});`,
    tags: ["fixture", "api", "request", "http", "setup"],
    related: ["network/api-request-context-post", "network/api-request-context-get"],
    note: "Dựng dữ liệu bằng API nhanh hơn bấm qua giao diện rất nhiều — nên để giao diện cho phần thật sự cần test.",
  }),

  entry("Test.extend", CAT, {
    id: "test-extend",
    description:
      "Tự viết fixture riêng. Đây là cách gọn nhất để chia sẻ phần chuẩn bị giữa nhiều file test.",
    code: `import { test as base, expect } from '@playwright/test';

type MyFixtures = {
  trangDangNhap: { dangNhap: (email: string) => Promise<void> };
};

export const test = base.extend<MyFixtures>({
  trangDangNhap: async ({ page }, use) => {
    await use({
      dangNhap: async (email: string) => {
        await page.goto('/dang-nhap');
        await page.getByLabel('Email').fill(email);
        await page.getByRole('button', { name: 'Đăng nhập' }).click();
      },
    });
  },
});

test('vào được trang cá nhân', async ({ page, trangDangNhap }) => {
  await trangDangNhap.dangNhap('an@vidu.vn');
  await expect(page).toHaveURL('/ca-nhan');
});`,
    tags: ["fixture", "custom", "extend", "reuse", "recommended"],
    related: ["worker-fixture", "advanced/merge-tests", "advanced/page-object-model"],
    note: "Phần trước `await use(...)` là setup, phần sau là teardown — chạy cả khi test thất bại.",
  }),

  standalone(CAT, {
    id: "worker-fixture",
    title: "Worker fixture ({ scope: 'worker' })",
    signature: "base.extend<{}, WorkerFixtures>({ ten: [fn, { scope: 'worker' }] })",
    description:
      "Fixture dựng một lần cho cả worker thay vì mỗi test. Dùng cho thứ tốn kém: kết nối database, đăng nhập tài khoản dùng chung.",
    code: `import { test as base } from '@playwright/test';

type WorkerFixtures = { taiKhoan: { email: string } };

export const test = base.extend<{}, WorkerFixtures>({
  taiKhoan: [
    async ({}, use, workerInfo) => {
      const email = \`user\${workerInfo.workerIndex}@vidu.vn\`;
      await use({ email });
    },
    { scope: 'worker' },
  ],
});`,
    tags: ["fixture", "worker", "scope", "performance"],
    docsUrl: "https://playwright.dev/docs/test-fixtures",
    related: ["test-extend", "debug-report/test-info"],
    note: "Dùng `workerInfo.workerIndex` để mỗi worker có dữ liệu riêng, tránh hai worker giẫm chân nhau.",
  }),

  standalone(CAT, {
    id: "auto-fixture",
    title: "Auto fixture ({ auto: true })",
    signature: "base.extend({ ten: [fn, { auto: true }] })",
    description:
      "Fixture chạy cho mọi test dù test không khai báo dùng. Dùng cho việc bắt buộc như bật log lỗi console.",
    code: `import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ batLoiConsole: void }>({
  batLoiConsole: [
    async ({ page }, use) => {
      const loi: string[] = [];
      page.on('pageerror', (e) => loi.push(e.message));
      await use();
      expect(loi).toHaveLength(0);
    },
    { auto: true },
  ],
});`,
    tags: ["fixture", "auto", "console", "error"],
    docsUrl: "https://playwright.dev/docs/test-fixtures",
    related: ["test-extend", "page/page-error"],
  }),

  standalone(CAT, {
    id: "option-fixture",
    title: "Option fixture ({ option: true })",
    signature: "base.extend({ ten: [giaTriMacDinh, { option: true }] })",
    description:
      "Fixture có giá trị đổi được từ playwright.config.ts qua `use`. Cách sạch để chạy cùng bộ test trên nhiều môi trường.",
    code: `import { test as base } from '@playwright/test';

export const test = base.extend<{ moiTruong: string }>({
  moiTruong: ['staging', { option: true }],
});

// playwright.config.ts
// projects: [{ name: 'prod', use: { moiTruong: 'production' } }]`,
    tags: ["fixture", "option", "config", "environment"],
    docsUrl: "https://playwright.dev/docs/test-parameterize",
    related: ["test-extend", "config/projects", "advanced/parameterized"],
  }),

  entry("Page.clock", CAT, {
    id: "clock",
    description:
      "Điều khiển thời gian trong trang: đặt giờ cố định, tua nhanh. Dùng để test thứ phụ thuộc thời gian mà không phải chờ thật.",
    code: `test('đếm ngược', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T10:00:00') });
  await page.goto('/khuyen-mai');
  await page.clock.fastForward('01:00');
  await expect(page.getByText('Đã hết hạn')).toBeVisible();
});`,
    tags: ["fixture", "clock", "time", "mock"],
    related: ["page/wait-for-timeout"],
  }),
];

export default fixtures;
