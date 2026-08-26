"use client";

/**
 * Phần NẶNG của ô tìm kiếm ở header: `useSearch` → `lib/search.ts` → `fuse.js`,
 * cộng với `search-index.json`.
 *
 * Tách hẳn ra một file riêng để `next/dynamic` cắt được nó thành chunk riêng.
 * `HeaderSearch` (cái ô nhập, có mặt trên mọi trang) không được kéo theo thứ
 * gì trong này — 322 trang chi tiết vào từ Google phải nhẹ như khi chưa có ô
 * search. Chunk này chỉ tải khi người ta thật sự chạm vào ô.
 *
 * Truy vấn do `HeaderSearch` giữ và truyền xuống: ô nhập phải sống được TRƯỚC
 * khi chunk này về, nếu không thì ký tự đầu tiên gõ vào sẽ rơi mất.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useSearch } from "../lib/use-search.ts";
import { useListNav } from "../lib/use-list-nav.ts";
import { GAN_DAY, GHIM, hrefGhim } from "../lib/ua-thich.ts";
import { SearchResults, Suggestions } from "./SearchResults.tsx";
import { CategoryFilter } from "./CategoryFilter.tsx";

export default function HeaderKetQua({
  query,
  onDong,
  onChonGanDay,
  datXuLyPhim,
}: {
  query: string;
  /** Đóng bảng kết quả — gọi sau khi đã mở một mục. */
  onDong: () => void;
  /** Bấm vào một truy vấn cũ thì đổ ngược lên ô nhập của `HeaderSearch`. */
  onChonGanDay: (q: string) => void;
  /** Giao `↑ ↓ Enter` lại cho ô nhập ở trên xử lý. */
  datXuLyPhim: (fn: ((e: React.KeyboardEvent) => void) | null) => void;
}) {
  const router = useRouter();
  const s = useSearch({ limit: 10, eager: true });

  const ganDay = useSyncExternalStore(GAN_DAY.subscribe, GAN_DAY.get, GAN_DAY.getServer);
  const ghim = useSyncExternalStore(GHIM.subscribe, GHIM.get, GHIM.getServer);

  const ghiLai = useCallback(() => {
    if (query.trim()) GAN_DAY.them(query.trim());
  }, [query]);

  const moMuc = useCallback(
    (i: number) => {
      const hit = s.hits[i];
      if (!hit) return;
      ghiLai();
      onDong();
      router.push(hit.href);
    },
    [s.hits, ghiLai, onDong, router],
  );

  const nav = useListNav(s.hits.length, moMuc);

  /**
   * Đồng bộ prop `query` vào state của `useSearch` NGAY TRONG LÚC RENDER, không
   * qua effect. Đây là cách React khuyến nghị cho "đổi state khi prop đổi": nó
   * render lại luôn trước khi commit, nên không có lượt vẽ trung gian nào hiện
   * kết quả của truy vấn cũ.
   */
  const [truoc, datTruoc] = useState(query);
  if (query !== truoc) {
    datTruoc(query);
    s.setQuery(query);
    nav.datLai();
  }

  // Ô nhập nằm ở component cha nên phím mũi tên tới đó trước. Mượn hàm xử lý
  // của `useListNav` cho cha dùng, và trả lại khi bảng kết quả đóng.
  useEffect(() => {
    datXuLyPhim(nav.onKeyDown);
    return () => datXuLyPhim(null);
  }, [nav.onKeyDown, datXuLyPhim]);

  const daGo = query.trim() !== "";
  const tong = Object.values(s.countByCategory).reduce((a, b) => a + b, 0);

  if (!daGo) return <ChuaGo ganDay={ganDay} ghim={ghim} onChonGanDay={onChonGanDay} onDong={onDong} />;

  if (s.status === "error") {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted">
        Không tải được dữ liệu tìm kiếm{s.error ? ` (${s.error.message})` : ""}. Bấm lại vào ô để
        thử lần nữa.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <CategoryFilter
        countByCategory={s.countByCategory}
        tong={tong}
        dangChon={s.category}
        onChon={(c) => {
          s.setCategory(c);
          nav.datLai();
        }}
      />

      {s.hits.length > 0 && (
        <SearchResults
          hits={s.hits}
          index={nav.index}
          chon={nav.chon}
          refMuc={nav.refMuc}
          onMo={() => {
            ghiLai();
            onDong();
          }}
        />
      )}

      {/* `isStale`: đã gõ nhưng kết quả cho lần gõ đó chưa tính xong (120ms
          debounce). Thiếu nó thì mỗi ký tự gõ thêm, "không có kết quả" lại nháy
          lên một cái rồi biến. */}
      {s.hits.length === 0 && !s.isStale && s.status === "ready" && (
        <div className="flex flex-col gap-2 px-2 py-2">
          <p className="text-sm">
            Không có kết quả cho <span className="font-mono">{query.trim()}</span>.
          </p>
          <Suggestions items={s.suggestions} />
        </div>
      )}
    </div>
  );
}

/** Chưa gõ gì: bày thứ người ta đã ghim và đã tìm, chứ không để trống trơn. */
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
      <p className="px-2 py-6 text-center text-sm text-muted">
        Gõ để tìm trong 322 cú pháp Playwright.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ghim.length > 0 && (
        <section className="flex flex-col gap-1.5">
          <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted">Đã ghim</h2>
          <ul className="flex flex-col gap-0.5">
            {ghim.map((m) => (
              <li key={`${m.c}/${m.i}`}>
                <Link
                  href={hrefGhim(m)}
                  onClick={onDong}
                  className="block wrap-anywhere rounded-lg px-2 py-1.5 font-mono text-sm transition-colors hover:bg-surface hover:text-accent"
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
          <h2 className="flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Tìm gần đây
            <button
              type="button"
              onClick={() => GAN_DAY.xoaHet()}
              className="cursor-pointer font-normal normal-case tracking-normal underline-offset-2 hover:text-accent hover:underline"
            >
              xoá
            </button>
          </h2>
          <ul className="flex flex-wrap gap-1.5 px-2">
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
