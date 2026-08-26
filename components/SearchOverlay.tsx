"use client";

/**
 * Phase 4 — hộp tìm kiếm gọi được từ MỌI trang, kể cả trang chi tiết SSG.
 *
 * Dùng `<dialog>` thật với `showModal()` chứ không tự dựng một cái div nổi:
 * trình duyệt cho sẵn focus trap, `Esc` để đóng, `::backdrop`, và khoá tương
 * tác với phần trang bên dưới. Tự viết lại mấy thứ đó bằng JS thì vừa dài vừa
 * dễ sai chỗ bàn phím.
 *
 * File này được nạp bằng `next/dynamic` từ `SearchTrigger` — nghĩa là cả nó lẫn
 * `fuse.js` chỉ tải xuống khi người ta thật sự mở tìm kiếm lần đầu. Trang chi
 * tiết vào từ Google không phải trả tiền cho thứ họ chưa dùng.
 */
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearch } from "../lib/use-search.ts";
import { useListNav } from "../lib/use-list-nav.ts";
import { GAN_DAY, GHIM, hrefGhim } from "../lib/ua-thich.ts";
import { SearchResults, Suggestions } from "./SearchResults.tsx";
import { CategoryFilter } from "./CategoryFilter.tsx";

export default function SearchOverlay({ onDong }: { onDong: () => void }) {
  const hop = useRef<HTMLDialogElement>(null);
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
    isStale,
    warmUp,
    clear,
  } = useSearch({ limit: 30, eager: true });

  const ganDay = useSyncExternalStore(GAN_DAY.subscribe, GAN_DAY.get, GAN_DAY.getServer);
  const ghim = useSyncExternalStore(GHIM.subscribe, GHIM.get, GHIM.getServer);

  const moMuc = useCallback(
    (i: number) => {
      const hit = hits[i];
      if (!hit) return;
      if (query.trim()) GAN_DAY.them(query.trim());
      onDong();
      router.push(hit.href);
    },
    [hits, query, router, onDong],
  );

  const nav = useListNav(hits.length, moMuc);

  // Mount là mở. Overlay chỉ được render khi đang mở nên không cần state "open"
  // thứ hai — hai nguồn sự thật cho cùng một thứ là chỗ sinh bug.
  useEffect(() => {
    const d = hop.current;
    if (d && !d.open) d.showModal();
  }, []);

  const tong = Object.values(countByCategory).reduce((a, b) => a + b, 0);
  const daGo = query.trim() !== "";

  return (
    <dialog
      ref={hop}
      // `Esc` -> sự kiện `close` của chính <dialog>, không phải keydown tự bắt.
      onClose={onDong}
      // Bấm ra ngoài thì đóng. <dialog> coi cả vùng backdrop là chính nó, nên so
      // target với dialog là đủ để biết bấm trúng nền hay trúng nội dung.
      onClick={(e) => {
        if (e.target === hop.current) onDong();
      }}
      aria-label="Tìm trong cheatsheet"
      className="m-0 w-full max-w-2xl rounded-2xl border border-border bg-bg p-0 text-fg shadow-2xl backdrop:bg-black/45 sm:mx-auto sm:mt-[8vh]"
    >
      <div className="flex max-h-[80vh] flex-col">
        <div className="border-b border-border p-3">
          <input
            type="search"
            value={query}
            autoFocus
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") clear();
              else setQuery(v);
              nav.datLai();
            }}
            onFocus={warmUp}
            onKeyDown={nav.onKeyDown}
            placeholder="Tìm hàm, cú pháp, biến…"
            aria-label="Tìm trong cheatsheet Playwright"
            spellCheck={false}
            autoComplete="off"
            className="w-full bg-transparent px-2 py-1.5 text-[15px] outline-none placeholder:text-muted/70"
          />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto p-3">
          {!daGo && <ChuaGo ganDay={ganDay} ghim={ghim} onChonGanDay={setQuery} onDong={onDong} />}

          {daGo && (
            <>
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
                  onMo={() => {
                    if (query.trim()) GAN_DAY.them(query.trim());
                    onDong();
                  }}
                />
              )}

              {hits.length === 0 && !isStale && status === "ready" && (
                <div className="flex flex-col gap-2 px-1 py-2">
                  <p className="text-sm">
                    Không có kết quả cho <span className="font-mono">{query.trim()}</span>.
                  </p>
                  <Suggestions items={suggestions} />
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted">
          <Phim k="↑ ↓">di chuyển</Phim>
          <Phim k="Enter">mở</Phim>
          <Phim k="Esc">đóng</Phim>
          <Phim k="?">bảng phím tắt</Phim>
        </div>
      </div>
    </dialog>
  );
}

function Phim({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px]">
        {k}
      </kbd>
      {children}
    </span>
  );
}

/** Khi chưa gõ gì: bày ra thứ người ta đã ghim và đã tìm, chứ không để trống trơn. */
function ChuaGo({
  ganDay,
  ghim,
  onChonGanDay,
  onDong,
}: {
  ganDay: readonly string[];
  ghim: readonly { c: string; i: string; t: string }[];
  onChonGanDay: (q: string) => void;
  onDong: () => void;
}) {
  if (ganDay.length === 0 && ghim.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted">
        Gõ để tìm trong 322 cú pháp Playwright.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ghim.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">Đã ghim</h2>
          <ul className="flex flex-col gap-0.5">
            {ghim.map((m) => (
              <li key={`${m.c}/${m.i}`}>
                <Link
                  href={hrefGhim(m)}
                  onClick={onDong}
                  className="block rounded-lg px-2 py-1.5 font-mono text-sm transition-colors hover:bg-surface hover:text-accent"
                >
                  {m.t}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ganDay.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h2 className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-muted">
            Tìm gần đây
            <button
              type="button"
              onClick={() => GAN_DAY.xoaHet()}
              className="cursor-pointer font-normal normal-case tracking-normal underline-offset-2 hover:text-accent hover:underline"
            >
              xoá
            </button>
          </h2>
          <ul className="flex flex-wrap gap-1.5 px-1">
            {ganDay.map((q) => (
              <li key={q}>
                <button
                  type="button"
                  onClick={() => onChonGanDay(q)}
                  className="cursor-pointer rounded-full border border-border px-3 py-1 text-[13px] text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {q}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
