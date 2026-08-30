/**
 * Phase 3b — trang search.
 *
 * Trang này (và chỉ trang này) tải `search-index.json`. Vỏ ngoài vẫn là Server
 * Component — số lượng entry mỗi nhóm tính sẵn lúc build và truyền xuống, nên
 * lưới 15 nhóm hiện ngay cả trước khi index kịp tải.
 */
import { countByCategory, entries, meta } from "../data/index.ts";
import { categoriesInOrder } from "../lib/entries.ts";
import { Search } from "../components/Search.tsx";

export default function TrangChu() {
  const soNhom = categoriesInOrder().length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 xl:max-w-5xl 2xl:max-w-6xl">
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 pt-4 text-center sm:pt-8">
        <h1 className="text-gradient text-4xl font-extrabold tracking-tight sm:text-6xl">
          Playwright Cheatsheet
        </h1>
        <p className="text-muted max-w-xl text-[15px] leading-relaxed sm:text-base">
          Tra cứu nhanh cú pháp Playwright — mỗi mục có ví dụ chạy được đã qua{" "}
          <code className="text-accent font-mono text-sm">tsc</code>, giải thích tiếng Việt, và link
          tới docs gốc. Gõ sai chính tả vẫn tìm ra.
        </p>

        {/* Ba con số cùng một thẻ kính — đúng dải thông tin "Quick Overview" của thiết kế. */}
        <dl className="glass mt-1 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl px-6 py-4 text-sm">
          <So so={entries.length} nhan="cú pháp" />
          <So so={soNhom} nhan="nhóm" />
          <div className="flex flex-col items-center">
            <dt className="text-muted order-2 text-xs tracking-wider uppercase">nguồn dữ liệu</dt>
            <dd className="text-accent order-1 font-mono text-sm font-semibold">
              {meta.generatedFrom}
            </dd>
          </div>
        </dl>
      </section>

      <Search demTheoNhom={countByCategory()} />
    </div>
  );
}

function So({ so, nhan }: { so: number; nhan: string }) {
  return (
    <div className="flex flex-col items-center">
      {/* `order` đảo chỗ: số to nằm trên, nhãn nằm dưới — nhưng trong DOM `dt`
          vẫn phải đứng trước `dd` của nó. */}
      <dt className="text-muted order-2 text-xs tracking-wider uppercase">{nhan}</dt>
      <dd className="text-gradient order-1 text-2xl font-bold tabular-nums">{so}</dd>
    </div>
  );
}
