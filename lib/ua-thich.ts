"use client";

/**
 * Phase 4 — hai danh sách sống trong localStorage của người đọc.
 *
 * `GAN_DAY`  — truy vấn tìm gần đây, tối đa 8.
 * `GHIM`     — mục đã ghim.
 *
 * Ghim lưu sẵn cả `title` chứ không chỉ `category/id`: nhờ vậy danh sách ghim
 * hiện được **ngay** khi mở trang, không phải chờ tải `search-index.json` rồi
 * mới tra ngược ra tên.
 */
import { createLocalStore } from "./local-store.ts";

export type MucGhim = {
  /** category */
  c: string;
  /** id */
  i: string;
  /** title */
  t: string;
};

export const GAN_DAY = createLocalStore<string>("pwcs:recent", 8, (a, b) => a === b);

export const GHIM = createLocalStore<MucGhim>(
  "pwcs:pinned",
  100,
  (a, b) => a.c === b.c && a.i === b.i,
);

export function hrefGhim(m: MucGhim): string {
  return `/${m.c}/${m.i}/`;
}
