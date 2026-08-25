/**
 * Nhóm 9 — Network.
 *
 * Hai việc khác nhau hay bị lẫn:
 *   - `page.route()`  chặn request của TRÌNH DUYỆT để giả lập phản hồi
 *   - `request`       gọi HTTP thẳng từ Node, không qua trình duyệt
 *
 * Cái đầu để test giao diện phản ứng với dữ liệu; cái sau để dựng dữ liệu hoặc
 * test API.
 */
import { entry } from "./_entry.ts";
import type { CheatEntry } from "../lib/types.ts";

const CAT = "network" as const;

export const network: CheatEntry[] = [
  entry("Page.route", CAT, {
    id: "route",
    description:
      "Chặn request khớp mẫu và tự quyết định trả về gì. Nền tảng của mọi thứ giả lập mạng.",
    code: `await page.route('**/api/san-pham', async (route) => {
  await route.fulfill({ json: [{ id: 1, ten: 'Cà phê' }] });
});
await page.goto('/san-pham');
await expect(page.getByText('Cà phê')).toBeVisible();`,
    tags: ["network", "route", "mock", "intercept", "recommended"],
    related: ["route-fulfill", "route-abort", "route-continue", "unroute"],
  }),

  entry("Route.fulfill", CAT, {
    id: "route-fulfill",
    description: "Trả về phản hồi tự chế cho request đã chặn.",
    code: `await page.route('**/api/nguoi-dung', (route) =>
  route.fulfill({ status: 200, json: { ten: 'An' } }),
);`,
    tags: ["network", "route", "mock", "response"],
    related: ["route", "route-abort"],
  }),

  entry("Route.abort", CAT, {
    id: "route-abort",
    description:
      "Huỷ request. Dùng để test giao diện khi API lỗi, hoặc để chặn ảnh cho test chạy nhanh.",
    code: `// Test màn hình lỗi
await page.route('**/api/**', (route) => route.abort());

// Chặn ảnh cho nhanh
await page.route('**/*.{png,jpg,jpeg,webp}', (route) => route.abort());`,
    tags: ["network", "route", "abort", "error", "performance"],
    related: ["route", "route-fulfill"],
  }),

  entry("Route.continue", CAT, {
    id: "route-continue",
    description: "Cho request đi tiếp, có thể sửa URL, method, header hoặc body trước khi gửi.",
    code: `await page.route('**/api/**', (route) =>
  route.continue({ headers: { ...route.request().headers(), 'X-Test': '1' } }),
);`,
    tags: ["network", "route", "modify", "header"],
    related: ["route", "route-fetch"],
  }),

  entry("Route.fetch", CAT, {
    id: "route-fetch",
    description:
      "Gửi request thật rồi sửa phản hồi trước khi trả cho trang. Cách gọn để chỉnh một trường trong dữ liệu thật.",
    code: `await page.route('**/api/don-hang', async (route) => {
  const res = await route.fetch();
  const data = await res.json();
  data.trangThai = 'da-giao';
  await route.fulfill({ response: res, json: data });
});`,
    tags: ["network", "route", "modify", "response"],
    related: ["route-fulfill", "route-continue"],
  }),

  entry("Page.unroute", CAT, {
    id: "unroute",
    description: "Gỡ một handler route đã đăng ký.",
    code: `const handler = (route: import('@playwright/test').Route) => route.abort();
await page.route('**/api/**', handler);
await page.unroute('**/api/**', handler);`,
    tags: ["network", "route", "cleanup"],
    related: ["route"],
  }),

  entry("Page.waitForResponse", CAT, {
    id: "wait-for-response",
    description:
      "Chờ một phản hồi khớp mẫu. Phải bắt đầu chờ TRƯỚC khi kích hoạt hành động.",
    code: `const [res] = await Promise.all([
  page.waitForResponse((r) => r.url().includes('/api/tim-kiem') && r.status() === 200),
  page.getByRole('button', { name: 'Tìm' }).click(),
]);
expect((await res.json()).length).toBeGreaterThan(0);`,
    tags: ["network", "wait", "response"],
    related: ["wait-for-request", "response-json", "page/wait-for-event"],
  }),

  entry("Page.waitForRequest", CAT, {
    id: "wait-for-request",
    description: "Chờ một request khớp mẫu được gửi đi.",
    code: `const [req] = await Promise.all([
  page.waitForRequest('**/api/theo-doi'),
  page.getByRole('button', { name: 'Theo dõi' }).click(),
]);
expect(req.method()).toBe('POST');`,
    tags: ["network", "wait", "request"],
    related: ["wait-for-response", "request-post-data"],
  }),

  entry("Page.response", CAT, {
    id: "response-event",
    title: "page.on('response')",
    description: "Nghe mọi phản hồi trang nhận được. Dùng để ghi log hoặc kiểm tra hàng loạt.",
    code: `page.on('response', (res) => {
  if (!res.ok()) console.warn('Lỗi mạng:', res.status(), res.url());
});
await page.goto('/');`,
    tags: ["network", "event", "response", "monitor"],
    related: ["wait-for-response", "page/on"],
  }),

  entry("Response.json", CAT, {
    id: "response-json",
    description: "Đọc thân phản hồi dưới dạng JSON.",
    code: `const res = await page.request.get('/api/nguoi-dung/1');
const data = await res.json();
expect(data.ten).toBe('An');`,
    tags: ["network", "response", "json", "api"],
    related: ["response-status", "api-request-context-get"],
  }),

  entry("Response.status", CAT, {
    id: "response-status",
    description: "Đọc mã trạng thái HTTP của phản hồi.",
    code: `const res = await page.request.get('/api/khong-ton-tai');
expect(res.status()).toBe(404);`,
    tags: ["network", "response", "status", "api"],
    related: ["response-ok", "response-json"],
  }),

  entry("Response.ok", CAT, {
    id: "response-ok",
    description: "Trả về true nếu mã trạng thái nằm trong khoảng 200–299.",
    code: `const res = await page.request.post('/api/don-hang', { data: { sanPham: 'ca-phe' } });
expect(res.ok()).toBeTruthy();`,
    tags: ["network", "response", "status", "api"],
    related: ["response-status"],
  }),

  entry("Request.postDataJSON", CAT, {
    id: "request-post-data",
    description: "Đọc thân request đã gửi, parse sẵn thành JSON. Dùng để kiểm tra trang gửi đúng gì.",
    code: `const [req] = await Promise.all([
  page.waitForRequest('**/api/don-hang'),
  page.getByRole('button', { name: 'Đặt hàng' }).click(),
]);
expect(req.postDataJSON()).toMatchObject({ sanPham: 'ca-phe' });`,
    tags: ["network", "request", "json", "verify"],
    related: ["wait-for-request", "request-headers"],
  }),

  entry("Request.headers", CAT, {
    id: "request-headers",
    description: "Đọc header của request.",
    code: `const [req] = await Promise.all([
  page.waitForRequest('**/api/**'),
  page.getByRole('button', { name: 'Tải' }).click(),
]);
expect(req.headers()['accept']).toContain('application/json');`,
    tags: ["network", "request", "header"],
    related: ["request-post-data", "route-continue"],
  }),

  entry("APIRequestContext.get", CAT, {
    id: "api-request-context-get",
    title: "request.get()",
    description: "Gọi GET thẳng từ Node, không qua trình duyệt. Nhanh hơn nhiều so với bấm giao diện.",
    code: `test('API trả về danh sách', async ({ request }) => {
  const res = await request.get('/api/san-pham');
  expect(res.ok()).toBeTruthy();
  expect(await res.json()).toHaveLength(3);
});`,
    tags: ["api", "http", "get", "request"],
    related: ["api-request-context-post", "fixtures/request"],
  }),

  entry("APIRequestContext.post", CAT, {
    id: "api-request-context-post",
    title: "request.post()",
    description: "Gọi POST với thân JSON hoặc form. Hay dùng để dựng dữ liệu trước test.",
    code: `test('tạo đơn', async ({ request }) => {
  const res = await request.post('/api/don-hang', {
    data: { sanPham: 'ca-phe', soLuong: 2 },
  });
  expect(res.status()).toBe(201);
});`,
    tags: ["api", "http", "post", "request", "setup"],
    related: ["api-request-context-get", "api-request-context-put", "fixtures/request"],
  }),

  entry("APIRequestContext.put", CAT, {
    id: "api-request-context-put",
    title: "request.put()",
    description: "Gọi PUT để cập nhật tài nguyên.",
    code: `const res = await request.put('/api/don-hang/1', { data: { trangThai: 'da-giao' } });
expect(res.ok()).toBeTruthy();`,
    tags: ["api", "http", "put", "request"],
    related: ["api-request-context-post", "api-request-context-delete"],
  }),

  entry("APIRequestContext.delete", CAT, {
    id: "api-request-context-delete",
    title: "request.delete()",
    description: "Gọi DELETE để xoá tài nguyên. Hay dùng trong afterEach để dọn dữ liệu.",
    code: `test.afterEach(async ({ request }) => {
  await request.delete('/api/don-hang/1');
});`,
    tags: ["api", "http", "delete", "request", "cleanup"],
    related: ["api-request-context-post", "test-structure/after-each"],
  }),

  entry("APIRequestContext.storageState", CAT, {
    id: "api-storage-state",
    title: "request.storageState()",
    description:
      "Xuất cookie mà client API đang giữ. Dùng để đăng nhập qua API rồi đưa session sang cho trình duyệt.",
    code: `await request.post('/api/dang-nhap', { data: { email: 'an@vidu.vn', matKhau: 'bí-mật' } });
await request.storageState({ path: 'playwright/.auth/user.json' });`,
    tags: ["api", "auth", "storage", "session"],
    related: ["auth-state/storage-state", "auth-state/auth-setup"],
  }),

  entry("Page.routeFromHAR", CAT, {
    id: "route-from-har",
    description:
      "Trả lời mọi request bằng tệp HAR đã ghi. Đặt `update: true` để ghi lại HAR mới.",
    code: `// Chạy lại từ HAR
await page.routeFromHAR('tests/har/api.har');

// Ghi HAR mới
await page.routeFromHAR('tests/har/api.har', { update: true });`,
    tags: ["network", "har", "mock", "record", "offline"],
    related: ["route", "browser-context/route-from-har"],
  }),

  entry("Page.routeWebSocket", CAT, {
    id: "route-web-socket",
    description: "Chặn và giả lập kết nối WebSocket.",
    code: `await page.routeWebSocket('wss://vidu.vn/ws', (ws) => {
  ws.onMessage(() => ws.send(JSON.stringify({ loai: 'thong-bao', noiDung: 'Xin chào' })));
});
await page.goto('/');`,
    tags: ["network", "websocket", "mock", "realtime"],
    related: ["route"],
  }),
];

export default network;
