# Kế hoạch triển khai — Playwright Cheatsheet Website

> **Nguồn yêu cầu:** `guild.txt` — "Xây dựng một website cheatsheet, web này cho phép search tìm kiếm cú pháp câu, hàm, biến của Playwright."
>
> **Trạng thái:** 🚧 Phase 0 gần xong (vướng `npm install`) · Phase 1 ✅ 322 entry · Phase 2 ✅ p95 14,79 ms
> **Ngày lập:** 2026-08-25
> **Cập nhật:** 2026-08-25 — (1) thêm mục 6 "Nguồn dữ liệu" · (2) **chốt stack Next.js**, viết lại mục 3/4 và Phase 0/3/5/7
> **Playwright bản tham chiếu:** `v1.62.1`

---

## 1. Mục tiêu

Một trang web **tra cứu nhanh (cheatsheet)** cho Playwright, trọng tâm là **tìm kiếm tức thì**: gõ vài ký tự → ra ngay cú pháp, hàm, biến, ví dụ code, copy được luôn.

**4 tiêu chí thành công:**

- [ ] Từ lúc mở trang → tìm được cú pháp cần → copy code: **dưới 5 giây**
- [ ] Search trả kết quả **< 50ms**, chấp nhận gõ sai chính tả (fuzzy: `locater` → `locator`)
- [ ] Hoạt động **offline**, không cần backend, deploy tĩnh ở bất kỳ đâu
- [ ] **Mỗi cú pháp có URL riêng được Google index** — người ta search "playwright getByRole", không search "playwright cheatsheet"

---

## 2. Phạm vi

### ✅ Trong phạm vi (v1)

- Cheatsheet Playwright **TypeScript / JavaScript** (`@playwright/test`)
- Search fuzzy theo: tên hàm, mô tả, code, tag, category
- Lọc theo nhóm (Locators, Actions, Assertions, Config…)
- Copy code 1 click, phím tắt, dark / light mode
- **URL thật cho từng mục**: `/locators/get-by-role` (SSG, không phải hash)
- Responsive (desktop + mobile)

### ❌ Ngoài phạm vi (v1 — cân nhắc v2)

- Playwright cho Python / Java / .NET (chỉ chừa chỗ trong schema để mở rộng sau)
- Tài khoản người dùng, bookmark đồng bộ đám mây (v1 dùng `localStorage`)
- Backend / database / API server
- Playground chạy code trực tiếp trên web

---

## 3. Quyết định kỹ thuật

> ✅ **ĐÃ CHỐT: Next.js** (xác nhận 2026-08-25). Bản kế hoạch trước dùng React + Vite — đã thay toàn bộ.

| Hạng mục       | Chọn                                         | Lý do                                                                      |
| -------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Framework      | **Next.js 15 — App Router + TypeScript**     | SSG: mỗi cú pháp thành 1 trang tĩnh riêng → Google index được              |
| Chế độ build   | **`output: 'export'`**                       | Ra HTML tĩnh thuần → deploy được cả GitHub Pages, vẫn giữ được offline/PWA |
| Styling        | **Tailwind CSS v4**                          | Dựng UI dày đặc thông tin nhanh, dark mode sẵn                             |
| Search engine  | **Fuse.js** (client-side)                    | Fuzzy match tốt, chấp nhận gõ sai — đo thật: p95 **6.93ms** / 340 entry    |
| Highlight code | **Shiki trong React Server Component**       | Highlight lúc build → **0 KB JS** xuống browser (xem 3.3)                  |
| Dữ liệu        | **JSON/TS tĩnh** trong repo                  | Trang chi tiết đọc server-side; search index tách riêng (xem 3.2)          |
| Routing        | **File-based, URL thật**                     | `/locators/get-by-role` — chia sẻ đẹp, SEO tốt                             |
| Deploy         | **Cloudflare Pages / GitHub Pages / Vercel** | Static, miễn phí, CDN                                                      |

### 3.1 Kiến trúc trang — hybrid SSG + client search

Đây là điểm Next.js ăn đứt SPA cho loại web này:

```
/                        → Trang search
                           Client Component, tải search index (15.5 KB brotli)

/[category]              → 15 trang liệt kê nhóm
                           SSG

/[category]/[id]         → ~340 trang, mỗi cú pháp 1 trang
                           SSG hoàn toàn — Server Component, 0 KB JS,
                           code đã highlight sẵn lúc build,
                           có <title>/<meta> riêng → Google index từng cú pháp
```

**Hệ quả quan trọng:** trang chi tiết **không cần JS để hiển thị**. Người vào từ Google thấy nội dung ngay, không chờ hydrate. Chỉ khi bấm vào ô search mới tải index.

### 3.2 Ngân sách kích thước (đo thật, 340 entry trích từ `types.d.ts` v1.62.1)

| Loại                                                                                 | JSON thô | gzip    | **brotli**  |
| ------------------------------------------------------------------------------------ | -------- | ------- | ----------- |
| Dữ liệu đầy đủ (mọi field)                                                           | 205.4 KB | 26.1 KB | 18.9 KB     |
| **Search index gọn** (`id`, `title`, `signature`, `description`, `tags`, `category`) | 152.0 KB | 20.9 KB | **15.5 KB** |
| Index siêu gọn (`id`, `title`, `tags`, `category`)                                   | 30.7 KB  | 1.7 KB  | 1.5 KB      |

⇒ **Chọn "index gọn" (15.5 KB brotli)** cho trang search — vẫn tìm được theo `signature` và `description`. Phần `code` / `params` đầy đủ nằm trong trang SSG, không cần ship xuống client.

**Không cần database.** Dữ liệu read-only, 205 KB, không đổi giữa các lần deploy → thuộc về bundle, không thuộc về API. Một truy vấn DB qua mạng mất 50–200ms; đọc trong RAM mất **~4ms**.

### 3.3 Hiệu năng đã benchmark (Fuse.js 7.5.0)

|                         | 340 entry   | 647 entry |
| ----------------------- | ----------- | --------- |
| `JSON.parse`            | 0.37 ms     | 0.61 ms   |
| Dựng index Fuse (1 lần) | 3.50 ms     | 4.88 ms   |
| **Search — trung vị**   | **3.82 ms** | 7.81 ms   |
| Search — p95            | 6.93 ms     | 14.05 ms  |

