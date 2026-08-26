/**
 * Phase 3a — trang chi tiết một cú pháp. 322 trang, sinh sẵn lúc build.
 *
 * Đây là trang quan trọng nhất về mặt SEO: mỗi cú pháp một URL riêng, có
 * <title>/<meta> riêng, nội dung nằm sẵn trong HTML. Người vào từ Google đọc
 * được ngay, không chờ hydrate, không chờ tải index tìm kiếm.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { entries, getEntry } from "../../../data/index.ts";
import { getCategory } from "../../../lib/types.ts";
import { EntryCard } from "../../../components/EntryCard.tsx";

export const dynamicParams = false;

export function generateStaticParams() {
  return entries.map((e) => ({ category: e.category, id: e.id }));
}

export async function generateMetadata(props: PageProps<"/[category]/[id]">): Promise<Metadata> {
  const { category, id } = await props.params;
  const entry = getEntry(category, id);
  if (!entry) return {};

  const nhom = getCategory(entry.category);
  return {
    title: entry.title,
    // Mô tả tiếng Việt của entry chính là thứ Google nên hiện — nó trả lời
    // "khi nào dùng", đúng câu hỏi người ta gõ vào ô tìm kiếm.
    description: entry.description,
    keywords: [entry.title, ...entry.tags, "playwright", nhom?.name ?? ""].filter(Boolean),
    alternates: { canonical: `/${entry.category}/${entry.id}/` },
    openGraph: {
      type: "article",
      title: `${entry.title} — Playwright Cheatsheet`,
      description: entry.description,
    },
  };
}

export default async function TrangChiTiet(props: PageProps<"/[category]/[id]">) {
  const { category, id } = await props.params;
  const entry = getEntry(category, id);
  if (!entry) notFound();

  return (
    <div className="max-w-3xl">
      <EntryCard entry={entry} />
    </div>
  );
}
