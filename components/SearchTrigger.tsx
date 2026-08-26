"use client";

/**
 * Chỗ DUY NHẤT bắt phím tắt toàn trang.
 *
 * Component này nằm ở layout gốc nên có mặt trên **mọi** trang, kể cả 322 trang
 * chi tiết SSG. Vì vậy nó phải thật nhẹ: một listener bàn phím, một chút state,
 * và không import gì thuộc tầng tìm kiếm.
 *
 * Tìm kiếm giờ nằm thẳng ở ô trên header (`HeaderSearch`) chứ không còn là hộp
 * thoại, nên việc của `/` và `Ctrl+K` chỉ là đưa con trỏ về đúng ô đang có mặt:
 * ô lớn giữa trang chủ nếu đang ở trang chủ, còn lại là ô ở header.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { ID_O_TIM_KIEM, ID_O_TIM_KIEM_HEADER } from "../lib/su-kien.ts";

const ShortcutHelp = dynamic(() => import("./ShortcutHelp.tsx"), { ssr: false });

/** Đang gõ trong ô nhập thì phím tắt một ký tự phải nhường chỗ. */
function dangGoChu(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/** Ô lớn của trang chủ được ưu tiên; trang nào không có nó thì dùng ô ở header. */
function veOTimKiem() {
  const el =
    document.getElementById(ID_O_TIM_KIEM) ?? document.getElementById(ID_O_TIM_KIEM_HEADER);
  if (!(el instanceof HTMLInputElement)) return;
  el.focus();
  el.select();
}

export function SearchTrigger() {
  const [moHelp, setMoHelp] = useState(false);

  const dong = useCallback(() => setMoHelp(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ctrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (ctrlK) {
        e.preventDefault();
        veOTimKiem();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (dangGoChu(e.target)) return;

      if (e.key === "/") {
        e.preventDefault();
        veOTimKiem();
      } else if (e.key === "?") {
        e.preventDefault();
        setMoHelp(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return moHelp ? <ShortcutHelp onDong={dong} /> : null;
}