Mục tiêu < 50ms → dư **13 lần**. Fuzzy xác nhận hoạt động: `locater` → `pickLocator()`, `locator()`, `frameLocator()`.

**Rủi ro bundle nằm ở Shiki, không phải data:**

| Package                | Unpacked    |
| ---------------------- | ----------- |
| `@shikijs/langs`       | **8.25 MB** |
| `@shikijs/themes`      | 1.41 MB     |
| Toàn bộ data 340 entry | **0.24 MB** |

⇒ Bắt buộc chạy Shiki trong **Server Component** (highlight lúc build). Import Shiki vào Client Component là kéo 8 MB grammar xuống browser.

### 3.4 Cái giá của `output: 'export'`

Static export **chặn** các tính năng sau:

| Mất                         | Dự án này có cần?                                        |
| --------------------------- | -------------------------------------------------------- |
| API Routes / Route Handlers | ❌ không — không có backend                              |
| Middleware                  | ❌ không                                                 |
| ISR / `revalidate`          | ❌ không — data đổi theo bản Playwright, rebuild là được |
| `next/image` tối ưu ảnh     | ❌ không — đặt `images: { unoptimized: true }`           |
| Server Actions              | ❌ không                                                 |

⇒ Không mất gì thực sự. Đổi lại giữ được: deploy ở đâu cũng chạy, offline được, không phụ thuộc Vercel.

> Nếu sau này muốn dùng ISR/Server Actions → bỏ `output: 'export'` và deploy lên Vercel/Cloudflare Workers. Không phải viết lại code, chỉ đổi config + chỗ deploy.

---

## 4. Cấu trúc thư mục dự kiến

```
D:/Syntax/
├── guild.txt
├── implement.md              ← file này
├── package.json
├── next.config.ts            ← output: 'export', images.unoptimized
├── tsconfig.json
├── playwright.config.ts
├── .cache/                   ← nguồn tải về, KHÔNG commit
│   ├── pw.d.ts
│   ├── params.md
│   └── class-*.md
├── app/
│   ├── layout.tsx            ← html/body, theme provider, font
│   ├── page.tsx              ← TRANG SEARCH (client)
│   ├── [category]/
│   │   ├── page.tsx          ← liệt kê nhóm (SSG)
│   │   └── [id]/
│   │       └── page.tsx      ← CHI TIẾT 1 cú pháp (SSG, 0 KB JS)
│   ├── sitemap.ts            ← Next tự sinh sitemap.xml
│   ├── robots.ts
│   ├── opengraph-image.tsx   ← OG image sinh lúc build
│   └── globals.css
├── components/
│   ├── SearchBar.tsx         ← 'use client'
│   ├── SearchResults.tsx     ← 'use client'
│   ├── CategoryFilter.tsx    ← 'use client'
│   ├── CopyButton.tsx        ← 'use client' — phần DUY NHẤT cần JS ở trang chi tiết
│   ├── CodeBlock.tsx         ← Server Component, gọi Shiki
│   ├── EntryCard.tsx         ← Server Component
│   ├── Sidebar.tsx
│   ├── ThemeToggle.tsx       ← 'use client'
│   └── ShortcutHelp.tsx      ← 'use client'
├── lib/
│   ├── types.ts              ← schema CheatEntry + DataMeta
│   ├── entries.ts            ← getAllEntries / getEntry / getCategories
│   ├── highlight.ts          ← Shiki singleton (server-only)
│   └── search.ts             ← cấu hình Fuse.js + trọng số
├── data/
│   ├── candidates.json       ← ~963 entry sinh tự động (mục 6)
│   ├── 01-cli.ts   …   15-advanced.ts
│   └── index.ts
├── public/
│   ├── search-index.json     ← index gọn 15.5 KB brotli (sinh lúc build)
│   └── favicon.svg
├── scripts/                  ← pipeline dữ liệu (mục 6)
│   ├── fetch-sources.ts      ← tải types.d.ts + docs md, ghim version
│   ├── extract-types.ts      ← parse types.d.ts (TS Compiler API)
│   ├── extract-docs.ts       ← parse class-*.md (lấy `since`, resolve macro)
│   ├── merge.ts              ← join 2 nguồn → candidates.json
│   ├── build-search-index.ts ← sinh public/search-index.json
│   ├── validate-data.ts      ← trùng id, thiếu field, docsUrl chết
│   └── typecheck-samples.ts  ← tsc --noEmit mọi code mẫu
└── tests/                    ← Playwright test cho chính website này 🎯
    ├── search.spec.ts
    ├── copy.spec.ts
    ├── shortcuts.spec.ts
    ├── seo.spec.ts           ← MỚI: check title/meta/sitemap từng trang
    └── a11y.spec.ts
```

---

## 5. Schema dữ liệu

```ts
type CheatEntry = {
  id: string; // 'get-by-role' — unique trong category, thành URL segment
  title: string; // 'page.getByRole()'
  category: Category; // 'locators'  → URL: /locators/get-by-role
  signature: string; // 'getByRole(role, options?): Locator'
  description: string; // Mô tả tiếng Việt, 1–2 câu
  code: string; // Ví dụ chạy được
  params?: Param[]; // { name, type, required, description }
  returns?: string; // 'Locator'
  since?: string; // 'v1.34' — lấy từ docs/src/api (mục 6)
  tags: string[]; // ['locator', 'role', 'a11y', 'recommended']
  docsUrl: string; // Link docs chính thức
  related?: string[]; // id của các entry liên quan
  note?: string; // Cảnh báo / deprecated / best practice
};

// Metadata toàn bộ dataset — BẮT BUỘC, để biết cheatsheet lệch bao nhiêu
type DataMeta = {
  generatedFrom: string; // 'playwright-core@1.62.1'
  generatedAt: string; // ISO date
};

// Bản rút gọn ship xuống client cho search (15.5 KB brotli — mục 3.2)
type SearchIndexEntry = Pick<
  CheatEntry,
  "id" | "title" | "signature" | "description" | "tags" | "category"
>;
```

**Quy tắc dữ liệu:**

