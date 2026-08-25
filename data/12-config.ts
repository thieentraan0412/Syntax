/**
 * Nhóm 12 — Config.
 *
 * Mọi thứ trong playwright.config.ts. Hai tầng khác nhau hay bị lẫn:
 *   - tuỳ chọn của TEST RUNNER (timeout, retries, workers, reporter) — TestConfig
 *   - tuỳ chọn của TRÌNH DUYỆT (baseURL, viewport, trace…)          — TestOptions,
 *     nằm trong `use: { … }` và ghi đè được ở từng project hay từng file.
 */
import { entry, standalone } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "config" as const;
const DOC_CONFIG = "https://playwright.dev/docs/test-configuration";

export const config: CheatEntry[] = [
  standalone(CAT, {
    id: "define-config",
    title: "defineConfig()",
    signature: "export default defineConfig({ … })",
    description:
      "Khung playwright.config.ts đầy đủ. Bọc trong defineConfig() để có gợi ý kiểu và bắt lỗi ngay khi gõ.",
    code: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});`,
    tags: ["config", "defineConfig", "core", "recommended"],
    docsUrl: DOC_CONFIG,
    related: ["test-dir", "use", "projects", "web-server"],
  }),

  entry("TestConfig.testDir", CAT, {
    id: "test-dir",
    description: "Thư mục chứa test. Mặc định là thư mục gốc dự án.",
    code: `export default defineConfig({ testDir: './tests' });`,
    tags: ["config", "testDir", "path"],
    related: ["test-match", "test-ignore"],
  }),

  entry("TestConfig.testMatch", CAT, {
    id: "test-match",
    description: "Mẫu nhận diện file test. Mặc định nhận `**/*.@(spec|test).?(c|m)[jt]s?(x)`.",
    code: `export default defineConfig({ testMatch: /.*\\.e2e\\.ts/ });`,
    tags: ["config", "testMatch", "pattern"],
    related: ["test-dir", "test-ignore"],
  }),

  entry("TestConfig.testIgnore", CAT, {
    id: "test-ignore",
    description: "Mẫu file cần bỏ qua khi tìm test.",
    code: `export default defineConfig({ testIgnore: '**/nhap/**' });`,
    tags: ["config", "testIgnore", "pattern"],
    related: ["test-match", "test-dir"],
  }),

  entry("TestConfig.timeout", CAT, {
    id: "timeout",
    description: "Timeout cho MỖI test, tính bằng mili giây. Mặc định 30 giây.",
    code: `export default defineConfig({ timeout: 60_000 });`,
    tags: ["config", "timeout", "test"],
    related: ["expect-timeout", "action-timeout", "test-structure/set-timeout"],
    note: "Đây là timeout của cả test, không phải của từng action. Ba loại timeout khác nhau: test, expect, action.",
  }),

  entry("TestConfig.expect", CAT, {
    id: "expect-timeout",
    title: "expect.timeout",
    description: "Timeout cho mỗi assertion tự chờ. Mặc định 5 giây.",
    code: `export default defineConfig({
  expect: { timeout: 10_000 },
});`,
    tags: ["config", "timeout", "expect", "assertion"],
    related: ["timeout", "action-timeout", "assertions/to-be-visible"],
  }),

  entry("TestOptions.actionTimeout", CAT, {
    id: "action-timeout",
    description:
      "Timeout cho mỗi action (click, fill…). Mặc định 0 — nghĩa là KHÔNG giới hạn riêng, chỉ bị chặn bởi timeout của cả test.",
    code: `export default defineConfig({
  use: { actionTimeout: 15_000 },
});`,
    tags: ["config", "timeout", "action"],
    related: ["timeout", "navigation-timeout", "expect-timeout"],
    note: "Mặc định là 0 chứ không phải 30000 — đây là điểm khác biệt của bản JavaScript so với Python/Java/.NET.",
  }),

  entry("TestOptions.navigationTimeout", CAT, {
    id: "navigation-timeout",
    description: "Timeout riêng cho goto, reload, waitForURL. Mặc định 0 — không giới hạn riêng.",
    code: `export default defineConfig({
  use: { navigationTimeout: 30_000 },
});`,
    tags: ["config", "timeout", "navigation"],
    related: ["action-timeout", "page/goto"],
  }),

  entry("TestConfig.fullyParallel", CAT, {
    id: "fully-parallel",
    description:
      "Cho phép các test TRONG CÙNG một file chạy song song, không chỉ song song giữa các file.",
    code: `export default defineConfig({ fullyParallel: true });`,
    tags: ["config", "parallel", "performance"],
    related: ["workers", "test-structure/describe-parallel"],
  }),

  entry("TestConfig.workers", CAT, {
    id: "workers",
    description: "Số tiến trình chạy song song. Mặc định là một nửa số nhân CPU.",
    code: `export default defineConfig({
  workers: process.env.CI ? 1 : undefined,
});`,
    tags: ["config", "workers", "parallel", "ci"],
    related: ["fully-parallel", "cli/test-workers"],
  }),

  entry("TestConfig.retries", CAT, {
    id: "retries",
    description: "Số lần chạy lại khi test thất bại. Nên bật trên CI, tắt ở máy cá nhân.",
    code: `export default defineConfig({
  retries: process.env.CI ? 2 : 0,
});`,
    tags: ["config", "retry", "ci", "flaky"],
    related: ["trace", "cli/test-retries"],
    note: "Retry giấu bớt test chập chờn chứ không sửa chúng. Kết hợp `trace: 'on-first-retry'` để còn xem được nguyên nhân.",
  }),

  entry("TestConfig.forbidOnly", CAT, {
    id: "forbid-only",
    description:
      "Bắt CI báo lỗi nếu còn sót `test.only`. Chặn được lỗi 'chỉ chạy 1 test mà tưởng chạy hết'.",
    code: `export default defineConfig({ forbidOnly: !!process.env.CI });`,
    tags: ["config", "ci", "only", "safety"],
    related: ["test-structure/only"],
  }),

  entry("TestConfig.reporter", CAT, {
    id: "reporter",
    description: "Chọn kiểu báo cáo. Khai mảng để dùng nhiều kiểu cùng lúc.",
    code: `export default defineConfig({
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'on-failure' }]],
});`,
    tags: ["config", "reporter", "report", "ci"],
    related: ["debug-report/reporter-html", "cli/test-reporter"],
  }),

  entry("TestConfig.webServer", CAT, {
    id: "web-server",
    description:
      "Tự khởi động server ứng dụng trước khi chạy test, và chờ tới khi nó sẵn sàng.",
    code: `export default defineConfig({
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});`,
    tags: ["config", "webServer", "ci", "dev"],
    related: ["base-url", "define-config"],
  }),

  entry("TestConfig.projects", CAT, {
    id: "projects",
    description:
      "Chạy cùng bộ test với nhiều cấu hình khác nhau: nhiều trình duyệt, nhiều thiết bị, nhiều môi trường.",
    code: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 15'] } },
  ],
});`,
    tags: ["config", "projects", "browser", "device", "recommended"],
    related: ["use", "auth-state/setup-project", "cli/test-project"],
  }),

  entry("TestConfig.use", CAT, {
    id: "use",
    description:
      "Tuỳ chọn cho trình duyệt và context, áp cho mọi test. Ghi đè được ở từng project hoặc từng file.",
    code: `export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});`,
    tags: ["config", "use", "options", "core"],
    related: ["base-url", "trace", "projects", "test-structure/use"],
  }),

  entry("TestOptions.baseURL", CAT, {
    id: "base-url",
    description:
      "Địa chỉ gốc để ghép với đường dẫn tương đối trong `page.goto()`. Nhờ nó test chuyển môi trường không phải sửa code.",
    code: `export default defineConfig({
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000' },
});

// rồi trong test:
// await page.goto('/gio-hang');`,
    tags: ["config", "baseURL", "url", "environment", "recommended"],
    related: ["use", "page/goto", "web-server"],
  }),

  entry("TestOptions.trace", CAT, {
    id: "trace",
    description:
      "Khi nào ghi trace. `on-first-retry` là lựa chọn cân bằng nhất: có đủ dữ liệu khi hỏng mà không làm chậm lần chạy bình thường.",
    code: `export default defineConfig({
  use: { trace: 'on-first-retry' },
});`,
    tags: ["config", "trace", "debug", "ci", "recommended"],
    related: ["retries", "debug-report/trace-viewer", "screenshot"],
  }),

  entry("TestOptions.screenshot", CAT, {
    id: "screenshot",
    description: "Khi nào tự chụp màn hình: 'off' | 'on' | 'only-on-failure'.",
    code: `export default defineConfig({
  use: { screenshot: 'only-on-failure' },
});`,
    tags: ["config", "screenshot", "debug", "report"],
    related: ["video", "trace", "page/screenshot"],
  }),

  entry("TestOptions.video", CAT, {
    id: "video",
    description: "Khi nào quay video: 'off' | 'on' | 'retain-on-failure' | 'on-first-retry'.",
    code: `export default defineConfig({
  use: { video: 'retain-on-failure' },
});`,
    tags: ["config", "video", "debug", "report"],
    related: ["screenshot", "trace", "browser-context/video"],
  }),

  entry("TestOptions.headless", CAT, {
    id: "headless",
    description: "Chạy không hiện cửa sổ trình duyệt. Mặc định true.",
    code: `export default defineConfig({
  use: { headless: !process.env.HIEN_CUA_SO },
});`,
    tags: ["config", "headless", "debug"],
    related: ["cli/test-headed", "browser-context/launch"],
  }),

  entry("TestOptions.viewport", CAT, {
    id: "viewport",
    description: "Kích thước khung nhìn mặc định. Đặt null để dùng kích thước cửa sổ thật.",
    code: `export default defineConfig({
  use: { viewport: { width: 1440, height: 900 } },
});`,
    tags: ["config", "viewport", "responsive"],
    related: ["page/set-viewport-size", "projects"],
  }),

  entry("TestOptions.locale", CAT, {
    id: "locale",
    description: "Ngôn ngữ trình duyệt. Ảnh hưởng định dạng ngày, số và header Accept-Language.",
    code: `export default defineConfig({
  use: { locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' },
});`,
    tags: ["config", "locale", "i18n", "language"],
    related: ["use", "browser-context/new-context"],
  }),

  entry("TestOptions.colorScheme", CAT, {
    id: "color-scheme",
    description: "Giả lập giao diện sáng hay tối: 'light' | 'dark' | 'no-preference'.",
    code: `export default defineConfig({
  use: { colorScheme: 'dark' },
});`,
    tags: ["config", "dark-mode", "theme"],
    related: ["page/emulate-media"],
  }),

  entry("TestOptions.testIdAttribute", CAT, {
    id: "test-id-attribute",
    description:
      "Đổi tên thuộc tính mà `getByTestId()` tìm. Mặc định là `data-testid`.",
    code: `export default defineConfig({
  use: { testIdAttribute: 'data-test' },
});`,
    tags: ["config", "testid", "locator"],
    related: ["locators/get-by-test-id"],
  }),

  entry("TestOptions.storageState", CAT, {
    id: "storage-state",
    description: "Tệp session nạp sẵn cho mọi test — đây là mảnh cuối của mẹo đăng nhập một lần.",
    code: `export default defineConfig({
  use: { storageState: 'playwright/.auth/user.json' },
});`,
    tags: ["config", "auth", "storage", "session"],
    related: ["auth-state/auth-setup", "auth-state/setup-project"],
  }),

  entry("TestOptions.ignoreHTTPSErrors", CAT, {
    id: "ignore-https-errors",
    description: "Bỏ qua lỗi chứng chỉ HTTPS. Cần khi test môi trường staging dùng cert tự ký.",
    code: `export default defineConfig({
  use: { ignoreHTTPSErrors: true },
});`,
    tags: ["config", "https", "ssl", "staging"],
    related: ["use"],
  }),

  entry("TestOptions.extraHTTPHeaders", CAT, {
    id: "extra-http-headers",
    description: "Header gắn vào mọi request của mọi test.",
    code: `export default defineConfig({
  use: { extraHTTPHeaders: { 'X-Moi-Truong': 'test' } },
});`,
    tags: ["config", "http", "header"],
    related: ["page/set-extra-http-headers"],
  }),

  entry("TestOptions.permissions", CAT, {
    id: "permissions",
    description: "Quyền cấp sẵn cho mọi context, không phải bấm đồng ý trong test.",
    code: `export default defineConfig({
  use: { permissions: ['geolocation', 'notifications'] },
});`,
    tags: ["config", "permission", "geolocation"],
    related: ["browser-context/grant-permissions", "geolocation"],
  }),

  entry("TestOptions.geolocation", CAT, {
    id: "geolocation",
    description: "Toạ độ GPS mặc định. Nhớ cấp kèm quyền `geolocation`.",
    code: `export default defineConfig({
  use: {
    geolocation: { latitude: 21.0278, longitude: 105.8342 },
    permissions: ['geolocation'],
  },
});`,
    tags: ["config", "geolocation", "gps"],
    related: ["permissions", "browser-context/set-geolocation"],
  }),

  entry("TestConfig.outputDir", CAT, {
    id: "output-dir",
    description: "Thư mục chứa ảnh, video, trace của lần chạy. Mặc định `test-results`.",
    code: `export default defineConfig({ outputDir: './ket-qua' });`,
    tags: ["config", "output", "artifacts"],
    related: ["reporter", "trace"],
  }),

  entry("TestConfig.globalSetup", CAT, {
    id: "global-setup",
    description: "File chạy một lần trước toàn bộ test.",
    code: `export default defineConfig({ globalSetup: './global-setup.ts' });`,
    tags: ["config", "global", "setup"],
    related: ["auth-state/global-setup", "auth-state/setup-project"],
  }),

  entry("TestConfig.grep", CAT, {
    id: "grep",
    description: "Chỉ chạy test có tiêu đề khớp mẫu. Thường dùng cho tag.",
    code: `export default defineConfig({ grep: /@smoke/ });`,
    tags: ["config", "grep", "filter", "tag"],
    related: ["cli/test-grep", "advanced/test-tag"],
  }),

  entry("TestConfig.shard", CAT, {
    id: "shard",
    description: "Chia test cho nhiều máy CI. Thường đặt qua dòng lệnh chứ không trong config.",
    code: `export default defineConfig({ shard: { current: 1, total: 4 } });`,
    tags: ["config", "shard", "ci", "parallel"],
    related: ["cli/test-shard", "cli/merge-reports"],
  }),

  entry("TestOptions.offline", CAT, {
    id: "offline",
    description: "Chạy mọi test ở trạng thái mất mạng. Hiếm khi bật toàn cục — thường bật tạm trong một test.",
    code: `export default defineConfig({
  use: { offline: true },
});`,
    tags: ["config", "offline", "network"],
    related: ["browser-context/set-offline", "use"],
  }),

  entry("TestOptions.httpCredentials", CAT, {
    id: "http-credentials",
    description: "Tài khoản HTTP Basic Auth cấp sẵn cho mọi test — hay gặp ở môi trường staging có khoá.",
    code: `export default defineConfig({
  use: {
    httpCredentials: { username: 'an', password: process.env.MAT_KHAU_STAGING! },
  },
});`,
    tags: ["config", "auth", "http", "basic-auth", "staging"],
    related: ["browser-context/set-http-credentials", "use"],
  }),

  entry("TestConfig.updateSnapshots", CAT, {
    id: "update-snapshots",
    description: "Chính sách ghi đè ảnh chuẩn: 'all' | 'changed' | 'missing' | 'none'.",
    code: `export default defineConfig({ updateSnapshots: 'missing' });`,
    tags: ["config", "snapshot", "visual"],
    related: ["cli/test-update-snapshots", "visual-testing/to-have-screenshot"],
  }),
];

export default config;
