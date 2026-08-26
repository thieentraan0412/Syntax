/**
 * Phase 3 — những phép tra cứu mà riêng tầng giao diện cần.
 *
 * KHÔNG bọc lại `getEntry` / `getEntriesByCategory` / `countByCategory` —
 * `data/index.ts` đã có sẵn và đó là nguồn sự thật duy nhất. File này chỉ chứa
 * thứ `data/index.ts` chưa có, cụ thể là gỡ chuỗi `related` thành entry thật và
 * dựng danh sách nhóm theo đúng thứ tự trình bày.
 */
import { entries } from "../data/index.ts";
import { CATEGORIES, type CategoryInfo, type CheatEntry } from "./types.ts";

/** 15 nhóm theo đúng thứ tự ở mục 7 — dùng cho sidebar, trang chủ, sitemap. */
export function categoriesInOrder(): readonly CategoryInfo[] {
  return [...CATEGORIES].sort((a, b) => a.order - b.order);
}

/**
 * `related` viết hai kiểu: `'category/id'` khi trỏ sang nhóm khác, `'id'` khi
 * cùng nhóm. Hàm này gỡ cả hai về entry thật.
 *
 * Link hụt thì **bỏ qua chứ không ném lỗi** — `scripts/validate-data.ts` đã
 * chặn từ trước, nên tới đây mà hụt thì cũng không đáng làm sập cả trang build.
 */
export function resolveRelated(entry: CheatEntry): CheatEntry[] {
  const out: CheatEntry[] = [];
  for (const ref of entry.related ?? []) {
    const [a, b] = ref.includes("/") ? ref.split("/") : [entry.category, ref];
    const found = entries.find((e) => e.category === a && e.id === b);
    if (found) out.push(found);
  }
  return out;
}