- [ ] `id` duy nhất **trong từng category**, kebab-case, an toàn cho URL
- [ ] Mọi `code` phải **chạy được thật** — kiểm bằng `tsc --noEmit`, không phải đọc tay
- [ ] Mọi entry phải có `docsUrl` trỏ về docs Playwright chính thức
- [ ] Mô tả bằng **tiếng Việt**, tên hàm / code giữ nguyên tiếng Anh
- [ ] Dataset phải kèm `generatedFrom` — không có thì 6 tháng sau không biết đã lỗi thời chưa

---

## 6. Nguồn dữ liệu

> Toàn bộ số liệu mục này đã **kiểm chứng thật** ngày 2026-08-25 trên Playwright `v1.62.1`.

### 6.1 Không có REST API chính thức

Đã thử, đều **404**:

- `https://playwright.dev/api.json`
- `https://raw.githubusercontent.com/microsoft/playwright/v1.62.1/utils/doclint/api.json`

⇒ Không lấy dữ liệu qua API được. Nhưng có 3 nguồn **máy đọc được** còn tốt hơn.

### 6.2 Nguồn A — `types.d.ts` qua CDN (nguồn chính)

```bash
curl -sL https://unpkg.com/playwright-core@1.62.1/types/types.d.ts -o .cache/pw.d.ts
```

Không cần `npm install`. Số liệu đo thật trên v1.62.1:

| Chỉ số                     | Giá trị              |
| -------------------------- | -------------------- |
| Dung lượng                 | 1.1 MB — 26,188 dòng |
| Method public              | **963**              |
| Interface / class          | 66                   |
| Khối code `js` trong JSDoc | **353**              |
| `@param` có mô tả          | **761**              |
| `@deprecated`              | 81                   |

JSDoc đầy đủ hơn dự kiến. Ví dụ `getByRole` có sẵn: mô tả, khối HTML minh hoạ, 3 dòng code mẫu, doc từng param.

- **Parse bằng:** TypeScript Compiler API (`ts.createSourceFile` + đọc JSDoc node)
- **Cho:** `title`, `signature`, `params`, `returns`, `note` (từ `@deprecated`), `code` (từ JSDoc)
- **Thiếu:** ❌ không có `since:` version

### 6.3 Nguồn B — GitHub raw `docs/src/api/*.md` (bù đúng chỗ thiếu)

```bash
curl -sL https://raw.githubusercontent.com/microsoft/playwright/v1.62.1/docs/src/api/class-locator.md
```

40+ file `class-*.md` — đây là **nguồn gốc sinh ra docs website**. Format có cấu trúc:

````
## method: Locator.and
* since: v1.34          ← types.d.ts KHÔNG có
- returns: <[Locator]>

Creates a locator that matches both this locator and the argument locator.

**Usage**

```js
const button = page.getByRole('button').and(page.getByTitle('Subscribe'));
```

### param: Locator.and.locator
* since: v1.34
- `locator` <[Locator]>
````

- **Cho:** `since`, `returns` chuẩn, code mẫu JS
- **Riêng `class-locator.md`** có 273 marker `* since:`

#### ⚠️ Hai cái bẫy khi parse (đã đụng phải lúc kiểm chứng)

**Bẫy 1 — code mẫu có 5 ngôn ngữ.** Mỗi method kèm khối code cho `js`, `java`, `python async`, `python sync`, `csharp`. Phải lọc **chỉ lấy `js`**, không thì cheatsheet lẫn code Python.

**Bẫy 2 — macro `%%-...-%%` có biến thể theo ngôn ngữ.** File `class-*.md` viết:

```
### option: Locator.check.timeout = %%-input-timeout-%%
### option: Locator.check.timeout = %%-input-timeout-js-%%
```

Macro định nghĩa trong **`docs/src/api/params.md`**, và **giá trị mặc định khác nhau**:

| Macro                 | `langs`              | Default                 |
| --------------------- | -------------------- | ----------------------- |
| `## input-timeout`    | python, java, csharp | `30000` ms              |
| `## input-timeout-js` | **js**               | **`0` — không timeout** |

⇒ Lấy nhầm biến thể là **ghi sai giá trị mặc định** trong cheatsheet. Bắt buộc ưu tiên hậu tố `-js`.

### 6.4 Nguồn C — API phụ trợ

| Endpoint                                                                      | Dùng để                                             | Giới hạn                             |
| ----------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| `api.github.com/repos/microsoft/playwright/contents/docs/src/api?ref=v1.62.1` | Liệt kê 40+ file `class-*.md`                       | 60 req/h không token · 5000 có token |
| `registry.npmjs.org/playwright-core/latest`                                   | Đọc version mới nhất → cảnh báo cheatsheet lỗi thời | —                                    |
| `playwright.dev/sitemap.xml`                                                  | **358 URL** — validate `docsUrl` không chết         | —                                    |

### 6.5 Pipeline join

```
  Nguồn A: types.d.ts                Nguồn B: docs/src/api/*.md
  signature, params, returns,        since, returns, code js
  deprecated, code JSDoc                     (+ params.md)
          │                                       │
          └──────────► join theo khoá ◄───────────┘
                      "Locator.click"
                             │
                             ▼
              candidates.json  (~963 entry)
              chính xác 100%, KHÔNG gõ tay
                             │
                             ▼  ← CHỌN LỌC tay
                     ~340 entry curated
                             │
                             ├──► SSG 340 trang chi tiết (đầy đủ)
                             └──► public/search-index.json (gọn, 15.5 KB)
                             │
                             ▼  ← VALIDATE
              tsc --noEmit  +  check sitemap.xml
```

### 6.6 Field nào lấy từ đâu

| Field                                     | Nguồn               | Cách                        |
| ----------------------------------------- | ------------------- | --------------------------- |
| `title`, `signature`, `params`, `returns` | A                   | 🤖 tự động                  |
| `since`                                   | B                   | 🤖 tự động                  |
| `note` (deprecated)                       | A (`@deprecated`)   | 🤖 tự động                  |
| `docsUrl`                                 | suy ra từ tên class | 🤖 tự động                  |
| `code`                                    | A hoặc B            | 🤖 tự động → ✍️ rút gọn tay |
| **`description` (tiếng Việt)**            | —                   | ✍️ **viết tay**             |
| **`category`, `tags`, `related`**         | —                   | ✍️ **viết tay**             |
| **`note` (best practice)**                | —                   | ✍️ **viết tay**             |

