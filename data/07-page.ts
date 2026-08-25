/**
 * Nhóm 7 — Page & Navigation.
 *
 * Lưu ý chung: Playwright tự chờ điều hướng sau mỗi action, nên gần như không
 * bao giờ cần `waitForNavigation`. Cần chờ gì thì chờ bằng assertion — vừa rõ ý
 * vừa báo lỗi tử tế khi sai.
 */
import { entry } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "page" as const;

export const pageEntries: CheatEntry[] = [
  entry("Page.goto", CAT, {
    id: "goto",
    description:
      "Mở một địa chỉ. Đường dẫn tương đối sẽ ghép với `baseURL` trong config.",
    code: `await page.goto('/gio-hang');
await page.goto('https://vidu.vn/gio-hang', { waitUntil: 'domcontentloaded' });`,
    tags: ["navigation", "goto", "url", "core"],
    related: ["reload", "go-back", "config/base-url"],
  }),

  entry("Page.reload", CAT, {
    id: "reload",
    description: "Tải lại trang hiện tại.",
    code: `await page.reload();`,
    tags: ["navigation", "reload"],
    related: ["goto", "go-back"],
  }),

  entry("Page.goBack", CAT, {
    id: "go-back",
    description: "Quay lại trang trước trong lịch sử duyệt web.",
    code: `await page.goBack();
await expect(page).toHaveURL('/danh-sach');`,
    tags: ["navigation", "history", "back"],
    related: ["go-forward", "goto"],
  }),

  entry("Page.goForward", CAT, {
    id: "go-forward",
    description: "Đi tới trang kế trong lịch sử duyệt web.",
    code: `await page.goForward();`,
    tags: ["navigation", "history", "forward"],
    related: ["go-back"],
  }),

  entry("Page.waitForURL", CAT, {
    id: "wait-for-url",
    description:
      "Chờ tới khi địa chỉ khớp mẫu. Dùng khi trang tự chuyển hướng sau một hành động.",
    code: `await page.getByRole('button', { name: 'Đăng nhập' }).click();
await page.waitForURL('**/bang-dieu-khien');`,
    tags: ["navigation", "wait", "url"],
    related: ["assertions/to-have-url", "wait-for-load-state"],
    note: "Thường `await expect(page).toHaveURL(...)` là đủ và cho thông báo lỗi rõ hơn.",
  }),

  entry("Page.waitForLoadState", CAT, {
    id: "wait-for-load-state",
    description:
      "Chờ trang đạt trạng thái tải: 'load', 'domcontentloaded' hoặc 'networkidle'.",
    code: `await page.waitForLoadState('domcontentloaded');`,
    tags: ["navigation", "wait", "load"],
    related: ["wait-for-url", "goto"],
    note: "Tránh 'networkidle' — trang có polling hay websocket thì nó không bao giờ đạt. Chờ bằng assertion trên phần tử thì chắc hơn.",
  }),

  entry("Page.waitForFunction", CAT, {
    id: "wait-for-function",
    description:
      "Chờ tới khi một hàm JavaScript chạy trong trang trả về giá trị đúng. Lối thoát khi không có locator nào diễn tả được điều kiện.",
    code: `await page.waitForFunction(() => document.readyState === 'complete');`,
    tags: ["wait", "javascript", "condition", "escape-hatch"],
    related: ["evaluate", "wait-for-load-state"],
  }),

  entry("Page.waitForEvent", CAT, {
    id: "wait-for-event",
    description:
      "Chờ một sự kiện của trang. Phải bắt đầu chờ TRƯỚC khi kích hoạt hành động, không thì lỡ mất sự kiện.",
    code: `const [tabMoi] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('link', { name: 'Mở tab mới' }).click(),
]);
await expect(tabMoi).toHaveURL(/vidu\\.vn/);`,
    tags: ["wait", "event", "popup"],
    related: ["frames-dialogs/popup", "network/wait-for-response"],
  }),

  entry("Page.waitForTimeout", CAT, {
    id: "wait-for-timeout",
    description: "Ngủ một khoảng thời gian cố định.",
    code: `await page.waitForTimeout(1000);`,
    tags: ["wait", "sleep", "timeout"],
    related: ["assertions/to-be-visible", "wait-for-load-state"],
    note: "Đừng dùng trong test thật. Máy CI chậm hơn máy bạn là test gãy, máy nhanh thì phí thời gian. Chờ bằng expect() thay vì đoán thời gian.",
  }),

  entry("Page.evaluate", CAT, {
    id: "evaluate",
    description:
      "Chạy JavaScript trong trang và lấy kết quả về. Tham số và giá trị trả về phải chuyển được sang JSON.",
    code: `const chieuRong = await page.evaluate(() => window.innerWidth);
expect(chieuRong).toBeGreaterThan(1000);

// Truyền tham số vào — tham số phải chuyển được sang JSON
const loiChao = await page.evaluate((ten: string) => \`Xin chào \${ten}\`, 'An');
expect(loiChao).toBe('Xin chào An');`,
    tags: ["javascript", "evaluate", "dom", "escape-hatch"],
    related: ["add-init-script", "actions/evaluate"],
    note: "Hàm này chạy trong trình duyệt, không phải trong Node — không dùng được biến bên ngoài trừ khi truyền qua tham số.",
  }),

  entry("Page.addInitScript", CAT, {
    id: "add-init-script",
    description:
      "Chạy một đoạn JS trước MỌI script của trang, trên mọi lần điều hướng. Dùng để giả lập API trình duyệt hoặc gieo localStorage.",
    code: `await page.addInitScript(() => {
  window.localStorage.setItem('da-xem-huong-dan', 'true');
});
await page.goto('/');`,
    tags: ["javascript", "init", "mock", "localstorage"],
    related: ["evaluate", "browser-context/add-init-script"],
  }),

  entry("Page.screenshot", CAT, {
    id: "screenshot",
    description: "Chụp ảnh màn hình trang, lưu ra tệp hoặc lấy về dạng Buffer.",
    code: `await page.screenshot({ path: 'trang-chu.png' });
await page.screenshot({ path: 'toan-trang.png', fullPage: true });

const anh = await page.screenshot();
expect(anh.length).toBeGreaterThan(0);`,
    tags: ["screenshot", "image", "debug", "report"],
    related: ["pdf", "visual-testing/to-have-screenshot", "config/screenshot"],
    note: "Để so sánh giao diện thì dùng `expect(page).toHaveScreenshot()` — nó tự so với ảnh chuẩn, còn cái này chỉ chụp.",
  }),

  entry("Page.pdf", CAT, {
    id: "pdf",
    description: "Xuất trang ra tệp PDF. Chỉ chạy được trên Chromium ở chế độ headless.",
    code: `await page.pdf({ path: 'hoa-don.pdf', format: 'A4' });`,
    tags: ["pdf", "export", "chromium"],
    related: ["screenshot"],
  }),

  entry("Page.setViewportSize", CAT, {
    id: "set-viewport-size",
    description: "Đổi kích thước khung nhìn giữa chừng. Dùng để test responsive.",
    code: `await page.setViewportSize({ width: 375, height: 667 });
await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();`,
    tags: ["viewport", "responsive", "mobile"],
    related: ["config/viewport", "browser-context/new-context"],
  }),

  entry("Page.emulateMedia", CAT, {
    id: "emulate-media",
    description:
      "Giả lập chế độ hiển thị: giao diện tối, chế độ in, giảm chuyển động.",
    code: `await page.emulateMedia({ colorScheme: 'dark' });
await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(17, 17, 17)');

await page.emulateMedia({ media: 'print' });`,
    tags: ["emulate", "dark-mode", "print", "media"],
    related: ["config/color-scheme", "set-viewport-size"],
  }),

  entry("Page.setContent", CAT, {
    id: "set-content",
    description:
      "Nạp thẳng chuỗi HTML vào trang, không cần server. Rất tiện để test component nhỏ.",
    code: `await page.setContent('<button id="mua">Mua ngay</button>');
await expect(page.getByRole('button', { name: 'Mua ngay' })).toBeVisible();`,
    tags: ["html", "content", "unit"],
    related: ["goto", "content"],
  }),

  entry("Page.content", CAT, {
    id: "content",
    description: "Lấy toàn bộ HTML hiện tại của trang.",
    code: `const html = await page.content();
expect(html).toContain('<title>');`,
    tags: ["html", "content", "read"],
    related: ["set-content", "title"],
  }),

  entry("Page.title", CAT, {
    id: "title",
    description: "Đọc tiêu đề trang. Để kiểm tra thì dùng expect(page).toHaveTitle().",
    code: `const tieuDe = await page.title();
expect(tieuDe).toContain('Cửa hàng');`,
    tags: ["title", "read", "seo"],
    related: ["assertions/to-have-title", "url"],
  }),

  entry("Page.url", CAT, {
    id: "url",
    description: "Đọc địa chỉ hiện tại. Để kiểm tra thì dùng expect(page).toHaveURL().",
    code: `expect(page.url()).toContain('/gio-hang');`,
    tags: ["url", "read", "navigation"],
    related: ["assertions/to-have-url", "wait-for-url"],
  }),

  entry("Page.close", CAT, {
    id: "close",
    description: "Đóng tab. Playwright tự đóng khi test xong nên hiếm khi phải gọi tay.",
    code: `const tabMoi = await context.newPage();
await tabMoi.goto('/');
await tabMoi.close();`,
    tags: ["page", "close", "cleanup"],
    related: ["browser-context/new-page"],
  }),

  entry("Page.setDefaultTimeout", CAT, {
    id: "set-default-timeout",
    description: "Đổi timeout mặc định của mọi action và assertion trên trang này.",
    code: `page.setDefaultTimeout(10_000);`,
    tags: ["timeout", "config"],
    related: ["set-default-navigation-timeout", "config/action-timeout"],
  }),

  entry("Page.setDefaultNavigationTimeout", CAT, {
    id: "set-default-navigation-timeout",
    description: "Đổi timeout riêng cho các thao tác điều hướng (goto, reload, waitForURL).",
    code: `page.setDefaultNavigationTimeout(30_000);`,
    tags: ["timeout", "navigation", "config"],
    related: ["set-default-timeout", "config/navigation-timeout"],
  }),

  entry("Page.setExtraHTTPHeaders", CAT, {
    id: "set-extra-http-headers",
    description: "Gắn thêm header vào mọi request của trang này.",
    code: `await page.setExtraHTTPHeaders({ 'X-Moi-Truong': 'test' });
await page.goto('/');`,
    tags: ["http", "header", "network"],
    related: ["config/extra-http-headers", "network/route"],
  }),

  entry("Page.on", CAT, {
    id: "on",
    description:
      "Lắng nghe sự kiện của trang: console, pageerror, request, response, dialog, download…",
    code: `page.on('console', (msg) => console.log('LOG TRANG:', msg.text()));
page.on('pageerror', (err) => console.error('LỖI JS:', err.message));
await page.goto('/');`,
    tags: ["event", "listener", "console", "error"],
    related: ["page-error", "frames-dialogs/dialog", "network/response-event"],
  }),

  entry("Page.pageError", CAT, {
    id: "page-error",
    title: "page.on('pageerror')",
    description:
      "Bắt lỗi JavaScript chưa được xử lý trong trang. Rất đáng gắn để test tự phát hiện lỗi console.",
    code: `const loi: string[] = [];
page.on('pageerror', (e) => loi.push(e.message));
await page.goto('/');
expect(loi).toHaveLength(0);`,
    tags: ["event", "error", "javascript", "quality"],
    related: ["on", "fixtures/auto-fixture"],
  }),

  entry("Page.addLocatorHandler", CAT, {
    id: "add-locator-handler",
    description:
      "Đăng ký cách xử lý phần tử chen ngang (banner cookie, popup khuyến mãi) mỗi khi nó chắn action.",
    code: `await page.addLocatorHandler(page.getByRole('dialog', { name: 'Cookie' }), async (hop) => {
  await hop.getByRole('button', { name: 'Đồng ý' }).click();
});
await page.goto('/');`,
    tags: ["handler", "popup", "cookie", "interrupt"],
    related: ["frames-dialogs/dialog", "on"],
  }),

  entry("Page.frames", CAT, {
    id: "frames",
    description: "Lấy danh sách mọi frame trong trang, kể cả frame chính.",
    code: `expect(page.frames().length).toBeGreaterThan(0);`,
    tags: ["frame", "iframe"],
    related: ["frames-dialogs/frame-locator-nested", "locators/frame-locator"],
  }),

  entry("Page.pause", CAT, {
    id: "pause",
    description:
      "Dừng test và mở Playwright Inspector để bạn tự thao tác. Chỉ dùng lúc debug tay.",
    code: `await page.goto('/gio-hang');
await page.pause();`,
    tags: ["debug", "pause", "inspector"],
    related: ["debug-report/page-pause", "cli/test-debug"],
    note: "Nhớ xoá trước khi commit — để lại là CI treo tới khi hết timeout.",
  }),

  entry("Page.localStorage", CAT, {
    id: "local-storage",
    description: "Đọc và ghi localStorage của trang mà không phải viết evaluate.",
    code: `await page.goto('/');
await page.localStorage.setItem('ngon-ngu', 'vi');
expect(await page.localStorage.getItem('ngon-ngu')).toBe('vi');`,
    tags: ["storage", "localstorage", "state"],
    related: ["session-storage", "add-init-script", "auth-state/storage-state"],
  }),

  entry("Page.sessionStorage", CAT, {
    id: "session-storage",
    description: "Đọc và ghi sessionStorage của trang.",
    code: `await page.goto('/');
await page.sessionStorage.setItem('buoc', '2');
expect(await page.sessionStorage.getItem('buoc')).toBe('2');`,
    tags: ["storage", "sessionstorage", "state"],
    related: ["local-storage"],
  }),
];

export default pageEntries;
