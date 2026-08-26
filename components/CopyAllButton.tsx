"use client";

/**
 * Phase 4 — chép toàn bộ code của một nhóm.
 *
 * Chuỗi ghép sẵn được truyền từ Server Component xuống chứ không dựng ở client:
 * `code` đầy đủ nằm trong `data/*.ts`, không có trong `search-index.json`, nên
 * client không tự ráp lại được — mà cũng không nên, đó là dữ liệu build-time.
 */
import { useCopy } from "../lib/use-copy.ts";

export function CopyAllButton({ noiDung, soMuc }: { noiDung: string; soMuc: number }) {
  const { trangThai, chep } = useCopy(noiDung);

  return (
    <button
      type="button"
      onClick={chep}
      aria-live="polite"
      title={trangThai === "loi" ? "Trình duyệt không cho chép" : undefined}
      className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {trangThai === "xong"
        ? "Đã chép ✓"
        : trangThai === "loi"
          ? "Không chép được"
          : `Chép cả ${soMuc} đoạn code`}
    </button>
  );
}
