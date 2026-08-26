"use client";

/**
 * Phase 3 — ô search.
 *
 * Hai điểm đáng nói:
 *
 * 1. `onFocus` gọi `warmUp()` — đây chính là lúc tải `search-index.json`. Người
 *    vào trang chi tiết từ Google không bao giờ chạm vào ô này, nên không phải
 *    tải 19 KB họ không dùng.
 * 2. `type="search"` chứ không phải `text`: trình duyệt cho sẵn nút xoá, và
 *    trình đọc màn hình đọc đúng vai trò của ô.
 */
import { useEffect, useRef } from "react";

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

  // Phím tắt "/" và Ctrl+K — thói quen của người hay đọc docs. Ở trang chủ hai
  // phím này KHÔNG mở overlay (SearchTrigger đã nhường) mà đưa con trỏ về ô
  // search ngay giữa màn hình: mở một hộp nổi đè lên chính ô đang trống là thừa.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ctrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (!ctrlK) {
        if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target as HTMLElement | null;
        if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        if (t?.isContentEditable) return;
      }
      e.preventDefault();
      ref.current?.focus();
      ref.current?.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <input
        ref={ref}
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
        placeholder="Tìm hàm, cú pháp, biến…  ví dụ: getByRole, toBeVisible, storageState"
        aria-label="Tìm trong cheatsheet Playwright"
        spellCheck={false}
        autoComplete="off"
        className="w-full rounded-xl border border-border bg-surface px-4 py-3 pr-24 text-[15px] outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
        {dangTai ? "đang tải…" : value === "" ? "gõ / để tìm" : ""}
      </span>
    </div>
  );
}
