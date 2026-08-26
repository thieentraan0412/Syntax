"use client";

/**
 * Phase 4 — ghim một mục để lần sau mở tìm kiếm là thấy ngay.
 *
 * Lưu cả `title` chứ không chỉ `category/id`: danh sách ghim trong overlay phải
 * hiện được ngay lúc mở, không đợi tải `search-index.json` rồi mới tra tên.
 */
import { useSyncExternalStore } from "react";
import { GHIM, type MucGhim } from "../lib/ua-thich.ts";

export function FavoriteButton({ muc }: { muc: MucGhim }) {
  const danhSach = useSyncExternalStore(GHIM.subscribe, GHIM.get, GHIM.getServer);
  const daGhim = danhSach.some((m) => m.c === muc.c && m.i === muc.i);

  return (
    <button
      type="button"
      onClick={() => (daGhim ? GHIM.bo(muc) : GHIM.them(muc))}
      aria-pressed={daGhim}
      title={daGhim ? "Bỏ ghim" : "Ghim mục này"}
      className={
        "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
        (daGhim
          ? "border-accent text-accent"
          : "border-border text-muted hover:border-accent hover:text-accent")
      }
    >
      <span aria-hidden>{daGhim ? "★" : "☆"}</span>
      {daGhim ? "Đã ghim" : "Ghim"}
    </button>
  );
}
