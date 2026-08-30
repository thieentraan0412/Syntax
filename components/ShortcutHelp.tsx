"use client";

/**
 * Phase 4 — bảng phím tắt, mở bằng phím `?`.
 *
 * Cũng dùng `<dialog>` như overlay tìm kiếm, vì cùng một lý do: focus trap và
 * `Esc` là của trình duyệt lo, không phải việc mình viết lại.
 */
import { useEffect, useRef } from "react";

const PHIM: { phim: string[]; viec: string }[] = [
  { phim: ["/"], viec: "Mở tìm kiếm" },
  { phim: ["Ctrl", "K"], viec: "Mở tìm kiếm (hoặc ⌘ K trên Mac)" },
  { phim: ["↑", "↓"], viec: "Di chuyển giữa các kết quả" },
  { phim: ["Enter"], viec: "Mở kết quả đang chọn" },
  { phim: ["C"], viec: "Chép đoạn code của trang đang xem" },
  { phim: ["Esc"], viec: "Đóng hộp đang mở" },
  { phim: ["?"], viec: "Bảng phím tắt này" },
];

export default function ShortcutHelp({ onDong }: { onDong: () => void }) {
  const hop = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = hop.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={hop}
      onClose={onDong}
      onClick={(e) => {
        if (e.target === hop.current) onDong();
      }}
      aria-label="Bảng phím tắt"
      className="border-border bg-panel text-fg m-0 w-full max-w-md rounded-2xl border p-0 shadow-[var(--shadow-pop)] backdrop:bg-black/55 backdrop:backdrop-blur-sm sm:mx-auto sm:mt-[12vh]"
    >
      <div className="flex flex-col">
        <h2 className="border-border text-muted border-b px-5 py-3 text-sm font-semibold tracking-wider uppercase">
          Phím tắt
        </h2>
        <dl className="flex flex-col gap-2.5 px-5 py-4">
          {PHIM.map((p) => (
            <div key={p.viec} className="flex items-center justify-between gap-6">
              <dt className="text-sm">{p.viec}</dt>
              <dd className="flex shrink-0 gap-1">
                {p.phim.map((k) => (
                  <kbd
                    key={k}
                    className="border-border bg-surface-2 rounded-md border px-1.5 py-0.5 font-mono text-[11px]"
                  >
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </dialog>
  );
}
