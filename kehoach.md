# Kế hoạch: IDE chạy test Playwright trên trình duyệt

> Đánh giá source `playwright-cheatsheet` hiện tại + checklist thực thi.
> Viết ngày 2026-08-29. Bản thay thế cho `compiler.md` đã xoá.

---

## 0. Kết luận trước, giải thích sau

Ba điều cần biết ngay, vì chúng quyết định toàn bộ phần còn lại:

1. **Playwright không chạy được trong trình duyệt.** Nó cần spawn process, ghi file,
   và điều khiển một binary Chromium thật. "IDE chạy code Playwright trên trình duyệt"
   thực chất là: *soạn thảo* trên trình duyệt, *thực thi* trên server. Mọi kế hoạch
   phải bắt đầu từ chỗ này.

2. **Repo hiện tại đang là site tĩnh 100%** (`output: "export"` trong
   [next.config.ts](next.config.ts#L6)). Ở chế độ này Next.js **không cho phép**
   Route Handler đọc `Request` — tức là không có `POST /api/run`. Đây không phải
   thứ vá được bằng cấu hình phụ; phải chọn: bỏ static export, hoặc tách IDE ra
   deploy riêng.

3. **Vercel serverless không phải chỗ chạy `npx playwright test`.** Filesystem chỉ
   ghi được `/tmp`, bundle có trần dung lượng, thời gian chạy có trần, và
   Firefox/WebKit thì gần như bất khả thi. Kế hoạch cũ (`compiler.md`) đặt Phase 9
   "tách runner ra Docker" ở cuối — nên đảo lại: **tách runner ra ngay từ đầu**,
   vì làm trên Vercel trước rồi mới tách là làm hai lần.

**Khuyến nghị:** Next.js (Vercel) làm IDE + API mỏng → gọi sang **runner riêng
chạy Docker image chính thức của Playwright**. Không Redis, không BullMQ,
không Kubernetes ở MVP.

---

## 1. Đánh giá source hiện tại

### 1.1 Hiện trạng

| Hạng mục | Giá trị |
| --- | --- |
| Framework | Next.js 16.3.2, React 19.2.8, App Router |
| Chế độ build | `output: "export"` → 341 file HTML tĩnh trong `out/` |
| Dữ liệu | 322 entry cheatsheet, 15 nhóm, sinh từ `playwright-core@1.62.1` |
| Search | Fuse.js client-side, index 93 KB (`public/search-index.json`), p95 ~14.8 ms |
| Tô màu code | Shiki, chạy **hoàn toàn lúc build** (Server Component) |
| Theme | CSS variable + `data-theme`, có anti-flash script inline |
| Playwright | `@playwright/test@1.62.1` là devDependency, **chưa có `playwright.config.ts`** |
| Pipeline | 9 script trong `scripts/` — fetch → extract → merge → validate → typecheck → index |

Chất lượng code cao hơn mặt bằng: có ngân sách bundle rõ ràng, comment tiếng Việt
giải thích *lý do* chứ không mô tả lại code, dữ liệu tách "phần máy sinh"
(`data/facts.ts`) khỏi "phần người biên tập" (`data/NN-*.ts`) qua
[data/_entry.ts](data/_entry.ts). Gõ sai tên API là vỡ lúc build chứ không im lặng.

### 1.2 Tài sản tái dùng được — lý do nên xây IDE *ở đây* thay vì repo mới

| Tài sản | Dùng vào việc gì trong IDE |
| --- | --- |
| 322 entry + code mẫu đã qua `tsc` ([data/](data/)) | Thư viện snippet chèn thẳng vào editor. Đây là thứ đối thủ không có. |
| `public/search-index.json` + [lib/use-search.ts](lib/use-search.ts) | Command palette `Ctrl+K` trong editor: gõ "getByRole" → chèn ví dụ. |
| [lib/local-store.ts](lib/local-store.ts) | Lưu draft / danh sách test case ở localStorage — **hoãn được database vài phase**. |
| Theme tokens ([app/globals.css](app/globals.css#L22-L53)) | Cấp thẳng cho theme của Monaco/CodeMirror, không phải chế bảng màu mới. |
| [lib/use-copy.ts](lib/use-copy.ts), [lib/use-list-nav.ts](lib/use-list-nav.ts), [components/ShortcutHelp.tsx](components/ShortcutHelp.tsx) | UX bàn phím đã có sẵn quy ước, IDE nối tiếp chứ không phát minh lại. |
| `@playwright/test@1.62.1` đã ghim | **Ràng buộc quan trọng**: image runner phải ghim *đúng* version này, nếu không ví dụ trong cheatsheet chạy ra kết quả khác. |

### 1.3 Xung đột kiến trúc phải xử lý

Đây là phần quan trọng nhất của bản đánh giá.

**① `output: "export"` chặn API.** Docs Next.js liệt kê rõ trong mục *Unsupported
Features*: "Route Handlers that rely on Request". Không có `POST` thì không có nút RUN.

- Cách A (khuyến nghị): **bỏ `output: "export"`**, deploy Vercel bình thường.
  341 trang cheatsheet vẫn được prerender tĩnh vì đã có `generateStaticParams()` +
  `dynamicParams = false` ở [app/[category]/[id]/page.tsx](app/%5Bcategory%5D/%5Bid%5D/page.tsx#L14-L16).
  Mất đi khả năng "deploy lên CDN bất kỳ", đổi lấy backend. Đáng.
- Cách B: giữ site tĩnh, IDE nằm ở origin khác → phải xử lý CORS + hai lần deploy +
  không chia sẻ được layout. Chỉ chọn nếu bắt buộc phải giữ GitHub Pages.

**② `trailingSlash: true` là bẫy cho POST.** Cấu hình này khiến Next redirect
`/api/run` → `/api/run/`. Nhiều client **mất body khi bị redirect** trên POST.
Phải hoặc gọi đúng URL có dấu `/` cuối, hoặc đặt `skipTrailingSlashRedirect`.
Đây là loại lỗi mất nửa ngày để tìm — ghi ra trước.

**③ Shiki không được lọt vào bundle client.** [lib/highlight.ts](lib/highlight.ts#L9-L10)
ghi rõ cảnh báo này. Trang IDE là Client Component; nếu import nhầm `CodeBlock`
vào đó là kéo vài MB grammar xuống trình duyệt. Editor phải dùng bộ tô màu riêng.

**④ Monaco nặng gấp nhiều lần toàn bộ site hiện tại.** Site đang tự hào vì trang
chi tiết "không cần một byte JS nào". Monaco ~2–5 MB. Bắt buộc: `next/dynamic`
với `ssr: false`, **chỉ ở route `/ide`**, tuyệt đối không đặt trong
[app/layout.tsx](app/layout.tsx).

**⑤ Chạy code người dùng gửi lên = RCE có chủ đích.** `npx playwright test` trên
file do người lạ soạn nghĩa là họ chạy Node tuỳ ý trong hạ tầng của bạn:
`process.env`, đọc file, gọi API nội bộ, đào coin, dùng server bạn tấn công bên thứ ba.
`compiler.md` cũ xếp Security ở **Phase 7** — quá muộn. Đây là **P0**.

---

## 2. Chọn chỗ chạy runner

| Phương án | Được | Mất | Kết luận |
| --- | --- | --- | --- |
| **Vercel Function + `playwright-core` + `@sparticuz/chromium`** | Không thêm hạ tầng | Chỉ Chromium headless; không dùng được test runner thật (`expect` auto-retry, fixtures, HTML report); trace/video khó; `/tmp` bay sau mỗi lần chạy; cold start nặng | Chỉ hợp demo "goto + screenshot", **không hợp một IDE** |
| **Container riêng từ image `mcr.microsoft.com/playwright:v<ver>-noble`** (Fly.io / Railway / Render / VPS) | Test runner đầy đủ, cả 3 browser, trace + video + HTML report, kiểm soát được sandbox | Thêm một dịch vụ phải vận hành, tốn tiền chạy nền | **Khuyến nghị** |
| **Browser-as-a-service** (Browserbase, Browserless…) | Không phải nuôi browser | Vẫn cần chỗ chạy process Node của test runner → không giải quyết được vấn đề chính; tính tiền theo phút | Chỉ là bổ trợ |

Ghi chú: **WebContainer / WASM không cứu được** — chúng chạy được Node trong trình
duyệt nhưng không chạy được binary Chromium thật.

### Kiến trúc đề xuất

```
Trình duyệt (Monaco + snippet từ 322 entry)
        │  POST /api/runs        { code, browser }
        ▼
Next.js trên Vercel  ── xác thực, rate-limit, validate ──┐
        │  GET /api/runs/:id/stream  (SSE log realtime)  │
        ▼                                                ▼
Runner service (Docker, ghim đúng @playwright/test 1.62.1)
        │  container dùng-một-lần: non-root, fs read-only trừ /tmp,
        │  giới hạn CPU/RAM/pids, timeout cứng, chặn egress nội bộ
        ▼
Chromium / Firefox / WebKit  →  site cần test
        │
        ▼
Artifact (screenshot, video.webm, trace.zip, report) → object storage (R2/S3)
```

---

## 3. CHECKLIST

Đánh dấu `[x]` khi xong. Thứ tự trong mỗi phase là thứ tự nên làm.

### P0 — Gỡ chốt chặn kiến trúc (làm trước tiên, không bỏ qua)

- [ ] Quyết định dứt khoát: **bỏ `output: "export"`** hay tách origin riêng. Ghi lại lý do.
- [ ] Bỏ `output: "export"` khỏi [next.config.ts](next.config.ts); chạy `npm run build`
      và **xác nhận 341 trang vẫn được prerender tĩnh** (xem log build, phải là ○/●, không phải ƒ).
- [ ] Kiểm tra `images: { unoptimized: true }` còn cần không sau khi bỏ export.
- [ ] Xử lý bẫy `trailingSlash: true` với POST — chọn một: luôn gọi `/api/runs/`,
      hoặc thêm `skipTrailingSlashRedirect: true`. **Viết test chứng minh body không bị mất.**
- [ ] Tạo `playwright.config.ts` cho chính repo này (hiện chưa có) —
      dùng để test E2E cho IDE, tách khỏi config sinh cho user.
- [ ] Chốt version Playwright dùng ở runner = **1.62.1**, đúng bằng `data/facts.ts`.
      Ghi ràng buộc này vào `AGENTS.md` để lần bump version sau không lệch.
- [ ] Viết `THREAT-MODEL.md`: liệt kê những gì user code **được phép** và **không được phép** chạm.

### P1 — Sandbox runner (bắt buộc trước khi có nút RUN công khai)

- [ ] Dockerfile từ `mcr.microsoft.com/playwright:v1.62.1-noble` (xác minh tag tồn tại trên registry).
- [ ] Chạy container **non-root**, `--read-only`, chỉ mount `/tmp` ghi được (tmpfs, có giới hạn size).
- [ ] Giới hạn tài nguyên: `--memory`, `--cpus`, `--pids-limit`, `--security-opt no-new-privileges`.
- [ ] **Timeout cứng hai lớp**: timeout trong `playwright.config.ts` + `docker kill` từ ngoài.
- [ ] Chặn egress nội bộ: block `169.254.169.254` (metadata endpoint), `127.0.0.0/8`,
      `10/8`, `172.16/12`, `192.168/16`. Kiểm chứng bằng test cố tình gọi vào.
- [ ] Container **không có** biến môi trường chứa secret; runner giữ secret riêng ở tầng ngoài.
- [ ] Container **dùng một lần** — huỷ sau mỗi run, không tái sử dụng giữa các user.
- [ ] Kiểm thử phá hoại: fork bomb, `while(true)`, cấp phát hết RAM, `fetch` vào metadata,
      `require('fs').readFileSync('/etc/passwd')`, `process.env`, spawn process con.
      **Cả 7 phải bị chặn.**
- [ ] Rate limit theo IP/user + hàng đợi có trần (từ chối khi đầy, không xếp hàng vô hạn).

### P2 — Trang `/ide` và editor

- [ ] Route `app/ide/page.tsx`, có link từ header nhưng **không** đụng vào layout gốc.
- [ ] Chọn editor: **Monaco** (autocomplete `page.` thật, nặng) hay **CodeMirror 6**
      (nhẹ ~200 KB, không có type-checking). Khuyến nghị Monaco vì autocomplete là
      giá trị cốt lõi của một IDE Playwright.
- [ ] Nạp editor bằng `next/dynamic` + `ssr: false`. **Đo bundle trước/sau**, ghi số vào PR.
- [ ] Nạp `@playwright/test` `.d.ts` vào Monaco (`addExtraLib`) → autocomplete `page.getByRole(...)`.
- [ ] Map theme editor vào CSS variable sẵn có; đổi sáng/tối không reload.
- [ ] Layout 3 khung: editor | console | artifact. Có thể kéo giãn, nhớ tỉ lệ ở localStorage.
- [ ] **Command palette `Ctrl+K` tái dùng `use-search.ts`** → chọn entry → chèn code mẫu vào editor.
      *Đây là tính năng khác biệt của sản phẩm, đừng để tới cuối.*
- [ ] Lưu draft vào localStorage qua `createLocalStore` — chưa cần database.

### P3 — Chạy được một test

- [ ] `POST /api/runs` → validate input (giới hạn độ dài code, chỉ nhận `chromium` ở MVP), trả `runId`.
- [ ] Runner: ghi code vào file spec tạm, sinh `playwright.config.ts` **do server soạn**
      (không lấy config từ user), chạy test, thu stdout/stderr.
- [ ] Dùng reporter `json` để lấy trạng thái có cấu trúc, **không parse stdout bằng regex**.
- [ ] `GET /api/runs/:id` trả `{ status, duration, stats, error }`.
- [ ] UI hiện PASS/FAIL + thời gian + thông điệp lỗi (expected/actual) đã format tử tế.
- [ ] Xử lý đủ trường hợp lỗi: lỗi cú pháp TS, test timeout, browser crash, runner không phản hồi,
      hàng đợi đầy. **Mỗi cái một thông báo riêng**, không nuốt thành "Something went wrong".

### P4 — Log realtime + artifact

- [ ] SSE `GET /api/runs/:id/stream` đẩy log từng dòng (SSE đủ, chưa cần WebSocket).
- [ ] Xử lý mất kết nối: client tự nối lại, server đệm log để không mất đoạn đầu.
- [ ] Bật `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'retain-on-failure'`.
- [ ] Upload artifact lên object storage (R2/S3), trả **signed URL có hạn**, đặt TTL tự xoá.
- [ ] Xem screenshot inline; xem video `.webm` inline.
- [ ] Trace: tải `.zip` + link mở bằng `trace.playwright.dev` (hoặc tự host trace viewer).
- [ ] Dọn rác: cron xoá artifact quá hạn + giới hạn dung lượng theo user.

### P5 — Quản lý test case

- [ ] Database (Postgres/Supabase): `users`, `projects`, `test_cases`, `test_runs`, `artifacts`.
- [ ] Auth (bắt buộc trước khi mở công khai — chạy code ẩn danh là mời gọi lạm dụng).
- [ ] CRUD test case + đổi tên + nhân bản.
- [ ] Lịch sử chạy: danh sách run, xem lại kết quả và artifact cũ.
- [ ] Quota theo user: số run/ngày, tổng thời gian chạy, dung lượng artifact.

### P6 — Mở rộng

- [ ] Firefox + WebKit (image chính thức đã có sẵn cả ba — chỉ là chuyện tài nguyên).
- [ ] Chạy song song nhiều run (thêm hàng đợi thật khi và chỉ khi đo được nghẽn).
- [ ] Nhiều file trong một project, import lẫn nhau (Page Object Model).
- [ ] Nhúng codegen / recorder.
- [ ] Chia sẻ run bằng link công khai.

---

## 4. Bảng rủi ro

| Rủi ro | Mức | Xử lý |
| --- | --- | --- |
| RCE từ code người dùng | **Nghiêm trọng** | P1 toàn bộ. Không mở public trước khi P1 xong và đã kiểm thử phá hoại. |
| Chi phí runner chạy nền | Cao | Scale-to-zero (Fly.io Machines), quota mỗi user, timeout ngắn. |
| Monaco phá ngân sách bundle | Trung bình | Dynamic import, route-scoped, đo bundle mỗi PR. |
| Vercel timeout khi proxy run dài | Trung bình | Không proxy đồng bộ: trả `runId` ngay, kết quả qua SSE/polling. |
| Lệch version giữa cheatsheet và runner | Trung bình | Ghim 1.62.1 hai đầu, thêm bước CI so khớp. |
| Bỏ `output: export` làm hỏng 341 trang | Thấp | Đã có `generateStaticParams` + `dynamicParams=false`; xác minh ở P0. |
| User test site bất hợp pháp qua hạ tầng của bạn | Cao | Log đầy đủ, allowlist/blocklist domain, ToS, quota. |

---

## 5. Định nghĩa "MVP xong"

Đủ cả 6 gạch đầu dòng mới coi là xong:

1. Người dùng mở `/ide`, thấy editor có sẵn một test mẫu.
2. `Ctrl+K` → tìm `getByRole` → code mẫu được chèn vào editor.
3. Bấm RUN → log chạy hiện dần theo thời gian thực.
4. Test fail → thấy thông điệp lỗi rõ ràng + screenshot + video + link trace.
5. Reload trang → code vẫn còn (localStorage).
6. **Đã chạy đủ bộ kiểm thử phá hoại ở P1 và tất cả đều bị chặn.**

Mọi thứ khác — Firefox/WebKit, database, project, chạy song song, Redis, BullMQ —
đều ở **sau** vạch này.

---

## 6. Việc làm ngay

1. Chốt phương án ở P0 (bỏ static export hay tách origin).
2. Bỏ `output: "export"`, chạy `npm run build`, xác nhận vẫn ra 341 trang tĩnh.
3. Dựng `Dockerfile` runner + chạy được `npx playwright test` trên một file cứng.
4. Chỉ khi bước 3 xong mới bắt đầu đụng vào Monaco.

---

## 7. Những con số cần tự kiểm chứng

Kế hoạch này cố tình không khẳng định các giới hạn cụ thể của nhà cung cấp, vì
chúng thay đổi theo gói và theo thời điểm. Trước khi chốt kiến trúc, hãy tự đo:

- [ ] Trần thời gian chạy của Vercel Function trên gói đang dùng.
- [ ] Trần dung lượng bundle của Vercel Function (so với dung lượng browser của Playwright).
- [ ] Thời gian cold start thực tế của runner container ở nhà cung cấp đã chọn.
- [ ] Giá mỗi phút chạy container, nhân với số run dự kiến mỗi ngày.
- [ ] Tag image `mcr.microsoft.com/playwright` tương ứng đúng phiên bản 1.62.1.
