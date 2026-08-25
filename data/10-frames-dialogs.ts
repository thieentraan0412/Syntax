/**
 * Nhóm 10 — Frames & Dialogs.
 *
 * Điểm chung của cả nhóm: những thứ xảy ra NGOÀI trang chính. Với popup,
 * download, hộp thoại — phải đăng ký lắng nghe TRƯỚC khi kích hoạt hành động,
 * không thì lỡ mất sự kiện.
 */
import { entry } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "frames-dialogs" as const;

export const framesDialogs: CheatEntry[] = [
  entry("Page.frameLocator", CAT, {
    id: "frame-locator",
    description: "Trỏ vào trong một iframe rồi tìm phần tử như trang bình thường.",
    code: `const khung = page.frameLocator('#khung-thanh-toan');
await khung.getByLabel('Số thẻ').fill('4242424242424242');
await khung.getByRole('button', { name: 'Thanh toán' }).click();`,
    tags: ["iframe", "frame", "locator"],
    related: ["frame-locator-nested", "locators/frame-locator"],
  }),

  entry("FrameLocator.frameLocator", CAT, {
    id: "frame-locator-nested",
    title: "frameLocator.frameLocator()",
    description: "Đi tiếp vào iframe lồng trong iframe.",
    code: `await page
  .frameLocator('#ngoai')
  .frameLocator('#trong')
  .getByRole('button', { name: 'Xác nhận' })
  .click();`,
    tags: ["iframe", "frame", "nested"],
    related: ["frame-locator"],
  }),

  entry("Page.frame", CAT, {
    id: "frame",
    description:
      "Lấy đối tượng Frame theo tên hoặc URL. Hầu hết trường hợp dùng frameLocator gọn hơn.",
    code: `const khung = page.frame({ name: 'thanh-toan' });
expect(khung).not.toBeNull();`,
    tags: ["iframe", "frame"],
    related: ["frame-locator", "page/frames"],
  }),

  entry("FrameLocator.owner", CAT, {
    id: "frame-owner",
    title: "frameLocator.owner()",
    description: "Lấy locator trỏ tới chính thẻ `<iframe>` đó — để kiểm tra kích thước, thuộc tính.",
    code: `await expect(page.frameLocator('#khung').owner()).toBeVisible();`,
    tags: ["iframe", "frame", "locator"],
    related: ["frame-locator"],
  }),

  entry("Page.dialog", CAT, {
    id: "dialog",
    title: "page.on('dialog')",
    description:
      "Bắt hộp thoại alert / confirm / prompt. Không đăng ký handler thì Playwright tự bấm Huỷ.",
    code: `page.on('dialog', async (hop) => {
  expect(hop.message()).toContain('Bạn chắc chứ');
  await hop.accept();
});
await page.getByRole('button', { name: 'Xoá' }).click();`,
    tags: ["dialog", "alert", "confirm", "event"],
    related: ["dialog-accept", "dialog-dismiss", "page/on"],
    note: "Phải gắn handler TRƯỚC khi bấm nút. Gắn sau là hộp thoại đã bị tự huỷ mất rồi.",
  }),

  entry("Dialog.accept", CAT, {
    id: "dialog-accept",
    description: "Bấm OK trên hộp thoại. Với prompt thì truyền thêm chuỗi để nhập.",
    code: `page.on('dialog', (hop) => hop.accept('Tên mới'));
await page.getByRole('button', { name: 'Đổi tên' }).click();`,
    tags: ["dialog", "accept", "prompt"],
    related: ["dialog", "dialog-dismiss"],
  }),

  entry("Dialog.dismiss", CAT, {
    id: "dialog-dismiss",
    description: "Bấm Huỷ trên hộp thoại.",
    code: `page.on('dialog', (hop) => hop.dismiss());
await page.getByRole('button', { name: 'Xoá' }).click();
await expect(page.getByText('Đã xoá')).toBeHidden();`,
    tags: ["dialog", "dismiss", "cancel"],
    related: ["dialog", "dialog-accept"],
  }),

  entry("Dialog.message", CAT, {
    id: "dialog-message",
    description: "Đọc nội dung chữ trong hộp thoại để kiểm tra.",
    code: `page.on('dialog', async (hop) => {
  expect(hop.message()).toBe('Xoá vĩnh viễn đơn hàng này?');
  await hop.dismiss();
});
await page.getByRole('button', { name: 'Xoá' }).click();`,
    tags: ["dialog", "message", "verify"],
    related: ["dialog"],
  }),

  entry("Page.popup", CAT, {
    id: "popup",
    title: "page.on('popup')",
    description: "Bắt tab hoặc cửa sổ mới do trang mở ra.",
    code: `const [tabMoi] = await Promise.all([
  page.waitForEvent('popup'),
  page.getByRole('link', { name: 'Điều khoản' }).click(),
]);
await expect(tabMoi).toHaveTitle(/Điều khoản/);`,
    tags: ["popup", "tab", "window", "event"],
    related: ["page/wait-for-event", "browser-context/new-page"],
  }),

  entry("Page.download", CAT, {
    id: "download",
    title: "page.on('download')",
    description: "Bắt sự kiện tải tệp về.",
    code: `const [tep] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Tải hoá đơn' }).click(),
]);
expect(tep.suggestedFilename()).toBe('hoa-don.pdf');`,
    tags: ["download", "file", "event"],
    related: ["download-save-as", "download-path"],
  }),

  entry("Download.saveAs", CAT, {
    id: "download-save-as",
    description: "Lưu tệp đã tải về đường dẫn mình chọn.",
    code: `const [tep] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Tải xuống' }).click(),
]);
await tep.saveAs('test-results/hoa-don.pdf');`,
    tags: ["download", "file", "save"],
    related: ["download", "download-path"],
  }),

  entry("Download.path", CAT, {
    id: "download-path",
    description: "Lấy đường dẫn tạm của tệp đã tải, để đọc kiểm tra nội dung.",
    code: `const [tep] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Xuất CSV' }).click(),
]);
const duongDan = await tep.path();
expect(duongDan).toBeTruthy();`,
    tags: ["download", "file", "path", "verify"],
    related: ["download-save-as", "download"],
  }),

  entry("Download.suggestedFilename", CAT, {
    id: "download-suggested-filename",
    description: "Đọc tên tệp mà server gợi ý qua header Content-Disposition.",
    code: `const [tep] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Tải' }).click(),
]);
expect(tep.suggestedFilename()).toMatch(/\\.pdf$/);`,
    tags: ["download", "file", "name"],
    related: ["download", "download-save-as"],
  }),

  entry("Page.fileChooser", CAT, {
    id: "file-chooser",
    title: "page.on('filechooser')",
    description:
      "Bắt hộp chọn tệp khi nút upload không phải `<input type=file>` thật.",
    code: `const [hop] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.getByRole('button', { name: 'Tải ảnh lên' }).click(),
]);
await hop.setFiles('tests/anh/avatar.png');`,
    tags: ["upload", "file", "chooser", "event"],
    related: ["actions/set-input-files", "file-chooser-set-files"],
    note: "Nếu có `<input type=file>` thật thì dùng setInputFiles() — gọn hơn và không cần bắt sự kiện.",
  }),

  entry("FileChooser.setFiles", CAT, {
    id: "file-chooser-set-files",
    description: "Chọn tệp cho hộp chọn tệp đã bắt được.",
    code: `const [hop] = await Promise.all([
  page.waitForEvent('filechooser'),
  page.getByRole('button', { name: 'Đính kèm' }).click(),
]);
await hop.setFiles(['a.pdf', 'b.pdf']);`,
    tags: ["upload", "file", "chooser"],
    related: ["file-chooser", "actions/set-input-files"],
  }),

  entry("Page.console", CAT, {
    id: "console",
    title: "page.on('console')",
    description: "Nghe log console của trang. Dùng để bắt cảnh báo hoặc lỗi ngầm.",
    code: `const canhBao: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'warning') canhBao.push(msg.text());
});
await page.goto('/');`,
    tags: ["console", "log", "event", "debug"],
    related: ["page/page-error", "page/on"],
  }),

  entry("Page.worker", CAT, {
    id: "worker",
    title: "page.on('worker')",
    description: "Bắt Web Worker do trang tạo ra.",
    code: `page.on('worker', (w) => console.log('worker:', w.url()));
await page.goto('/');`,
    tags: ["worker", "event"],
    related: ["page/on"],
  }),
];

export default framesDialogs;
