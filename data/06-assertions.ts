/**
 * Nhóm 6 — Assertions.
 *
 * Điểm mấu chốt: `expect(locator)` TỰ CHỜ và thử lại tới khi đúng hoặc hết
 * timeout. Còn `expect(giá_trị)` thì kiểm tra một lần rồi thôi.
 *
 *   await expect(page.getByText('Xong')).toBeVisible();   // chờ, ổn định
 *   expect(await page.getByText('Xong').isVisible()).toBe(true);  // không chờ, chập chờn
 *
 * Đây là nguyên nhân số một của test flaky. Cứ giữ locator bên trong expect().
 */
import { entry } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "assertions" as const;

export const assertions: CheatEntry[] = [
  entry("LocatorAssertions.toBeVisible", CAT, {
    id: "to-be-visible",
    description:
      "Khẳng định phần tử hiện ra và có kích thước thật. Tự chờ nên không cần sleep trước đó.",
    code: `await expect(page.getByText('Đăng nhập thành công')).toBeVisible();

// Chờ lâu hơn mặc định cho thao tác chậm
await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });`,
    tags: ["assertion", "visible", "expect", "recommended"],
    related: ["to-be-hidden", "to-be-attached", "locators/is-visible"],
  }),

  entry("LocatorAssertions.toBeHidden", CAT, {
    id: "to-be-hidden",
    description:
      "Khẳng định phần tử không hiển thị — hoặc bị ẩn, hoặc không còn trong DOM.",
    code: `await expect(page.getByText('Đang tải…')).toBeHidden();`,
    tags: ["assertion", "hidden", "expect"],
    related: ["to-be-visible", "to-be-attached"],
  }),

  entry("LocatorAssertions.toBeAttached", CAT, {
    id: "to-be-attached",
    description:
      "Khẳng định phần tử có mặt trong DOM, kể cả khi đang bị CSS ẩn. Khác toBeVisible ở chỗ đó.",
    code: `await expect(page.getByTestId('vung-an')).toBeAttached();
await expect(page.getByTestId('da-xoa')).not.toBeAttached();`,
    tags: ["assertion", "dom", "expect"],
    related: ["to-be-visible", "not"],
  }),

  entry("LocatorAssertions.toHaveText", CAT, {
    id: "to-have-text",
    description:
      "Khẳng định chữ trong phần tử khớp trọn vẹn. Truyền mảng để kiểm tra cả danh sách một lần.",
    code: `await expect(page.getByRole('heading')).toHaveText('Giỏ hàng');
await expect(page.getByRole('listitem')).toHaveText(['Cà phê', 'Trà', 'Nước ép']);
await expect(page.getByTestId('tong')).toHaveText(/\\d+ đ/);`,
    tags: ["assertion", "text", "expect", "recommended"],
    related: ["to-contain-text", "locators/text-content"],
    note: "Khớp trọn chuỗi (đã cắt khoảng trắng đầu cuối). Chỉ muốn kiểm tra một phần thì dùng toContainText().",
  }),

  entry("LocatorAssertions.toContainText", CAT, {
    id: "to-contain-text",
    description: "Khẳng định phần tử chứa đoạn chữ này ở đâu đó bên trong.",
    code: `await expect(page.getByRole('alert')).toContainText('không hợp lệ');`,
    tags: ["assertion", "text", "expect"],
    related: ["to-have-text"],
  }),

  entry("LocatorAssertions.toHaveValue", CAT, {
    id: "to-have-value",
    description: "Khẳng định giá trị hiện tại của ô input, textarea hoặc select.",
    code: `await expect(page.getByLabel('Email')).toHaveValue('an@vidu.vn');`,
    tags: ["assertion", "form", "input", "expect"],
    related: ["to-have-values", "locators/input-value", "actions/fill"],
  }),

  entry("LocatorAssertions.toHaveValues", CAT, {
    id: "to-have-values",
    description: "Khẳng định danh sách mục đang được chọn trong `<select multiple>`.",
    code: `await expect(page.getByLabel('Sở thích')).toHaveValues(['doc-sach', 'the-thao']);`,
    tags: ["assertion", "form", "select", "expect"],
    related: ["to-have-value", "actions/select-option"],
  }),

  entry("LocatorAssertions.toHaveAttribute", CAT, {
    id: "to-have-attribute",
    description: "Khẳng định phần tử có thuộc tính HTML với giá trị mong muốn.",
    code: `await expect(page.getByRole('link', { name: 'Điều khoản' })).toHaveAttribute('href', '/dieu-khoan');
await expect(page.getByRole('button')).toHaveAttribute('disabled');`,
    tags: ["assertion", "attribute", "expect"],
    related: ["to-have-class", "to-have-id", "locators/get-attribute"],
  }),

  entry("LocatorAssertions.toHaveClass", CAT, {
    id: "to-have-class",
    description:
      "Khẳng định thuộc tính class khớp trọn vẹn. Chỉ cần có một class trong đó thì dùng toContainClass().",
    code: `await expect(page.getByRole('button')).toHaveClass('nut nut-chinh');
await expect(page.getByRole('button')).toHaveClass(/dang-hoat-dong/);`,
    tags: ["assertion", "class", "css", "expect"],
    related: ["to-contain-class", "to-have-css"],
  }),

  entry("LocatorAssertions.toContainClass", CAT, {
    id: "to-contain-class",
    description:
      "Khẳng định phần tử có chứa class này, không quan tâm các class khác. Thường đúng ý hơn toHaveClass.",
    code: `await expect(page.getByRole('tab', { name: 'Hồ sơ' })).toContainClass('dang-chon');`,
    tags: ["assertion", "class", "css", "expect"],
    related: ["to-have-class"],
  }),

  entry("LocatorAssertions.toHaveCount", CAT, {
    id: "to-have-count",
    description:
      "Khẳng định locator khớp đúng bao nhiêu phần tử. Tự chờ nên dùng được cho danh sách đang tải.",
    code: `await expect(page.getByRole('listitem')).toHaveCount(3);
await expect(page.getByRole('alert')).toHaveCount(0);`,
    tags: ["assertion", "count", "list", "expect"],
    related: ["locators/count"],
    note: "Dùng cái này thay cho `expect(await ds.count()).toBe(3)` — bản kia không chờ nên hay chập chờn.",
  }),

  entry("LocatorAssertions.toBeEnabled", CAT, {
    id: "to-be-enabled",
    description: "Khẳng định phần tử đang bật, bấm hoặc nhập được.",
    code: `await expect(page.getByRole('button', { name: 'Gửi' })).toBeEnabled();`,
    tags: ["assertion", "state", "form", "expect"],
    related: ["to-be-disabled", "to-be-editable"],
  }),

  entry("LocatorAssertions.toBeDisabled", CAT, {
    id: "to-be-disabled",
    description: "Khẳng định phần tử đang bị vô hiệu hoá.",
    code: `await expect(page.getByRole('button', { name: 'Gửi' })).toBeDisabled();`,
    tags: ["assertion", "state", "form", "expect"],
    related: ["to-be-enabled"],
  }),

  entry("LocatorAssertions.toBeChecked", CAT, {
    id: "to-be-checked",
    description: "Khẳng định checkbox hoặc radio đang được tích.",
    code: `await expect(page.getByLabel('Nhớ đăng nhập')).toBeChecked();
await expect(page.getByLabel('Nhận quảng cáo')).not.toBeChecked();`,
    tags: ["assertion", "checkbox", "form", "expect"],
    related: ["actions/check", "not"],
  }),

  entry("LocatorAssertions.toBeEditable", CAT, {
    id: "to-be-editable",
    description: "Khẳng định ô nhập liệu đang sửa được (không disabled, không readonly).",
    code: `await expect(page.getByLabel('Ghi chú')).toBeEditable();`,
    tags: ["assertion", "form", "input", "expect"],
    related: ["to-be-enabled"],
  }),

  entry("LocatorAssertions.toBeEmpty", CAT, {
    id: "to-be-empty",
    description: "Khẳng định phần tử không có chữ và không có phần tử con nào.",
    code: `await expect(page.getByTestId('ket-qua')).toBeEmpty();`,
    tags: ["assertion", "text", "expect"],
    related: ["to-have-text"],
  }),

  entry("LocatorAssertions.toBeFocused", CAT, {
    id: "to-be-focused",
    description: "Khẳng định phần tử đang giữ con trỏ. Dùng để kiểm tra thứ tự Tab.",
    code: `await page.keyboard.press('Tab');
await expect(page.getByLabel('Email')).toBeFocused();`,
    tags: ["assertion", "focus", "keyboard", "a11y", "expect"],
    related: ["actions/focus"],
  }),

  entry("LocatorAssertions.toBeInViewport", CAT, {
    id: "to-be-in-viewport",
    description: "Khẳng định phần tử đang nằm trong khung nhìn, không phải cuộn mới thấy.",
    code: `await expect(page.getByRole('heading', { name: 'Chân trang' })).toBeInViewport();`,
    tags: ["assertion", "viewport", "scroll", "expect"],
    related: ["actions/scroll-into-view-if-needed", "to-be-visible"],
  }),

  entry("LocatorAssertions.toHaveCSS", CAT, {
    id: "to-have-css",
    description: "Khẳng định giá trị một thuộc tính CSS sau khi trình duyệt đã tính toán.",
    code: `await expect(page.getByRole('button')).toHaveCSS('background-color', 'rgb(0, 122, 255)');`,
    tags: ["assertion", "css", "style", "expect"],
    related: ["to-have-class"],
  }),

  entry("LocatorAssertions.toHaveId", CAT, {
    id: "to-have-id",
    description: "Khẳng định thuộc tính `id` của phần tử.",
    code: `await expect(page.getByRole('navigation')).toHaveId('menu-chinh');`,
    tags: ["assertion", "attribute", "expect"],
    related: ["to-have-attribute"],
  }),

  entry("LocatorAssertions.toHaveJSProperty", CAT, {
    id: "to-have-js-property",
    description:
      "Khẳng định giá trị một thuộc tính JavaScript của phần tử DOM — không phải thuộc tính HTML.",
    code: `await expect(page.getByLabel('Số lượng')).toHaveJSProperty('valueAsNumber', 3);`,
    tags: ["assertion", "javascript", "dom", "expect"],
    related: ["to-have-attribute"],
  }),

  entry("LocatorAssertions.toHaveRole", CAT, {
    id: "to-have-role",
    description: "Khẳng định vai trò ARIA của phần tử.",
    code: `await expect(page.getByTestId('nut-luu')).toHaveRole('button');`,
    tags: ["assertion", "a11y", "role", "expect"],
    related: ["to-have-accessible-name", "locators/get-by-role"],
  }),

  entry("LocatorAssertions.toHaveAccessibleName", CAT, {
    id: "to-have-accessible-name",
    description:
      "Khẳng định tên mà trình đọc màn hình đọc lên cho phần tử này.",
    code: `await expect(page.getByRole('button')).toHaveAccessibleName('Đóng hộp thoại');`,
    tags: ["assertion", "a11y", "expect"],
    related: ["to-have-role", "to-have-accessible-description"],
  }),

  entry("LocatorAssertions.toHaveAccessibleDescription", CAT, {
    id: "to-have-accessible-description",
    description: "Khẳng định phần mô tả bổ sung mà trình đọc màn hình đọc lên.",
    code: `await expect(page.getByRole('textbox')).toHaveAccessibleDescription('Tối thiểu 8 ký tự');`,
    tags: ["assertion", "a11y", "expect"],
    related: ["to-have-accessible-name"],
  }),

  entry("LocatorAssertions.toMatchAriaSnapshot", CAT, {
    id: "to-match-aria-snapshot",
    description:
      "Khẳng định cả cây accessibility của một vùng giao diện khớp với mẫu YAML. Một assertion thay cho hàng chục cái lẻ.",
    code: `await expect(page.getByRole('navigation')).toMatchAriaSnapshot(\`
  - navigation:
    - link "Trang chủ"
    - link "Sản phẩm"
\`);`,
    tags: ["assertion", "a11y", "snapshot", "expect"],
    related: ["actions/aria-snapshot", "visual-testing/to-have-screenshot"],
  }),

  entry("PageAssertions.toHaveURL", CAT, {
    id: "to-have-url",
    description: "Khẳng định địa chỉ trang hiện tại. Tự chờ điều hướng xong.",
    code: `await expect(page).toHaveURL('/bang-dieu-khien');
await expect(page).toHaveURL(/\\/don-hang\\/\\d+/);`,
    tags: ["assertion", "url", "navigation", "expect"],
    related: ["to-have-title", "page/wait-for-url"],
  }),

  entry("PageAssertions.toHaveTitle", CAT, {
    id: "to-have-title",
    description: "Khẳng định tiêu đề trang (thẻ `<title>`).",
    code: `await expect(page).toHaveTitle('Bảng điều khiển — Cửa hàng');
await expect(page).toHaveTitle(/Bảng điều khiển/);`,
    tags: ["assertion", "title", "seo", "expect"],
    related: ["to-have-url"],
  }),

  entry("LocatorAssertions.not", CAT, {
    id: "not",
    description:
      "Đảo ngược mọi assertion phía sau. Vẫn tự chờ — chờ tới khi điều kiện KHÔNG còn đúng.",
    code: `await expect(page.getByText('Đang tải…')).not.toBeVisible();
await expect(page.getByRole('button')).not.toBeDisabled();`,
    tags: ["assertion", "negate", "expect"],
    related: ["to-be-visible", "to-be-hidden"],
  }),

  entry("GenericAssertions.toBe", CAT, {
    id: "to-be",
    description:
      "So sánh hai giá trị bằng `Object.is`. Dùng cho số, chuỗi, boolean — không dùng cho object.",
    code: `const so = await page.getByRole('listitem').count();
expect(so).toBe(3);`,
    tags: ["assertion", "value", "expect"],
    related: ["to-equal", "to-have-count"],
    note: "Đây là assertion KHÔNG chờ. Kiểm tra giao diện thì luôn ưu tiên expect(locator).",
  }),

  entry("GenericAssertions.toEqual", CAT, {
    id: "to-equal",
    description: "So sánh sâu hai object hoặc mảng theo giá trị.",
    code: `const donHang = { ma: 'DH-1', soLuong: 2 };
expect(donHang).toEqual({ ma: 'DH-1', soLuong: 2 });`,
    tags: ["assertion", "object", "deep", "expect"],
    related: ["to-be", "to-match-object"],
  }),

  entry("GenericAssertions.toMatchObject", CAT, {
    id: "to-match-object",
    description:
      "So sánh sâu nhưng chỉ với những khoá mình liệt kê — khoá thừa trong object thật thì bỏ qua. Rất hợp để kiểm tra phản hồi API.",
    code: `const data = await (await page.request.get('/api/nguoi-dung/1')).json();
expect(data).toMatchObject({ ten: 'An' });`,
    tags: ["assertion", "object", "api", "expect"],
    related: ["to-equal", "network/api-request-context-get"],
  }),

  entry("GenericAssertions.toContain#1", CAT, {
    id: "to-contain",
    title: "expect(value).toContain()",
    description: "Khẳng định mảng có chứa phần tử này, hoặc chuỗi có chứa đoạn chữ này.",
    code: `const ten = await page.getByRole('listitem').allInnerTexts();
expect(ten).toContain('Cà phê');`,
    tags: ["assertion", "array", "string", "expect"],
    related: ["to-contain-text"],
  }),

  entry("GenericAssertions.toHaveLength", CAT, {
    id: "to-have-length",
    description: "Khẳng định độ dài mảng hoặc chuỗi.",
    code: `const ten = await page.getByRole('listitem').allInnerTexts();
expect(ten).toHaveLength(3);`,
    tags: ["assertion", "array", "expect"],
    related: ["to-have-count"],
  }),

  entry("GenericAssertions.toThrow", CAT, {
    id: "to-throw",
    description: "Khẳng định hàm ném lỗi khi được gọi.",
    code: `expect(() => JSON.parse('{ hỏng')).toThrow();`,
    tags: ["assertion", "error", "expect"],
    related: ["to-be"],
  }),

  entry("Test.expect", CAT, {
    id: "expect",
    title: "expect()",
    description:
      "Hàm assertion của Playwright. Truyền locator hoặc page thì được assertion tự chờ; truyền giá trị thường thì kiểm tra một lần.",
    code: `import { test, expect } from '@playwright/test';

test('giỏ hàng', async ({ page }) => {
  await page.goto('/gio-hang');
  await expect(page.getByRole('listitem')).toHaveCount(2);
});`,
    tags: ["assertion", "expect", "core", "recommended"],
    related: ["to-be-visible", "advanced/custom-matcher"],
  }),
];

export default assertions;
