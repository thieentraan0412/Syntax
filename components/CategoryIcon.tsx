/**
 * Biểu tượng của 15 nhóm — ô vuông gradient đứng trước mỗi tiêu đề mục.
 *
 * Vẽ thẳng bằng `<path>` chứ không kéo một thư viện icon: mỗi trang chỉ dùng
 * một hai cái, mà 322 trang chi tiết thì không nên gánh thêm dependency nào cho
 * phần trang trí. Đây là Server Component thuần, render xong đóng băng vào HTML.
 *
 * Icon mang nghĩa trang trí — chỗ gọi luôn kèm chữ, nên `aria-hidden`.
 */
import type { ReactNode } from "react";

const HINH: Record<string, ReactNode> = {
  // Terminal
  cli: (
    <>
      <path d="m4 17 6-6-6-6" />
      <path d="M12 19h8" />
    </>
  ),
  // Danh sách có dấu tick
  "test-structure": (
    <>
      <path d="m3 7 2 2 4-4" />
      <path d="m3 17 2 2 4-4" />
      <path d="M13 7h8M13 17h8" />
    </>
  ),
  // Mảnh ghép
  fixtures: (
    <>
      <path d="M4 7a2 2 0 0 1 2-2h3a2 2 0 1 1 4 0h3a2 2 0 0 1 2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 1-2 2h-3a2 2 0 1 0-4 0H6a2 2 0 0 1-2-2v-3a2 2 0 1 0 0-4V7Z" />
    </>
  ),
  // Tâm ngắm
  locators: (
    <>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  // Con trỏ bấm
  actions: (
    <>
      <path d="M9 9l9 3.5-4 1.5-1.5 4L9 9Z" />
      <path d="M5 3v3M3 5h3M5 13v2M13 5h2" />
    </>
  ),
  // Dấu tick trong vòng tròn
  assertions: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  // Cửa sổ trình duyệt
  page: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M6.5 6.5h.01M9.5 6.5h.01" />
    </>
  ),
  // Nhiều lớp cửa sổ
  "browser-context": (
    <>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M8 6V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1" />
    </>
  ),
  // Sóng mạng
  network: (
    <>
      <path d="M2 8.5a15 15 0 0 1 20 0" />
      <path d="M5 12.5a10 10 0 0 1 14 0" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M12 20h.01" />
    </>
  ),
  // Bong bóng thoại
  "frames-dialogs": (
    <>
      <path d="M20 4H8a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2v4l4-4h6a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" />
      <path d="M6 18H4a2 2 0 0 1-2-2V9" />
    </>
  ),
  // Ổ khoá
  "auth-state": (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      <path d="M12 14v2" />
    </>
  ),
  // Thanh trượt cấu hình
  config: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </>
  ),
  // Con bọ
  "debug-report": (
    <>
      <rect x="8" y="7" width="8" height="12" rx="4" />
      <path d="M9.5 7a2.5 2.5 0 0 1 5 0" />
      <path d="M3 11h5M16 11h5M3 17h5M16 17h5M12 19v2" />
    </>
  ),
  // Bức ảnh
  "visual-testing": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m4 17 5-4 4 3 3-2 4 3" />
    </>
  ),
  // Ngôi sao lấp lánh
  advanced: (
    <>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4L4.5 10.8 10.2 9 12 3.5Z" />
      <path d="M18.5 16.5 19.3 19l2.2.8-2.2.8-.8 2.4-.8-2.4L15.5 20l2.2-.8.8-2.7Z" />
    </>
  ),
};

/** Icon dự phòng cho slug lạ: dấu ngoặc nhọn của code. */
const MAC_DINH = (
  <>
    <path d="m9 8-5 4 5 4" />
    <path d="m15 8 5 4-5 4" />
  </>
);

export function CategoryIcon({
  slug,
  className = "h-5 w-5",
}: {
  slug: string;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {HINH[slug] ?? MAC_DINH}
    </svg>
  );
}
