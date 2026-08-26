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
import { CodeBlock } from "./CodeBlock.tsx";
import { FavoriteButton } from "./FavoriteButton.tsx";
import { resolveRelated } from "../lib/entries.ts";
import { getCategory, hrefOf, type CheatEntry } from "../lib/types.ts";

export function SinceBadge({ since }: { since?: string }) {
  if (!since) return null;
  return (
    <span
      title={`Có từ Playwright ${since}`}
      className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-muted"
    >
      {since}
    </span>
  );
}

function ParamsTable({ params }: { params: NonNullable<CheatEntry["params"]> }) {
  return (
    // Bảng rộng hơn màn hình thì tự cuộn trong khung của nó, không đẩy cả trang
    // trượt ngang.
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface text-left">
            <th className="px-3 py-2 font-medium">Tham số</th>
            <th className="px-3 py-2 font-medium">Kiểu</th>
            <th className="px-3 py-2 font-medium">Mô tả</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-t border-border align-top">
              <td className="whitespace-nowrap px-3 py-2">
                <code className="font-mono text-[13px] text-accent">{p.name}</code>
                {!p.required && <span className="ml-1 text-xs text-muted">?</span>}
              </td>
              <td className="px-3 py-2">
                <code className="font-mono text-[13px] text-muted">{p.type}</code>
              </td>
              <td className="px-3 py-2 text-muted">
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
                    <span className="whitespace-nowrap text-xs">
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
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${entry.category}/`}
            className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline"
          >
            {nhom?.name ?? entry.category}
          </Link>
          <SinceBadge since={entry.since} />
          <span className="ml-auto">
            <FavoriteButton muc={{ c: entry.category, i: entry.id, t: entry.title }} />
          </span>
        </div>

        <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-3xl">
          {entry.title}
        </h1>

        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">{entry.description}</p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface px-4 py-3">
        <code className="whitespace-pre font-mono text-sm">{entry.signature}</code>
      </div>

      {/* Khối code chính của trang -> nhận phím tắt `C`. */}
      <CodeBlock code={entry.code} lang={entry.codeLang} phimTat />

      {entry.note && (
        <aside className="rounded-xl border-l-4 border-accent bg-surface px-4 py-3 text-sm leading-relaxed">
          <strong className="font-medium">Lưu ý — </strong>
          <span className="text-muted">{entry.note}</span>
        </aside>
      )}

      {entry.params && entry.params.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Tham số</h2>
          <ParamsTable params={entry.params} />
        </section>
      )}

      {entry.returns && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Trả về</h2>
          <code className="font-mono text-sm">{entry.returns}</code>
        </section>
      )}

      {related.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Liên quan</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={`${r.category}/${r.id}`}>
                <Link
                  href={hrefOf(r)}
                  className="inline-block rounded-lg border border-border px-3 py-1.5 font-mono text-[13px] transition-colors hover:border-accent hover:text-accent"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm">
        <a
          href={entry.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline-offset-4 hover:underline"
        >
          Docs chính thức ↗
        </a>
        <span className="flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
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
        className="group flex flex-col gap-1.5 rounded-xl border border-border px-4 py-3 transition-colors hover:border-accent hover:bg-surface"
      >
        <span className="flex flex-wrap items-center gap-2">
          <code className="font-mono text-[15px] font-medium group-hover:text-accent">
            {entry.title}
          </code>
          <SinceBadge since={entry.since} />
        </span>
        <span className="line-clamp-2 text-sm leading-relaxed text-muted">{entry.description}</span>
      </Link>
    </li>
  );
}
