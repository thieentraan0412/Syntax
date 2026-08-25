/**
 * Nhóm 8 — Browser & Context.
 *
 * Context là đơn vị cách ly: cookie, localStorage, quyền, session — mỗi context
 * một bộ riêng. Chi phí tạo context gần như bằng 0 so với khởi động browser, nên
 * mỗi test một context là mặc định đúng, không phải sự xa xỉ.
 */
import { entry } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "browser-context" as const;

export const browserContext: CheatEntry[] = [
  entry("BrowserType.launch", CAT, {
    id: "launch",
    description:
      "Khởi động một trình duyệt. Trong test runner hầu như không cần gọi tay — fixture `browser` đã lo.",
    code: `import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false, slowMo: 100 });
const page = await browser.newPage();
await page.goto('https://vidu.vn');
await browser.close();`,
    tags: ["browser", "launch", "chromium"],
    related: ["new-context", "launch-persistent-context", "config/headless"],
  }),

  entry("BrowserType.launchPersistentContext", CAT, {
    id: "launch-persistent-context",
    description:
      "Khởi động browser với thư mục hồ sơ lưu trên đĩa — cookie và cache còn lại giữa các lần chạy. Dùng khi cần trạng thái đăng nhập bền.",
    code: `import { chromium } from '@playwright/test';

const context = await chromium.launchPersistentContext('./.ho-so', { headless: false });
const page = await context.newPage();
await page.goto('https://vidu.vn');
await context.close();`,
    tags: ["browser", "persistent", "profile", "session"],
    related: ["launch", "auth-state/storage-state"],
  }),

  entry("Browser.newContext", CAT, {
    id: "new-context",
    description:
      "Tạo context mới, cách ly hoàn toàn với các context khác. Đây là chỗ đặt mọi tuỳ chọn giả lập thiết bị.",
    code: `const context = await browser.newContext({
  locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
});
const page = await context.newPage();
await page.goto('/');
await context.close();`,
    tags: ["context", "isolation", "emulation", "locale"],
    related: ["new-page", "config/use", "fixtures/context"],
  }),

  entry("BrowserContext.newPage", CAT, {
    id: "new-page",
    description: "Mở một tab mới trong context. Tab dùng chung cookie với context đó.",
    code: `const tab2 = await context.newPage();
await tab2.goto('/gio-hang');`,
    tags: ["context", "page", "tab"],
    related: ["new-context", "fixtures/context"],
  }),

  entry("BrowserContext.storageState", CAT, {
    id: "storage-state",
    description:
      "Xuất cookie và localStorage hiện tại ra tệp. Nền tảng của mẹo đăng nhập một lần dùng cho mọi test.",
    code: `await context.storageState({ path: 'playwright/.auth/user.json' });`,
    tags: ["context", "storage", "auth", "session"],
    related: ["auth-state/storage-state", "cookies", "config/storage-state"],
  }),

  entry("BrowserContext.cookies", CAT, {
    id: "cookies",
    description: "Đọc cookie hiện có của context, lọc theo URL nếu cần.",
    code: `const ds = await context.cookies();
expect(ds.some((c) => c.name === 'phien')).toBe(true);`,
    tags: ["context", "cookie", "read"],
    related: ["add-cookies", "clear-cookies", "storage-state"],
  }),

  entry("BrowserContext.addCookies", CAT, {
    id: "add-cookies",
    description: "Đặt sẵn cookie trước khi mở trang. Cách nhanh để bỏ qua bước đăng nhập.",
    code: `await context.addCookies([
  { name: 'phien', value: 'abc123', domain: 'vidu.vn', path: '/' },
]);
await page.goto('/ca-nhan');`,
    tags: ["context", "cookie", "auth", "setup"],
    related: ["cookies", "clear-cookies", "auth-state/storage-state"],
  }),

  entry("BrowserContext.clearCookies", CAT, {
    id: "clear-cookies",
    description: "Xoá cookie trong context, lọc theo tên hoặc domain nếu muốn.",
    code: `await context.clearCookies();
await context.clearCookies({ name: 'phien' });`,
    tags: ["context", "cookie", "cleanup", "logout"],
    related: ["add-cookies", "cookies"],
  }),

  entry("BrowserContext.grantPermissions", CAT, {
    id: "grant-permissions",
    description:
      "Cấp trước quyền trình duyệt (vị trí, camera, thông báo…) để trang không hiện hộp xin quyền.",
    code: `await context.grantPermissions(['geolocation'], { origin: 'https://vidu.vn' });`,
    tags: ["context", "permission", "geolocation", "camera"],
    related: ["clear-permissions", "set-geolocation", "config/permissions"],
  }),

  entry("BrowserContext.clearPermissions", CAT, {
    id: "clear-permissions",
    description: "Thu hồi mọi quyền đã cấp cho context.",
    code: `await context.clearPermissions();`,
    tags: ["context", "permission", "cleanup"],
    related: ["grant-permissions"],
  }),

  entry("BrowserContext.setGeolocation", CAT, {
    id: "set-geolocation",
    description: "Giả lập vị trí GPS. Phải cấp quyền `geolocation` trước.",
    code: `await context.grantPermissions(['geolocation']);
await context.setGeolocation({ latitude: 21.0278, longitude: 105.8342 });
await page.goto('/cua-hang-gan-toi');`,
    tags: ["context", "geolocation", "gps", "emulation"],
    related: ["grant-permissions", "config/geolocation"],
  }),

  entry("BrowserContext.setOffline", CAT, {
    id: "set-offline",
    description: "Ngắt mạng của context để test hành vi khi mất kết nối.",
    code: `await context.setOffline(true);
await page.getByRole('button', { name: 'Lưu' }).click();
await expect(page.getByText('Không có kết nối')).toBeVisible();`,
    tags: ["context", "offline", "network", "error"],
    related: ["network/route-abort", "config/offline"],
  }),

  entry("BrowserContext.setHTTPCredentials", CAT, {
    id: "set-http-credentials",
    description: "Đặt tài khoản HTTP Basic Auth cho context.",
    code: `await context.setHTTPCredentials({ username: 'an', password: 'bí-mật' });`,
    tags: ["context", "auth", "http", "basic-auth"],
    related: ["config/http-credentials"],
  }),

  entry("BrowserContext.setExtraHTTPHeaders", CAT, {
    id: "set-extra-http-headers",
    description: "Gắn header vào mọi request của mọi tab trong context.",
    code: `await context.setExtraHTTPHeaders({ Authorization: 'Bearer token-test' });`,
    tags: ["context", "http", "header"],
    related: ["page/set-extra-http-headers", "config/extra-http-headers"],
  }),

  entry("BrowserContext.addInitScript", CAT, {
    id: "add-init-script",
    description:
      "Chạy JS trước mọi script của trang, áp dụng cho MỌI tab trong context.",
    code: `await context.addInitScript(() => {
  window.localStorage.setItem('da-xem-huong-dan', 'true');
});`,
    tags: ["context", "init", "javascript", "mock"],
    related: ["page/add-init-script"],
  }),

  entry("BrowserContext.tracing", CAT, {
    id: "tracing",
    description:
      "Đối tượng ghi trace của context. Trace ghi lại từng bước kèm ảnh DOM, xem lại được bằng Trace Viewer.",
    code: `await context.tracing.start({ screenshots: true, snapshots: true });
await page.goto('/');
await context.tracing.stop({ path: 'trace.zip' });`,
    tags: ["context", "trace", "debug", "record"],
    related: ["tracing-start", "debug-report/trace-viewer", "config/trace"],
  }),

  entry("Tracing.start", CAT, {
    id: "tracing-start",
    description: "Bắt đầu ghi trace. Bật `screenshots` và `snapshots` thì xem lại mới đủ ý nghĩa.",
    code: `await context.tracing.start({ screenshots: true, snapshots: true, sources: true });`,
    tags: ["trace", "debug", "record"],
    related: ["tracing-stop", "tracing"],
  }),

  entry("Tracing.stop", CAT, {
    id: "tracing-stop",
    description: "Dừng ghi và lưu trace ra tệp .zip.",
    code: `await context.tracing.stop({ path: 'test-results/trace.zip' });`,
    tags: ["trace", "debug", "record"],
    related: ["tracing-start", "cli/show-trace"],
  }),

  entry("BrowserContext.close", CAT, {
    id: "close",
    description:
      "Đóng context và mọi tab bên trong. Bắt buộc gọi khi tự tạo context bằng tay, không thì video và trace không được ghi trọn.",
    code: `await context.close();`,
    tags: ["context", "close", "cleanup"],
    related: ["new-context"],
  }),

  entry("Browser.close", CAT, {
    id: "browser-close",
    title: "browser.close()",
    description: "Đóng browser và mọi context của nó.",
    code: `await browser.close();`,
    tags: ["browser", "close", "cleanup"],
    related: ["launch", "close"],
  }),

  entry("Browser.version", CAT, {
    id: "version",
    description: "Đọc phiên bản trình duyệt đang chạy. Hữu ích khi ghi vào báo cáo.",
    code: `console.log(browser.version());`,
    tags: ["browser", "version", "info"],
    related: ["launch"],
  }),

  entry("Page.video", CAT, {
    id: "video",
    description:
      "Lấy video ghi lại phiên làm việc của tab. Chỉ có khi đã bật `recordVideo` lúc tạo context.",
    code: `const context = await browser.newContext({ recordVideo: { dir: 'videos/' } });
const page = await context.newPage();
await page.goto('/');
await context.close();
console.log(await page.video()?.path());`,
    tags: ["video", "record", "debug"],
    related: ["config/video", "tracing"],
    note: "Video chỉ được ghi trọn sau khi context đóng — đọc path trước khi close là ra tệp dở.",
  }),

  entry("BrowserContext.routeFromHAR", CAT, {
    id: "route-from-har",
    description:
      "Trả lời request bằng dữ liệu trong tệp HAR đã ghi trước. Cho phép chạy test hoàn toàn offline.",
    code: `await context.routeFromHAR('tests/har/api.har', { update: false });
await page.goto('/');`,
    tags: ["context", "har", "network", "mock", "offline"],
    related: ["network/route", "network/route-from-har"],
  }),
];

export default browserContext;
