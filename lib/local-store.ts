"use client";

/**
 * Phase 4 — kho localStorage đọc được bằng `useSyncExternalStore`.
 *
 * Cả "tìm gần đây" lẫn "ghim yêu thích" đều là cùng một bài toán: một danh sách
 * nằm ngoài React, cần đọc lúc render mà không được gọi setState trong effect
 * (rule `react-hooks/set-state-in-effect` — đã vấp một lần ở Phase 2).
 *
 * `useSyncExternalStore` sinh ra đúng cho việc này, nên gom lại một chỗ thay vì
 * viết hai lần.
 */

export type LocalStore<T> = {
  /** Ảnh chụp hiện tại. Giữ NGUYÊN tham chiếu khi chưa đổi — React so bằng Object.is. */
  get(): readonly T[];
  /** Ảnh chụp phía server: luôn rỗng, vì server không biết localStorage. */
  getServer(): readonly T[];
  subscribe(cb: () => void): () => void;
  /** Đẩy một mục lên đầu, bỏ trùng, cắt còn `max`. */
  them(item: T): void;
  bo(item: T): void;
  /** Có trong danh sách chưa. */
  co(item: T): boolean;
  xoaHet(): void;
};

const RONG: readonly never[] = Object.freeze([]);

export function createLocalStore<T>(
  key: string,
  max: number,
  laBang: (a: T, b: T) => boolean,
): LocalStore<T> {
  let cache: readonly T[] | undefined;
  let listeners: (() => void)[] = [];

  function doc(): readonly T[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return RONG;
      const v: unknown = JSON.parse(raw);
      return Array.isArray(v) ? (v.slice(0, max) as T[]) : RONG;
    } catch {
      // JSON hỏng hoặc localStorage bị chặn — coi như chưa có gì, đừng làm sập trang.
      return RONG;
    }
  }

  function get(): readonly T[] {
    // `??=` chứ không đọc mỗi lần: React gọi getSnapshot rất nhiều, mà trả về
    // mảng mới mỗi lượt là vòng lặp render vô tận.
    cache ??= doc();
    return cache;
  }

  function ghi(next: readonly T[]) {
    cache = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Hết quota hoặc chế độ riêng tư — lựa chọn chỉ sống trong phiên này.
    }
    for (const l of listeners) l();
  }

  return {
    get,
    getServer: () => RONG,

    subscribe(cb) {
      listeners.push(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key) return;
        cache = doc();
        cb();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners = listeners.filter((l) => l !== cb);
        window.removeEventListener("storage", onStorage);
      };
    },

    them(item) {
      ghi([item, ...get().filter((x) => !laBang(x, item))].slice(0, max));
    },

    bo(item) {
      const con = get().filter((x) => !laBang(x, item));
      if (con.length !== get().length) ghi(con);
    },

    co(item) {
      return get().some((x) => laBang(x, item));
    },

    xoaHet() {
      ghi(RONG);
    },
  };
}
