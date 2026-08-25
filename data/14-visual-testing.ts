/**
 * Nhóm 14 — Visual testing.
 *
 * So sánh ảnh rất dễ báo động giả: khác font, khác GPU, khác hệ điều hành là ra
 * khác biệt dù giao diện không đổi. Nên quy tắc thực dụng:
 *   - chạy so ảnh trong Docker hoặc trên CI, đừng so giữa máy cá nhân
 *   - che (`mask`) mọi vùng động: giờ, avatar, quảng cáo
 *   - phần logic thì dùng assertion thường, chỉ để so ảnh cho phần thật sự về hình
 */
import { entry, standalone } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "visual-testing" as const;
const DOC_SNAP = "https://playwright.dev/docs/test-snapshots";

export const visualTesting: CheatEntry[] = [
  entry("PageAssertions.toHaveScreenshot#1", CAT, {
    id: "to-have-screenshot",
    title: "expect(page).toHaveScreenshot()",
    description:
      "Chụp trang và so với ảnh chuẩn. Lần chạy đầu tự tạo ảnh chuẩn và báo thất bại — đó là hành vi cố ý.",
    code: `await page.goto('/');
await expect(page).toHaveScreenshot('trang-chu.png');`,
    tags: ["visual", "screenshot", "snapshot", "recommended"],
    related: ["to-have-screenshot-locator", "max-diff-pixels", "mask"],
    note: "Ảnh chuẩn phụ thuộc hệ điều hành và font. Nên tạo ảnh chuẩn trên đúng môi trường mà CI sẽ chạy.",
  }),

  entry("LocatorAssertions.toHaveScreenshot#1", CAT, {
    id: "to-have-screenshot-locator",
    title: "expect(locator).toHaveScreenshot()",
    description:
      "Chỉ so ảnh của một phần tử. Ổn định hơn so cả trang rất nhiều vì ít vùng động hơn.",
    code: `await expect(page.getByRole('article').first()).toHaveScreenshot('the-bai-viet.png');`,
    tags: ["visual", "screenshot", "component", "recommended"],
    related: ["to-have-screenshot", "mask"],
  }),

  standalone(CAT, {
    id: "max-diff-pixels",
    title: "maxDiffPixels",
    signature: "toHaveScreenshot({ maxDiffPixels: 100 })",
    description:
      "Cho phép lệch tối đa bao nhiêu điểm ảnh. Dùng để bỏ qua nhiễu nhỏ do khử răng cưa.",
    code: `await expect(page).toHaveScreenshot('trang-chu.png', { maxDiffPixels: 100 });`,
    tags: ["visual", "screenshot", "tolerance", "diff"],
    docsUrl: DOC_SNAP,
    related: ["max-diff-pixel-ratio", "threshold", "to-have-screenshot"],
  }),

  standalone(CAT, {
    id: "max-diff-pixel-ratio",
    title: "maxDiffPixelRatio",
    signature: "toHaveScreenshot({ maxDiffPixelRatio: 0.01 })",
    description:
      "Cho phép lệch tối đa bao nhiêu phần trăm tổng số điểm ảnh. Hợp hơn maxDiffPixels khi ảnh có nhiều kích cỡ khác nhau.",
    code: `await expect(page).toHaveScreenshot('trang-chu.png', { maxDiffPixelRatio: 0.01 });`,
    tags: ["visual", "screenshot", "tolerance", "diff"],
    docsUrl: DOC_SNAP,
    related: ["max-diff-pixels", "threshold"],
  }),

  standalone(CAT, {
    id: "threshold",
    title: "threshold",
    signature: "toHaveScreenshot({ threshold: 0.2 })",
    description:
      "Ngưỡng khác biệt màu chấp nhận được cho từng điểm ảnh, từ 0 đến 1. Mặc định 0.2.",
    code: `await expect(page).toHaveScreenshot('trang-chu.png', { threshold: 0.3 });`,
    tags: ["visual", "screenshot", "tolerance", "color"],
    docsUrl: DOC_SNAP,
    related: ["max-diff-pixels", "max-diff-pixel-ratio"],
  }),

  standalone(CAT, {
    id: "mask",
    title: "mask",
    signature: "toHaveScreenshot({ mask: [locator, …] })",
    description:
      "Che vùng động bằng ô màu đặc trước khi so sánh. Đây là cách chính để test ảnh khỏi chập chờn.",
    code: `await expect(page).toHaveScreenshot('bang-dieu-khien.png', {
  mask: [page.getByTestId('gio-hien-tai'), page.getByRole('img', { name: 'Ảnh đại diện' })],
});`,
    tags: ["visual", "screenshot", "mask", "dynamic", "recommended"],
    docsUrl: DOC_SNAP,
    related: ["to-have-screenshot", "animations"],
  }),

  standalone(CAT, {
    id: "animations",
    title: "animations: 'disabled'",
    signature: "toHaveScreenshot({ animations: 'disabled' })",
    description:
      "Tắt CSS animation và transition trước khi chụp. Mặc định đã bật sẵn — nhớ nó tồn tại khi ảnh vẫn lệch.",
    code: `await expect(page).toHaveScreenshot('menu.png', { animations: 'disabled' });`,
    tags: ["visual", "screenshot", "animation", "stability"],
    docsUrl: DOC_SNAP,
    related: ["mask", "to-have-screenshot"],
  }),

  standalone(CAT, {
    id: "full-page-screenshot",
    title: "fullPage",
    signature: "toHaveScreenshot({ fullPage: true })",
    description: "Chụp cả trang kể cả phần phải cuộn mới thấy, không chỉ khung nhìn.",
    code: `await expect(page).toHaveScreenshot('toan-trang.png', { fullPage: true });`,
    tags: ["visual", "screenshot", "fullpage", "scroll"],
    docsUrl: DOC_SNAP,
    related: ["to-have-screenshot", "page/screenshot"],
  }),

  entry("SnapshotAssertions.toMatchSnapshot#1", CAT, {
    id: "to-match-snapshot",
    title: "expect(value).toMatchSnapshot()",
    description:
      "So chuỗi hoặc Buffer bất kỳ với tệp chuẩn. Dùng cho nội dung không phải ảnh: JSON, HTML, văn bản.",
    code: `const html = await page.getByRole('main').innerHTML();
expect(html).toMatchSnapshot('noi-dung-chinh.html');`,
    tags: ["visual", "snapshot", "text", "json"],
    related: ["to-have-screenshot", "assertions/to-match-aria-snapshot"],
  }),

  entry("LocatorAssertions.toMatchAriaSnapshot", CAT, {
    id: "to-match-aria-snapshot",
    title: "expect(locator).toMatchAriaSnapshot()",
    description:
      "So cấu trúc accessibility thay vì so từng điểm ảnh. Bắt được thay đổi có ý nghĩa mà không vỡ vì lệch font hay màu.",
    code: `await expect(page.getByRole('navigation')).toMatchAriaSnapshot(\`
  - navigation:
    - link "Trang chủ"
    - link "Sản phẩm"
    - link "Liên hệ"
\`);`,
    tags: ["visual", "a11y", "snapshot", "structure", "recommended"],
    related: ["to-have-screenshot", "assertions/to-match-aria-snapshot"],
    note: "Thường là lựa chọn tốt hơn so ảnh: ổn định giữa các máy mà vẫn bắt được thay đổi thật về cấu trúc giao diện.",
  }),

  entry("TestConfig.snapshotPathTemplate", CAT, {
    id: "snapshot-path-template",
    description:
      "Đặt quy tắc đường dẫn tệp ảnh chuẩn. Dùng để tách ảnh theo hệ điều hành hoặc theo trình duyệt.",
    code: `export default defineConfig({
  snapshotPathTemplate: '{testDir}/__anh__/{platform}/{projectName}/{arg}{ext}',
});`,
    tags: ["visual", "snapshot", "path", "config"],
    related: ["config/update-snapshots", "to-have-screenshot"],
  }),

  entry("TestConfig.ignoreSnapshots", CAT, {
    id: "ignore-snapshots",
    description:
      "Bỏ qua toàn bộ assertion so ảnh. Dùng khi chạy trên môi trường không đảm bảo render giống nhau.",
    code: `export default defineConfig({
  ignoreSnapshots: !process.env.CI,
});`,
    tags: ["visual", "snapshot", "config", "skip"],
    related: ["config/update-snapshots", "to-have-screenshot"],
  }),
];

export default visualTesting;
