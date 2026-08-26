/**
 * Phase 3 — tô màu code bằng Shiki, chạy HOÀN TOÀN lúc build.
 *
 * Đây là lý do trang chi tiết không cần một byte JS nào: Shiki chạy trong
 * Server Component, nhả ra HTML đã tô màu sẵn, rồi `output: 'export'` đóng băng
 * thành file tĩnh. Trình duyệt chỉ việc hiển thị.
 *
 * File này KHÔNG được import từ Client Component — Shiki nặng vài MB, kéo vào
 * bundle client là hỏng toàn bộ ngân sách ở mục 3.2.
 */
import { createHighlighter, type Highlighter } from "shiki";

/** Chỉ nạp đúng thứ cần. Bundle đầy đủ của Shiki có ~200 ngôn ngữ, dùng 2. */
const LANGS = ["typescript", "bash"] as const;

/**
 * Hai theme cùng lúc: Shiki nhả ra CSS variable `--shiki-light` /`--shiki-dark`
 * cho từng token, `globals.css` chọn cái nào tuỳ `data-theme`. Nhờ vậy đổi
 * sáng/tối không phải tô màu lại — và cũng không cần JS để tô.
 */
export const THEMES = { light: "github-light", dark: "github-dark" } as const;

/**
 * Một highlighter dùng chung cho cả 322 trang.
 *
 * Giữ ở module scope: `createHighlighter` mất ~300ms vì phải nạp grammar, gọi
 * lại 322 lần thì build đội thêm cả phút. Giữ Promise chứ không giữ instance
 * để nhiều trang build song song cùng chờ đúng một lượt khởi tạo.
 */
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [THEMES.light, THEMES.dark],
    langs: [...LANGS],
  });
  return highlighterPromise;
}

export type CodeLang = "ts" | "bash";

/** `codeLang` trong dữ liệu -> tên ngôn ngữ Shiki hiểu. */
const LANG_MAP: Record<CodeLang, (typeof LANGS)[number]> = {
  ts: "typescript",
  bash: "bash",
};

/**
 * Trả về HTML đã tô màu. Chuỗi này đi thẳng vào `dangerouslySetInnerHTML`.
 *
 * An toàn vì nguồn vào là `data/*.ts` do chính dự án viết, không phải input của
 * người dùng — và Shiki tự escape nội dung code khi dựng HTML.
 */
export async function highlightCode(code: string, lang: CodeLang): Promise<string> {
  const shiki = await getHighlighter();
  return shiki.codeToHtml(code.trim(), {
    lang: LANG_MAP[lang],
    themes: THEMES,
    // Bỏ inline background của theme: nền do `globals.css` quyết để khớp khung.
    defaultColor: false,
  });
}
