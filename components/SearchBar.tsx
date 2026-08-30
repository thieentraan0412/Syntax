"use client";

/**
 * Phase 3 — ô search.
 *
 * Ba điểm đáng nói:
 *
 * 1. `onFocus` gọi `warmUp()` — đây chính là lúc tải `search-index.json`. Người
 *    vào trang chi tiết từ Google không bao giờ chạm vào ô này, nên không phải
 *    tải 19 KB họ không dùng.
 * 2. `type="search"` chứ không phải `text`: trình duyệt cho sẵn nút xoá, và
 *    trình đọc màn hình đọc đúng vai trò của ô.
 * 3. Không tự bắt phím tắt: `/` và `Ctrl+K` do `SearchTrigger` ở layout gốc
 *    bắt rồi đưa con trỏ về đây qua `id`. Hai chỗ cùng nghe một phím là hai
 *    chỗ phải cùng đúng.
 */
import { useRef } from "react";
import { ID_O_TIM_KIEM } from "../lib/su-kien.ts";

export function SearchBar({
  value,
  onChange,
  onWarmUp,
  onClear,
  onKeyDown,
  autoFocus = false,
  dangTai = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onWarmUp: () => void;
  onClear: () => void;
  /** Điều hướng `↑ ↓ Enter` trong danh sách kết quả (Phase 4). */
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoFocus?: boolean;
  dangTai?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-muted pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        ref={ref}
        id={ID_O_TIM_KIEM}
        type="search"
        value={value}
        // Trang chủ chỉ có đúng một việc là tìm, nên để con trỏ sẵn ở đây là
        // đúng ý người vào — không phải kiểu autofocus cướp tiêu điểm tuỳ tiện.
        autoFocus={autoFocus}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") onClear();
          else onChange(v);
        }}
        onFocus={onWarmUp}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClear();
            e.currentTarget.blur();
            return;
          }
          onKeyDown?.(e);
        }}
        placeholder="Tìm hàm, cú pháp, biến…  ví dụ: getByRole, toBeVisible"
        aria-label="Tìm trong cheatsheet Playwright"
        spellCheck={false}
        autoComplete="off"
        className="glass placeholder:text-muted/70 focus:border-accent w-full rounded-2xl py-4 pr-24 pl-12 text-[15px] transition-colors outline-none"
      />
      <span className="text-muted pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs">
        {dangTai ? "đang tải…" : value === "" ? "gõ / để tìm" : ""}
      </span>
    </div>
  );
}
