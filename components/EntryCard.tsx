/**
 * Phase 3 — hai cách trình bày một entry.
 *
 * `EntryCard`      — bản đầy đủ, dùng ở trang chi tiết.
 * `EntryListItem`  — bản gọn một dòng rưỡi, dùng ở trang liệt kê nhóm.
 *
 * Cả hai đều là Server Component: không state, không sự kiện, render xong là
 * đóng băng thành HTML.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { CodeBlock } from "./CodeBlock.tsx";
import { FavoriteButton } from "./FavoriteButton.tsx";
import { resolveRelated } from "../lib/entries.ts";
import { getCategory, hrefOf, type CheatEntry, type Example } from "../lib/types.ts";

export function SinceBadge({ since }: { since?: string }) {
  if (!since) return null;
  return (
    <span
      title={`Có từ Playwright ${since}`}
      className="border-border bg-surface-2 text-muted rounded-full border px-2 py-0.5 font-mono text-[11px]"
    >
      {since}
    </span>
  );
}

/**
 * Tiêu đề của một mục nhỏ trong trang: ô vuông gradient + chữ.
 *
 * Cùng một khuôn với tiêu đề trang nhóm, chỉ nhỏ hơn một cỡ — nhờ vậy nhìn vào
 * là biết ngay đâu là cấp trên đâu là cấp dưới mà không cần kẻ vạch.
 */
function TieuDeMuc({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2.5 text-sm font-semibold tracking-wider uppercase">
      <span className="tile flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
        {icon}
      </span>
      {children}
    </h2>
  );
}

