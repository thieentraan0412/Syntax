/**
 * Nhóm 4 — Locators.
 *
 * Nhóm được tra nhiều nhất. Nguyên tắc xuyên suốt: ưu tiên locator mà người dùng
 * thật "nhìn thấy" (role, text, label) hơn là selector bám vào cấu trúc DOM
 * (CSS, XPath) — đổi giao diện thì CSS vỡ, còn getByRole thì không.
 */
import { entry } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "locators" as const;

export const locators: CheatEntry[] = [
  entry("Page.getByRole", CAT, {
    id: "get-by-role",
    description:
      "Tìm phần tử theo vai trò accessibility (button, link, checkbox…) và tên hiển thị. Đây là cách nên dùng đầu tiên cho mọi thứ người dùng nhìn thấy và bấm được.",
    code: `await page.getByRole('button', { name: 'Đăng nhập' }).click();
await page.getByRole('link', { name: 'Trang chủ' }).click();
await expect(page.getByRole('heading', { name: 'Bảng điều khiển' })).toBeVisible();`,
    tags: ["locator", "role", "a11y", "recommended", "getby"],
    paramNotes: {
      role: "Vai trò ARIA: button, link, heading, checkbox, textbox, listitem…",
    },
    related: ["get-by-label", "get-by-text", "get-by-test-id"],
    note: "Ưu tiên getByRole hơn CSS selector: nó phản ánh cách người dùng và trình đọc màn hình nhìn trang, nên không vỡ khi đổi class hay cấu trúc HTML.",
  }),

  entry("Page.getByText", CAT, {
    id: "get-by-text",
    description:
      "Tìm phần tử theo nội dung chữ bên trong. Hợp với đoạn văn, nhãn tĩnh, thông báo — không hợp với nút bấm (dùng getByRole).",
    code: `await expect(page.getByText('Đăng nhập thành công')).toBeVisible();

// Khớp chính xác cả chuỗi, phân biệt hoa thường
await expect(page.getByText('Xong', { exact: true })).toBeVisible();

// Khớp theo biểu thức chính quy
await expect(page.getByText(/còn \\d+ sản phẩm/)).toBeVisible();`,
    tags: ["locator", "text", "getby"],
    related: ["get-by-role", "get-by-label"],
    note: "Mặc định khớp một phần và bỏ qua hoa thường; truyền `{ exact: true }` để khớp trọn chuỗi.",
  }),

  entry("Page.getByLabel", CAT, {
    id: "get-by-label",
    description:
      "Tìm ô nhập liệu theo nhãn `<label>` gắn với nó. Cách chuẩn nhất để trỏ vào form.",
    code: `await page.getByLabel('Mật khẩu').fill('bí-mật-123');
await page.getByLabel('Nhớ đăng nhập').check();`,
    tags: ["locator", "form", "input", "a11y", "getby"],
    related: ["get-by-placeholder", "get-by-role", "actions/fill"],
  }),

  entry("Page.getByPlaceholder", CAT, {
    id: "get-by-placeholder",
    description:
      "Tìm ô nhập liệu theo chữ mờ trong ô (placeholder). Dùng khi ô không có `<label>`.",
    code: `await page.getByPlaceholder('you@example.com').fill('an@vidu.vn');`,
    tags: ["locator", "form", "input", "getby"],
    related: ["get-by-label"],
    note: "Placeholder không thay thế được label về mặt accessibility — nếu sửa được HTML thì thêm `<label>` rồi dùng getByLabel.",
  }),

  entry("Page.getByTestId", CAT, {
    id: "get-by-test-id",
    description:
      "Tìm theo thuộc tính `data-testid`. Lối thoát khi phần tử không có role, text hay label nào ổn định.",
    code: `await page.getByTestId('gio-hang').click();`,
    tags: ["locator", "testid", "getby"],
    related: ["get-by-role", "config/test-id-attribute"],
    note: "Đổi tên thuộc tính bằng `testIdAttribute` trong playwright.config.ts nếu dự án dùng `data-test` hay `data-cy`.",
  }),

  entry("Page.getByAltText", CAT, {
    id: "get-by-alt-text",
    description: "Tìm ảnh (hoặc phần tử có thuộc tính `alt`) theo chữ mô tả ảnh.",
    code: `await expect(page.getByAltText('Logo công ty')).toBeVisible();`,
    tags: ["locator", "image", "a11y", "getby"],
    related: ["get-by-title", "get-by-role"],
  }),

  entry("Page.getByTitle", CAT, {
    id: "get-by-title",
    description: "Tìm phần tử theo thuộc tính `title` — chữ hiện ra khi rê chuột.",
    code: `await expect(page.getByTitle('Số mục còn lại')).toHaveText('25');`,
    tags: ["locator", "tooltip", "getby"],
    related: ["get-by-alt-text"],
  }),

  entry("Page.locator", CAT, {
    id: "locator",
    description:
      "Tạo locator từ CSS selector hoặc XPath. Chỉ dùng khi không có getBy* nào phù hợp.",
    code: `await page.locator('css=.gio-hang').click();
await page.locator('#dang-nhap').fill('an');

// Playwright tự đoán CSS hay XPath
await page.locator('//button[@type="submit"]').click();`,
    tags: ["locator", "css", "xpath", "selector"],
    related: ["get-by-role", "filter", "nth"],
    note: "CSS và XPath bám vào cấu trúc DOM nên vỡ mỗi lần đổi giao diện. Ưu tiên getByRole / getByLabel / getByText trước.",
  }),

  entry("Locator.filter", CAT, {
    id: "filter",
    description:
      "Lọc bớt trong tập phần tử đã tìm được, theo chữ bên trong hoặc theo locator con. Dùng để chọn đúng một dòng trong danh sách.",
    code: `const dong = page.getByRole('listitem').filter({ hasText: 'Sản phẩm B' });
await dong.getByRole('button', { name: 'Xoá' }).click();

// Lọc theo phần tử con
await page
  .getByRole('listitem')
  .filter({ has: page.getByRole('button', { name: 'Mua' }) })
  .first()
  .click();`,
    tags: ["locator", "filter", "list", "chaining"],
    related: ["nth", "first", "and", "or"],
  }),

  entry("Locator.first", CAT, {
    id: "first",
    description:
      "Lấy phần tử đầu tiên khi locator khớp nhiều phần tử.",
    code: `await page.getByRole('listitem').first().click();`,
    tags: ["locator", "index", "list"],
    related: ["last", "nth", "filter"],
    note: "Nếu phải dùng first() để test chạy được, thường là locator chưa đủ cụ thể — cân nhắc filter() cho rõ ý.",
  }),

  entry("Locator.last", CAT, {
    id: "last",
    description: "Lấy phần tử cuối cùng khi locator khớp nhiều phần tử.",
    code: `await page.getByRole('listitem').last().click();`,
    tags: ["locator", "index", "list"],
    related: ["first", "nth"],
  }),

  entry("Locator.nth", CAT, {
    id: "nth",
    description: "Lấy phần tử thứ n (đếm từ 0). Truyền -1 để lấy phần tử cuối.",
    code: `await page.getByRole('listitem').nth(2).click();`,
    tags: ["locator", "index", "list"],
    related: ["first", "last", "filter"],
  }),

  entry("Locator.and", CAT, {
    id: "and",
    description:
      "Yêu cầu phần tử khớp đồng thời cả hai locator. Dùng khi một điều kiện chưa đủ phân biệt.",
    code: `const nut = page.getByRole('button').and(page.getByTitle('Đăng ký'));
await nut.click();`,
    tags: ["locator", "combine", "chaining"],
    related: ["or", "filter"],
  }),

  entry("Locator.or", CAT, {
    id: "or",
    description:
      "Khớp một trong hai locator. Dùng khi giao diện có thể hiện ra một trong hai dạng.",
    code: `const hopThoai = page.getByRole('button', { name: 'Đồng ý' });
const nutMoi = page.getByRole('button', { name: 'Tạo mới' });
await expect(hopThoai.or(nutMoi).first()).toBeVisible();`,
    tags: ["locator", "combine", "chaining"],
    related: ["and", "filter"],
  }),

  entry("Locator.locator", CAT, {
    id: "locator-chaining",
    title: "locator.locator()",
    description:
      "Tìm tiếp bên trong một locator đã có. Đây là cách thu hẹp phạm vi tìm kiếm về đúng một vùng của trang.",
    code: `const bang = page.getByRole('table');
await bang.getByRole('row').filter({ hasText: 'An' }).getByRole('button').click();`,
    tags: ["locator", "chaining", "scope"],
    related: ["filter", "locator"],
  }),

  entry("Locator.count", CAT, {
    id: "count",
    description:
      "Đếm số phần tử khớp. Trả kết quả ngay, không chờ — muốn chờ đủ số lượng thì dùng expect().toHaveCount().",
    code: `const soDong = await page.getByRole('listitem').count();
expect(soDong).toBeGreaterThan(0);`,
    tags: ["locator", "count", "list"],
    related: ["assertions/to-have-count", "all"],
    note: "count() không tự chờ. Dùng `await expect(locator).toHaveCount(3)` nếu danh sách còn đang tải.",
  }),

  entry("Locator.all", CAT, {
    id: "all",
    description:
      "Trả về mảng locator, mỗi cái trỏ vào một phần tử khớp. Dùng để duyệt qua danh sách.",
    code: `for (const muc of await page.getByRole('listitem').all()) {
  await expect(muc).toBeVisible();
}`,
    tags: ["locator", "list", "loop"],
    related: ["count", "nth"],
    note: "all() không chờ phần tử xuất hiện. Danh sách tải động thì phải chờ trước, ví dụ `await expect(ds).toHaveCount(5)`.",
  }),

  entry("Page.frameLocator", CAT, {
    id: "frame-locator",
    description:
      "Trỏ vào bên trong một `<iframe>` rồi tìm tiếp như trang bình thường.",
    code: `await page.frameLocator('#khung-thanh-toan').getByLabel('Số thẻ').fill('4242424242424242');`,
    tags: ["locator", "iframe", "frame"],
    related: ["frames-dialogs/frame-locator-nested"],
  }),

  entry("Locator.waitFor", CAT, {
    id: "wait-for",
    description:
      "Chờ phần tử đạt trạng thái mong muốn (attached, detached, visible, hidden). Hầu hết trường hợp không cần vì action và expect đã tự chờ.",
    code: `await page.getByText('Đang tải…').waitFor({ state: 'hidden' });`,
    tags: ["locator", "wait", "state"],
    related: ["assertions/to-be-visible"],
    note: "Cần waitFor thường là dấu hiệu nên dùng expect() thay thế — expect vừa chờ vừa báo lỗi rõ ràng hơn khi thất bại.",
  }),

  entry("Locator.textContent", CAT, {
    id: "text-content",
    description:
      "Đọc chữ thô bên trong phần tử, kể cả phần bị CSS ẩn. Để kiểm tra thì dùng expect().toHaveText() thay vì so sánh tay.",
    code: `const chu = await page.getByTestId('tong-tien').textContent();
expect(chu).toContain('250.000');`,
    tags: ["locator", "text", "read"],
    related: ["inner-text", "assertions/to-have-text"],
  }),

  entry("Locator.innerText", CAT, {
    id: "inner-text",
    description:
      "Đọc chữ như người dùng thấy — đã áp dụng CSS, bỏ phần bị ẩn. Khác textContent ở chỗ đó.",
    code: `const chu = await page.getByRole('heading').innerText();
expect(chu).toBe('Giỏ hàng');`,
    tags: ["locator", "text", "read"],
    related: ["text-content"],
  }),

  entry("Locator.inputValue", CAT, {
    id: "input-value",
    description: "Đọc giá trị hiện tại của ô input, textarea hoặc select.",
    code: `const email = await page.getByLabel('Email').inputValue();
expect(email).toBe('an@vidu.vn');`,
    tags: ["locator", "form", "input", "read"],
    related: ["assertions/to-have-value", "actions/fill"],
  }),

  entry("Locator.getAttribute", CAT, {
    id: "get-attribute",
    description: "Đọc giá trị một thuộc tính HTML của phần tử.",
    code: `const href = await page.getByRole('link', { name: 'Điều khoản' }).getAttribute('href');
expect(href).toBe('/dieu-khoan');`,
    tags: ["locator", "attribute", "read"],
    related: ["assertions/to-have-attribute"],
  }),

  entry("Locator.isVisible", CAT, {
    id: "is-visible",
    description:
      "Kiểm tra phần tử có đang hiển thị không, trả về ngay lập tức. Dùng để rẽ nhánh, không dùng để kiểm tra kết quả.",
    code: `if (await page.getByText('Chấp nhận cookie').isVisible()) {
  await page.getByRole('button', { name: 'Đồng ý' }).click();
}`,
    tags: ["locator", "state", "visible", "condition"],
    related: ["assertions/to-be-visible", "is-enabled"],
    note: "Không tự chờ. Kiểm tra kết quả test thì phải dùng `await expect(locator).toBeVisible()`, không thì test sẽ chập chờn.",
  }),

  entry("Locator.isEnabled", CAT, {
    id: "is-enabled",
    description: "Kiểm tra phần tử có đang bật (không bị disabled) không, trả về ngay.",
    code: `if (await page.getByRole('button', { name: 'Gửi' }).isEnabled()) {
  await page.getByRole('button', { name: 'Gửi' }).click();
}`,
    tags: ["locator", "state", "enabled", "condition"],
    related: ["is-visible", "assertions/to-be-enabled"],
  }),

  entry("Locator.isChecked", CAT, {
    id: "is-checked",
    description: "Kiểm tra checkbox hoặc radio có đang được tích không, trả về ngay.",
    code: `const daTich = await page.getByLabel('Nhớ đăng nhập').isChecked();
expect(daTich).toBe(true);`,
    tags: ["locator", "state", "checkbox", "condition"],
    related: ["assertions/to-be-checked", "actions/check"],
  }),

  entry("Locator.boundingBox", CAT, {
    id: "bounding-box",
    description:
      "Lấy vị trí và kích thước phần tử trên trang. Dùng cho kiểm tra bố cục hoặc tính toạ độ kéo thả.",
    code: `const khung = await page.getByRole('button').boundingBox();
expect(khung?.width).toBeGreaterThan(100);`,
    tags: ["locator", "layout", "position"],
    related: ["actions/drag-to"],
  }),

  entry("Locator.describe", CAT, {
    id: "describe",
    description:
      "Đặt tên dễ đọc cho locator. Tên này hiện trong báo cáo lỗi và trace viewer, giúp đọc lỗi nhanh hơn nhiều.",
    code: `const nutMua = page.getByRole('button', { name: 'Mua ngay' }).describe('Nút mua ở đầu trang');
await nutMua.click();`,
    tags: ["locator", "debug", "report", "readability"],
    related: ["debug-report/trace-viewer"],
  }),

  entry("Locator.highlight", CAT, {
    id: "highlight",
    description:
      "Tô sáng phần tử trên trang khi đang debug. Chỉ dùng lúc chạy tay, đừng để lại trong test.",
    code: `await page.getByRole('button', { name: 'Gửi' }).highlight();`,
    tags: ["locator", "debug"],
    related: ["debug-report/page-pause"],
  }),

  entry("Locator.page", CAT, {
    id: "page",
    description: "Lấy lại đối tượng Page chứa locator này. Hữu ích khi viết helper dùng chung.",
    code: `async function chupManHinh(muc: import('@playwright/test').Locator) {
  await muc.page().screenshot({ path: 'man-hinh.png' });
}`,
    tags: ["locator", "page", "helper"],
    related: ["page/screenshot"],
  }),
];

export default locators;
