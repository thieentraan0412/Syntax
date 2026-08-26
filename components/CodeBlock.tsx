/**
 * Phase 3 — khối code đã tô màu.
 *
 * Server Component: Shiki chạy lúc build, nhả HTML tĩnh. Thứ duy nhất còn cần
 * JS trong khối này là nút chép.
 */
import { highlightCode, type CodeLang } from "../lib/highlight.ts";
import { CopyButton } from "./CopyButton.tsx";

const TEN_NGON_NGU: Record<CodeLang, string> = {
  ts: "TypeScript",
  bash: "Terminal",
};

export async function CodeBlock({
  code,
  lang,
  /** Bật phím tắt `C` cho khối này — chỉ dùng cho khối code chính của trang. */
  phimTat = false,
}: {
  code: string;
  lang: CodeLang;
  phimTat?: boolean;
}) {
  const html = await highlightCode(code, lang);

  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-surface">
      <figcaption className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
          {TEN_NGON_NGU[lang]}
        </span>
        <CopyButton code={code.trim()} phimTat={phimTat} />
      </figcaption>
      {/*
        An toàn: `html` do Shiki dựng từ `data/*.ts` của chính dự án — không có
        input người dùng ở đây, và Shiki tự escape nội dung code.
      */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}
