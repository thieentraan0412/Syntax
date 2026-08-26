"use client";

/**
 * Phase 3 — nút chép code.
 * Phase 4 — thêm phím tắt `C` cho khối code chính của trang, và báo khi chép hỏng.
 *
 * Trên trang chi tiết đây gần như là JS duy nhất của mình; mọi thứ còn lại là
 * HTML tĩnh dựng sẵn lúc build.
 */
import { useEffect } from "react";
import { useCopy } from "../lib/use-copy.ts";

export function CopyButton({
  code,
  label = "Chép",
  /** Bật phím tắt `C` — chỉ khối code CHÍNH của trang mới nên bật, không thì hai khối cùng nghe một phím. */
  phimTat = false,
}: {
  code: string;
  label?: string;
  phimTat?: boolean;
}) {
  const { trangThai, chep } = useCopy(code);

  useEffect(() => {
    if (!phimTat) return;
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "c") return;
      // Chừa Ctrl+C / ⌘C cho việc chép đoạn bôi đen — cướp phím đó là phá thói
      // quen của mọi người.
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      // Đang bôi đen chữ thì cũng để yên.
      if ((window.getSelection()?.toString() ?? "") !== "") return;
      e.preventDefault();
      void chep();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phimTat, chep]);

  return (
    <button
      type="button"
      onClick={chep}
      // aria-live để trình đọc màn hình đọc được kết quả, không chỉ thấy chữ đổi.
      aria-live="polite"
      title={
        trangThai === "loi"
          ? "Trình duyệt không cho chép — bôi đen rồi Ctrl+C"
          : phimTat
            ? "Chép code (phím C)"
            : "Chép code"
      }
      className={
        "cursor-pointer rounded-md border bg-surface px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
        (trangThai === "loi"
          ? "border-border text-muted"
          : "border-border text-muted hover:border-accent hover:text-accent")
      }
    >
      {trangThai === "xong" ? "Đã chép ✓" : trangThai === "loi" ? "Không chép được" : label}
    </button>
  );
}