> **Nguyên tắc:** `types.d.ts` sinh ra 963 method — đó là **API dump**, không phải cheatsheet. Giá trị của cheatsheet nằm ở _chọn lọc_ và _giải thích khi nào dùng_. Script chỉ tạo **khung chính xác + danh sách ứng viên**; việc chọn ~340 cái và viết mô tả vẫn là làm tay.

### 6.7 Không dùng nguồn nào

❌ **Kiến thức có sẵn của LLM** để sinh signature / default value — có knowledge cutoff, API mới hoặc vừa deprecated sẽ sai âm thầm. Chỉ dùng LLM cho `description` tiếng Việt, và **luôn** đối chiếu lại với nguồn A/B.

---

## 7. Nội dung cheatsheet — 15 nhóm

Mỗi nhóm = 1 route segment. Ví dụ nhóm 4 → `/locators/*`.

| #   | Nhóm (slug)                               | Nội dung chính                                                                                                                                                                                                                          | Ước lượng |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | **CLI & Cài đặt** (`cli`)                 | `npx playwright install`, `test`, `codegen`, `show-report`, `--ui`, `--debug`, `--headed`, `--project`, `--grep`, `--repeat-each`                                                                                                       | ~20       |
| 2   | **Cấu trúc test** (`test-structure`)      | `test`, `test.describe`, `beforeEach/All`, `afterEach/All`, `test.skip/only/fixme/slow`, `test.step`, `test.use`                                                                                                                        | ~20       |
| 3   | **Fixtures** (`fixtures`)                 | `page`, `context`, `browser`, `browserName`, `request`, custom fixture, worker fixture, `test.extend`                                                                                                                                   | ~15       |
| 4   | **Locators** (`locators`)                 | `getByRole`, `getByText`, `getByLabel`, `getByPlaceholder`, `getByAltText`, `getByTitle`, `getByTestId`, `locator()`, CSS/XPath, `filter`, `first/last/nth`, `and/or`, chaining                                                         | ~30       |
| 5   | **Actions** (`actions`)                   | `click`, `dblclick`, `fill`, `pressSequentially`, `press`, `check/uncheck`, `selectOption`, `setInputFiles`, `hover`, `focus`, `dragTo`, `tap`, `clear`, `scrollIntoViewIfNeeded`                                                       | ~30       |
| 6   | **Assertions** (`assertions`)             | `toBeVisible`, `toHaveText`, `toContainText`, `toHaveValue`, `toHaveAttribute`, `toHaveClass`, `toHaveCount`, `toBeEnabled/Disabled/Checked/Editable/Empty/Focused`, `toHaveURL`, `toHaveTitle`, `expect.soft`, `expect.poll`, `toPass` | ~40       |
| 7   | **Page & Navigation** (`page`)            | `goto`, `reload`, `goBack`, `waitForURL`, `waitForLoadState`, `waitForFunction`, `waitForEvent`, `evaluate`, `addInitScript`, `screenshot`, `pdf`, `setViewportSize`, `emulateMedia`                                                    | ~30       |
| 8   | **Browser & Context** (`browser-context`) | `chromium.launch`, `launchPersistentContext`, `newContext`, `storageState`, cookies, permissions, geolocation, `recordVideo`, `recordHar`, `tracing`                                                                                    | ~25       |
| 9   | **Network** (`network`)                   | `route`, `fulfill`, `abort`, `continue`, `waitForResponse/Request`, `APIRequestContext` (`request.get/post/put/delete`), HAR replay                                                                                                     | ~25       |
| 10  | **Frames & Dialogs** (`frames-dialogs`)   | `frameLocator`, popup, `page.on('dialog')`, download, upload, tab mới                                                                                                                                                                   | ~15       |
| 11  | **Auth & State** (`auth-state`)           | `storageState`, `globalSetup`, setup project dependencies, `auth.setup.ts`, tái dùng session                                                                                                                                            | ~12       |
| 12  | **Config** (`config`)                     | `playwright.config.ts`: `testDir`, `timeout`, `fullyParallel`, `retries`, `workers`, `reporter`, `use{baseURL, trace, screenshot, video, headless, viewport}`, `projects`, `webServer`                                                  | ~30       |
| 13  | **Debug & Report** (`debug-report`)       | Trace viewer, `page.pause()`, `PWDEBUG`, UI mode, reporter `html/json/junit/list/blob`                                                                                                                                                  | ~18       |
| 14  | **Visual testing** (`visual-testing`)     | `toHaveScreenshot`, `toMatchSnapshot`, `maxDiffPixels`, `threshold`, `mask`, `--update-snapshots`                                                                                                                                       | ~12       |
| 15  | **Nâng cao** (`advanced`)                 | `mergeTests`, `mergeExpects`, custom matcher, parameterized / data-driven, tag `@smoke`, annotations, Page Object Model                                                                                                                 | ~18       |

**Tổng ước lượng: ~340 entry** ⇒ **~340 trang SSG + 15 trang nhóm + 1 trang search = ~356 trang tĩnh.** Chọn lọc từ **963 ứng viên** mà pipeline mục 6 sinh ra. Mốc tối thiểu cho v1: **≥ 200 entry**, phủ đủ 15 nhóm.

---

## 8. Checklist thực hiện theo phase

### Phase 0 — Khởi tạo dự án ⚠️ GẦN XONG (2026-08-25, làm lại)

> **Bản ghi trước sai.** Mục này từng được đánh dấu "✅ XONG" nhưng thư mục dự án
> khi đó chỉ còn `guild.txt` + `implement.md`, repo chưa có commit nào. Toàn bộ
> Phase 0 đã được làm lại từ đầu và ghi lại đúng thực tế bên dưới.

- [x] `.gitignore` (`node_modules`, `.next`, `out`, `test-results`, `playwright-report`, `.cache`)
- [x] Scaffold Next.js — xem ghi chú ⚠️ bên dưới, lệnh trong kế hoạch **không chạy được nguyên văn**
- [x] `next.config.ts`: `output: 'export'` + `images: { unoptimized: true }` + `trailingSlash: true`
- [x] Cấu hình Prettier (`.prettierrc.json` + `.prettierignore`)
- [x] Script `format`, `format:check`, `typecheck` + 8 script `data:*` cho pipeline dữ liệu
- [ ] ❌ **`npm install` chưa xong** — chặn 4 mục dưới đây. Xem "Vướng mạng" bên dưới.
- [ ] Cài `@playwright/test@1.62.1` (devDependency)
- [ ] `npm run dev` lên được trang mặc định
- [ ] `npm run build` sạch → sinh `out/index.html`
- [ ] `npm run typecheck` và `npm run lint`

