"use client";

/**
 * Phase 4 — logic chép dùng chung cho nút chép một đoạn và nút chép cả nhóm.
 *
 * Có ba trạng thái chứ không phải hai, và trạng thái thứ ba là quan trọng nhất:
 * `navigator.clipboard.writeText` **từ chối** trong khá nhiều tình huống đời
 * thực — trang không phải https, tab đang không được focus, quyền bị chặn. Nếu
 * chỉ bắt lỗi rồi im lặng thì người dùng bấm nút mà không có gì xảy ra và không
 * hiểu tại sao. Thà nói thẳng "không chép được" còn hơn.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type TrangThaiChep = "cho" | "xong" | "loi";

const NHA_SAU = 1600;

export function useCopy(noiDung: string): {
  trangThai: TrangThaiChep;
  chep: () => Promise<void>;
} {
  const [trangThai, setTrangThai] = useState<TrangThaiChep>("cho");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bấm chép rồi rời trang ngay thì timer vẫn còn treo — dọn khi unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const chep = useCallback(async () => {
    let ket: TrangThaiChep;
    try {
      await navigator.clipboard.writeText(noiDung);
      ket = "xong";
    } catch {
      ket = "loi";
    }
    setTrangThai(ket);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTrangThai("cho"), NHA_SAU);
  }, [noiDung]);

  return { trangThai, chep };
}
