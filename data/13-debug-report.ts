/**
 * Nhóm 13 — Debug & Report.
 *
 * Thứ tự nên thử khi test hỏng:
 *   1. Trace Viewer  — xem lại lần chạy đã hỏng, không cần tái hiện
 *   2. UI mode       — sửa và chạy lại liên tục lúc đang viết
 *   3. --debug       — bước từng dòng khi cần nhìn kỹ
 *   4. page.pause()  — dừng đúng chỗ mình nghi
 */
import { entry, standalone } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "debug-report" as const;
const DOC_DEBUG = "https://playwright.dev/docs/debug";
const DOC_REPORTER = "https://playwright.dev/docs/test-reporters";

export const debugReport: CheatEntry[] = [
  standalone(CAT, {
    id: "trace-viewer",
    title: "Trace Viewer",
    signature: "npx playwright show-trace <trace.zip>",
    description:
      "Xem lại toàn bộ lần chạy: từng action, ảnh DOM tại mỗi bước, network, console, source. Công cụ debug mạnh nhất của Playwright.",
    code: `# Bật ghi trace trong config
# use: { trace: 'on-first-retry' }

npx playwright show-trace test-results/dang-nhap-chromium/trace.zip`,
    codeLang: "bash",
    tags: ["debug", "trace", "viewer", "recommended"],
    docsUrl: "https://playwright.dev/docs/trace-viewer",
    related: ["config/trace", "cli/show-trace", "browser-context/tracing"],
    note: "Trace ghi lại đủ để tìm lỗi mà không cần tái hiện — đặc biệt quý với lỗi chỉ xảy ra trên CI.",
  }),

  standalone(CAT, {
    id: "ui-mode",
    title: "UI mode",
    signature: "npx playwright test --ui",
    description:
      "Giao diện xem test chạy từng bước, tua đi tua lại, lọc theo trạng thái, sửa code là tự chạy lại. Cách làm việc tốt nhất lúc đang viết test.",
    code: `npx playwright test --ui`,
    codeLang: "bash",
    tags: ["debug", "ui", "watch", "recommended"],
    docsUrl: "https://playwright.dev/docs/test-ui-mode",
    related: ["cli/test-ui", "trace-viewer"],
  }),

  entry("Page.pause", CAT, {
    id: "page-pause",
    description:
      "Dừng test tại đúng dòng này và mở Playwright Inspector để bạn tự thao tác, thử locator.",
    code: `await page.goto('/gio-hang');
await page.pause();
await page.getByRole('button', { name: 'Thanh toán' }).click();`,
    tags: ["debug", "pause", "inspector"],
    related: ["pwdebug", "cli/test-debug", "page/pause"],
    note: "Xoá trước khi commit — để lại là CI đứng chờ tới khi hết timeout.",
  }),

  standalone(CAT, {
    id: "pwdebug",
    title: "PWDEBUG=1",
    signature: "PWDEBUG=1 npx playwright test",
    description:
      "Biến môi trường bật chế độ debug: mở Inspector, chạy headed, tắt timeout của test.",
    code: `# Linux / macOS
PWDEBUG=1 npx playwright test

# Windows PowerShell
$env:PWDEBUG=1; npx playwright test

# Chỉ mở console debug, không mở Inspector
PWDEBUG=console npx playwright test`,
    codeLang: "bash",
    tags: ["debug", "env", "inspector", "pwdebug"],
    docsUrl: DOC_DEBUG,
    related: ["page-pause", "cli/test-debug", "debug-env"],
  }),

  standalone(CAT, {
    id: "debug-env",
    title: "DEBUG=pw:api",
    signature: "DEBUG=pw:api npx playwright test",
    description:
      "In log chi tiết mọi lời gọi API của Playwright. Dùng khi cần biết chính xác nó đang chờ cái gì.",
    code: `DEBUG=pw:api npx playwright test
DEBUG=pw:browser npx playwright test`,
    codeLang: "bash",
    tags: ["debug", "env", "log", "verbose"],
    docsUrl: DOC_DEBUG,
    related: ["pwdebug"],
  }),

  standalone(CAT, {
    id: "reporter-html",
    title: "Reporter html",
    signature: "reporter: [['html', { open: 'never' }]]",
    description:
      "Báo cáo HTML đầy đủ: danh sách test, lỗi kèm ảnh, video, trace nhúng sẵn. Mặc định của dự án mới.",
    code: `export default defineConfig({
  reporter: [['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],
});`,
    tags: ["report", "html", "reporter"],
    docsUrl: DOC_REPORTER,
    related: ["cli/show-report", "config/reporter"],
  }),

  standalone(CAT, {
    id: "reporter-list",
    title: "Reporter list / line / dot",
    signature: "reporter: 'list' | 'line' | 'dot'",
    description:
      "Báo cáo dạng chữ trên terminal. `list` in từng test, `line` gọn một dòng, `dot` gọn nhất — hợp cho CI.",
    code: `export default defineConfig({
  reporter: process.env.CI ? 'dot' : 'list',
});`,
    tags: ["report", "terminal", "reporter", "ci"],
    docsUrl: DOC_REPORTER,
    related: ["reporter-html", "config/reporter"],
  }),

  standalone(CAT, {
    id: "reporter-json",
    title: "Reporter json / junit",
    signature: "reporter: [['json', { outputFile: 'ket-qua.json' }]]",
    description:
      "Xuất kết quả ra tệp máy đọc được. `junit` là định dạng mọi hệ CI đều hiểu.",
    code: `export default defineConfig({
  reporter: [
    ['json', { outputFile: 'ket-qua.json' }],
    ['junit', { outputFile: 'ket-qua.xml' }],
  ],
});`,
    tags: ["report", "json", "junit", "ci", "reporter"],
    docsUrl: DOC_REPORTER,
    related: ["reporter-html", "reporter-blob"],
  }),

  standalone(CAT, {
    id: "reporter-blob",
    title: "Reporter blob",
    signature: "reporter: 'blob'",
    description:
      "Báo cáo trung gian để gộp kết quả từ nhiều shard CI thành một báo cáo HTML duy nhất.",
    code: `export default defineConfig({
  reporter: process.env.CI ? 'blob' : 'html',
});

// rồi trên máy gộp:
// npx playwright merge-reports ./all-blob-reports --reporter=html`,
    tags: ["report", "blob", "shard", "ci", "merge"],
    docsUrl: "https://playwright.dev/docs/test-sharding",
    related: ["cli/merge-reports", "cli/test-shard"],
  }),

  entry("Test.info", CAT, {
    id: "test-info",
    description:
      "Thông tin về test đang chạy: tiêu đề, trạng thái, lần retry, thư mục kết quả, danh sách đính kèm.",
    code: `test.afterEach(async ({ page }, testInfo) => {
  console.log(testInfo.title, testInfo.status, 'retry', testInfo.retry);
});`,
    tags: ["debug", "metadata", "report", "testinfo"],
    related: ["test-info-attach", "test-structure/test-info"],
  }),

  entry("TestInfo.attach", CAT, {
    id: "test-info-attach",
    title: "testInfo.attach()",
    description:
      "Gắn tệp hoặc dữ liệu vào báo cáo test — ảnh, log, phản hồi API. Hiện ngay trong báo cáo HTML.",
    code: `test('có kèm ảnh khi hỏng', async ({ page }, testInfo) => {
  await page.goto('/');
  await testInfo.attach('man-hinh.png', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
});`,
    tags: ["report", "attachment", "screenshot", "debug"],
    related: ["test-info", "reporter-html", "page/screenshot"],
  }),

  entry("TestInfo.outputPath", CAT, {
    id: "test-info-output-path",
    title: "testInfo.outputPath()",
    description:
      "Đường dẫn tệp trong thư mục kết quả của riêng test này. Dùng để lưu tệp tạm mà không đụng test khác.",
    code: `test('lưu tệp riêng', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.screenshot({ path: testInfo.outputPath('trang.png') });
});`,
    tags: ["report", "path", "output", "artifacts"],
    related: ["test-info", "config/output-dir"],
  }),

  entry("TestInfo.annotations", CAT, {
    id: "annotations",
    description:
      "Ghi chú gắn vào test và hiện trong báo cáo — link tới issue, lý do bỏ qua.",
    code: `test('bug đã biết', async ({ page }, testInfo) => {
  testInfo.annotations.push({ type: 'issue', description: 'https://github.com/vidu/repo/issues/42' });
  await page.goto('/');
});`,
    tags: ["report", "annotation", "issue", "metadata"],
    related: ["test-info", "advanced/test-tag"],
  }),

  entry("Page.console", CAT, {
    id: "console-log",
    title: "Bắt log console khi debug",
    description: "Đẩy log của trang ra terminal để nhìn thấy trang đang báo gì.",
    code: `page.on('console', (msg) => console.log(\`[\${msg.type()}]\`, msg.text()));
await page.goto('/');`,
    tags: ["debug", "console", "log"],
    related: ["page/page-error", "frames-dialogs/console"],
  }),

  standalone(CAT, {
    id: "slow-mo",
    title: "slowMo",
    signature: "launchOptions: { slowMo: 500 }",
    description:
      "Làm chậm mọi thao tác lại vài trăm mili giây để mắt kịp nhìn. Chỉ dùng lúc debug tay.",
    code: `export default defineConfig({
  use: { launchOptions: { slowMo: 500 }, headless: false },
});`,
    tags: ["debug", "slowmo", "visual"],
    docsUrl: DOC_DEBUG,
    related: ["config/headless", "cli/test-headed"],
  }),

  standalone(CAT, {
    id: "vscode-extension",
    title: "Tiện ích VS Code",
    signature: "ms-playwright.playwright",
    description:
      "Chạy test, đặt breakpoint, chọn locator bằng chuột ngay trong VS Code. Cách debug tiện nhất nếu bạn đang dùng VS Code.",
    code: `# Cài từ Marketplace: "Playwright Test for VSCode"
# rồi bấm nút ▷ cạnh mỗi test`,
    codeLang: "bash",
    tags: ["debug", "vscode", "ide", "tooling"],
    docsUrl: "https://playwright.dev/docs/getting-started-vscode",
    related: ["ui-mode", "page-pause"],
  }),
];

export default debugReport;