#### ⚠️ Ba chỗ thực tế khác kế hoạch

**1. Không scaffold thẳng vào `D:/Syntax` được.** npm cấm tên package có chữ hoa, mà `create-next-app` lấy tên từ tên thư mục → `"Syntax"` bị từ chối. Cách đã dùng:

```bash
npx create-next-app@latest pw-tmp --typescript --tailwind --app --eslint \
  --no-src-dir --import-alias "@/*" --use-npm --no-turbopack --skip-install --yes
mv pw-tmp/* pw-tmp/.[!.]* . && rmdir pw-tmp
# rồi sửa "name" trong package.json thành "playwright-cheatsheet"
```

**2. Next.js ra bản 16.3.2, không phải 15.** Kế hoạch viết "Next.js 15" từ trước khi kiểm tra. Bản thực tế: `next@16.3.2`, `react@19.2.8`. App Router và `output: 'export'` không đổi nên phần còn lại của kế hoạch vẫn đúng.

**3. Thêm `trailingSlash: true`** (không có trong kế hoạch gốc). Cần cho host tĩnh: mỗi route thành thư mục riêng có `index.html`, để `/locators/get-by-role/` chạy trên GitHub Pages mà không cần cấu hình rewrite.

#### 🔴 Vướng mạng — `npm install` chưa hoàn tất

Băng thông tới `registry.npmjs.org` từ máy này đo được **~3,6 KB/s**. Đã thử 4 lần, mỗi lần tải được tới **~430 MB** rồi đứt `ECONNRESET` và npm rollback sạch `node_modules`.

Đã đo thử mirror khác để tham khảo:

| Registry                   | Tốc độ đo được | So với gốc |
| -------------------------- | -------------- | ---------- |
| `registry.npmjs.org`       | 3,6 KB/s       | —          |
| `registry.yarnpkg.com`     | 82 KB/s        | ~23×       |
| `registry.npmmirror.com`   | 1,5 MB/s       | ~400×      |

Đã hỏi và **chốt giữ registry chính thức**, chấp nhận chờ. Cần chạy lại `npm install` khi mạng khá hơn, rồi làm nốt 4 mục còn lại của Phase 0.

**Việc này KHÔNG chặn Phase 1** — pipeline dữ liệu chạy bằng Node thuần (Node 25 chạy TypeScript trực tiếp, không cần `tsx`), và `typescript` đã kịp có mặt trong một lần cài trước khi bị rollback.

#### Ghi chú thêm

- `create-next-app` tự sinh `AGENTS.md` + `CLAUDE.md` — giữ nguyên
- `implement.md` đã đưa vào `.prettierignore` — tài liệu viết tay, không để Prettier căn lại bảng
- **Chưa commit** — repo đã `git init`, chờ bạn quyết định

### Phase 1 — Tầng dữ liệu ✅ XONG (2026-08-25)

> Nguyên tắc: **máy lo phần chính xác, người lo phần chọn lọc & giải thích.**

**Kết quả: 322 entry, phủ đủ 15 nhóm, 322/322 `docsUrl` đối chiếu sitemap thật, 296/296 đoạn code TypeScript biên dịch sạch.**

#### 1a. Khung

- [x] `lib/types.ts` — `CheatEntry` + `DataMeta` + `SearchIndexEntry` + `Param`
- [x] Hằng số `CATEGORIES` (15 nhóm + slug ở mục 7)
- [x] **Thêm ngoài kế hoạch:** field `codeLang: 'ts' | 'bash'`. Nhóm CLI là lệnh shell chứ không phải TypeScript — không tách ra thì `tsc` báo lỗi ở cả 20 entry, và Phase 3 cũng cần đúng field này để Shiki tô màu

#### 1b. Script extract — 🤖 tự động

