/**
 * Nhóm 11 — Auth & State.
 *
 * Ý tưởng cốt lõi của cả nhóm: đăng nhập MỘT LẦN, lưu session ra tệp, rồi mọi
 * test nạp lại tệp đó. Bấm qua form đăng nhập ở mỗi test vừa chậm vừa dễ hỏng —
 * và nó không phải thứ bạn đang muốn test.
 */
import { entry, standalone } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "auth-state" as const;
const DOC_AUTH = "https://playwright.dev/docs/auth";

export const authState: CheatEntry[] = [
  standalone(CAT, {
    id: "auth-setup",
    title: "auth.setup.ts",
    signature: "setup('authenticate', async ({ page }) => { … })",
    description:
      "File setup chạy trước mọi test: đăng nhập một lần rồi lưu session ra tệp JSON.",
    code: `import { test as setup, expect } from '@playwright/test';

const FILE_AUTH = 'playwright/.auth/user.json';

setup('đăng nhập', async ({ page }) => {
  await page.goto('/dang-nhap');
  await page.getByLabel('Email').fill('an@vidu.vn');
  await page.getByLabel('Mật khẩu').fill('bí-mật');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL('/bang-dieu-khien');

  await page.context().storageState({ path: FILE_AUTH });
});`,
    tags: ["auth", "setup", "login", "session", "recommended"],
    docsUrl: DOC_AUTH,
    related: ["setup-project", "storage-state", "config/storage-state"],
    note: "Thêm `playwright/.auth/` vào .gitignore — tệp này chứa session thật, không được commit.",
  }),

  standalone(CAT, {
    id: "setup-project",
    title: "Project dependencies cho setup",
    signature: "projects: [{ name: 'setup', testMatch: /.*\\.setup\\.ts/ }, { dependencies: ['setup'] }]",
    description:
      "Khai báo project `setup` chạy trước, các project khác phụ thuộc vào nó. Playwright tự đảm bảo thứ tự.",
    code: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\\.setup\\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});`,
    tags: ["auth", "project", "dependency", "config", "recommended"],
    docsUrl: DOC_AUTH,
    related: ["auth-setup", "config/projects", "config/storage-state"],
  }),

  entry("BrowserContext.storageState", CAT, {
    id: "storage-state",
    description:
      "Xuất cookie và localStorage của context ra tệp — đây là thứ tạo ra tệp session.",
    code: `await page.context().storageState({ path: 'playwright/.auth/user.json' });`,
    tags: ["auth", "storage", "session", "export"],
    related: ["auth-setup", "config/storage-state", "browser-context/storage-state"],
  }),

  standalone(CAT, {
    id: "use-storage-state",
    title: "test.use({ storageState })",
    signature: "test.use({ storageState: 'đường/dẫn.json' })",
    description:
      "Nạp session cho một file hoặc một nhóm test. Dùng khi cần vai trò khác với mặc định trong config.",
    code: `import { test, expect } from '@playwright/test';

test.describe('Quản trị viên', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('vào được trang quản trị', async ({ page }) => {
    await page.goto('/quan-tri');
    await expect(page.getByRole('heading', { name: 'Quản trị' })).toBeVisible();
  });
});`,
    tags: ["auth", "storage", "role", "override"],
    docsUrl: DOC_AUTH,
    related: ["multi-role", "test-structure/use", "config/storage-state"],
  }),

  standalone(CAT, {
    id: "multi-role",
    title: "Nhiều vai trò người dùng",
    signature: "setup('as admin', …) + setup('as user', …)",
    description:
      "Tạo nhiều tệp session, mỗi vai một tệp, rồi test nào cần vai nào thì nạp tệp đó.",
    code: `import { test as setup } from '@playwright/test';

