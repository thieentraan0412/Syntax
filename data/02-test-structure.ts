/**
 * Nhóm 2 — Cấu trúc test.
 *
 * Khung xương của mọi file .spec.ts: khai báo test, gom nhóm, chạy trước/sau,
 * bỏ qua có điều kiện. Toàn bộ nằm trong `@playwright/test`, không phải
 * playwright-core.
 */
import { entry, standalone } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "test-structure" as const;

export const testStructure: CheatEntry[] = [
  entry("Test.(call)", CAT, {
    id: "test",
    title: "test()",
    description:
      "Khai báo một test. Tham số thứ hai nhận fixture — `page` là cái dùng nhiều nhất.",
    code: `import { test, expect } from '@playwright/test';

test('đăng nhập thành công', async ({ page }) => {
  await page.goto('/dang-nhap');
  await page.getByLabel('Email').fill('an@vidu.vn');
  await page.getByLabel('Mật khẩu').fill('bí-mật');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL('/bang-dieu-khien');
});`,
    tags: ["test", "khai báo", "core", "recommended"],
    related: ["describe", "before-each", "fixtures/page"],
  }),

  entry("Test.describe", CAT, {
    id: "describe",
    description:
      "Gom nhiều test lại thành một nhóm. Hook và `test.use()` khai trong nhóm chỉ ảnh hưởng nhóm đó.",
    code: `test.describe('Giỏ hàng', () => {
  test('thêm sản phẩm', async ({ page }) => {
    await page.goto('/gio-hang');
  });

  test('xoá sản phẩm', async ({ page }) => {
    await page.goto('/gio-hang');
  });
});`,
    tags: ["test", "group", "describe", "organize"],
    related: ["test", "describe-serial", "describe-configure"],
  }),

  entry("Test.beforeEach", CAT, {
    id: "before-each",
    description: "Chạy trước MỖI test. Chỗ đặt phần chuẩn bị chung như điều hướng, đăng nhập.",
    code: `test.beforeEach(async ({ page }) => {
  await page.goto('/bang-dieu-khien');
});`,
    tags: ["hook", "setup", "before"],
    related: ["after-each", "before-all", "fixtures/test-extend"],
  }),

  entry("Test.afterEach", CAT, {
    id: "after-each",
    description: "Chạy sau MỖI test, kể cả khi test thất bại. Chỗ dọn dẹp dữ liệu.",
    code: `test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: \`loi-\${testInfo.title}.png\` });
  }
});`,
    tags: ["hook", "teardown", "after", "cleanup"],
    related: ["before-each", "after-all", "debug-report/test-info"],
  }),

  entry("Test.beforeAll", CAT, {
    id: "before-all",
    description:
      "Chạy MỘT LẦN trước cả nhóm, trong cùng worker. Dùng cho việc chuẩn bị tốn kém như dựng dữ liệu.",
    code: `test.beforeAll(async () => {
  await taoDuLieuMau();
});

async function taoDuLieuMau() {
  // gọi API dựng dữ liệu
}`,
    tags: ["hook", "setup", "before", "once"],
    related: ["after-all", "before-each"],
    note: "Trạng thái tạo ở beforeAll dùng chung cho cả nhóm — một test làm hỏng là các test sau gãy theo. Cân nhắc beforeEach nếu cần cách ly.",
  }),

  entry("Test.afterAll", CAT, {
    id: "after-all",
    description: "Chạy MỘT LẦN sau cả nhóm. Chỗ dọn thứ đã dựng ở beforeAll.",
    code: `test.afterAll(async () => {
  await xoaDuLieuMau();
});

async function xoaDuLieuMau() {
  // gọi API dọn dữ liệu
}`,
    tags: ["hook", "teardown", "after", "once"],
    related: ["before-all", "after-each"],
  }),

  entry("Test.skip", CAT, {
    id: "skip",
    description:
      "Bỏ qua test. Gọi kèm điều kiện để chỉ bỏ trong một số trường hợp.",
    code: `test.skip('chưa làm xong', async ({ page }) => {
  await page.goto('/');
});

test('chỉ chạy trên Chromium', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Tính năng này chỉ có ở Chromium');
  await page.goto('/');
});`,
    tags: ["test", "skip", "conditional"],
    related: ["fixme", "only", "fail"],
  }),

  entry("Test.only", CAT, {
    id: "only",
    description:
      "Chỉ chạy đúng test này, bỏ hết phần còn lại trong file. Chỉ dùng lúc phát triển.",
    code: `test.only('đang sửa cái này', async ({ page }) => {
  await page.goto('/');
});`,
    tags: ["test", "only", "focus", "debug"],
    related: ["skip", "config/forbid-only"],
    note: "Đặt `forbidOnly: !!process.env.CI` trong config để CI chặn không cho lọt `.only` lên nhánh chính.",
  }),

  entry("Test.fixme", CAT, {
    id: "fixme",
    description:
      "Đánh dấu test đang hỏng và không chạy nó. Khác skip ở ý nghĩa: đây là lỗi cần sửa, không phải cố ý bỏ.",
    code: `test.fixme('giỏ hàng tính sai thuế', async ({ page }) => {
  await page.goto('/gio-hang');
});`,
    tags: ["test", "fixme", "broken", "todo"],
    related: ["skip", "fail"],
  }),

  entry("Test.fail", CAT, {
    id: "fail",
    description:
      "Khai báo test PHẢI thất bại. Nếu nó bỗng nhiên pass thì Playwright báo lỗi — hữu ích để theo dõi bug đã biết.",
    code: `test('bug #123 chưa sửa', async ({ page }) => {
  test.fail();
  await page.goto('/');
  await expect(page.getByText('Đã sửa')).toBeVisible();
});`,
    tags: ["test", "fail", "known-issue"],
    related: ["fixme", "skip"],
  }),

  entry("Test.slow", CAT, {
    id: "slow",
    description: "Báo test này chậm — Playwright nhân ba timeout cho nó.",
    code: `test('xuất báo cáo lớn', async ({ page }) => {
  test.slow();
  await page.goto('/bao-cao');
});`,
    tags: ["test", "timeout", "slow"],
    related: ["set-timeout", "config/timeout"],
  }),

  entry("Test.setTimeout", CAT, {
    id: "set-timeout",
    description: "Đặt timeout riêng cho test hoặc hook đang chạy, tính bằng mili giây.",
    code: `test('tải lên tệp lớn', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/tai-len');
});`,
    tags: ["test", "timeout", "config"],
    related: ["slow", "config/timeout"],
  }),

  entry("Test.step", CAT, {
    id: "step",
    description:
      "Chia test thành các bước có tên. Bước hiện trong báo cáo và trace, giúp đọc lỗi nhanh hơn hẳn.",
    code: `test('mua hàng', async ({ page }) => {
  await test.step('Đăng nhập', async () => {
    await page.goto('/dang-nhap');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
  });

  await test.step('Thanh toán', async () => {
    await page.getByRole('button', { name: 'Thanh toán' }).click();
  });
});`,
    tags: ["test", "step", "report", "readability", "recommended"],
    related: ["debug-report/trace-viewer", "test"],
  }),

  entry("Test.use", CAT, {
    id: "use",
    description:
      "Đổi tuỳ chọn cho file hoặc nhóm hiện tại: locale, viewport, storageState, browser…",
    code: `test.use({ locale: 'vi-VN', viewport: { width: 1280, height: 720 } });

test.describe('Người dùng đã đăng nhập', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('vào được trang cá nhân', async ({ page }) => {
    await page.goto('/ca-nhan');
  });
});`,
    tags: ["test", "options", "config", "override"],
    related: ["config/use", "auth-state/storage-state"],
  }),

  entry("Test.describe.configure", CAT, {
    id: "describe-configure",
    description: "Đặt chế độ chạy và số lần thử lại cho một nhóm test.",
    code: `test.describe.configure({ mode: 'serial', retries: 2 });`,
    tags: ["test", "config", "serial", "parallel", "retry"],
    related: ["describe-serial", "describe-parallel", "config/retries"],
  }),

  entry("Test.describe.serial", CAT, {
    id: "describe-serial",
    description:
      "Chạy các test trong nhóm lần lượt; một cái hỏng là bỏ luôn các cái sau. Dùng khi test phụ thuộc nhau.",
    code: `test.describe.serial('Luồng thanh toán', () => {
  test('thêm vào giỏ', async ({ page }) => {
    await page.goto('/gio-hang');
  });

  test('thanh toán', async ({ page }) => {
    await page.goto('/thanh-toan');
  });
});`,
    tags: ["test", "serial", "order", "dependency"],
    related: ["describe-parallel", "describe-configure"],
    note: "Test phụ thuộc nhau thì không chạy song song được và khó tìm lỗi. Chỉ dùng khi thật sự không tách được.",
  }),

  entry("Test.describe.parallel", CAT, {
    id: "describe-parallel",
    description:
      "Cho các test trong nhóm chạy song song, kể cả khi file đang ở chế độ tuần tự.",
    code: `test.describe.parallel('Trang tĩnh', () => {
  test('trang chủ', async ({ page }) => {
    await page.goto('/');
  });

  test('giới thiệu', async ({ page }) => {
    await page.goto('/gioi-thieu');
  });
});`,
    tags: ["test", "parallel", "performance"],
    related: ["describe-serial", "config/fully-parallel"],
  }),

  entry("Test.describe.skip", CAT, {
    id: "describe-skip",
    description: "Bỏ qua cả nhóm test.",
    code: `test.describe.skip('Tính năng chưa bật', () => {
  test('mai làm', async ({ page }) => {
    await page.goto('/');
  });
});`,
    tags: ["test", "skip", "group"],
    related: ["skip", "describe"],
  }),

  entry("Test.info", CAT, {
    id: "test-info",
    description:
      "Lấy thông tin test đang chạy: tiêu đề, trạng thái, lần retry thứ mấy, thư mục kết quả.",
    code: `test('có đính kèm', async ({ page }) => {
  const info = test.info();
  await page.goto('/');
  await info.attach('trang.png', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});`,
    tags: ["test", "metadata", "report", "attachment"],
    related: ["debug-report/test-info-attach", "after-each"],
  }),

  standalone(CAT, {
    id: "spec-file",
    title: "Bố cục file .spec.ts",
    signature: "tests/<tên>.spec.ts",
    description:
      "Khung một file test đầy đủ: import, nhóm, hook, rồi tới các test. Playwright tự nhận file theo `testMatch` trong config.",
    code: `import { test, expect } from '@playwright/test';

test.describe('Trang đăng nhập', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dang-nhap');
  });

  test('báo lỗi khi sai mật khẩu', async ({ page }) => {
    await page.getByLabel('Email').fill('an@vidu.vn');
    await page.getByLabel('Mật khẩu').fill('sai');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page.getByRole('alert')).toContainText('không đúng');
  });
});`,
    tags: ["test", "file", "structure", "template"],
    docsUrl: "https://playwright.dev/docs/writing-tests",
    related: ["test", "describe", "config/test-match"],
  }),
];

export default testStructure;