- [x] `scripts/fetch-sources.ts` — tải nguồn về `.cache/`, ghim version, retry khi mạng đứt
- [x] `scripts/extract-types.ts` — TypeScript Compiler API → **1.095 member** từ 90 interface/class
- [x] `scripts/extract-docs.ts` — parse 66 file `.md` → **903 member js**, 100% có `since`
- [x] `scripts/merge.ts` — join A + B → `data/candidates.json` (**932 ứng viên**, kế hoạch ước 963)
- [x] **Bẫy 1 xử lý:** chỉ lấy khối ```js — bỏ 99 member + 330 param/option của java/python/csharp
- [x] **Bẫy 2 xử lý:** `Locator.check.timeout` default = **`0`** ✓ (không phải `30000`). Spot-check này chạy **ngay trong script**, sai là fail build chứ không chờ người kiểm

#### 🔎 Ba chỗ thực tế khác kế hoạch

**1. Kế hoạch thiếu hẳn nguồn cho `@playwright/test`.** Mục 6.2/6.3 chỉ nói `playwright-core` + `docs/src/api`. Nhưng `test`, `expect`, fixtures, `playwright.config.ts`, `testInfo` **không nằm ở đó** — chúng ở `docs/src/test-api/` (12 file) và `playwright/types/test.d.ts`. Thiếu hai nguồn này thì **6/15 nhóm không có dữ liệu**. Đã bổ sung vào `fetch-sources.ts`.

**2. `raw.githubusercontent.com` không truy cập được** từ máy này (SSL connect error). Đã đổi sang `cdn.jsdelivr.net/gh/...` làm mirror chính, giữ raw làm dự phòng.

**3. Thêm `data/facts.ts` (máy sinh) + `data/_entry.ts` (cầu nối).** Kế hoạch để entry viết tay chứa cả `signature`, `params`, `since`, `docsUrl` — tức chép tay 322 lần thứ máy đã biết chính xác, và lệch dần mỗi lần Playwright ra bản mới. Nay file `data/NN-*.ts` chỉ viết **phần người** (chọn cái nào, nhóm nào, giải thích tiếng Việt), còn phần máy lấy từ `facts.ts`:

```ts
entry("Locator.check", "actions", {
  id: "check",
  description: "Tích vào checkbox hoặc radio, rồi kiểm tra lại là nó đã được tích thật.",
  code: `await page.getByLabel('Tôi đồng ý').check();`,
  tags: ["action", "form", "checkbox"],
})
// signature / params / since / docsUrl -> tự lấy từ facts.ts
```

Bump version Playwright ⇒ chạy lại `npm run data:pipeline` ⇒ mọi chữ ký tự cập nhật, không phải sờ vào entry nào. Gõ sai khoá API là **ném lỗi ngay lúc build**, không im lặng ra trang trống.

#### 1c. Chọn lọc & biên tập — ✍️ làm tay

- [x] Từ 932 ứng viên → chọn **322**, gán nhóm cho từng cái
- [x] `id` kebab-case, không trùng trong cùng nhóm
- [x] `description` tiếng Việt, trả lời "khi nào dùng" chứ không dịch lại docs
- [x] `tags`, `related` (mọi link `related` được kiểm là có thật)
- [x] `note` best-practice ở những chỗ dễ sai — vd `isVisible()` không tự chờ, `waitForTimeout` làm test chập chờn, `actionTimeout` mặc định là 0 chứ không phải 30000
- [x] 15 file `data/NN-*.ts` + `data/index.ts`

| #   | Nhóm            | Entry  | #   | Nhóm            | Entry   |
| --- | --------------- | ------ | --- | --------------- | ------- |
| 1   | cli             | 20     | 9   | network         | 21      |
| 2   | test-structure  | 20     | 10  | frames-dialogs  | 17      |
| 3   | fixtures        | 10     | 11  | auth-state      | 11      |
| 4   | locators        | 30     | 12  | config          | 37      |
| 5   | actions         | 25     | 13  | debug-report    | 16      |
| 6   | assertions      | 35     | 14  | visual-testing  | 12      |
| 7   | page            | 30     | 15  | advanced        | 15      |
| 8   | browser-context | 23     |     | **Tổng**        | **322** |

Ít hơn ước lượng 340 nhưng vượt xa mốc tối thiểu 200, và phủ đủ 15 nhóm.

#### 1d. Validate — 🤖 tự động, đã sạch

- [x] `scripts/validate-data.ts` — id trùng, field thiếu, category lạ, `related` trỏ hụt
- [x] `docsUrl` đối chiếu `playwright.dev/sitemap.xml` (358 URL) → **322/322 có thật**
- [x] `scripts/typecheck-samples.ts` — **296/296 đoạn TypeScript biên dịch sạch** với `strict: true`
- [x] `scripts/build-search-index.ts` → `public/search-index.json`
- [x] `npm run data:check` chạy sạch cả ba → ✅ chốt Phase 1

**Ngân sách search index (đo thật, 322 entry):**

| Dạng   | Kích thước |
| ------ | ---------- |
| thô    | 93,4 KB    |
| gzip   | 21,9 KB    |
| brotli | **18,9 KB** |

Kế hoạch dự trù 15,5 KB brotli cho 340 entry. Thực tế 18,9 KB cho 322 — cao hơn vì mô tả tiếng Việt dài hơn mô tả tiếng Anh. Vẫn dưới ngưỡng cảnh báo 25 KB.

**Về `typecheck-samples.ts`:** type lấy thẳng từ `.cache/pw-test.d.ts` + `.cache/pw.d.ts` qua `compilerOptions.paths`, không qua `node_modules`. Nghĩa là code mẫu được kiểm với **đúng bản Playwright mà cheatsheet đang ghim**, chứ không phải bản đang cài trên máy. Đây cũng là lý do Phase 1 chốt được dù `npm install` chưa xong.

### Phase 2 — Search engine ✅ XONG (2026-08-25)

**Đo thật trên 322 entry: p95 = 14,79 ms — dư 3,4× so với mục tiêu 50 ms. 29/29 phép kiểm hành vi đạt.**

- [x] `lib/search.ts` — Fuse.js, trọng số `title` 0.5 · `tags` 0.2 · `signature` 0.15 · `description` 0.1
- [x] Tải `search-index.json` **lazy** — chỉ khi user focus vào ô search hoặc gõ phím
- [x] Hook `useSearch()` + debounce 120ms (`lib/use-search.ts`)
- [x] Highlight đoạn khớp trong kết quả
- [x] Trạng thái rỗng: chưa gõ → không tìm; không kết quả → gợi ý "Ý bạn là…"
- [x] Benchmark lại trên máy thật — **p95 14,79 ms** (mẫu kế hoạch: 6,93 ms)

#### Số đo thật (`npm run search:bench`, 500 lượt / 20 truy vấn)

| | 322 entry | Kế hoạch dự trù |
| --- | --- | --- |
| `JSON.parse` | 0,48 ms | 0,37 ms |
| Dựng index Fuse (1 lần) | 0,91 ms | 3,50 ms |
| **Tổng khởi động** | **1,38 ms** | — |
| Search — trung vị | 8,73 ms | 3,82 ms |
| **Search — p95** | **14,79 ms** | 6,93 ms |
| Search — p99 | 16,74 ms | — |

Chậm hơn số mẫu của kế hoạch khoảng 2× — vì mô tả tiếng Việt dài hơn tiếng Anh nên Fuse phải quét nhiều ký tự hơn. Vẫn dư 3,4× so với ngưỡng 50 ms.

Fuzzy xác nhận chạy trên dữ liệu thật:

| Gõ sai | Ra đúng |
| --- | --- |
| `locater` | `locator.first()`, `locator.last()`, `frameLocator.owner()` |
| `getByRoel` | `page.getByRole()`, `page.getByText()` |
| `tohavetext` | `locatorAssertions.toHaveText()` |
| `srceenshot` | `testOptions.screenshot`, `expect(page).toHaveScreenshot()` |

#### Bốn quyết định khác kế hoạch

**1. Tách `lib/search.ts` (thuần) khỏi `lib/use-search.ts` (React).** `search.ts` không import React, không chạm DOM — nhờ vậy benchmark chạy được bằng **Node thuần**, không cần Next.js hay browser. Đây chính là lý do Phase 2 chốt được trong khi Phase 0 còn dở `npm install`.

**2. Debounce 120ms giữ nguyên, nhưng vì lý do khác kế hoạch.** Search chỉ mất ~9ms nên không cần debounce để đỡ tải máy. 120ms ở đây là để danh sách kết quả không nhấp nháy khi gõ nhanh — lý do thị giác. Xoá trắng ô thì trả kết quả **ngay**, không bắt chờ thêm 120ms.

**3. Lọc nhóm chạy SAU khi tìm, không phải trước.** Giữ nguyên thứ hạng Fuse tính trên toàn bộ tập, nên kết quả không nhảy lung tung khi user đổi bộ lọc. Đã có phép kiểm cho việc này.

**4. `highlight()` trả mảng đoạn, không trả chuỗi HTML.** Trả HTML thì component phải dùng `dangerouslySetInnerHTML` cho nội dung lấy từ dữ liệu — không đáng đánh đổi để tiết kiệm vài dòng.

#### Kiểm hành vi (`npm run search:check` — 29 phép kiểm)

Những thứ nhìn mắt không thấy được:

- Tô sáng: khoảng chồng nhau / liền kề / đảo thứ tự đều gộp đúng; ghép segment lại phải ra **đúng chuỗi gốc** (tô sáng làm mất chữ là lỗi thầm lặng); chữ có dấu tiếng Việt không vỡ
- Tìm kiếm: gõ 1 ký tự không tìm; tên hàm chính xác lên đầu; điểm sắp tăng dần; `countByCategory` khớp tổng số
- Trạng thái rỗng: truy vấn vô nghĩa thì **cũng không gợi ý bừa**
- Tải lazy: 3 lần gọi song song chỉ fetch **1 lần**; fetch hỏng thì lần sau **thử lại được**, không kẹt cache vĩnh viễn
- Đường dẫn: href có trailing slash, khớp `trailingSlash: true` trong `next.config.ts`

> **Còn nợ Phase 3:** ráp hook vào UI thật để bấm thử. Logic đã kiểm bằng test, nhưng chưa có ai gõ vào ô input thật — đó là việc của Phase 3, không phải Phase 2.

### Phase 3 — Giao diện

#### 3a. Trang SSG (Server Component — 0 KB JS)

- [ ] `app/[category]/[id]/page.tsx` + `generateStaticParams()` → sinh ~340 trang
- [ ] `app/[category]/page.tsx` + `generateStaticParams()` → 15 trang nhóm
- [ ] `components/CodeBlock.tsx` — gọi Shiki **server-side**, trả HTML đã highlight
- [ ] `components/EntryCard.tsx` — title, signature, mô tả, params, badge `since`, link docs, related
- [ ] `components/CopyButton.tsx` — `'use client'`, là **JS duy nhất** trên trang chi tiết
- [ ] Kiểm: tắt JS trong browser, trang chi tiết vẫn đọc được đầy đủ

#### 3b. Trang search (Client Component)

- [ ] `app/page.tsx` — `SearchBar` autofocus
- [ ] `CategoryFilter` — chip lọc đa chọn, hiện số lượng
- [ ] `SearchResults` — link sang trang SSG tương ứng

#### 3c. Chung

- [ ] `app/layout.tsx` — dark / light mode (`next-themes` hoặc tự viết), tránh nháy màu khi load
- [ ] Responsive: mobile sidebar thu thành drawer
- [ ] Hiển thị `generatedFrom` ở footer (vd "Playwright v1.62.1")

### Phase 4 — Tính năng trải nghiệm

- [ ] Phím tắt: `/` hoặc `Ctrl+K` mở search · `↑ ↓` di chuyển · `Enter` mở · `C` copy · `Esc` đóng
- [ ] Search overlay gọi được từ **mọi trang** (kể cả trang chi tiết SSG)
- [ ] Lịch sử tìm kiếm gần đây (`localStorage`, tối đa 8)
- [ ] Ghim mục yêu thích (`localStorage`)
- [ ] Nút "Copy tất cả code của nhóm này"
- [ ] Bảng phím tắt (phím `?`)
- [ ] `<Link prefetch>` cho kết quả search top 5 → bấm vào là hiện ngay

### Phase 5 — Chất lượng & SEO

> Đây là phần Next.js trả lại giá trị. Với Vite thì mục này gần như bỏ trống.

- [ ] `generateMetadata()` mỗi trang chi tiết — `<title>` dạng `page.getByRole() — Playwright Cheatsheet`, `description` lấy từ entry
- [ ] `app/sitemap.ts` — liệt kê đủ ~356 URL
- [ ] `app/robots.ts`
- [ ] `app/opengraph-image.tsx` — OG image sinh lúc build
- [ ] JSON-LD `TechArticle` cho trang chi tiết
- [ ] Canonical URL
- [ ] A11y: điều hướng bàn phím đầy đủ, ARIA label, contrast ≥ 4.5:1, focus ring rõ
- [ ] Performance: JS trang chi tiết **< 100 KB gzip**, LCP < 1.5s
- [ ] Offline: service worker cache (PWA nhẹ) — vẫn làm được vì `output: 'export'`
- [ ] Kiểm tra trên Chrome, Firefox, Safari, mobile

### Phase 6 — Kiểm thử (dùng chính Playwright 🎯)

- [ ] `search.spec.ts` — gõ `getByRole` ra đúng entry; fuzzy `locater` ra `locator`
- [ ] `copy.spec.ts` — click Copy → clipboard đúng nội dung
- [ ] `shortcuts.spec.ts` — `Ctrl+K`, `↑ ↓`, `Esc`
- [ ] `seo.spec.ts` — **MỚI**: mỗi trang chi tiết có `<title>` riêng, có `<meta name="description">`, có canonical; `sitemap.xml` đủ URL
- [ ] `a11y.spec.ts` — tab qua toàn trang, không có bẫy focus
- [ ] Test trang chi tiết **khi tắt JavaScript** — nội dung phải vẫn hiện
- [ ] Visual regression: `toHaveScreenshot` cho light + dark
- [ ] Toàn bộ test xanh trên 3 browser

### Phase 7 — Build & Deploy

- [ ] `npm run build` sạch, không warning — kiểm thư mục `out/` có đủ ~356 file HTML
- [ ] Kiểm `out/` chạy được qua `npx serve out`
- [ ] Bật **brotli** ở CDN (Cloudflare Pages có sẵn) — chênh lệch 26 KB → 18 KB
- [ ] README: cách chạy, **cách chạy lại pipeline khi Playwright ra bản mới**
- [ ] Deploy Cloudflare Pages (khuyến nghị) / GitHub Pages / Vercel
- [ ] Nếu GitHub Pages đặt ở subpath → cấu hình `basePath` trong `next.config.ts`
- [ ] Kiểm tra bản production thật (search, copy, URL trực tiếp, dark mode, `sitemap.xml`)
- [ ] Submit sitemap lên Google Search Console

---

## 9. Định nghĩa "Hoàn thành" (DoD)

- [ ] ≥ 200 entry, phủ đủ 15 nhóm
- [ ] **Mọi code mẫu qua được `tsc --noEmit`** với type Playwright thật
- [ ] **Mọi `docsUrl` có trong `sitemap.xml`** của Playwright — không link chết
- [ ] Dataset ghi rõ `generatedFrom: playwright-core@x.y.z`
- [ ] Search p95 < 50ms (đã đo mẫu 6.93ms)
- [ ] **Mỗi entry có URL riêng, `<title>` riêng, nằm trong `sitemap.xml` của site**
- [ ] **Trang chi tiết đọc được khi tắt JavaScript**
- [ ] Toàn bộ Playwright test xanh
- [ ] Chạy được offline
- [ ] Đã deploy, có URL truy cập
- [ ] README hướng dẫn chạy lại pipeline dữ liệu

---

## 10. Rủi ro & cách xử lý

| Rủi ro                                                                    | Mức độ    | Cách xử lý                                                                          |
| ------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------- |
| ~~Nhập 340 entry thủ công~~ → nay chỉ còn biên tập mô tả                  | 🟡 Vừa ↓  | Pipeline mục 6 lo phần signature/param; người chỉ chọn lọc + viết tiếng Việt        |
| **Parse nhầm macro `-js`** → ghi sai default (`30000` thay vì `0`)        | 🔴 Cao    | Bẫy 2 mục 6.3. Bắt buộc spot-check `Locator.check.timeout` ở Phase 1b               |
| **Import Shiki vào Client Component** → kéo 8.25 MB grammar xuống browser | 🔴 Cao    | Shiki **chỉ** dùng trong Server Component (mục 3.3). Check bundle size ở Phase 5    |
| **Lẫn code Python/Java** vào cheatsheet JS                                | 🟡 Vừa    | Bẫy 1 mục 6.3. Lọc chặt theo tag `js`, thêm assert trong `validate-data`            |
| Playwright đổi format `docs/src/api` → script gãy                         | 🟡 Vừa    | Ghim `?ref=v1.62.1` (không dùng `main`); script fail rõ ràng thay vì sinh data rỗng |
| `output: 'export'` chặn API routes / ISR / middleware                     | 🟢 Thấp   | Mục 3.4 — không tính năng nào cần đến. Muốn dùng thì bỏ `export`, deploy Vercel     |
| Deploy GitHub Pages ở subpath → link vỡ                                   | 🟢 Thấp   | Đặt `basePath` trong `next.config.ts` ngay từ Phase 0 nếu biết trước                |
| ~~Bundle phình vì data~~ — đã đo, không phải vấn đề                       | 🟢 Thấp ↓ | 205 KB thô / **18.9 KB brotli**. Client chỉ nhận index gọn **15.5 KB**              |
| ~~SEO yếu do hash routing~~ — đã giải quyết bằng Next.js                  | ✅ Hết    | SSG + `sitemap.ts` + `generateMetadata`                                             |
| Code mẫu lỗi thời khi Playwright ra bản mới                               | 🟢 Thấp   | `generatedFrom` + so với `registry.npmjs.org/playwright-core/latest` trong CI       |
| Rate limit GitHub API (60 req/h)                                          | 🟢 Thấp   | Cache vào `.cache/`, chỉ fetch lại khi đổi version; dùng token nếu cần              |
| Fuzzy quá lỏng → kết quả nhiễu                                            | 🟢 Thấp   | `threshold` Fuse.js bắt đầu 0.35, test với truy vấn thật                            |

---

## 11. Ước lượng công sức

| Phase                    | React+Vite (bản cũ) | **Next.js (bản này)** | Ghi chú                                    |
| ------------------------ | ------------------- | --------------------- | ------------------------------------------ |
| 0 — Khởi tạo             | 0.5 ngày            | 0.5 ngày              | `create-next-app` + config export          |
| 1 — Dữ liệu              | 2–2.5 ngày          | 2–2.5 ngày            | Không đổi — pipeline độc lập với framework |
| 2 — Search               | 0.5 ngày            | 0.5 ngày              |                                            |
| 3 — UI                   | 1.5 ngày            | **2 ngày** ↑          | Tách 2 loại trang: SSG + client search     |
| 4 — Trải nghiệm          | 1 ngày              | 1 ngày                |                                            |
| **5 — Chất lượng & SEO** | 1 ngày              | **1.5 ngày** ↑        | Thêm metadata, sitemap, OG image, JSON-LD  |
| 6 — Test                 | 1 ngày              | **1.5 ngày** ↑        | Thêm `seo.spec.ts` + test tắt-JS           |
| 7 — Deploy               | 0.5 ngày            | 0.5 ngày              |                                            |
| **Tổng**                 | ~8–8.5 ngày         | **~9.5–10 ngày**      | +1.5 ngày để đổi lấy SEO                   |

**Đánh đổi:** Next.js tốn thêm **~1.5 ngày**, đổi lại mỗi cú pháp thành một trang Google index được. Với cheatsheet thì đây là kênh vào chính — đáng.

**Lối tắt để có bản dùng được sớm:** Phase 0 → 1a/1b → 1c rút gọn (chỉ Locators + Actions + Assertions, ~100 entry) → 2 → 3 → deploy. Khoảng **3.5 ngày**, rồi bổ sung dữ liệu và SEO dần.

---

## 12. Bước kế tiếp

1. ✅ ~~Xác nhận stack~~ — **đã chốt Next.js** (2026-08-25)
2. Bắt đầu **Phase 0**
3. Cập nhật tiến độ bằng cách tick `[x]` trực tiếp trong file này
