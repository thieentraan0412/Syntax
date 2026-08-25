/**
 * Schema dữ liệu cheatsheet — mục 5 của implement.md.
 *
 * Nguyên tắc: phần chính xác (signature, params, since) do script sinh từ
 * types.d.ts + docs/src/api; phần chọn lọc & giải thích (description tiếng Việt,
 * category, tags, related, note best-practice) do người viết tay.
 */

/** 15 nhóm ở mục 7. Slug cũng chính là route segment: /locators/get-by-role */
export const CATEGORIES = [
  {
    slug: "cli",
    order: 1,
    name: "CLI & Cài đặt",
    description: "Lệnh dòng lệnh: cài browser, chạy test, codegen, xem report.",
  },
  {
    slug: "test-structure",
    order: 2,
    name: "Cấu trúc test",
    description: "Khai báo test, nhóm test, hook trước/sau, bỏ qua và đánh dấu.",
  },
  {
    slug: "fixtures",
    order: 3,
    name: "Fixtures",
    description: "Fixture có sẵn (page, context, request) và cách tự viết fixture.",
  },
  {
    slug: "locators",
    order: 4,
    name: "Locators",
    description: "Cách trỏ tới phần tử trên trang — nền tảng của mọi test Playwright.",
  },
  {
    slug: "actions",
    order: 5,
    name: "Actions",
    description: "Tương tác với phần tử: click, gõ chữ, chọn, kéo thả, upload file.",
  },
  {
    slug: "assertions",
    order: 6,
    name: "Assertions",
    description: "Kiểm tra kết quả với expect() — tự động chờ (auto-retry) tới khi đúng.",
  },
  {
    slug: "page",
    order: 7,
    name: "Page & Navigation",
    description: "Điều hướng, chờ trạng thái trang, chạy JS, chụp màn hình, xuất PDF.",
  },
  {
    slug: "browser-context",
    order: 8,
    name: "Browser & Context",
    description: "Khởi chạy browser, tạo context cách ly, cookie, quyền, video, trace.",
  },
  {
    slug: "network",
    order: 9,
    name: "Network",
    description: "Chặn và giả lập request, chờ response, gọi API trực tiếp, HAR.",
  },
  {
    slug: "frames-dialogs",
    order: 10,
    name: "Frames & Dialogs",
    description: "Làm việc với iframe, popup, hộp thoại alert/confirm, download.",
  },
  {
    slug: "auth-state",
    order: 11,
    name: "Auth & State",
    description: "Đăng nhập một lần rồi tái dùng session cho mọi test.",
  },
  {
    slug: "config",
    order: 12,
    name: "Config",
    description: "playwright.config.ts: timeout, retries, workers, projects, webServer.",
  },
  {
    slug: "debug-report",
    order: 13,
    name: "Debug & Report",
    description: "Trace viewer, UI mode, pause, biến môi trường debug, các reporter.",
  },
  {
    slug: "visual-testing",
    order: 14,
    name: "Visual testing",
    description: "So sánh ảnh chụp màn hình, ngưỡng khác biệt, che vùng động.",
  },
  {
    slug: "advanced",
    order: 15,
    name: "Nâng cao",
    description: "Gộp fixture, custom matcher, data-driven, tag, Page Object Model.",
  },
] as const;

export type Category = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS: readonly Category[] = CATEGORIES.map((c) => c.slug);

export type CategoryInfo = (typeof CATEGORIES)[number];

export function getCategory(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function isCategory(slug: string): slug is Category {
  return CATEGORIES.some((c) => c.slug === slug);
}

/** Một tham số của hàm/lệnh. */
export type Param = {
  name: string;
  type: string;
  required: boolean;
  /** Mô tả tiếng Việt. Giữ nguyên tên biến / giá trị bằng tiếng Anh. */
  description: string;
  /** Giá trị mặc định nếu có, viết đúng như trong docs (vd: `0`, `'load'`). */
  default?: string;
};

/** Một mục cheatsheet = một trang SSG. */
export type CheatEntry = {
  /** kebab-case, duy nhất TRONG category, an toàn cho URL. -> /locators/get-by-role */
  id: string;
  /** Tên hiển thị, vd 'page.getByRole()'. */
  title: string;
  category: Category;
  /** Chữ ký gốc, vd 'getByRole(role, options?): Locator'. */
  signature: string;
  /** Mô tả tiếng Việt, 1–2 câu, trả lời "khi nào dùng". */
  description: string;
  /** Ví dụ chạy được. Với `codeLang: 'ts'` thì phải qua được `tsc --noEmit`. */
  code: string;
  /**
   * Ngôn ngữ của `code` — quyết định cách Shiki tô màu, và quyết định
   * scripts/typecheck-samples.ts có kiểm đoạn này không.
   * Mặc định 'ts'. Nhóm CLI dùng 'bash'.
   */
  codeLang: "ts" | "bash";
  params?: Param[];
  returns?: string;
  /** Phiên bản Playwright bắt đầu có API này, vd 'v1.34'. */
  since?: string;
  tags: string[];
  /** Link docs chính thức, phải tồn tại trong playwright.dev/sitemap.xml. */
  docsUrl: string;
  /** id của entry liên quan. Dạng 'category/id' nếu khác nhóm, hoặc 'id' nếu cùng nhóm. */
  related?: string[];
  /** Cảnh báo, deprecated, hoặc best practice. */
  note?: string;
};

/** Metadata dataset — bắt buộc, để biết cheatsheet lệch bao nhiêu so với bản mới. */
export type DataMeta = {
  /** vd 'playwright-core@1.62.1' */
  generatedFrom: string;
  /** ISO date */
  generatedAt: string;
};

/** Bản rút gọn ship xuống client cho search — mục 3.2, ~15.5 KB brotli. */
export type SearchIndexEntry = Pick<
  CheatEntry,
  "id" | "title" | "signature" | "description" | "tags" | "category"
>;

export type SearchIndex = {
  meta: DataMeta;
  entries: SearchIndexEntry[];
};
