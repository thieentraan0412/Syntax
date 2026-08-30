/**
 * Phase 2 — tầng tìm kiếm.
 *
 * Chạy hoàn toàn ở client, không có backend. 322 entry nằm gọn trong RAM nên
 * mỗi lần gõ là tìm lại toàn bộ — không cần debounce vì lý do hiệu năng, chỉ
 * debounce để tránh giật khi gõ nhanh.
 *
 * File này KHÔNG import React và KHÔNG chạm tới DOM, để benchmark được bằng
 * Node thuần (scripts/benchmark-search.ts).
 */
import Fuse, { type IFuseOptions, type FuseResult, type FuseResultMatch } from "fuse.js";
import { hrefOf, type SearchIndex, type SearchIndexEntry, type Category } from "./types.ts";

/**
 * Trọng số theo mục 8 kế hoạch. Ý đồ: người ta gõ TÊN HÀM là chính
 * (`getByRole`, `toBeVisible`), nên `title` phải áp đảo. `description` tiếng
 * Việt để nhẹ nhất — nó dài, dễ khớp bừa, và không phải thứ người ta gõ.
 */
export const WEIGHTS = {
  title: 0.5,
  tags: 0.2,
  signature: 0.15,
  description: 0.1,
} as const;

export const FUSE_OPTIONS: IFuseOptions<SearchIndexEntry> = {
  keys: [
    { name: "title", weight: WEIGHTS.title },
    { name: "tags", weight: WEIGHTS.tags },
    { name: "signature", weight: WEIGHTS.signature },
    { name: "description", weight: WEIGHTS.description },
  ],
  /**
   * 0 = khớp tuyệt đối, 1 = khớp gì cũng được. 0.35 là chỗ `locater` vẫn ra
   * `locator` mà không kéo theo cả đống thứ không liên quan.
   */
  threshold: 0.35,
  /** Cần vị trí khớp để tô sáng trong kết quả. */
  includeMatches: true,
  includeScore: true,
  /** Không phạt khoảng cách: `toHaveScreenshot` khớp `screenshot` ở cuối chuỗi. */
  ignoreLocation: true,
  /** Gõ 1 ký tự thì kết quả vô nghĩa; 2 ký tự trở lên mới tìm. */
  minMatchCharLength: 2,
  /** Sắp theo điểm — kết hợp trọng số ở trên. */
  shouldSort: true,
};

export type SearchHit = {
  entry: SearchIndexEntry;
  /** 0 = khớp hoàn hảo. */
  score: number;
  /** Vị trí ký tự khớp, để tô sáng. */
  matches: readonly FuseResultMatch[];
  /** URL trang chi tiết. */
  href: string;
};

// hrefOf sống ở lib/types.ts (không phụ thuộc Fuse). Re-export để chỗ gọi cũ
// và scripts/check-search.ts không phải đổi import.
export { hrefOf };

/** Bọc Fuse lại để chỗ gọi không phải biết Fuse, và để thay engine sau này dễ. */
export class SearchEngine {
  private readonly fuse: Fuse<SearchIndexEntry>;
  readonly entries: readonly SearchIndexEntry[];

  constructor(entries: readonly SearchIndexEntry[]) {
    this.entries = entries;
    this.fuse = new Fuse([...entries], FUSE_OPTIONS);
  }

  static fromIndex(index: SearchIndex): SearchEngine {
    return new SearchEngine(index.entries);
  }

  /**
   * `category` lọc SAU khi tìm chứ không phải trước: giữ nguyên thứ hạng của
   * Fuse trên toàn bộ tập, nên kết quả không nhảy lung tung khi đổi bộ lọc.
   */
  search(query: string, options?: { limit?: number; category?: Category | null }): SearchHit[] {
    const q = query.trim();
    if (q.length < FUSE_OPTIONS.minMatchCharLength!) return [];

    const raw: FuseResult<SearchIndexEntry>[] = this.fuse.search(q);
    const limit = options?.limit ?? 50;
    const hits: SearchHit[] = [];

    for (const r of raw) {
      if (options?.category && r.item.category !== options.category) continue;
      hits.push({
        entry: r.item,
        score: r.score ?? 1,
        matches: r.matches ?? [],
        href: hrefOf(r.item),
      });
      if (hits.length >= limit) break;
    }
    return hits;
  }

