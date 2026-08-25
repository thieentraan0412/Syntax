/**
 * Nhóm 1 — CLI & Cài đặt.
 *
 * Đây là nhóm duy nhất gần như không map được vào types.d.ts: lệnh dòng lệnh
 * không phải API TypeScript. Nên hầu hết dùng standalone() và tự khai docsUrl.
 */
import { standalone } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "cli" as const;
const DOC_CLI = "https://playwright.dev/docs/test-cli";
const DOC_INTRO = "https://playwright.dev/docs/intro";

export const cli: CheatEntry[] = [
  standalone(CAT, {
    id: "init",
    title: "npm init playwright@latest",
    signature: "npm init playwright@latest",
    description:
      "Tạo dự án Playwright mới: sinh playwright.config.ts, thư mục tests, workflow GitHub Actions và tải sẵn browser.",
    code: `npm init playwright@latest`,
    codeLang: "bash",
    tags: ["cli", "cài đặt", "khởi tạo", "init", "setup"],
    docsUrl: DOC_INTRO,
    related: ["install-browsers", "config/test-dir"],
  }),

  standalone(CAT, {
    id: "install-browsers",
    title: "npx playwright install",
    signature: "npx playwright install [browser...] [--with-deps]",
    description:
      "Tải bản browser mà Playwright dùng. Chạy lại mỗi lần nâng cấp Playwright vì mỗi bản ghim một bản browser riêng.",
    code: `npx playwright install
npx playwright install chromium
npx playwright install --with-deps`,
    codeLang: "bash",
    tags: ["cli", "cài đặt", "browser", "install", "ci"],
    docsUrl: "https://playwright.dev/docs/browsers",
    related: ["init"],
    note: "Trên CI Linux phải thêm `--with-deps` để cài kèm thư viện hệ thống, không thì browser không khởi động được.",
  }),

  standalone(CAT, {
    id: "test",
    title: "npx playwright test",
    signature: "npx playwright test [file|thư mục] [tuỳ chọn]",
    description: "Chạy toàn bộ test. Mặc định chạy headless và song song nhiều worker.",
    code: `npx playwright test
npx playwright test tests/dang-nhap.spec.ts
npx playwright test tests/gio-hang/`,
    codeLang: "bash",
    tags: ["cli", "test", "chạy", "run"],
    docsUrl: DOC_CLI,
    related: ["test-headed", "test-ui", "test-grep", "test-project"],
  }),

  standalone(CAT, {
    id: "test-ui",
    title: "npx playwright test --ui",
    signature: "npx playwright test --ui",
    description:
      "Mở UI mode: xem test chạy từng bước, tua đi tua lại, sửa code là chạy lại ngay. Cách debug tốt nhất trong lúc viết test.",
    code: `npx playwright test --ui`,
    codeLang: "bash",
    tags: ["cli", "ui", "debug", "watch"],
    docsUrl: "https://playwright.dev/docs/test-ui-mode",
    related: ["test-debug", "debug-report/trace-viewer"],
  }),

  standalone(CAT, {
    id: "test-debug",
    title: "npx playwright test --debug",
    signature: "npx playwright test --debug",
    description:
      "Chạy từng bước một với Playwright Inspector mở sẵn. Tự đặt workers = 1 và tắt timeout.",
    code: `npx playwright test --debug
npx playwright test tests/dang-nhap.spec.ts:12 --debug`,
    codeLang: "bash",
    tags: ["cli", "debug", "inspector", "step"],
    docsUrl: "https://playwright.dev/docs/debug",
    related: ["test-ui", "debug-report/page-pause", "debug-report/pwdebug"],
  }),

  standalone(CAT, {
    id: "test-headed",
    title: "npx playwright test --headed",
    signature: "npx playwright test --headed",
    description: "Chạy test với cửa sổ browser hiện lên để nhìn thấy chuyện gì đang xảy ra.",
    code: `npx playwright test --headed`,
    codeLang: "bash",
    tags: ["cli", "headed", "debug", "visual"],
    docsUrl: DOC_CLI,
    related: ["test-debug", "config/headless"],
  }),

  standalone(CAT, {
    id: "test-project",
    title: "npx playwright test --project",
    signature: "npx playwright test --project=<tên>",
    description:
      "Chỉ chạy một project trong config — thường dùng để chạy riêng một trình duyệt.",
    code: `npx playwright test --project=chromium
npx playwright test --project=chromium --project=firefox`,
    codeLang: "bash",
    tags: ["cli", "project", "browser", "filter"],
    docsUrl: DOC_CLI,
    related: ["config/projects", "auth-state/setup-project"],
  }),

  standalone(CAT, {
    id: "test-grep",
    title: "npx playwright test --grep",
    signature: "npx playwright test --grep <regex> | --grep-invert <regex>",
    description:
      "Chỉ chạy test có tiêu đề khớp biểu thức. Đây cũng là cách chạy theo tag `@smoke`.",
    code: `npx playwright test --grep @smoke
npx playwright test --grep-invert @cham`,
    codeLang: "bash",
    tags: ["cli", "filter", "grep", "tag"],
    docsUrl: DOC_CLI,
    related: ["advanced/test-tag", "config/grep"],
  }),

  standalone(CAT, {
    id: "test-repeat-each",
    title: "npx playwright test --repeat-each",
    signature: "npx playwright test --repeat-each=<số>",
    description:
      "Chạy mỗi test nhiều lần liên tiếp. Cách nhanh nhất để bắt test chập chờn.",
    code: `npx playwright test tests/gio-hang.spec.ts --repeat-each=20`,
    codeLang: "bash",
    tags: ["cli", "flaky", "repeat", "stability"],
    docsUrl: DOC_CLI,
    related: ["test-retries", "config/retries"],
  }),

  standalone(CAT, {
    id: "test-retries",
    title: "npx playwright test --retries",
    signature: "npx playwright test --retries=<số>",
    description: "Chạy lại test thất bại tối đa n lần, ghi đè giá trị trong config.",
    code: `npx playwright test --retries=2`,
    codeLang: "bash",
    tags: ["cli", "retry", "ci", "flaky"],
    docsUrl: DOC_CLI,
    related: ["config/retries", "test-repeat-each"],
  }),

  standalone(CAT, {
    id: "test-workers",
    title: "npx playwright test --workers",
    signature: "npx playwright test --workers=<số|%>",
    description:
      "Đặt số tiến trình chạy song song. Để `--workers=1` khi cần chạy tuần tự để debug.",
    code: `npx playwright test --workers=1
npx playwright test --workers=50%`,
    codeLang: "bash",
    tags: ["cli", "parallel", "workers", "performance"],
    docsUrl: DOC_CLI,
    related: ["config/workers", "config/fully-parallel"],
  }),

  standalone(CAT, {
    id: "test-reporter",
    title: "npx playwright test --reporter",
    signature: "npx playwright test --reporter=<list|line|dot|html|json|junit|blob>",
    description: "Chọn kiểu báo cáo cho lần chạy này, ghi đè config.",
    code: `npx playwright test --reporter=list
npx playwright test --reporter=html,github`,
    codeLang: "bash",
    tags: ["cli", "reporter", "report", "ci"],
    docsUrl: "https://playwright.dev/docs/test-reporters",
    related: ["show-report", "config/reporter"],
  }),

  standalone(CAT, {
    id: "test-last-failed",
    title: "npx playwright test --last-failed",
    signature: "npx playwright test --last-failed",
    description:
      "Chỉ chạy lại những test thất bại ở lần chạy trước. Tiết kiệm rất nhiều thời gian khi đang sửa lỗi.",
    code: `npx playwright test --last-failed`,
    codeLang: "bash",
    tags: ["cli", "rerun", "failed", "productivity"],
    docsUrl: DOC_CLI,
    related: ["test", "test-retries"],
  }),

  standalone(CAT, {
    id: "test-update-snapshots",
    title: "npx playwright test --update-snapshots",
    signature: "npx playwright test --update-snapshots[=all|changed|missing|none]",
    description: "Ghi đè ảnh chuẩn khi giao diện đã đổi có chủ đích.",
    code: `npx playwright test --update-snapshots
npx playwright test --update-snapshots=missing`,
    codeLang: "bash",
    tags: ["cli", "snapshot", "visual", "screenshot"],
    docsUrl: "https://playwright.dev/docs/test-snapshots",
    related: ["visual-testing/to-have-screenshot", "config/update-snapshots"],
    note: "Xem kỹ ảnh mới trước khi commit — lệnh này chấp nhận mọi khác biệt, kể cả lỗi thật.",
  }),

  standalone(CAT, {
    id: "codegen",
    title: "npx playwright codegen",
    signature: "npx playwright codegen [url] [--device] [--save-storage]",
    description:
      "Mở browser và sinh code test theo thao tác của bạn. Cách nhanh nhất để có bộ khung ban đầu.",
    code: `npx playwright codegen https://vidu.vn
npx playwright codegen --device="iPhone 15" https://vidu.vn
npx playwright codegen --save-storage=auth.json https://vidu.vn`,
    codeLang: "bash",
    tags: ["cli", "codegen", "record", "generate"],
    docsUrl: "https://playwright.dev/docs/codegen",
    related: ["auth-state/storage-state", "locators/get-by-role"],
    note: "Code sinh ra là bản nháp. Thường nên sửa lại locator cho gọn và thêm assertion trước khi commit.",
  }),

  standalone(CAT, {
    id: "show-report",
    title: "npx playwright show-report",
    signature: "npx playwright show-report [thư-mục]",
    description: "Mở báo cáo HTML của lần chạy gần nhất trong browser.",
    code: `npx playwright show-report`,
    codeLang: "bash",
    tags: ["cli", "report", "html"],
    docsUrl: "https://playwright.dev/docs/test-reporters",
    related: ["test-reporter", "debug-report/reporter-html"],
  }),

  standalone(CAT, {
    id: "show-trace",
    title: "npx playwright show-trace",
    signature: "npx playwright show-trace <trace.zip>",
    description:
      "Mở Trace Viewer để xem lại toàn bộ lần chạy: từng bước, ảnh chụp DOM, network, console.",
    code: `npx playwright show-trace test-results/dang-nhap/trace.zip`,
    codeLang: "bash",
    tags: ["cli", "trace", "debug", "report"],
    docsUrl: "https://playwright.dev/docs/trace-viewer",
    related: ["debug-report/trace-viewer", "config/trace"],
  }),

  standalone(CAT, {
    id: "merge-reports",
    title: "npx playwright merge-reports",
    signature: "npx playwright merge-reports <thư-mục-blob> --reporter=html",
    description:
      "Gộp nhiều báo cáo blob từ các shard CI khác nhau thành một báo cáo HTML duy nhất.",
    code: `npx playwright merge-reports ./all-blob-reports --reporter=html`,
    codeLang: "bash",
    tags: ["cli", "ci", "shard", "report", "merge"],
    docsUrl: "https://playwright.dev/docs/test-sharding",
    related: ["test-shard", "debug-report/reporter-blob"],
  }),

  standalone(CAT, {
    id: "test-shard",
    title: "npx playwright test --shard",
    signature: "npx playwright test --shard=<n>/<tổng>",
    description: "Chia test ra nhiều máy CI chạy song song.",
    code: `npx playwright test --shard=1/4`,
    codeLang: "bash",
    tags: ["cli", "ci", "shard", "parallel"],
    docsUrl: "https://playwright.dev/docs/test-sharding",
    related: ["merge-reports", "config/shard"],
  }),

  standalone(CAT, {
    id: "test-list",
    title: "npx playwright test --list",
    signature: "npx playwright test --list",
    description: "Liệt kê test sẽ chạy mà không chạy thật. Dùng để kiểm tra bộ lọc có đúng không.",
    code: `npx playwright test --list --grep @smoke`,
    codeLang: "bash",
    tags: ["cli", "list", "dry-run", "filter"],
    docsUrl: DOC_CLI,
    related: ["test-grep"],
  }),
];

export default cli;
