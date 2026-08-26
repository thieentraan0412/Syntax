/**
 * Phase 3a — trang liệt kê một nhóm. 15 trang, sinh sẵn lúc build.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEntriesByCategory } from "../../data/index.ts";
import { categoriesInOrder } from "../../lib/entries.ts";
import { getCategory, isCategory, type CheatEntry } from "../../lib/types.ts";
import { EntryListItem } from "../../components/EntryCard.tsx";
import { CopyAllButton } from "../../components/CopyAllButton.tsx";

/**
 * `false` = chỉ đúng 15 slug dưới đây tồn tại, vào slug lạ thì 404 ngay lúc
 * build. `output: 'export'` cũng không cho phép `true` — không có server nào
 * để dựng trang theo yêu cầu.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return categoriesInOrder().map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/[category]">): Promise<Metadata> {
  const { category } = await props.params;
  const nhom = getCategory(category);
  if (!nhom) return {};

  const soLuong = isCategory(category) ? getEntriesByCategory(category).length : 0;
  return {
    title: nhom.name,
    description: `${nhom.description} ${soLuong} cú pháp Playwright, có ví dụ chạy được.`,
    alternates: { canonical: `/${nhom.slug}/` },
  };
}

/**
 * Ghép code của cả nhóm thành một khối chép được.
 *
 * Ghép ở đây (Server Component, lúc build) chứ không ở client: `code` đầy đủ chỉ
 * có trong `data/*.ts`, không nằm trong `search-index.json` gửi xuống trình duyệt.
 *
 * Dấu chú thích theo đúng ngôn ngữ của từng đoạn — nhóm CLI là lệnh shell, dán
 * `//` vào đó là dán luôn một dòng lỗi.
 */
function ghepCode(danhSach: CheatEntry[]): string {
  return danhSach
    .map((e) => {
      const dau = e.codeLang === "bash" ? "#" : "//";
      return `${dau} ${e.title} — ${e.description}\n${dau} ${e.docsUrl}\n${e.code.trim()}`;
    })
    .join("\n\n");
}

export default async function TrangNhom(props: PageProps<"/[category]">) {
  const { category } = await props.params;
  if (!isCategory(category)) notFound();

  const nhom = getCategory(category);
  const danhSach = getEntriesByCategory(category);
  if (!nhom) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{nhom.name}</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">{nhom.description}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">{danhSach.length} mục</span>
          <CopyAllButton noiDung={ghepCode(danhSach)} soMuc={danhSach.length} />
        </div>
      </header>

      <ul className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
        {danhSach.map((e) => (
          <EntryListItem key={e.id} entry={e} />
        ))}
      </ul>
    </div>
  );
}
