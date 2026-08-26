"use client";

/**
 * Phase 3 — chip lọc theo nhóm, kèm số kết quả của từng nhóm.
 *
 * Chỉ hiện nhóm CÓ kết quả cho truy vấn hiện tại — bày ra 15 chip mà 12 cái
 * bấm vào ra trắng thì chỉ tổ làm người ta bấm hụt.
 */
import { categoriesInOrder } from "../lib/entries.ts";
import type { Category } from "../lib/types.ts";

export function CategoryFilter({
  countByCategory,
  tong,
  dangChon,
  onChon,
}: {
  countByCategory: Record<string, number>;
  tong: number;
  dangChon: Category | null;
  onChon: (c: Category | null) => void;
}) {
  const coKetQua = categoriesInOrder().filter((c) => (countByCategory[c.slug] ?? 0) > 0);
  if (coKetQua.length === 0) return null;

  return (
    <div
      role="group"
      aria-label="Lọc theo nhóm"
      className="flex flex-wrap gap-1.5"
    >
      <Chip dangChon={dangChon === null} onClick={() => onChon(null)}>
        Tất cả <Dem>{tong}</Dem>
      </Chip>

      {coKetQua.map((c) => (
        <Chip key={c.slug} dangChon={dangChon === c.slug} onClick={() => onChon(c.slug)}>
          {c.name} <Dem>{countByCategory[c.slug]}</Dem>
        </Chip>
      ))}
    </div>
  );
}

function Chip({
  dangChon,
  onClick,
  children,
}: {
  dangChon: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={dangChon}
      className={
        "cursor-pointer rounded-full border px-3 py-1 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
        (dangChon
          ? "border-accent bg-accent text-accent-fg"
          : "border-border text-muted hover:border-accent hover:text-accent")
      }
    >
      {children}
    </button>
  );
}

function Dem({ children }: { children: React.ReactNode }) {
  return <span className="ml-0.5 tabular-nums opacity-70">{children}</span>;
}
