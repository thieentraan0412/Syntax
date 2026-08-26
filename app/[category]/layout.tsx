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
    <div className="grid gap-6 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-10">
      <aside className="md:sticky md:top-20 md:self-start">
        <Sidebar dangMo={isCategory(category) ? category : undefined} />
      </aside>
      <div className="min-w-0">{props.children}</div>
    </div>
  );
}
