/**
 * Phase 3 — điều hướng 15 nhóm.
 *
 * Server Component, không state: nhóm đang mở được truyền vào bằng prop từ
 * layout chứ không đọc `usePathname()`. Đổi lại là sidebar không kéo theo một
 * byte JS nào xuống trang chi tiết.
 *
 * Về responsive: kế hoạch ghi "mobile thu thành drawer", nhưng drawer thì phải
 * có JS mở/đóng — mà nguyên tắc của Phase 3 là trang chi tiết chỉ có đúng
 * `CopyButton` cần JS. Nên trên mobile nó thành một hàng chip cuộn ngang: cùng
 * một khối HTML, khác mỗi CSS, không thêm JS, và với 15 mục thì cuộn ngang một
 * phát cũng nhanh hơn mở drawer rồi chọn rồi đóng.
 */
import Link from "next/link";
import { categoriesInOrder } from "../lib/entries.ts";
import { countByCategory } from "../data/index.ts";
import { CategoryIcon } from "./CategoryIcon.tsx";
import type { Category } from "../lib/types.ts";

export function Sidebar({ dangMo }: { dangMo?: Category }) {
  const dem = countByCategory();

  return (
    <nav
      aria-label="Nhóm cú pháp"
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0"
    >
      <ul className="flex gap-2 md:flex-col md:gap-1">
        {categoriesInOrder().map((c) => {
          const mo = c.slug === dangMo;
          return (
            <li key={c.slug} className="shrink-0 md:shrink">
              <Link
                href={`/${c.slug}/`}
                aria-current={mo ? "page" : undefined}
                className={
                  "flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-sm whitespace-nowrap transition-colors md:whitespace-normal " +
                  (mo
                    ? "btn-accent font-semibold"
                    : "text-muted hover:border-border hover:bg-surface-2 hover:text-fg border-transparent")
                }
              >
                {/*
                  Ô icon nhỏ: nhóm đang mở thì nền của nút đã là gradient cam rồi,
                  nên ô icon phải trong suốt — chồng gradient tím lên gradient cam
                  thì thành một vệt bùn.
                */}
                <span
                  className={
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg " +
                    (mo ? "bg-white/20" : "tile opacity-85")
                  }
                >
                  <CategoryIcon slug={c.slug} className="h-3.5 w-3.5" />
                </span>
                <span className="flex-1">{c.name}</span>
                <span className="text-xs tabular-nums opacity-70">{dem[c.slug] ?? 0}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
