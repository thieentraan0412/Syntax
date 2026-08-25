/**
 * Nhóm 5 — Actions.
 *
 * Mọi action đều tự chờ phần tử "sẵn sàng" (hiện ra, ổn định, không bị che, bật)
 * rồi mới thao tác. Nên hầu như không bao giờ cần `waitForTimeout` trước một
 * action — nếu thấy cần, thường là locator sai chứ không phải trang chậm.
 */
import { entry } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "actions" as const;

export const actions: CheatEntry[] = [
  entry("Locator.click", CAT, {
    id: "click",
    description: "Bấm chuột vào phần tử. Tự chờ phần tử hiện ra, ổn định và bấm được.",
    code: `await page.getByRole('button', { name: 'Gửi' }).click();

// Bấm chuột phải
await page.getByText('Tệp').click({ button: 'right' });

// Bấm giữ phím Shift
await page.getByRole('listitem').nth(3).click({ modifiers: ['Shift'] });`,
    tags: ["action", "click", "mouse"],
    related: ["dblclick", "hover", "tap"],
  }),

  entry("Locator.dblclick", CAT, {
    id: "dblclick",
    description: "Bấm đúp chuột vào phần tử.",
    code: `await page.getByText('tep-tin.txt').dblclick();`,
    tags: ["action", "click", "mouse"],
    related: ["click"],
  }),

  entry("Locator.fill", CAT, {
    id: "fill",
    description:
      "Xoá sạch ô rồi đặt giá trị mới trong một bước. Đây là cách nhanh và ổn định nhất để nhập liệu.",
    code: `await page.getByLabel('Email').fill('an@vidu.vn');
await page.getByLabel('Ghi chú').fill('');`,
    tags: ["action", "form", "input", "type", "recommended"],
    related: ["press-sequentially", "clear", "locators/input-value"],
    note: "fill() đặt thẳng giá trị, không gõ từng phím. Nếu ô có xử lý riêng cho từng phím gõ (autocomplete, mặt nạ nhập liệu) thì dùng pressSequentially().",
  }),

  entry("Locator.clear", CAT, {
    id: "clear",
    description: "Xoá trắng ô nhập liệu. Tương đương `fill('')` nhưng đọc rõ ý hơn.",
    code: `await page.getByLabel('Tìm kiếm').clear();`,
    tags: ["action", "form", "input"],
    related: ["fill"],
  }),

  entry("Locator.pressSequentially", CAT, {
    id: "press-sequentially",
    description:
      "Gõ từng ký tự một, phát sinh đủ sự kiện keydown/keypress/keyup. Dùng cho ô autocomplete hoặc ô có mặt nạ nhập liệu.",
    code: `await page.getByLabel('Tìm kiếm').pressSequentially('bàn phím', { delay: 100 });
await expect(page.getByRole('option').first()).toBeVisible();`,
    tags: ["action", "form", "input", "type", "keyboard"],
    related: ["fill", "press"],
    note: "Chậm hơn fill() nhiều. Chỉ dùng khi thật sự cần từng sự kiện phím.",
  }),

  entry("Locator.press", CAT, {
    id: "press",
    description: "Nhấn một phím hoặc tổ hợp phím khi phần tử đang được focus.",
    code: `await page.getByLabel('Tìm kiếm').press('Enter');
await page.getByRole('textbox').press('Control+A');
await page.getByRole('dialog').press('Escape');`,
    tags: ["action", "keyboard", "shortcut"],
    related: ["press-sequentially", "keyboard"],
  }),

  entry("Locator.check", CAT, {
    id: "check",
    description:
      "Tích vào checkbox hoặc radio, rồi kiểm tra lại là nó đã được tích thật. Đã tích sẵn thì không làm gì.",
    code: `await page.getByLabel('Tôi đồng ý với điều khoản').check();`,
    tags: ["action", "form", "checkbox", "radio"],
    related: ["uncheck", "set-checked", "assertions/to-be-checked"],
  }),

  entry("Locator.uncheck", CAT, {
    id: "uncheck",
    description: "Bỏ tích checkbox, rồi kiểm tra lại là nó đã bỏ tích thật.",
    code: `await page.getByLabel('Nhận email quảng cáo').uncheck();`,
    tags: ["action", "form", "checkbox"],
    related: ["check", "set-checked"],
  }),

  entry("Locator.setChecked", CAT, {
    id: "set-checked",
    description:
      "Đặt trạng thái tích theo giá trị boolean. Gọn hơn khi trạng thái mong muốn nằm trong biến.",
    code: `const nhanTin = true;
await page.getByLabel('Nhận thông báo').setChecked(nhanTin);`,
    tags: ["action", "form", "checkbox"],
    related: ["check", "uncheck"],
  }),

  entry("Locator.selectOption", CAT, {
    id: "select-option",
    description:
      "Chọn mục trong thẻ `<select>`. Chọn được theo value, theo nhãn hiển thị, hoặc theo chỉ số.",
    code: `await page.getByLabel('Tỉnh thành').selectOption('HN');
await page.getByLabel('Tỉnh thành').selectOption({ label: 'Hà Nội' });

// Select cho phép chọn nhiều
await page.getByLabel('Sở thích').selectOption(['doc-sach', 'the-thao']);`,
    tags: ["action", "form", "select", "dropdown"],
    related: ["assertions/to-have-values"],
    note: "Chỉ dùng được cho thẻ `<select>` thật. Dropdown tự dựng bằng div thì bấm bằng getByRole('option').",
  }),

  entry("Locator.setInputFiles", CAT, {
    id: "set-input-files",
    description:
      "Chọn tệp cho ô upload `<input type=file>`. Truyền mảng rỗng để bỏ chọn.",
    code: `await page.getByLabel('Ảnh đại diện').setInputFiles('tests/anh/avatar.png');

// Nhiều tệp
await page.getByLabel('Đính kèm').setInputFiles(['a.pdf', 'b.pdf']);

// Tệp tạo ngay trong bộ nhớ, không cần file thật trên đĩa
await page.getByLabel('Đính kèm').setInputFiles({
  name: 'ghi-chu.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('nội dung'),
});`,
    tags: ["action", "form", "upload", "file"],
    related: ["frames-dialogs/file-chooser"],
  }),

  entry("Locator.hover", CAT, {
    id: "hover",
    description: "Rê chuột lên phần tử. Dùng để mở menu thả xuống hoặc hiện tooltip.",
    code: `await page.getByRole('button', { name: 'Tài khoản' }).hover();
await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();`,
    tags: ["action", "mouse", "hover", "menu"],
    related: ["click"],
  }),

  entry("Locator.focus", CAT, {
    id: "focus",
    description: "Đưa con trỏ vào phần tử mà không bấm chuột.",
    code: `await page.getByLabel('Email').focus();`,
    tags: ["action", "focus", "form"],
    related: ["blur", "assertions/to-be-focused"],
  }),

  entry("Locator.blur", CAT, {
    id: "blur",
    description: "Bỏ focus khỏi phần tử. Dùng để kích hoạt validate lúc rời ô.",
    code: `await page.getByLabel('Email').fill('sai-dinh-dang');
await page.getByLabel('Email').blur();
await expect(page.getByText('Email không hợp lệ')).toBeVisible();`,
    tags: ["action", "focus", "form", "validation"],
    related: ["focus"],
  }),

  entry("Locator.dragTo", CAT, {
    id: "drag-to",
    description: "Kéo phần tử này thả vào phần tử kia.",
    code: `await page.getByTestId('the-viec').dragTo(page.getByTestId('cot-hoan-thanh'));`,
    tags: ["action", "drag", "mouse"],
    related: ["click", "locators/bounding-box"],
  }),

  entry("Locator.tap", CAT, {
    id: "tap",
    description:
      "Chạm màn hình cảm ứng. Phải bật `hasTouch: true` trong config thì mới dùng được.",
    code: `await page.getByRole('button', { name: 'Menu' }).tap();`,
    tags: ["action", "touch", "mobile"],
    related: ["click", "browser-context/new-context"],
    note: "Cần `use: { hasTouch: true }` trong playwright.config.ts, không thì Playwright báo lỗi.",
  }),

  entry("Locator.scrollIntoViewIfNeeded", CAT, {
    id: "scroll-into-view-if-needed",
    description:
      "Cuộn trang cho phần tử lọt vào khung nhìn. Hiếm khi cần vì action nào cũng tự cuộn trước khi thao tác.",
    code: `await page.getByRole('heading', { name: 'Chân trang' }).scrollIntoViewIfNeeded();`,
    tags: ["action", "scroll", "viewport"],
    related: ["assertions/to-be-in-viewport"],
  }),

  entry("Locator.selectText", CAT, {
    id: "select-text",
    description: "Bôi đen toàn bộ chữ trong phần tử.",
    code: `await page.getByRole('textbox').selectText();
await page.keyboard.press('Control+C');`,
    tags: ["action", "text", "selection"],
    related: ["press"],
  }),

  entry("Locator.dispatchEvent", CAT, {
    id: "dispatch-event",
    description:
      "Bắn thẳng một sự kiện DOM vào phần tử, bỏ qua mọi kiểm tra sẵn sàng. Lối thoát cuối khi action bình thường không chạy.",
    code: `await page.getByRole('button').dispatchEvent('click');`,
    tags: ["action", "event", "escape-hatch"],
    related: ["click"],
    note: "Bỏ qua hết kiểm tra actionability nên có thể 'thành công' trên phần tử người dùng thật không bấm được. Chỉ dùng khi hết cách.",
  }),

  entry("Page.keyboard", CAT, {
    id: "keyboard",
    description:
      "Bàn phím ở cấp trang, không gắn với phần tử nào. Dùng cho phím tắt toàn cục.",
    code: `await page.keyboard.press('Escape');
await page.keyboard.down('Shift');
await page.keyboard.press('Tab');
await page.keyboard.up('Shift');`,
    tags: ["action", "keyboard", "shortcut", "global"],
    related: ["press", "mouse"],
  }),

  entry("Page.mouse", CAT, {
    id: "mouse",
    description:
      "Chuột ở cấp trang, thao tác theo toạ độ. Dùng cho canvas hoặc kéo thả tự do.",
    code: `await page.mouse.move(100, 100);
await page.mouse.down();
await page.mouse.move(300, 250);
await page.mouse.up();`,
    tags: ["action", "mouse", "canvas", "coordinates"],
    related: ["drag-to", "keyboard"],
    note: "Thao tác theo toạ độ rất dễ vỡ khi đổi bố cục. Ưu tiên click() trên locator.",
  }),

  entry("Page.dragAndDrop", CAT, {
    id: "drag-and-drop",
    description: "Kéo thả bằng cách đưa thẳng hai selector, không cần tạo locator trước.",
    code: `await page.dragAndDrop('#nguon', '#dich');`,
    tags: ["action", "drag", "selector"],
    related: ["drag-to"],
  }),

  entry("Page.setChecked", CAT, {
    id: "page-set-checked",
    title: "page.setChecked()",
    description:
      "Bản rút gọn của setChecked ở cấp trang: truyền thẳng selector thay vì locator.",
    code: `await page.setChecked('#dong-y', true);`,
    tags: ["action", "form", "checkbox", "shortcut"],
    related: ["set-checked"],
  }),

  entry("Locator.evaluate", CAT, {
    id: "evaluate",
    description:
      "Chạy JavaScript trên chính phần tử, ngay trong trình duyệt. Dùng khi cần chạm vào thứ API không phơi ra.",
    code: `const mau = await page
  .getByRole('button')
  .evaluate((el: HTMLElement) => getComputedStyle(el).backgroundColor);
expect(mau).toBe('rgb(0, 122, 255)');`,
    tags: ["action", "javascript", "dom", "escape-hatch"],
    related: ["page/evaluate", "assertions/to-have-css"],
  }),

  entry("Locator.ariaSnapshot", CAT, {
    id: "aria-snapshot",
    description:
      "Chụp lại cây accessibility của phần tử dưới dạng YAML. Dùng để kiểm tra cả một vùng giao diện bằng một assertion.",
    code: `const cay = await page.getByRole('navigation').ariaSnapshot();
console.log(cay);`,
    tags: ["action", "a11y", "snapshot"],
    related: ["assertions/to-match-aria-snapshot"],
  }),
];

export default actions;
