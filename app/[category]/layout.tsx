/**
 * Phase 3 — khung hai cột dùng chung cho trang nhóm và trang chi tiết.
 *
 * Sidebar nằm ở layout chứ không ở từng page: chuyển giữa các entry cùng nhóm
 * thì Next giữ nguyên phần layout, chỉ đổi phần trong.
 */
import { Sidebar } from "../../components/Sidebar.tsx";
import { isCategory } from "../../lib/types.ts";

export default async function LayoutNhom(props: LayoutProps<"/[category]">) {
  const { category } = await props.params;

  return (
    <div className="grid gap-6 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10 xl:grid-cols-[15rem_minmax(0,1fr)]">
      {/*
        `min-w-0` không phải cho đẹp: ô lưới mặc định rộng tối thiểu bằng
        max-content của nó, mà max-content của sidebar là cả 15 chip xếp ngang
        (~2000px). Thiếu nó thì `overflow-x-auto` của thanh chip vô hiệu và cả
        TRANG bị đẩy trượt ngang trên điện thoại.
      */}
      <aside className="min-w-0 md:sticky md:top-20 md:self-start">
        <Sidebar dangMo={isCategory(category) ? category : undefined} />
      </aside>
      <div className="min-w-0">{props.children}</div>
    </div>
  );
}
