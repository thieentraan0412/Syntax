"use client";

/**
 * Phase 4 — di chuyển trong danh sách kết quả bằng `↑ ↓ Enter`.
 *
 * Dùng chung cho hai chỗ: ô search ở trang chủ và overlay gọi từ mọi trang.
 *
 * Về việc kẹp chỉ số: khi danh sách ngắn lại (gõ thêm ký tự, lọc nhóm), chỉ số
 * đang chọn có thể vượt ra ngoài. Kẹp **ngay lúc render** bằng phép suy ra chứ
 * không sửa state trong effect — vừa đúng rule `react-hooks/set-state-in-effect`,
 * vừa không có lượt render trung gian trỏ vào mục không tồn tại.
 */
import { useCallback, useRef, useState } from "react";

export type ListNav = {
  /** -1 khi danh sách rỗng. */
  index: number;
  /** Rê chuột vào mục nào thì mục đó thành mục đang chọn. */
  chon: (i: number) => void;
  /** Gọi khi truy vấn đổi — kéo lựa chọn về đầu danh sách. */
  datLai: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  /** Gắn vào từng mục để cuộn mục đang chọn vào tầm nhìn. */
  refMuc: (i: number) => (el: HTMLElement | null) => void;
};

export function useListNav(soLuong: number, moMuc: (i: number) => void): ListNav {
  const [tho, setTho] = useState(0);
  const items = useRef<(HTMLElement | null)[]>([]);

  const index = soLuong === 0 ? -1 : Math.min(tho, soLuong - 1);

  const dua = useCallback((i: number) => {
    // `block: "nearest"` để danh sách không giật lên giật xuống khi mục đã hiện đủ.
    items.current[i]?.scrollIntoView({ block: "nearest" });
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (soLuong === 0) return;
      let toi: number | null = null;

      if (e.key === "ArrowDown") toi = Math.min(index + 1, soLuong - 1);
      else if (e.key === "ArrowUp") toi = Math.max(index - 1, 0);
      else if (e.key === "Home") toi = 0;
      else if (e.key === "End") toi = soLuong - 1;
      else if (e.key === "Enter" && index >= 0) {
        e.preventDefault();
        moMuc(index);
        return;
      } else return;

      e.preventDefault();
      setTho(toi);
      dua(toi);
    },
    [index, soLuong, moMuc, dua],
  );

  return {
    index,
    chon: setTho,
    datLai: useCallback(() => setTho(0), []),
    onKeyDown,
    refMuc: useCallback(
      (i: number) => (el: HTMLElement | null) => {
        items.current[i] = el;
      },
      [],
    ),
  };
}
