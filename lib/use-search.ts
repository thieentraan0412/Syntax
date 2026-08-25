"use client";

/**
 * Phase 2 — hook nối tầng search vào React.
 *
 * Tách khỏi lib/search.ts để phần logic tìm kiếm benchmark được bằng Node thuần.
 * File này chỉ lo phần React: tải lazy, debounce, và giữ state.
 *
 * Về debounce: search chỉ mất ~9ms (đo thật ở scripts/benchmark-search.ts) nên
 * KHÔNG cần debounce vì lý do hiệu năng. 120ms ở đây là để tránh danh sách kết
 * quả nhấp nháy liên tục khi gõ nhanh — lý do thị giác, không phải lý do máy.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadSearchEngine,
  type SearchEngine,
  type SearchHit,
} from "./search.ts";
import type { Category, SearchIndexEntry } from "./types.ts";

export const DEBOUNCE_MS = 120;

export type SearchStatus = "idle" | "loading" | "ready" | "error";

export type UseSearchResult = {
  /** Giá trị đang hiện trong ô input — cập nhật tức thì, không debounce. */
  query: string;
  setQuery: (q: string) => void;

  /** Nhóm đang lọc, null = tất cả. */
  category: Category | null;
  setCategory: (c: Category | null) => void;

  /** Kết quả cho truy vấn đã debounce. */
  hits: SearchHit[];
  /** Gợi ý "Ý bạn là…" khi không có kết quả nào. */
  suggestions: SearchIndexEntry[];
  /** Số kết quả theo từng nhóm, để hiện cạnh bộ lọc. */
  countByCategory: Record<string, number>;

  status: SearchStatus;
  error: Error | null;
  /** true khi đã gõ nhưng kết quả cho lần gõ đó chưa kịp tính. */
  isStale: boolean;

  /**
   * Gọi khi user focus vào ô search hoặc bấm phím tắt — đây là lúc tải index.
   * Gọi nhiều lần vô hại.
   */
  warmUp: () => void;

  clear: () => void;
};

export type UseSearchOptions = {
  limit?: number;
  /** Tải index ngay khi mount thay vì chờ focus. Mặc định false. */
  eager?: boolean;
  /** Cho test tiêm fetch giả. */
  fetchImpl?: typeof fetch;
};

export function useSearch(options: UseSearchOptions = {}): UseSearchResult {
  const { limit = 50, eager = false, fetchImpl } = options;

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [engine, setEngine] = useState<SearchEngine | null>(null);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  /** Chặn tải trùng khi vừa focus vừa gõ. */
  const requested = useRef(false);

  const warmUp = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    setStatus("loading");

    loadSearchEngine(fetchImpl).then(
      (e) => {
        setEngine(e);
        setStatus("ready");
      },
      (err: unknown) => {
        // Cho phép thử lại ở lần focus sau.
        requested.current = false;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      },
    );
  }, [fetchImpl]);

  useEffect(() => {
    if (eager) warmUp();
  }, [eager, warmUp]);

  // Gõ là tải, kể cả khi chưa từng focus (vd dán chữ vào, hoặc gõ phím tắt).
  useEffect(() => {
    if (query !== "") warmUp();
  }, [query, warmUp]);

  useEffect(() => {
    if (query === "") {
      // Xoá trắng thì trả kết quả ngay, không bắt chờ thêm 120ms.
      setDebounced("");
      return;
    }
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const hits = useMemo(
    () => (engine ? engine.search(debounced, { limit, category }) : []),
    [engine, debounced, limit, category],
  );

  const countByCategory = useMemo(
    () => (engine && debounced ? engine.countByCategory(debounced) : {}),
    [engine, debounced],
  );

  // Chỉ tính gợi ý khi thật sự không có kết quả — nó tốn thêm một lượt tìm.
  const suggestions = useMemo(
    () => (engine && debounced && hits.length === 0 ? engine.suggest(debounced) : []),
    [engine, debounced, hits.length],
  );

  const clear = useCallback(() => {
    setQuery("");
    setDebounced("");
    setCategory(null);
  }, []);

  return {
    query,
    setQuery,
    category,
    setCategory,
    hits,
    suggestions,
    countByCategory,
    status,
    error,
    isStale: query.trim() !== debounced.trim(),
    warmUp,
    clear,
  };
}
