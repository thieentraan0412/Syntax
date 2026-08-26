"use client";

/**
 * Phase 4 — chỗ duy nhất bắt phím tắt toàn trang.
 *
 * Component này nằm ở layout gốc nên có mặt trên **mọi** trang, kể cả 322 trang
 * chi tiết SSG. Vì vậy nó phải thật nhẹ: chỉ có một listener bàn phím và một
 * chút state. Toàn bộ phần nặng — overlay tìm kiếm, `useSearch`, `fuse.js`,
 * `search-index.json` — nằm sau `next/dynamic`, chỉ tải khi người ta thật sự mở.
 *
 * Đây là cách giữ lời hứa "trang chi tiết không trả tiền cho tìm kiếm" của mục
 * 3.1 trong khi vẫn làm được mục "search overlay gọi từ mọi trang" của Phase 4.
 */
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const SearchOverlay = dynamic(() => import("./SearchOverlay.tsx"), { ssr: false });
const ShortcutHelp = dynamic(() => import("./ShortcutHelp.tsx"), { ssr: false });

type Hop = "none" | "search" | "help";

/** Đang gõ trong ô nhập thì phím tắt một ký tự phải nhường chỗ. */
function dangGoChu(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

export function SearchTrigger() {
  const [hop, setHop] = useState<Hop>("none");
  const duongDan = usePathname();

  // Trang chủ đã có ô search to đùng ngay giữa màn hình; mở thêm overlay đè lên
  // nó là thừa. Ở đó `/` và Ctrl+K do SearchBar lo.
  const laTrangChu = duongDan === "/";

  const dong = useCallback(() => setHop("none"), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ctrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";

      if (ctrlK && !laTrangChu) {
        e.preventDefault();
        setHop("search");
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (dangGoChu(e.target)) return;

      if (e.key === "/" && !laTrangChu) {
        e.preventDefault();
        setHop("search");
      } else if (e.key === "?") {
        e.preventDefault();
        setHop("help");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [laTrangChu]);

  return (
    <>
      {hop === "search" && <SearchOverlay onDong={dong} />}
      {hop === "help" && <ShortcutHelp onDong={dong} />}
    </>
  );
}
