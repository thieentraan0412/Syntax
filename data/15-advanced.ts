/**
 * Nhóm 15 — Nâng cao.
 *
 * Những thứ cần khi bộ test đã lớn: gộp fixture từ nhiều nguồn, viết matcher
 * riêng, chạy cùng một test với nhiều bộ dữ liệu, và tổ chức code theo Page
 * Object để không phải sửa 50 file mỗi lần giao diện đổi.
 */
import { entry, standalone } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "advanced" as const;

export const advanced: CheatEntry[] = [
  standalone(CAT, {
    id: "merge-tests",
    title: "mergeTests()",
    signature: "mergeTests(testA, testB)",
    description:
      "Gộp nhiều `test` đã mở rộng thành một. Cần khi fixture được chia ra nhiều file theo lĩnh vực.",
    code: `import { mergeTests } from '@playwright/test';
import { test as testAuth } from './fixtures/auth';
import { test as testApi } from './fixtures/api';

export const test = mergeTests(testAuth, testApi);`,
    tags: ["advanced", "fixture", "merge", "compose"],
    docsUrl: "https://playwright.dev/docs/test-fixtures",
    related: ["merge-expects", "fixtures/test-extend"],
  }),

  standalone(CAT, {
    id: "merge-expects",
    title: "mergeExpects()",
    signature: "mergeExpects(expectA, expectB)",
    description: "Gộp nhiều `expect` đã thêm matcher riêng thành một.",
    code: `import { mergeExpects } from '@playwright/test';
import { expect as expectTien } from './matchers/tien';
import { expect as expectNgay } from './matchers/ngay';

export const expect = mergeExpects(expectTien, expectNgay);`,
    tags: ["advanced", "expect", "merge", "matcher"],
    docsUrl: "https://playwright.dev/docs/test-assertions",
    related: ["custom-matcher", "merge-tests"],
  }),

  standalone(CAT, {
    id: "custom-matcher",
    title: "expect.extend()",
    signature: "expect.extend({ tenMatcher(received, expected) { … } })",
    description:
      "Viết assertion riêng cho nghiệp vụ của bạn. Test đọc rõ ý hơn và thông báo lỗi sát vấn đề hơn.",
    code: `import { expect as baseExpect } from '@playwright/test';

export const expect = baseExpect.extend({
  toBeTienVND(received: number, mongDoi: number) {
    const dung = received === mongDoi;
    return {
      pass: dung,
      message: () => \`Mong \${mongDoi.toLocaleString('vi-VN')}đ, nhận \${received.toLocaleString('vi-VN')}đ\`,
    };
  },
});

expect(250000).toBeTienVND(250000);`,
    tags: ["advanced", "matcher", "expect", "custom"],
    docsUrl: "https://playwright.dev/docs/test-assertions",
    related: ["merge-expects", "assertions/expect"],
  }),

  standalone(CAT, {
    id: "page-object-model",
    title: "Page Object Model",
    signature: "class TrangDangNhap { constructor(page: Page) { … } }",
    description:
      "Gói locator và thao tác của một trang vào một class. Giao diện đổi thì chỉ sửa một chỗ thay vì mọi file test.",
    code: `import { type Page, type Locator, expect } from '@playwright/test';

export class TrangDangNhap {
  readonly page: Page;
  readonly oEmail: Locator;
  readonly oMatKhau: Locator;
  readonly nutGui: Locator;

  constructor(page: Page) {
    this.page = page;
    this.oEmail = page.getByLabel('Email');
    this.oMatKhau = page.getByLabel('Mật khẩu');
    this.nutGui = page.getByRole('button', { name: 'Đăng nhập' });
  }

  async mo() {
    await this.page.goto('/dang-nhap');
  }

  async dangNhap(email: string, matKhau: string) {
    await this.oEmail.fill(email);
    await this.oMatKhau.fill(matKhau);
    await this.nutGui.click();
    await expect(this.page).toHaveURL('/bang-dieu-khien');
  }
}`,
    tags: ["advanced", "pom", "page-object", "organize", "recommended"],
    docsUrl: "https://playwright.dev/docs/pom",
    related: ["pom-fixture", "fixtures/test-extend"],
    note: "Đừng bọc mọi thứ vào Page Object — chỉ bọc phần dùng lại nhiều. Bọc quá tay thì đọc test khó hơn là đọc thẳng locator.",
  }),

  standalone(CAT, {
    id: "pom-fixture",
    title: "Page Object làm fixture",
    signature: "base.extend<{ trangDangNhap: TrangDangNhap }>({ … })",
    description:
      "Đưa Page Object vào fixture để test chỉ việc khai báo là dùng được, không phải tự khởi tạo.",
    code: `import { test as base } from '@playwright/test';
import { TrangDangNhap } from './pom/TrangDangNhap';

export const test = base.extend<{ trangDangNhap: TrangDangNhap }>({
  trangDangNhap: async ({ page }, use) => {
    const trang = new TrangDangNhap(page);
    await trang.mo();
    await use(trang);
  },
});

test('đăng nhập được', async ({ trangDangNhap }) => {
  await trangDangNhap.dangNhap('an@vidu.vn', 'bí-mật');
});`,
    tags: ["advanced", "pom", "fixture", "organize", "recommended"],
    docsUrl: "https://playwright.dev/docs/pom",
    related: ["page-object-model", "fixtures/test-extend"],
  }),

  standalone(CAT, {
    id: "data-driven",
    title: "Test theo bộ dữ liệu",
    signature: "for (const truongHop of duLieu) test(`…`, …)",
    description:
      "Sinh nhiều test từ một mảng dữ liệu. Mỗi trường hợp thành một test riêng nên báo lỗi chỉ đúng cái hỏng.",
    code: `import { test, expect } from '@playwright/test';

const truongHop = [
  { email: 'sai-dinh-dang', loi: 'Email không hợp lệ' },
  { email: '', loi: 'Vui lòng nhập email' },
];

for (const tc of truongHop) {
  test(\`báo lỗi với email "\${tc.email}"\`, async ({ page }) => {
    await page.goto('/dang-nhap');
    await page.getByLabel('Email').fill(tc.email);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('alert')).toContainText(tc.loi);
  });
}`,
    tags: ["advanced", "data-driven", "parameterized", "loop"],
    docsUrl: "https://playwright.dev/docs/test-parameterize",
    related: ["parameterized", "test-structure/test"],
    note: "Đặt tên test có kèm dữ liệu — không thì báo cáo hiện 5 test trùng tên và không biết cái nào hỏng.",
  }),

  standalone(CAT, {
    id: "parameterized",
    title: "Test theo tham số môi trường",
    signature: "projects: [{ name: 'staging', use: { moiTruong: 'staging' } }]",
    description:
      "Chạy cùng bộ test trên nhiều môi trường bằng option fixture kết hợp projects.",
    code: `import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'staging', use: { baseURL: 'https://staging.vidu.vn' } },
    { name: 'production', use: { baseURL: 'https://vidu.vn' } },
  ],
});`,
    tags: ["advanced", "parameterized", "environment", "projects"],
    docsUrl: "https://playwright.dev/docs/test-parameterize",
    related: ["data-driven", "config/projects", "fixtures/option-fixture"],
  }),

  standalone(CAT, {
    id: "test-tag",
    title: "Tag test (@smoke)",
    signature: "test('tên', { tag: ['@smoke'] }, async ({ page }) => { … })",
    description:
      "Gắn nhãn cho test để lọc khi chạy. Cách chuẩn để tách bộ smoke nhanh khỏi bộ đầy đủ.",
    code: `import { test, expect } from '@playwright/test';

test('trang chủ mở được', { tag: ['@smoke', '@nhanh'] }, async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Cửa hàng/);
});

// Chạy: npx playwright test --grep @smoke`,
    tags: ["advanced", "tag", "filter", "smoke"],
    docsUrl: "https://playwright.dev/docs/test-annotations",
    related: ["cli/test-grep", "config/grep", "annotations"],
  }),

  standalone(CAT, {
    id: "annotations",
    title: "Annotation cho test",
    signature: "test('tên', { annotation: { type, description } }, …)",
    description: "Gắn ghi chú có cấu trúc vào test — link issue, lý do, tài liệu. Hiện trong báo cáo.",
    code: `import { test, expect } from '@playwright/test';

test(
  'giỏ hàng tính thuế',
  { annotation: { type: 'issue', description: 'https://github.com/vidu/repo/issues/42' } },
  async ({ page }) => {
    await page.goto('/gio-hang');
    await expect(page.getByTestId('thue')).toBeVisible();
  },
);`,
    tags: ["advanced", "annotation", "issue", "report"],
    docsUrl: "https://playwright.dev/docs/test-annotations",
    related: ["test-tag", "debug-report/annotations"],
  }),

  entry("Test.extend", CAT, {
    id: "fixture-override",
    title: "Ghi đè fixture có sẵn",
    description:
      "Bọc lại fixture gốc như `page` để thêm hành vi cho mọi test — ví dụ tự chặn quảng cáo.",
    code: `import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/quang-cao/**', (route) => route.abort());
    await use(page);
  },
});`,
    tags: ["advanced", "fixture", "override", "extend"],
    related: ["fixtures/test-extend", "network/route-abort"],
  }),

  entry("Page.exposeFunction", CAT, {
    id: "expose-function",
    description:
      "Đưa một hàm Node vào trang để JavaScript trong trang gọi được. Dùng để bắt sự kiện từ phía trang về test.",
    code: `const daGoi: string[] = [];
await page.exposeFunction('ghiNhan', (ten: string) => {
  daGoi.push(ten);
});
await page.goto('/');
await page.evaluate(() => (window as any).ghiNhan('bat-dau'));
expect(daGoi).toContain('bat-dau');`,
    tags: ["advanced", "expose", "bridge", "javascript"],
    related: ["page/evaluate", "page/add-init-script"],
  }),

  entry("Page.requestGC", CAT, {
    id: "request-gc",
    description:
      "Yêu cầu trình duyệt dọn bộ nhớ. Dùng khi test rò rỉ bộ nhớ hoặc muốn kiểm tra WeakRef.",
    code: `await page.requestGC();`,
    tags: ["advanced", "memory", "gc", "performance"],
    related: ["page/evaluate"],
  }),

  entry("Page.addScriptTag", CAT, {
    id: "add-script-tag",
    description: "Chèn thêm thẻ `<script>` vào trang — để nạp thư viện phụ trợ lúc test.",
    code: `await page.goto('/');
await page.addScriptTag({ content: 'window.CO_CHE_TEST = true;' });`,
    tags: ["advanced", "script", "inject"],
    related: ["add-style-tag", "page/add-init-script"],
  }),

  entry("Page.addStyleTag", CAT, {
    id: "add-style-tag",
    description:
      "Chèn CSS vào trang. Rất hay dùng để tắt animation trước khi so ảnh.",
    code: `await page.addStyleTag({
  content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
});`,
    tags: ["advanced", "style", "css", "visual"],
    related: ["add-script-tag", "visual-testing/animations"],
  }),

  entry("Page.exposeBinding", CAT, {
    id: "expose-binding",
    description:
      "Như exposeFunction nhưng hàm nhận thêm tham số đầu chứa `page`, `frame` — biết lời gọi đến từ đâu.",
    code: `await page.exposeBinding('nguonGoc', ({ frame }) => frame.url());
await page.goto('/');`,
    tags: ["advanced", "expose", "binding", "frame"],
    related: ["expose-function"],
  }),
];

export default advanced;
