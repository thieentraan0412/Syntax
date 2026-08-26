/**
 * Phase 3b — trang search.
 *
 * Trang này (và chỉ trang này) tải `search-index.json`. Vỏ ngoài vẫn là Server
 * Component — số lượng entry mỗi nhóm tính sẵn lúc build và truyền xuống, nên
 * lưới 15 nhóm hiện ngay cả trước khi index kịp tải.
 */
import { countByCategory, entries } from "../data/index.ts";
import { Search } from "../components/Search.tsx";

export default function TrangChu() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Tra cứu cú pháp Playwright
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          {entries.length} hàm, tuỳ chọn và lệnh — mỗi mục có ví dụ chạy được đã qua{" "}
          <code className="font-mono text-sm">tsc</code>, giải thích tiếng Việt, và link tới docs
          gốc. Gõ sai chính tả vẫn tìm ra.
        </p>
      </section>

      <Search demTheoNhom={countByCategory()} />
    </div>
  );
}
