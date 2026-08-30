"use client";

/**
 * Nút tròn cam ở góc phải dưới — cuộn về đầu trang.
 *
 * Nằm ở layout gốc nên có mặt trên cả 322 trang chi tiết SSG, vì vậy phải thật
 * nhẹ: một listener `scroll` thụ động, một boolean, không import gì thêm.
 *
 * Chỉ đổi state khi vượt qua ngưỡng chứ không setState mỗi lần cuộn — trang dài
 * mà set state theo từng pixel thì React render lại liên tục cho một nút không
 * hề đổi hình.
 */
import { useEffect, useState } from "react";

/** Cuộn quá chừng này thì nút mới hiện — hiện sớm quá thì nó che nội dung ngay từ màn hình đầu. */
const NGUONG = 480;

export function ScrollTop() {
  const [hien, setHien] = useState(false);

  useEffect(() => {
    function onScroll() {
      setHien(window.scrollY > NGUONG);
    }
    onScroll(); // Vào giữa trang bằng neo #id thì nút phải có sẵn, không đợi cuộn.
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        })
      }
      title="Về đầu trang"
      aria-label="Về đầu trang"
      // Ẩn bằng opacity + pointer-events chứ không tháo khỏi DOM: nút xuất hiện
      // và biến đi có chuyển động, không nhảy phựt một cái.
      className={
        "btn-accent focus-visible:outline-accent fixed right-5 bottom-5 z-30 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-xl shadow-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 " +
        (hien ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0")
      }
      aria-hidden={!hien}
      tabIndex={hien ? 0 : -1}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