  /** Đếm kết quả theo nhóm — để hiện số bên cạnh mỗi bộ lọc. */
  countByCategory(query: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const hit of this.search(query, { limit: Number.MAX_SAFE_INTEGER })) {
      out[hit.entry.category] = (out[hit.entry.category] ?? 0) + 1;
    }
    return out;
  }

  /**
   * Khi không có kết quả nào: nới threshold ra rồi tìm lại, lấy 3 cái gần nhất
   * làm gợi ý "Ý bạn là…". Chỉ gợi ý khi thật sự gần, không thì im lặng còn hơn
   * gợi ý bừa.
   */
  suggest(query: string, limit = 3): SearchIndexEntry[] {
    const q = query.trim();
    if (q.length < FUSE_OPTIONS.minMatchCharLength!) return [];

    const loose = new Fuse([...this.entries], {
      ...FUSE_OPTIONS,
      threshold: 0.6,
      includeMatches: false,
      keys: [{ name: "title", weight: 1 }],
    });
    return loose
      .search(q)
      .slice(0, limit)
      .map((r) => r.item);
  }
}

// ---------------------------------------------------------------------------
// Tô sáng đoạn khớp
// ---------------------------------------------------------------------------

export type Segment = { text: string; hit: boolean };

/**
 * Cắt chuỗi thành các đoạn khớp / không khớp để component render `<mark>`.
 *
 * Trả về mảng chứ không trả HTML: chuỗi HTML phải qua `dangerouslySetInnerHTML`,
 * mà nội dung này lấy từ dữ liệu — không đáng đánh đổi để tiết kiệm vài dòng.
 */
export function highlight(
  text: string,
  indices: readonly (readonly [number, number])[],
): Segment[] {
  if (indices.length === 0) return [{ text, hit: false }];

  // Fuse trả các khoảng có thể chồng nhau và không đảm bảo thứ tự.
  const sorted = [...indices].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }

  const out: Segment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) out.push({ text: text.slice(cursor, start), hit: false });
    out.push({ text: text.slice(start, end + 1), hit: true });
    cursor = end + 1;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), hit: false });
  return out;
}

/** Lấy khoảng khớp của đúng một field trong kết quả Fuse. */
export function matchIndices(
  hit: SearchHit,
  key: keyof SearchIndexEntry,
): readonly (readonly [number, number])[] {
  return hit.matches.find((m) => m.key === key)?.indices ?? [];
}

// ---------------------------------------------------------------------------
// Tải index — lazy
// ---------------------------------------------------------------------------

/** Nơi build đặt search-index.json. Cùng origin nên không lo CORS. */
export const SEARCH_INDEX_URL = "/search-index.json";

let cached: Promise<SearchEngine> | null = null;

/**
 * Tải index và dựng engine, đúng MỘT lần cho cả phiên.
 *
 * Gọi khi user focus vào ô search hoặc gõ phím tắt — không gọi lúc trang tải,
 * để trang chi tiết vào từ Google không phải tải 19 KB mà nó không dùng tới.
 */
export function loadSearchEngine(fetchImpl: typeof fetch = fetch): Promise<SearchEngine> {
  cached ??= fetchImpl(SEARCH_INDEX_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Không tải được ${SEARCH_INDEX_URL}: ${res.status}`);
      return res.json() as Promise<SearchIndex>;
    })
    .then(SearchEngine.fromIndex)
    .catch((err: unknown) => {
      // Hỏng thì xoá cache để lần focus sau thử lại, không kẹt vĩnh viễn.
      cached = null;
      throw err;
    });
  return cached;
}

/** Chỉ dùng trong test. */
export function resetSearchEngineCache(): void {
  cached = null;
}