setup('phiên quản trị', async ({ page }) => {
  await page.goto('/dang-nhap');
  await page.getByLabel('Email').fill('admin@vidu.vn');
  await page.getByLabel('Mật khẩu').fill('bí-mật');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});`,
    tags: ["auth", "role", "multi-user", "session"],
    docsUrl: DOC_AUTH,
    related: ["use-storage-state", "auth-setup"],
  }),

  standalone(CAT, {
    id: "api-login",
    title: "Đăng nhập qua API",
    signature: "request.post('/api/dang-nhap') + request.storageState()",
    description:
      "Bỏ qua giao diện, gọi thẳng API đăng nhập rồi lấy cookie. Nhanh hơn nhiều và không vỡ khi form đổi.",
    code: `import { test as setup } from '@playwright/test';

setup('đăng nhập qua API', async ({ request }) => {
  await request.post('/api/dang-nhap', {
    data: { email: 'an@vidu.vn', matKhau: 'bí-mật' },
  });
  await request.storageState({ path: 'playwright/.auth/user.json' });
});`,
    tags: ["auth", "api", "login", "performance"],
    docsUrl: DOC_AUTH,
    related: ["auth-setup", "network/api-storage-state", "fixtures/request"],
  }),

  entry("BrowserContext.addCookies", CAT, {
    id: "add-cookies",
    description: "Đặt thẳng cookie phiên nếu bạn biết giá trị token — cách nhanh nhất.",
    code: `await context.addCookies([
  { name: 'phien', value: process.env.TOKEN_TEST!, domain: 'vidu.vn', path: '/' },
]);
await page.goto('/ca-nhan');`,
    tags: ["auth", "cookie", "token", "session"],
    related: ["storage-state", "browser-context/add-cookies"],
  }),

  standalone(CAT, {
    id: "global-setup",
    title: "globalSetup",
    signature: "globalSetup: './global-setup.ts'",
    description:
      "Chạy một lần trước toàn bộ test, kể cả trước khi dựng project. Dùng để dựng database hay bật service.",
    code: `// global-setup.ts
import type { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Chuẩn bị dữ liệu cho', config.projects.length, 'project');
}

export default globalSetup;`,
    tags: ["auth", "global", "setup", "config"],
    docsUrl: "https://playwright.dev/docs/test-global-setup-teardown",
    related: ["setup-project", "config/global-setup"],
    note: "Nếu chỉ cần đăng nhập thì project dependencies (setup-project) tốt hơn: có trace, có retry, báo lỗi rõ.",
  }),

  standalone(CAT, {
    id: "gitignore-auth",
    title: "Không commit tệp session",
    signature: "playwright/.auth/",
    description:
      "Tệp storageState chứa cookie phiên thật. Commit lên là rò rỉ quyền truy cập.",
    code: `# .gitignore
playwright/.auth/
test-results/
playwright-report/`,
    codeLang: "bash",
    tags: ["auth", "bảo mật", "gitignore", "security"],
    docsUrl: DOC_AUTH,
    related: ["auth-setup", "storage-state"],
  }),

  entry("BrowserContext.clearCookies", CAT, {
    id: "logout",
    title: "Đăng xuất bằng clearCookies()",
    description: "Xoá cookie để về trạng thái chưa đăng nhập, kiểm tra trang có chặn đúng không.",
    code: `await context.clearCookies();
await page.goto('/ca-nhan');
await expect(page).toHaveURL(/dang-nhap/);`,
    tags: ["auth", "logout", "cookie"],
    related: ["add-cookies", "browser-context/clear-cookies"],
  }),

  standalone(CAT, {
    id: "no-storage-state",
    title: "Test cho người chưa đăng nhập",
    signature: "test.use({ storageState: { cookies: [], origins: [] } })",
    description:
      "Bỏ session mặc định cho một nhóm test, để kiểm tra luồng của khách chưa đăng nhập.",
    code: `import { test, expect } from '@playwright/test';

test.describe('Khách vãng lai', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('bị đẩy về trang đăng nhập', async ({ page }) => {
    await page.goto('/ca-nhan');
    await expect(page).toHaveURL(/dang-nhap/);
  });
});`,
    tags: ["auth", "guest", "storage", "override"],
    docsUrl: DOC_AUTH,
    related: ["use-storage-state", "logout"],
  }),
];

export default authState;
