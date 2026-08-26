"use client";

/**
 * Ô tìm kiếm ở header — gõ thẳng, kết quả rơi xuống ngay dưới. Không hộp thoại.
 *
 * Ô nhập và truy vấn nằm ở ĐÂY, phần tìm kiếm thật nằm ở `HeaderKetQua` sau
 * `next/dynamic`. Chia như vậy vì hai ràng buộc kéo ngược nhau:
 *
 *  - Ô phải gõ được ngay lập tức trên mọi trang, kể cả khi `fuse.js` và
 *    `search-index.json` chưa về — nếu không thì ký tự đầu tiên rơi mất.
 *  - 322 trang chi tiết SSG không được tải sẵn hai thứ đó. Người vào từ Google
 *    đọc xong rồi đi, không phải ai cũng tìm kiếm.
 *
 * Nên: cái ô là HTML tĩnh nhẹ hều, chunk nặng chỉ tải lúc chạm vào ô, và truy
 * vấn được truyền xuống dưới dạng prop.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ID_O_TIM_KIEM_HEADER } from "../lib/su-kien.ts";

const HeaderKetQua = dynamic(() => import("./HeaderKetQua.tsx"), { ssr: false });

function IconTimKiem() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function HeaderSearch() {
  const boc = useRef<HTMLDivElement>(null);
  const o = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [mo, setMo] = useState(false);

  /**
   * Đã chạm vào ô lần nào chưa. Một chiều, không bao giờ về false: đóng bảng
   * kết quả rồi mở lại thì chunk đã nằm sẵn trong bộ nhớ, tháo nó ra chỉ tổ
   * mất `fuse.js` đã dựng và phải dựng lại.
   */
  const [daCham, setDaCham] = useState(false);

  const dong = useCallback(() => setMo(false), []);

  const cham = useCallback(() => {
    setDaCham(true);
    setMo(true);
  }, []);

  /**
   * `↑ ↓ Enter` phải do `useListNav` bên trong `HeaderKetQua` xử lý vì chỉ nó
   * biết có bao nhiêu kết quả. Nó mượn hàm xử lý lên đây qua ref này.
   */
  const xuLyPhim = useRef<((e: React.KeyboardEvent) => void) | null>(null);
  const datXuLyPhim = useCallback((fn: ((e: React.KeyboardEvent) => void) | null) => {
    xuLyPhim.current = fn;
  }, []);

  // Bấm ra ngoài thì đóng. Dùng `pointerdown` chứ không phải `blur`: blur bắn
  // TRƯỚC click, nên bấm vào một kết quả sẽ đóng bảng trước khi link kịp chạy.
  useEffect(() => {
    if (!mo) return;
    function raNgoai(e: PointerEvent) {
      if (!boc.current?.contains(e.target as Node)) setMo(false);
    }
    document.addEventListener("pointerdown", raNgoai);
    return () => document.removeEventListener("pointerdown", raNgoai);
  }, [mo]);

  /**
   * `Esc` bắt ở thẻ bọc chứ không ở riêng ô nhập: tiêu điểm có thể đang nằm
   * trên một chip lọc nhóm bên trong bảng kết quả, và ở đó `Esc` vẫn phải đóng
   * được. Lần một xoá chữ (bảng vẫn mở, quay về danh sách tìm gần đây), lần hai
   * mới đóng hẳn — bấm nhầm một phát không mất luôn ngữ cảnh.
   */
  const onEsc = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (query !== "") {
        setQuery("");
        o.current?.focus();
      } else {
        setMo(false);
        o.current?.blur();
      }
    },
    [query],
  );

  return (
    <div ref={boc} onKeyDown={onEsc} className="relative w-full max-w-lg">
      <IconTimKiem />
      <input
        ref={o}
        id={ID_O_TIM_KIEM_HEADER}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          cham();
        }}
        onFocus={cham}
        onKeyDown={(e) => {
          // `Esc` đã có thẻ bọc lo.
          if (e.key !== "Escape") xuLyPhim.current?.(e);
        }}
        placeholder="Tìm cú pháp, hàm, tuỳ chọn…"
        aria-label="Tìm trong cheatsheet Playwright"
        aria-keyshortcuts="/ Control+K"
        spellCheck={false}
        autoComplete="off"
        className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted/80 focus:border-accent"
      />
      {query === "" && (
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[11px] text-muted sm:block">
          /
        </kbd>
      )}

      {daCham && mo && (
        /*
          Điện thoại: bảng kết quả bám theo MÀN HÌNH (`fixed inset-x-3`), không
          bám theo ô nhập. Ô nhập ở đó chỉ rộng ~200px và nằm lệch tâm, treo một
          bảng 640px canh giữa nó thì bảng thò ra ngoài mép phải và đẩy cả trang
          trượt ngang. Ô search nằm lệch tâm (logo bên trái rộng hơn nút theme
          bên phải) nên phải tới `lg` mới đủ chỗ hai bên để bám theo ô.
        */
        <div className="fixed left-1/2 top-[3.8rem] z-20 w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg shadow-2xl lg:absolute lg:top-full lg:mt-2">
          <div className="max-h-[min(70vh,32rem)] overflow-y-auto p-2">
            <HeaderKetQua
              query={query}
              onDong={dong}
              onChonGanDay={(q) => {
                setQuery(q);
                o.current?.focus();
              }}
              datXuLyPhim={datXuLyPhim}
            />
          </div>
          {/* Điện thoại không có mấy phím này — giấu đi cho gọn. */}
          <div className="hidden flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-1.5 text-xs text-muted sm:flex">
            <Phim k="↑ ↓">di chuyển</Phim>
            <Phim k="Enter">mở</Phim>
            <Phim k="Esc">đóng</Phim>
            <Phim k="?">phím tắt</Phim>
          </div>
        </div>
      )}
    </div>
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
