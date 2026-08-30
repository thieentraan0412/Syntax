"use client";

/**
 * Phase 3 — ráp hook `useSearch()` của Phase 2 vào UI thật.
 * Phase 4 — thêm điều hướng `↑ ↓ Enter`, lịch sử tìm gần đây và mục đã ghim.
 *
 * Component này giữ toàn bộ state; `SearchBar` / `CategoryFilter` /
 * `SearchResults` chỉ nhận props và vẽ.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { useSearch } from "../lib/use-search.ts";
import { useListNav } from "../lib/use-list-nav.ts";
import { GAN_DAY, GHIM, hrefGhim } from "../lib/ua-thich.ts";
import { SearchBar } from "./SearchBar.tsx";
import { CategoryFilter } from "./CategoryFilter.tsx";
import { SearchResults, Suggestions } from "./SearchResults.tsx";
import { CategoryIcon } from "./CategoryIcon.tsx";
import { categoriesInOrder } from "../lib/entries.ts";

export function Search({ demTheoNhom }: { demTheoNhom: Record<string, number> }) {
  const router = useRouter();
  const {
    query,
    setQuery,
    category,
    setCategory,
    hits,
    suggestions,
    countByCategory,
    status,
    error,
    isStale,
    warmUp,
    clear,
  } = useSearch({ limit: 50 });

  const ganDay = useSyncExternalStore(GAN_DAY.subscribe, GAN_DAY.get, GAN_DAY.getServer);
  const ghim = useSyncExternalStore(GHIM.subscribe, GHIM.get, GHIM.getServer);

  const ghiLai = useCallback(() => {
    if (query.trim()) GAN_DAY.them(query.trim());
  }, [query]);

  const moMuc = useCallback(
    (i: number) => {
      const hit = hits[i];
      if (!hit) return;
      ghiLai();
      router.push(hit.href);
    },
    [hits, router, ghiLai],
  );

  const nav = useListNav(hits.length, moMuc);

  const tong = Object.values(countByCategory).reduce((a, b) => a + b, 0);
  const daGo = query.trim() !== "";

  return (
    <div className="flex flex-col gap-7">
      <div className="mx-auto w-full max-w-3xl">
        <SearchBar
          value={query}
          onChange={(v) => {
            setQuery(v);
            nav.datLai();
          }}
          onWarmUp={warmUp}
          onClear={clear}
          onKeyDown={nav.onKeyDown}
          autoFocus
          dangTai={status === "loading"}
        />
      </div>

      {/* Chưa gõ gì: bày thứ người ta đã ghim / đã tìm, rồi tới 15 nhóm. */}
      {!daGo && (
        <>
          {ghim.length > 0 && (
            <section className="mx-auto flex w-full max-w-3xl flex-col gap-2">
              <h2 className="text-muted text-xs font-semibold tracking-wider uppercase">Đã ghim</h2>
              <ul className="flex flex-wrap gap-2">
                {ghim.map((m) => (
                  <li key={`${m.c}/${m.i}`}>
                    <Link
                      href={hrefGhim(m)}
                      className="glass glass-hover hover:text-accent inline-block rounded-xl px-3 py-1.5 font-mono text-[13px] wrap-anywhere"
                    >
                      <span className="text-accent">★</span> {m.t}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {ganDay.length > 0 && (
            <section className="mx-auto flex w-full max-w-3xl flex-col gap-2">
              <h2 className="text-muted flex items-center gap-3 text-xs font-semibold tracking-wider uppercase">
                Tìm gần đây
                <button
                  type="button"
                  onClick={() => GAN_DAY.xoaHet()}
                  className="hover:text-accent cursor-pointer font-normal tracking-normal normal-case underline-offset-2 hover:underline"
                >
                  xoá
                </button>
              </h2>
              <ul className="flex flex-wrap gap-2">
                {ganDay.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(q);
                        nav.datLai();
                      }}
                      className="glass glass-hover text-muted hover:text-accent cursor-pointer rounded-full px-3 py-1 text-[13px]"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <NhomGrid demTheoNhom={demTheoNhom} />
        </>
      )}

      {daGo && status === "error" && (
        <p className="glass text-muted mx-auto w-full max-w-3xl rounded-2xl px-4 py-3 text-sm">
          Không tải được dữ liệu tìm kiếm{error ? ` (${error.message})` : ""}. Bấm lại vào ô tìm
          kiếm để thử lần nữa.
        </p>
      )}

      {daGo && status !== "error" && (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <CategoryFilter
            countByCategory={countByCategory}
            tong={tong}
            dangChon={category}
            onChon={(c) => {
              setCategory(c);
              nav.datLai();
            }}
          />

          {hits.length > 0 && (
            <SearchResults
              hits={hits}
              index={nav.index}
              chon={nav.chon}
              refMuc={nav.refMuc}
              onMo={ghiLai}
            />
          )}

          {/*
            `isStale` = đã gõ nhưng kết quả cho lần gõ đó chưa tính xong (đang
            trong 120ms debounce). Không có nó thì mỗi lần gõ thêm một ký tự,
            "không tìm thấy" lại nháy lên một cái rồi biến — rất khó chịu.
          */}
          {hits.length === 0 && !isStale && status === "ready" && (
            <div className="glass flex flex-col gap-2 rounded-2xl px-4 py-3.5">
              <p className="text-sm">
                Không có kết quả cho <span className="text-accent font-mono">{query.trim()}</span>.
              </p>
              <Suggestions items={suggestions} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NhomGrid({ demTheoNhom }: { demTheoNhom: Record<string, number> }) {
  return (
    <nav
      aria-label="Duyệt theo nhóm"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
    >
      {categoriesInOrder().map((c) => (
        <Link
          key={c.slug}
          href={`/${c.slug}/`}
          className="glass glass-hover group flex flex-col gap-2 rounded-2xl px-4 py-4"
        >
          <span className="flex items-center gap-3">
            <span className="tile flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <CategoryIcon slug={c.slug} className="h-[18px] w-[18px]" />
            </span>
            <span className="group-hover:text-accent flex-1 font-semibold transition-colors">
              {c.name}
            </span>
            <span className="bg-surface-2 text-muted rounded-full px-2 py-0.5 text-xs tabular-nums">
              {demTheoNhom[c.slug] ?? 0}
            </span>
          </span>
          <span className="text-muted line-clamp-2 text-sm leading-relaxed">{c.description}</span>
        </Link>
      ))}
    </nav>
  );
}