function Icon({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {d.split("|").map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

/**
 * Một ví dụ dài. Ba thứ đi cùng nhau và thiếu cái nào cũng hụt:
 *
 *   - tiêu đề mục trong docs -> biết ví dụ này đang dạy gì
 *   - HTML minh hoạ (nếu có) -> biết locator đang trỏ vào cái gì
 *   - link về đúng mục nguồn -> đọc tiếp được, và kiểm chứng được
 */
function ViDu({ vd }: { vd: Example }) {
  return (
    <li className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-[15px] font-semibold">{vd.title}</h3>
        {vd.url && (
          <a
            href={vd.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-accent text-xs underline-offset-4 hover:underline"
          >
            {vd.source === "api" ? "docs API" : "docs"} ↗
          </a>
        )}
      </div>

      {vd.html && (
        <div className="flex flex-col gap-1.5">
          <span className="text-muted text-xs">HTML minh hoạ</span>
          <CodeBlock code={vd.html} lang="html" nhan="HTML" />
        </div>
      )}

      <CodeBlock code={vd.code} lang={vd.lang} nhan={vd.file} />
    </li>
  );
}

function ParamsTable({ params }: { params: NonNullable<CheatEntry["params"]> }) {
  return (
    // Bảng rộng hơn màn hình thì tự cuộn trong khung của nó, không đẩy cả trang
    // trượt ngang.
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-2 text-left">
            <th className="px-4 py-2.5 font-semibold">Tham số</th>
            <th className="px-4 py-2.5 font-semibold">Kiểu</th>
            <th className="px-4 py-2.5 font-semibold">Mô tả</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-border border-t align-top">
              <td className="px-4 py-2.5 whitespace-nowrap">
                <code className="text-accent font-mono text-[13px] font-medium">{p.name}</code>
                {!p.required && <span className="text-muted ml-1 text-xs">?</span>}
              </td>
              <td className="px-4 py-2.5">
                <code className="text-violet font-mono text-[13px]">{p.type}</code>
              </td>
              <td className="text-muted px-4 py-2.5">
                {/*
                  122/287 param trong dữ liệu chưa có mô tả (gần hết là
                  `options: Object`) — nguồn types.d.ts không mô tả chúng. Để ô
                  trống thì trông như bảng hỏng, nên hiện dấu gạch: "biết là
                  không có" khác với "không biết có gì".
                */}
                {p.description?.trim() ? p.description : <span aria-label="chưa có mô tả">—</span>}
                {p.default !== undefined && (
                  <>
                    {" "}
                    <span className="text-xs whitespace-nowrap">
                      (mặc định <code className="font-mono">{p.default}</code>)
                    </span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function EntryCard({ entry }: { entry: CheatEntry }) {
  const related = resolveRelated(entry);
  const nhom = getCategory(entry.category);

  return (
    <article className="flex flex-col gap-7">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${entry.category}/`}
            className="glass glass-hover text-muted hover:text-accent rounded-full px-3 py-1 text-xs font-medium transition-colors"
          >
            ← {nhom?.name ?? entry.category}
          </Link>
          <SinceBadge since={entry.since} />
          <span className="ml-auto">
            <FavoriteButton muc={{ c: entry.category, i: entry.id, t: entry.title }} />
          </span>
        </div>

        {/*
          `wrap-anywhere` chứ không phải `break-words`. Tiêu đề là định danh mono
          không có khoảng trắng — `locatorAssertions.toHaveAccessibleDescription()`
          là 47 ký tự, ~450px ở cỡ 24px. `break-words` chỉ cho phép xuống dòng
          lúc VẼ mà không hạ min-content, nên ô lưới / flex bọc ngoài vẫn nở ra
          theo chiều dài cả từ và đẩy nguyên TRANG trượt ngang trên điện thoại.
          `overflow-wrap: anywhere` hạ luôn min-content, nên chỗ nào cũng co được.
        */}
        <h1 className="font-mono text-2xl font-bold tracking-tight wrap-anywhere sm:text-[2rem]">
          {entry.title}
        </h1>

        <p className="text-muted max-w-2xl text-[15px] leading-relaxed">{entry.description}</p>
      </header>

      <div className="glass overflow-x-auto rounded-xl px-4 py-3">
        <code className="font-mono text-sm whitespace-pre">{entry.signature}</code>
      </div>

      {/* Khối code chính của trang -> nhận phím tắt `C`. */}
      <CodeBlock code={entry.code} lang={entry.codeLang} phimTat />

      {entry.note && (
        <aside className="glass note-accent flex gap-3 rounded-2xl px-4 py-3.5 text-sm leading-relaxed">
          <span className="tile-accent mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
            <Icon d="M12 8v5|M12 16.5h.01" className="h-4 w-4" />
          </span>
          <span>
            <strong className="font-semibold">Lưu ý — </strong>
            <span className="text-muted">{entry.note}</span>
          </span>
        </aside>
      )}

      {entry.examples && entry.examples.length > 0 && (
        <section className="flex flex-col gap-4">
          <TieuDeMuc icon={<Icon d="M4 6h16v12H4z|M8 10l-2 2 2 2|M14 10l2 2-2 2" />}>
            Ví dụ chi tiết
            {entry.examples.some((v) => v.source !== "tay") && (
              <span className="text-muted ml-1 font-normal normal-case">
                — từ docs chính thức, đã kiểm bằng <code className="font-mono">tsc</code>
              </span>
            )}
          </TieuDeMuc>
          <ul className="flex flex-col gap-6">
            {entry.examples.map((vd) => (
              <ViDu key={vd.code} vd={vd} />
            ))}
          </ul>
        </section>
      )}

      {entry.params && entry.params.length > 0 && (
        <section className="flex flex-col gap-3">
          <TieuDeMuc icon={<Icon d="M4 6h9|M4 12h4|M4 18h9|M20 6h-2|M20 12h-8|M20 18h-2" />}>
            Tham số
          </TieuDeMuc>
          <ParamsTable params={entry.params} />
        </section>
      )}

      {entry.returns && (
        <section className="flex flex-col gap-3">
          <TieuDeMuc icon={<Icon d="M4 12h14|m13 6 6 6-6 6" />}>Trả về</TieuDeMuc>
          <div className="glass overflow-x-auto rounded-xl px-4 py-3">
            <code className="text-violet font-mono text-sm whitespace-pre">{entry.returns}</code>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="flex flex-col gap-3">
          <TieuDeMuc
            icon={
              <Icon d="M10 13a4 4 0 0 0 5.7.4l2.3-2.3a4 4 0 0 0-5.7-5.7l-1 1|M14 11a4 4 0 0 0-5.7-.4L6 12.9a4 4 0 0 0 5.7 5.7l1-1" />
            }
          >
            Liên quan
          </TieuDeMuc>
          <ul className="flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={`${r.category}/${r.id}`}>
                <Link
                  href={hrefOf(r)}
                  className="glass glass-hover hover:text-accent inline-block rounded-xl px-3 py-1.5 font-mono text-[13px] wrap-anywhere"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-border flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-5 text-sm">
        <a
          href={entry.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-accent font-medium underline-offset-4 hover:underline"
        >
          Docs chính thức ↗
        </a>
        <span className="flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="border-border bg-surface-2 text-muted rounded-full border px-2.5 py-0.5 text-xs"
            >
              {t}
            </span>
          ))}
        </span>
      </footer>
    </article>
  );
}

export function EntryListItem({ entry }: { entry: CheatEntry }) {
  return (
    <li>
      <Link
        href={hrefOf(entry)}
        className="glass glass-hover group flex h-full flex-col gap-1.5 rounded-2xl px-4 py-3.5"
      >
        <span className="flex flex-wrap items-center gap-2">
          <code className="group-hover:text-accent font-mono text-[15px] font-semibold wrap-anywhere transition-colors">
            {entry.title}
          </code>
          <SinceBadge since={entry.since} />
        </span>
        <span className="text-muted line-clamp-2 text-sm leading-relaxed">{entry.description}</span>
      </Link>
    </li>
  );
}
