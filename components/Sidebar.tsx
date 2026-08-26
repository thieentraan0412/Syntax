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
import type { Category } from "../lib/types.ts";

export function Sidebar({ dangMo }: { dangMo?: Category }) {
  const dem = countByCategory();

  return (
    <nav
      aria-label="Nhóm cú pháp"
      className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0"
    >
      <ul className="flex gap-1.5 md:flex-col md:gap-0.5">
        {categoriesInOrder().map((c) => {
          const mo = c.slug === dangMo;
          return (
            <li key={c.slug} className="shrink-0 md:shrink">
              <Link
                href={`/${c.slug}/`}
                aria-current={mo ? "page" : undefined}
                className={
                  "flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors md:whitespace-normal " +
                  (mo
                    ? "bg-surface font-medium text-accent"
                    : "text-muted hover:bg-surface hover:text-fg")
                }
              >
                <span>{c.name}</span>
                <span className="text-xs tabular-nums opacity-60">{dem[c.slug] ?? 0}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
