"use client";

/**
 * Phase 3 — danh sách kết quả, có tô sáng đoạn khớp.
 * Phase 4 — thêm mục đang chọn (`↑ ↓`) và prefetch 5 kết quả đầu.
 *
 * Tô sáng dùng `highlight()` của Phase 2: nó trả về mảng đoạn `{text, hit}`
 * chứ không trả chuỗi HTML, nên ở đây render `<mark>` bằng JSX bình thường —
 * không đụng tới `dangerouslySetInnerHTML` cho nội dung lấy từ dữ liệu.
 */
import Link from "next/link";
import { highlight, matchIndices, type SearchHit } from "../lib/search.ts";
import { getCategory, hrefOf, type SearchIndexEntry } from "../lib/types.ts";

/** Bao nhiêu kết quả đầu được tải trước. */
export const SO_PREFETCH = 5;

/** Tô sáng một field của kết quả. */
function ToSang({
  hit,
  field,
  className,
}: {
  hit: SearchHit;
  field: keyof SearchIndexEntry;
  className?: string;
}) {
  const text = String(hit.entry[field] ?? "");
  const doan = highlight(text, matchIndices(hit, field));
  return (
    <span className={className}>
      {doan.map((d, i) =>
        d.hit ? (
          <mark key={i} className="rounded-sm bg-accent/20 text-inherit">
            {d.text}
          </mark>
        ) : (
          <span key={i}>{d.text}</span>
        ),
      )}
    </span>
  );
}

export function SearchResults({
  hits,
  index = -1,
  chon,
  refMuc,
  onMo,
}: {
  hits: SearchHit[];
  /** Mục đang chọn bằng bàn phím. -1 = không chọn gì. */
  index?: number;
  chon?: (i: number) => void;
  refMuc?: (i: number) => (el: HTMLElement | null) => void;
  /** Gọi khi người dùng thật sự mở một kết quả — để ghi vào "tìm gần đây". */
  onMo?: () => void;
}) {
  return (
    // `listbox`/`option` để trình đọc màn hình hiểu đây là danh sách chọn được
    // bằng bàn phím, không phải một danh sách link thường.
    <ul role="listbox" aria-label="Kết quả tìm kiếm" className="flex flex-col gap-1.5">
      {hits.map((hit, i) => {
        const nhom = getCategory(hit.entry.category);
        const dangChon = i === index;
        return (
          <li key={`${hit.entry.category}/${hit.entry.id}`} role="option" aria-selected={dangChon}>
            <Link
              ref={refMuc?.(i)}
              href={hit.href}
              // Chỉ tải trước 5 cái đầu. Để mặc định thì mọi link lọt vào tầm
              // nhìn đều được tải trước — 50 kết quả là 50 lượt tải phí.
              prefetch={i < SO_PREFETCH ? undefined : false}
              onMouseEnter={() => chon?.(i)}
              onClick={onMo}
              className={
                "group flex flex-col gap-1 rounded-xl border px-3 py-2.5 transition-colors " +
                (dangChon
                  ? "border-accent bg-surface"
                  : "border-transparent hover:border-border hover:bg-surface")
              }
            >
              <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <ToSang
                  hit={hit}
                  field="title"
                  className={
                    "font-mono text-[15px] font-medium " +
                    (dangChon ? "text-accent" : "group-hover:text-accent")
                  }
                />
                <span className="text-xs text-muted">{nhom?.name ?? hit.entry.category}</span>
              </span>
              <ToSang
                hit={hit}
                field="description"
                className="line-clamp-2 text-sm leading-relaxed text-muted"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** "Ý bạn là…" — chỉ hiện khi tìm không ra gì mà vẫn có cái gần đúng. */
export function Suggestions({ items }: { items: SearchIndexEntry[] }) {
  if (items.length === 0) return null;
  return (
    <p className="text-sm text-muted">
      Ý bạn là:{" "}
      {items.map((e, i) => (
        <span key={`${e.category}/${e.id}`}>
          {i > 0 && ", "}
          <Link href={hrefOf(e)} className="font-mono text-accent underline-offset-4 hover:underline">
            {e.title}
          </Link>
        </span>
      ))}
      ?
    </p>
  );
}
