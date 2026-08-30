"use client";

/**
 * Phase 3 — đổi sáng / tối.
 *
 * Ba trạng thái: theo hệ thống → sáng → tối → quay lại theo hệ thống. "Theo hệ
 * thống" là mặc định, và là trạng thái KHÔNG ghi gì vào localStorage — nhờ vậy
 * người chưa bao giờ bấm nút này thì luôn đi theo cài đặt máy của họ.
 *
 * Dùng `useSyncExternalStore` chứ không phải `useEffect` + `setState`: lựa chọn
 * theme nằm ngoài React (localStorage + thuộc tính trên <html>), mà đó đúng là
 * việc `useSyncExternalStore` sinh ra để làm. Đọc bằng effect thì vừa nháy một
 * lượt render thừa, vừa vướng đúng cái rule `react-hooks/set-state-in-effect`.
 */
import { useSyncExternalStore } from "react";

type LuaChon = "light" | "dark" | null;

const KEY = "theme";

let hienTai: LuaChon | undefined;
let listeners: (() => void)[] = [];

function doc(): LuaChon {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    // localStorage bị chặn (chế độ riêng tư của vài trình duyệt) — coi như chưa chọn.
    return null;
  }
}

function getSnapshot(): LuaChon {
  hienTai ??= doc();
  return hienTai;
}

/** Server không biết lựa chọn của người dùng — luôn là "theo hệ thống". */
function getServerSnapshot(): LuaChon {
  return null;
}

function subscribe(cb: () => void): () => void {
  listeners.push(cb);
  // Đổi theme ở tab khác thì tab này cũng đổi theo.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    hienTai = doc();
    apDung(hienTai);
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Gỡ hẳn thuộc tính khi về "theo hệ thống" — để @media trong CSS lại có hiệu lực. */
function apDung(c: LuaChon) {
  const el = document.documentElement;
  if (c === null) el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", c);
}

function dat(c: LuaChon) {
  hienTai = c;
  try {
    if (c === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, c);
  } catch {
    // Không ghi được thì thôi, lựa chọn chỉ sống trong phiên này.
  }
  apDung(c);
  for (const l of listeners) l();
}

const VONG: Record<string, LuaChon> = { null: "light", light: "dark", dark: null };
const NHAN: Record<string, { icon: string; text: string }> = {
  null: { icon: "◐", text: "Theo hệ thống" },
  light: { icon: "☀", text: "Sáng" },
  dark: { icon: "☾", text: "Tối" },
};

export function ThemeToggle() {
  const chon = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const key = String(chon);
  const nhan = NHAN[key];

  return (
    <button
      type="button"
      onClick={() => dat(VONG[key])}
      title={`Giao diện: ${nhan.text} — bấm để đổi`}
      aria-label={`Giao diện: ${nhan.text}. Bấm để đổi.`}
      className="glass text-muted hover:text-accent focus-visible:outline-accent flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span aria-hidden className="text-base leading-none">
        {nhan.icon}
      </span>
    </button>
  );
}
