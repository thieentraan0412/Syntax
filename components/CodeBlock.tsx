/**
 * Phase 3 — khối code đã tô màu, đóng khung như một cửa sổ terminal.
 *
 * Server Component: Shiki chạy lúc build, nhả HTML tĩnh. Thứ duy nhất còn cần
 * JS trong khối này là nút chép.
 */
import { highlightCode, type CodeLang } from "../lib/highlight.ts";
import { CopyButton } from "./CopyButton.tsx";

const TEN_NGON_NGU: Record<CodeLang, string> = {
  ts: "TypeScript",
  bash: "Terminal",
  html: "HTML",
};

/** Ba chấm kiểu cửa sổ macOS. Thuần trang trí, nên không có nhãn cho trình đọc màn hình. */
function BaCham() {
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1.5">
      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
    </span>
  );
}

export async function CodeBlock({
  code,
  lang,
  /**
   * Chữ trên thanh cửa sổ. Bỏ trống thì là tên ngôn ngữ; ví dụ lấy từ docs
   * truyền tên file thật vào đây (`playwright.config.ts`) — cùng một đoạn code,
   * để trong config hay trong file test là hai chuyện khác.
   */
  nhan,
  /** Bật phím tắt `C` cho khối này — chỉ dùng cho khối code chính của trang. */
  phimTat = false,
}: {
  code: string;
  lang: CodeLang;
  nhan?: string;
  phimTat?: boolean;
}) {
  const html = await highlightCode(code, lang);

  return (
    <figure className="border-border bg-code overflow-hidden rounded-2xl border shadow-[var(--shadow-lift)]">
      <figcaption className="border-border bg-code-bar flex items-center gap-3 border-b px-4 py-2.5">
        <BaCham />
        <span className="text-muted truncate font-mono text-xs tracking-wide">
          {nhan ?? TEN_NGON_NGU[lang]}
        </span>
        <span className="ml-auto">
          <CopyButton code={code.trim()} phimTat={phimTat} />
        </span>
      </figcaption>
      {/*
        An toàn: `html` do Shiki dựng từ `data/*.ts` của chính dự án — không có
        input người dùng ở đây, và Shiki tự escape nội dung code.
      */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}
