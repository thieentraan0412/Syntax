# Kế hoạch triển khai — Playwright Cheatsheet Website

> **Nguồn yêu cầu:** `guild.txt` — "Xây dựng một website cheatsheet, web này cho phép search tìm kiếm cú pháp câu, hàm, biến của Playwright."
>
> **Trạng thái:** Phase 0–4 ✅ · 322 entry · 341 trang tĩnh · trang chi tiết 136 KB gzip · tiếp theo Phase 5 (SEO)
> **Ngày lập:** 2026-08-25
> **Cập nhật:** 2026-08-26 — `npm install` xong, Phase 0 đóng lại; vá `fuse.js` + `prettier` thiếu trong `package.json`, 2 lỗi lint cũ, và lỗ hổng `data:typecheck` im lặng rơi về `node_modules`
> _2026-08-25_ — (1) thêm mục 6 "Nguồn dữ liệu" · (2) **chốt stack Next.js**, viết lại mục 3/4 và Phase 0/3/5/7
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

### Phase 0 — Khởi tạo dự án ✅ XONG (2026-08-26)

> **Bản ghi trước sai.** Mục này từng được đánh dấu "✅ XONG" nhưng thư mục dự án
> khi đó chỉ còn `guild.txt` + `implement.md`, repo chưa có commit nào. Toàn bộ
> Phase 0 đã được làm lại từ đầu và ghi lại đúng thực tế bên dưới.

- [x] `.gitignore` (`node_modules`, `.next`, `out`, `test-results`, `playwright-report`, `.cache`)
- [x] Scaffold Next.js — xem ghi chú ⚠️ bên dưới, lệnh trong kế hoạch **không chạy được nguyên văn**
- [x] `next.config.ts`: `output: 'export'` + `images: { unoptimized: true }` + `trailingSlash: true`
- [x] Cấu hình Prettier (`.prettierrc.json` + `.prettierignore`) — **gói `prettier` cài bổ sung 2026-08-26**, trước đó chỉ có file cấu hình
- [x] Script `format`, `format:check`, `typecheck` + 8 script `data:*` cho pipeline dữ liệu
- [x] `npm install` — **xong 2026-08-26**: 358 gói trong 3 phút, 0 lỗ hổng, có `package-lock.json`
- [x] Cài `@playwright/test@1.62.1` (devDependency, ghim **đúng số**, không `^` — xem lý do bên dưới)
- [x] `npm run dev` lên được trang mặc định — Ready 518 ms, `GET /` → 200 (16,4 KB)
- [x] `npm run build` sạch → sinh `out/index.html` (12,0 KB) + 4 route tĩnh
- [x] `npm run typecheck` và `npm run lint` — cả hai sạch (sau khi vá 2 lỗi cũ, xem bên dưới)

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

#### 🟢 Vướng mạng — đã gỡ (2026-08-26)

Chạy lại nguyên `npm install` với **registry chính thức**, giữ đúng quyết định đã
chốt hôm trước. Lần này **xong sau 3 phút**, không đứt lần nào.

Lý do không phải mạng khá lên mà là **cache**: 4 lần thất bại hôm 2026-08-25 tuy bị
npm rollback sạch `node_modules` nhưng tarball đã tải thì vẫn nằm lại trong
`~/AppData/Local/npm-cache` — đo được **1,6 GB**. Lượt này npm chỉ phải tải phần
còn thiếu. Bài học: `npm install` đứt giữa chừng **không mất trắng**, cứ chạy lại.

Số đo mirror hôm 2026-08-25 giữ lại để tham khảo — **không dùng đến**:

| Registry                   | Tốc độ đo được | So với gốc |
| -------------------------- | -------------- | ---------- |
| `registry.npmjs.org`       | 3,6 KB/s       | —          |
| `registry.yarnpkg.com`     | 82 KB/s        | ~23×       |
| `registry.npmmirror.com`   | 1,5 MB/s       | ~400×      |

#### 🐛 Bốn lỗ hổng cũ lộ ra khi lần đầu chạy được đủ bộ lệnh

Cả bốn đều là nợ có sẵn, không phải do lượt cài này sinh ra. Chúng nằm im được
lâu vì **chưa lần nào chạy nổi `npm run build` hay `npm run lint`** để phát hiện.

**1. `fuse.js` chưa bao giờ có trong `package.json`.** `lib/search.ts` đã
`import Fuse from "fuse.js"` từ Phase 2, nhưng dependency thì chưa từng được khai
báo — Phase 2 benchmark được là nhờ `node_modules` sót lại của một lượt cài dở.
Nếu để nguyên thì Phase 3 vừa ráp hook vào UI là build vỡ. Đã thêm
`fuse.js@7.5.0` — **đúng bản đã benchmark p95 14,79 ms**, không lấy bản mới hơn.

**2. `npm run lint` báo 1 lỗi + 1 cảnh báo.**

- `lib/use-search.ts` — lỗi `react-hooks/set-state-in-effect`: gọi
  `setDebounced("")` đồng bộ ngay trong thân effect. Sửa bằng cách dồn việc "xoá
  trắng thì trả kết quả ngay" vào chính `setQuery`/`clear` — tức là xử lý tại
  **nguồn thay đổi** thay vì để effect dọn sau. Hành vi giữ y nguyên (xoá trắng
  vẫn không phải chờ 120 ms), lại bớt được một lượt render thừa.
- `scripts/fetch-sources.ts` — import thừa `readFile`, đã bỏ.

**3. `prettier` cũng chưa bao giờ được cài** — cùng loại lỗi với `fuse.js`.
`.prettierrc.json` + `.prettierignore` có sẵn từ Phase 0, script `format` /
`format:check` có sẵn trong `package.json`, nhưng gói thì không. Chạy
`npm run format:check` ra thẳng `'prettier' is not recognized`. Đã cài
`prettier` + `prettier-plugin-tailwindcss` (cấu hình có khai báo plugin này).

**4. `eslint.config.mjs` không ignore `.cache/`.** Cái này nằm im lâu nhất vì
`.cache/` khi đó **rỗng** — không có file thì không có gì để lint. Đến lúc chạy
`npm run data:fetch` nạp lại nguồn, `.cache/` có `pw.d.ts` (1,1 MB) +
`pw-test.d.ts` (395 KB) thì `npm run lint` **nổ 509 lỗi**, toàn bộ là type của
Playwright chứ không dính gì code của mình. `.prettierignore` vốn đã liệt kê
`.cache` / `test-results` / `playwright-report`; ESLint thì thiếu cả ba. Đã thêm
vào `globalIgnores` cho hai danh sách khớp nhau.

#### 🟡 `npm run format:check` đang đỏ — **cố ý để nguyên, chờ bạn quyết**

Cài xong Prettier thì lộ ra: **chưa file nào trong repo từng đi qua Prettier** — 41 file lệch:

| Loại lệch | Số file | Bản chất |
| --- | --- | --- |
| Khác nội dung thật | **30** | `printWidth` 100 nhưng code viết tay theo ~80 cột → Prettier gộp lại các `import` nhiều dòng, v.v. |
| Chỉ khác xuống dòng | **11** | file trên đĩa là CRLF, Prettier mặc định `endOfLine: "lf"` |

**Chưa chạy `npm run format`.** Sweep 30 file là viết lại gần hết code đã commit
của Phase 1–2 — nằm ngoài Phase 0, và sẽ chôn mất diff thật của lượt này. Thêm nữa
bạn đã cố ý đưa `implement.md` vào `.prettierignore` vì "bảng đã căn thủ công",
nên tôi không tự ý cho 322 entry dữ liệu đi qua máy căn lề. **Cần bạn chốt**, ba lựa chọn:

1. `npm run format` một lượt, commit riêng — từ đó `format:check` xanh vĩnh viễn
2. Thêm `"endOfLine": "auto"` vào `.prettierrc.json` rồi format — bớt được 11 file CRLF khỏi diff
3. Nâng `printWidth` cho khớp cách viết hiện tại, rồi mới format — diff nhỏ nhất

Đã làm sẵn một việc **không thể chờ**: đưa `public/search-index.json` và
`data/candidates.json` vào `.prettierignore`. Hai file này do script sinh ra —
Prettier căn lại thì lượt `data:index` / `data:merge` kế tiếp đạp về ngay, diff
nhảy qua nhảy lại mãi không dứt.

#### ⚠️ `npm run typecheck` phải chạy SAU `npm run build`

Chạy `tsc --noEmit` trên cây sạch thì lỗi ngay:
`app/layout.tsx(20,50): error TS2304: Cannot find name 'LayoutProps'`.

`LayoutProps` là type **Next.js 16 tự sinh** vào `.next/types/`, mà `tsconfig.json`
có `include` thư mục đó. Chưa build lần nào thì chưa có file → tsc không tìm ra.
Không phải lỗi code. Thứ tự đúng: `build` (hoặc `dev` một lượt) **rồi mới**
`typecheck`. **Nhớ cho CI ở Phase 7** — đảo thứ tự là đỏ pipeline oan.

#### ✅ Chạy lại toàn bộ bộ kiểm với dependency thật

Đây là lần đầu Phase 1–2 được kiểm bằng `node_modules` cài đàng hoàng, không phải
đồ sót:

| Lệnh                    | Kết quả                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run data:validate` | sạch                                                             |
| `npm run data:typecheck`| **296/296** đoạn code biên dịch sạch (type từ `.cache/`, **không** qua `node_modules`) |
| `npm run data:index`    | 322 entry · thô 93,4 KB · gzip 21,9 KB · **brotli 18,9 KB**      |
| `npm run search:check`  | **29/29** phép kiểm đạt                                          |
| `npm run build`         | sạch, 4 route tĩnh                                               |

`public/search-index.json` sinh lại **byte-for-byte y hệt bản đã commit** — pipeline
chạy lại cho ra đúng cùng kết quả, không phụ thuộc máy.

> **Đính chính (2026-08-26).** Bản ghi đầu của mục này nói `data:typecheck` kiểm
> code mẫu bằng `@playwright/test` trong `node_modules`. **Sai.**
> `scripts/typecheck-samples.ts` map `@playwright/test` → `.cache/pw-test.d.ts`
> qua `compilerOptions.paths`, tức bản đã ghim tải về, **không** đụng
> `node_modules`. Đã đo lại bằng `program.getSourceFiles()`: nạp đúng
> `D:/Syntax/.cache/pw.d.ts`.

Vậy lý do ghim `@playwright/test` đúng `1.62.1` thay vì `^1.62.1` **không phải**
vì `data:typecheck` (việc đó `.cache` lo). Lý do đúng là **Phase 6**: test E2E
sẽ chạy bằng chính gói trong `node_modules`, nên nó phải cùng bản với API mà
cheatsheet đang mô tả — không thì test xanh trên một bản, còn trang thì tả bản khác.
Ghim đúng số cũng đồng bộ với cách `next` / `react` đã ghim sẵn trong dự án.

#### Ghi chú thêm

- `create-next-app` tự sinh `AGENTS.md` + `CLAUDE.md` — giữ nguyên
- `implement.md` đã đưa vào `.prettierignore` — tài liệu viết tay, không để Prettier căn lại bảng
- `package-lock.json` lần đầu có mặt (243 KB) — **cần commit**, nó khoá lại toàn bộ 364 gói
- npm cảnh báo `unrs-resolver` có script cài chưa duyệt (`npm approve-scripts`) — **bỏ qua được**, eslint vẫn chạy đúng, chưa cần cấp quyền
- Browser Playwright (chromium 1223 · firefox 1522 · webkit 2287) **đã có sẵn trên máy** — Phase 6 không phải chờ tải ~400 MB
- Phase 0 phần scaffold đã commit ở `1f6ce08`; phần `npm install` + các bản vá ở trên **chưa commit**

### Phase 1 — Tầng dữ liệu ✅ XONG (2026-08-25) · rà lại + vá 1 lỗ hổng (2026-08-26)

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

#### 🔍 Rà lại Phase 1 (2026-08-26) — số liệu đúng hết, nhưng lộ một lỗ hổng

Chạy lại với `node_modules` thật + mạng thật, đối chiếu từng con số đã ghi ở trên:

| Điều đã ghi | Đo lại 2026-08-26 |
| --- | --- |
| 322 entry, đủ 15 nhóm | ✓ khớp **từng nhóm một** với bảng ở mục 1c |
| 296 đoạn TS · 26 đoạn shell | ✓ 296 + 26 = 322 |
| 322/322 `docsUrl` có thật | ✓ đối chiếu `playwright.dev/sitemap.xml` **thật** — 358 URL |
| 296/296 biên dịch sạch | ✓ |
| `related` không trỏ hụt | ✓ |

**Nhưng lúc đó `.cache/` đang rỗng — mà `npm run data:typecheck` vẫn báo "296/296 sạch".**

Đó là lỗi thật chứ không phải may. `compilerOptions.paths` chỉ là **gợi ý**: trỏ vào
file không có thật thì TypeScript **im lặng** rơi về `node_modules`. Đo bằng
`program.getSourceFiles()`:

| Trạng thái `.cache` | Type thực sự nạp vào | Số lỗi |
| --- | --- | --- |
| có `pw*.d.ts` | `.cache/pw.d.ts` — đúng bản ghim ✅ | 0 |
| thiếu `pw*.d.ts` | `node_modules/playwright-core/…` — bản đang cài ⚠️ | **0** |

Cả hai đều "xanh". Nghĩa là lời hứa "kiểm bằng đúng bản Playwright đã ghim" có thể
bốc hơi mà **không ai hay** — xanh nhưng vô nghĩa, kiểu sai tệ nhất vì nó không kêu.

**Đã vá** `scripts/typecheck-samples.ts`: thiếu `.cache/pw-test.d.ts` hoặc
`.cache/pw.d.ts` là **dừng ngay, exit 1**, kèm câu chỉ thẳng việc phải làm. Mỗi lượt
chạy cũng in ra nguồn type đã dùng, để đọc log là biết chứ không phải đoán:

```
→ ghép 296 đoạn code vào .cache/samples/  (bỏ qua 26 đoạn shell· 5 stub import minh hoạ)
→ type ghim: .cache/pw-test.d.ts + .cache/pw.d.ts
✓ cả 296 đoạn code đều biên dịch sạch
```

Đã thử ngược lại để chắc: giấu `pw-test.d.ts` đi thì script **exit 1**, không còn
báo sạch nữa.

Đây vốn đã là cách `validate-data.ts` xử lý check sitemap — mất mạng thì nó **báo to**
rồi mới bỏ qua, chứ không lặng lẽ. Hai script giờ nhất quán ở chỗ đó.

#### ⚠️ `.cache/` nằm trong `.gitignore` — nhớ cho CI ở Phase 7

`data:typecheck` và `data:pipeline` đều cần `.cache/`, mà thư mục này không commit.
Clone mới hoặc chạy CI đều phải nạp nguồn trước:

```bash
npm run data:fetch
```

rồi mới `npm run data:check`. Riêng `npm run build` thì **không** cần — nó chỉ chạy
`data:index`, đọc từ `data/*.ts` đã commit.

### Phase 2 — Search engine ✅ XONG (2026-08-25) · rà lại 2026-08-26

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

#### 🔍 Rà lại Phase 2 (2026-08-26)

Đọc lại cả 209 dòng `lib/search.ts` đối chiếu từng gạch đầu dòng của checklist —
**có thật trong code hết**, không mục nào tick khống:

| Mục checklist | Chỗ nó nằm |
| --- | --- |
| Trọng số 0.5 / 0.2 / 0.15 / 0.1 | `WEIGHTS` + `FUSE_OPTIONS.keys` |
| Tải lazy, đúng 1 lần / phiên | `loadSearchEngine()` — `cached ??=`, hỏng thì `cached = null` để thử lại |
| Debounce 120 ms | `DEBOUNCE_MS` trong `lib/use-search.ts` |
| Tô sáng | `highlight()` trả `Segment[]`, gộp khoảng chồng/liền nhau |
| Gợi ý "Ý bạn là…" | `suggest()` — nới `threshold` 0.35 → 0.6, chỉ soi `title` |
| Lọc nhóm sau khi tìm | `search()` bỏ qua `category` khi chấm điểm rồi mới lọc |

Chạy lại trên máy này: **29/29 phép kiểm đạt**, **p95 13,01 ms** (bản ghi cũ 14,79 ms —
chênh do nhiễu máy, cả hai đều dư ~4× so với ngưỡng 50 ms).

Một số đo bản ghi cũ không có: **lượt chậm nhất 53,33 ms**, tức có vượt ngưỡng 50 ms
— nhưng đúng **1 lượt trên 500**, là lượt đầu lúc JIT chưa nóng (p99 chỉ 25,67 ms).
Không phải vấn đề, nhưng ghi ra để sau này ai đọc số cũng thấy đủ, không phải chỉ
thấy phần đẹp.

#### ⚠️ Rủi ro còn treo: `lib/use-search.ts` không có test tự động

`scripts/check-search.ts` phủ **`lib/search.ts`** — tầng thuần, không React. Hook thì
**chưa có phép kiểm nào**, mà 2026-08-26 nó vừa bị sửa (dời việc "xoá trắng trả kết quả
ngay" từ effect sang `setQuery`/`clear` để hết lỗi `react-hooks/set-state-in-effect`).

Sửa xong `typecheck` + `lint` đều sạch, nhưng **không có test nào chứng minh hành vi
không đổi**. Đây đúng chỗ Phase 3 (bấm tay) và Phase 6 (Playwright) phải soi kỹ:

- gõ → chờ 120 ms mới ra kết quả, không ra sớm
- xoá trắng → kết quả biến **ngay**, không phải chờ thêm 120 ms
- gõ "abc" → xoá trắng → gõ "x": không được nháy lại kết quả cũ của "abc"

### Phase 3 — Giao diện ✅ XONG (2026-08-26)

**341 trang tĩnh sinh trong 5,1 giây. Trang chi tiết đọc được đầy đủ khi tắt JS.**

#### 3a. Trang SSG (Server Component)

- [x] `app/[category]/[id]/page.tsx` + `generateStaticParams()` → **322 trang** (kế hoạch ước ~340)
- [x] `app/[category]/page.tsx` + `generateStaticParams()` → 15 trang nhóm
- [x] `components/CodeBlock.tsx` — Shiki **server-side**, hai theme cùng lúc bằng CSS variable
- [x] `components/EntryCard.tsx` — title, signature, mô tả, params, badge `since`, note, link docs, related, tags
- [x] `components/CopyButton.tsx` — JS **của mình** duy nhất trên trang chi tiết
- [x] Kiểm tắt JS: grep thẳng HTML thô trong `out/` — bảng tham số, liên quan, trả về, lưu ý, code đã tô màu, cả 15 link sidebar đều nằm sẵn trong file

#### 3b. Trang search (Client Component)

- [x] `app/page.tsx` — `SearchBar` autofocus, thêm phím tắt `/`
- [x] `CategoryFilter` — chip kèm số lượng, **chỉ hiện nhóm có kết quả**
- [x] `SearchResults` — tô sáng đoạn khớp, link sang trang SSG tương ứng
- [x] Ráp `useSearch()` vào UI thật — trả xong món nợ Phase 2 ghi ở trên

#### 3c. Chung

- [x] `app/layout.tsx` — sáng / tối / theo hệ thống, **không nháy màu** (script inline trong `<head>`, đúng pattern `preventing-flash-before-hydration` của docs Next 16)
- [x] Responsive — xem ghi chú ⚠️ bên dưới
- [x] `generatedFrom` ở footer: "322 cú pháp · dữ liệu trích từ `playwright-core@1.62.1`"

#### 🔴 "0 KB JS" — kế hoạch hứa sai, không đạt được

Mục 3.1 và checklist 3a đều ghi trang chi tiết là "**0 KB JS**". Đo thật:

| | thô | gzip | brotli |
| --- | --- | --- | --- |
| JS trang chi tiết (7 chunk) | 454,1 KB | 135,4 KB | **115,9 KB** |

Đây là runtime React + App Router, **App Router luôn kèm nó**, không có cách tắt.
"0 KB JS" là điều bất khả thi ngay từ lúc chốt Next.js, không phải do làm sai.

Phần **đúng** của lời hứa thì vẫn giữ được, và đã đo:

- `fuse.js` **không lọt** vào chunk trang chi tiết — grep cả 4 chunk lớn: 0 dấu vết
- Trang chi tiết **không tải** `search-index.json` — kiểm bằng `performance.getEntriesByType('resource')`: `false`
- Tắt JS thì trang vẫn đọc được **đầy đủ**

⚠️ **Cảnh báo cho Phase 5:** mục đó đặt ngưỡng "JS trang chi tiết < 100 KB gzip".
Hiện là **135,4 KB gzip** — **vượt 35%**. Không phải lỗi Phase 3 (toàn bộ là runtime
framework), nhưng Phase 5 sẽ phải hoặc nới ngưỡng, hoặc tính cách khác.

#### ⚠️ Ba chỗ làm khác kế hoạch, đều có lý do

**1. Chip lọc ĐƠN chọn, không phải đa chọn.** Kế hoạch ghi "chip lọc đa chọn".
Nhưng hook `useSearch()` của Phase 2 có API `category: Category | null` và đã có
phép kiểm ăn theo API đó ("lọc nhóm chỉ trả entry của nhóm đó", "lọc nhóm giữ
nguyên thứ hạng"). Đổi sang đa chọn là sửa API đã ký và viết lại test. Với 15
nhóm mà kết quả thường dồn vào 1–2 nhóm thì đơn chọn cũng đủ dùng. **Nếu bạn vẫn
muốn đa chọn thì nói, tôi sửa cả hook lẫn test.**

**2. Mobile: hàng chip cuộn ngang, không phải drawer.** Kế hoạch ghi "sidebar thu
thành drawer". Drawer thì phải có JS mở/đóng — mà nguyên tắc của chính Phase 3 là
trang chi tiết chỉ có `CopyButton` cần JS. Nay cùng một khối HTML, khác mỗi CSS:
desktop là cột dọc, mobile là hàng cuộn ngang. Không thêm JS, và với 15 mục thì
cuộn một phát cũng nhanh hơn mở drawer → chọn → đóng.

**3. Không dựng `lib/entries.ts` kiểu bọc lại `data/index.ts`.** Mục 4 vẽ
`lib/entries.ts` có `getAllEntries` / `getEntry` / `getCategories` — nhưng
`data/index.ts` đã có sẵn `getEntry` / `getEntriesByCategory` / `countByCategory`,
và chính nó tự đặt ra nguyên tắc "để không có hai nguồn sự thật". Bọc thêm một
lớp chỉ để đúng sơ đồ thư mục là tự tạo chỗ lệch. `lib/entries.ts` vẫn có, nhưng
chỉ chứa thứ chưa ai làm: `resolveRelated()` và `categoriesInOrder()`.

#### 🐛 Một bẫy JavaScript suýt lọt

`hrefOf()` vốn nằm ở `lib/search.ts`. Server Component cần nó, mà import từ đó
thì kéo luôn `fuse.js` vào bundle server — nên chuyển hàm về `lib/types.ts` (không
phụ thuộc gì) rồi re-export lại cho chỗ gọi cũ khỏi phải đổi.

Lần đầu viết là `export { hrefOf } from "./types.ts"` — **sai**: dạng này KHÔNG
tạo binding cục bộ, nên `hrefOf(r.item)` ngay trong `SearchEngine.search()` thành
`ReferenceError`. Phải `import` rồi mới `export { hrefOf }`.

`npm run search:check` bắt được **ngay lập tức** — đúng loại lỗi mà đọc code bằng
mắt sẽ trượt, vì dòng đó trông hoàn toàn hợp lệ.

#### ✅ `npm run typecheck` giờ chạy độc lập được

Phase 0 có ghi cái bẫy "typecheck phải chạy SAU build" vì `LayoutProps` là type
Next tự sinh. Docs Next 16 có lời giải gọn hơn: `next typegen` sinh type route mà
không cần build. Script đã đổi thành:

```
"typecheck": "next typegen && tsc --noEmit"
```

Giờ `npm run typecheck` chạy trên cây sạch cũng xanh. **Cái bẫy ghi ở Phase 0 coi
như đã gỡ** — CI ở Phase 7 không phải xếp thứ tự build → typecheck nữa.

#### 🔎 Kiểm bằng browser thật, không chỉ tin exit code

Chạy trên bản export tĩnh trong `out/` — đúng thứ sẽ nằm trên CDN:

| Việc kiểm | Kết quả |
| --- | --- |
| Gõ sai `getByRoel` | `page.getByRole()` lên đầu · chip đếm 8 / Locators 7 / Config 1 |
| Gõ sai `tohavetext` | ra `toHaveText`, link đúng `/assertions/to-have-text/` |
| **Xoá trắng ô search** | kết quả biến **ngay**, lưới 15 nhóm quay lại |
| **Gõ → xoá → gõ lại** | danh sách trống ngay, **không nháy kết quả cũ**; 120 ms sau mới ra kết quả mới |
| Theme 3 trạng thái | tối → theo hệ thống → sáng → tối; nhãn, màu nền và token Shiki đổi đúng |
| Trang chi tiết | **không** tải `search-index.json` |
| `search-index.json` | chỉ tải sau khi gõ, HTTP 200 |

Ba dòng in đậm chính là ba rủi ro đã ghi ở cuối Phase 2 khi tôi sửa
`lib/use-search.ts` mà không có test nào phủ. **Đã kiểm tay xong, cả ba đều đúng.**
Phase 6 nên biến đúng ba ca này thành test Playwright.

> **Hai lần "phát hiện lỗi" hoá ra là lỗi của cách kiểm, không phải của code:**
> (1) `ctrl+a` / `Backspace` qua công cụ browser không tới được ô input — phải
> dùng `form_input`; (2) bấm nút theme 3 lần trong **cùng một tick** thì React gộp
> cả 3 vào một lượt render nên cả 3 dùng chung closure cũ — thêm 120 ms giữa các
> lần bấm là chạy đúng ngay. Ghi lại để Phase 6 viết test khỏi vấp lại.

#### 📋 Nợ mang sang phase sau

- **122/287 param không có mô tả** (42,5%, gần hết là `options: Object` — nguồn
  `types.d.ts` không mô tả chúng). UI hiện dấu `—` thay vì để ô trống trông như
  bảng hỏng. Muốn lấp thì phải viết tay, thuộc phần "người lo phần giải thích".
- `generateMetadata()` + canonical **đã làm sẵn ở Phase 3** — trừ được 2 gạch của Phase 5.
- `sitemap.ts` / `robots.ts` / OG image / JSON-LD vẫn nằm ở Phase 5, chưa làm.

### Phase 4 — Tính năng trải nghiệm ✅ XONG (2026-08-26)

**Toàn bộ tính năng của phase này chỉ làm trang chi tiết nặng thêm 0,8 KB gzip.**

- [x] Phím tắt: `/` hoặc `Ctrl+K` mở search · `↑ ↓` di chuyển · `Enter` mở · `C` chép · `Esc` đóng
- [x] Search overlay gọi được từ **mọi trang**, kể cả 322 trang chi tiết SSG
- [x] Lịch sử tìm kiếm gần đây (`localStorage`, tối đa 8)
- [x] Ghim mục yêu thích (`localStorage`)
- [x] Nút "Chép cả N đoạn code" ở trang nhóm
- [x] Bảng phím tắt (phím `?`)
- [x] `<Link prefetch>` cho 5 kết quả đầu — ⚠️ **chưa kiểm chứng được**, xem bên dưới

#### 💡 Cách giữ được lời hứa "trang chi tiết không trả tiền cho tìm kiếm"

Yêu cầu "overlay gọi từ mọi trang" đụng thẳng vào nguyên tắc của mục 3.1. Nếu
overlay import `useSearch` theo cách thường thì `fuse.js` rơi vào chunk chung và
**cả 322 trang chi tiết đều phải tải nó**, kể cả người không bao giờ tìm gì.

Cách giải: tách làm hai lớp.

| Lớp | Nội dung | Nằm ở đâu |
| --- | --- | --- |
| `SearchTrigger` | một listener bàn phím + hai dòng state | chunk chung, **mọi trang** |
| `SearchOverlay` + `fuse.js` + `search-index.json` | toàn bộ phần nặng | sau `next/dynamic`, **chỉ tải khi mở tìm kiếm lần đầu** |

Đo trên bản export tĩnh, trang `/locators/get-by-role/`:

| | trước Phase 4 | sau Phase 4 |
| --- | --- | --- |
| Số chunk JS tải về | 7 | 7 |
| gzip | 135,4 KB | **136,2 KB** (+0,8 KB) |
| Chunk chứa `fuse` có tải không | — | **không** |
| `search-index.json` có tải không | không | **không** |

Chunk lazy (overlay + Fuse) là **83,6 KB brotli**, chỉ tải ở lần mở tìm kiếm đầu
tiên. Kiểm bằng `performance.getEntriesByType('resource')`: vào trang chi tiết
thì `daTaiChunkFuse: false`; bấm `/` xong mới thành `true`.

Cũng đã kiểm ngược lại điều đáng sợ hơn: **Shiki không lọt vào chunk client nào**
(`grep -l "oniguruma\|shiki" out/_next/static/chunks/*.js` → rỗng). Shiki nặng
vài MB; lọt xuống client là hỏng toàn bộ ngân sách.

#### 🧩 Ba quyết định kỹ thuật

**1. Dùng `<dialog>` thật + `showModal()`, không tự dựng div nổi.** Trình duyệt
cho sẵn focus trap, `Esc` để đóng, `::backdrop`, và khoá tương tác với phần
trang bên dưới. Tự viết lại mấy thứ đó vừa dài vừa dễ sai đúng chỗ bàn phím —
mà bàn phím chính là điểm của cả phase này.

**2. Trang chủ KHÔNG mở overlay.** `SearchTrigger` đọc `usePathname()` và bỏ qua
`/` + `Ctrl+K` khi đang ở trang chủ, nhường cho ô search có sẵn giữa màn hình —
mở một hộp nổi đè lên chính ô đang trống là thừa. Đã kiểm: ở trang chủ cả hai
phím đều đưa con trỏ về ô search, `moOverlay: false`.

**3. Gom ba thứ lặp thành module dùng chung** thay vì viết hai lần:
`lib/local-store.ts` (kho localStorage đọc bằng `useSyncExternalStore` — dùng cho
cả "gần đây" lẫn "đã ghim"), `lib/use-copy.ts`, `lib/use-list-nav.ts`.

Cả ba đều dùng `useSyncExternalStore` chứ không `useEffect` + `setState`, vì đã
vấp rule `react-hooks/set-state-in-effect` một lần ở Phase 2 rồi.

#### 🐛 Lỗi UX thật, tìm ra nhờ môi trường kiểm bị hỏng

Bấm phím `C` mà nút chép **không đổi gì cả**. Đào ra:

```
NotAllowedError — Failed to execute 'writeText' on 'Clipboard': Document is not focused.
```

Nguyên nhân trực tiếp là môi trường (pane trình duyệt không được focus), nhưng nó
lộ ra một lỗi thật trong code: `CopyButton` bắt lỗi rồi **im lặng**. Người dùng
bấm nút, không có gì xảy ra, không hiểu tại sao. Mà `writeText` bị từ chối trong
khá nhiều tình huống đời thực — trang không phải https, tab mất focus, quyền bị chặn.

Đã sửa: thêm trạng thái thứ ba, nút hiện **"Không chép được"** kèm tooltip gợi ý
bôi đen rồi `Ctrl+C`. Ba trạng thái `cho | xong | loi` gom vào `lib/use-copy.ts`
cho cả nút chép một đoạn lẫn nút chép cả nhóm.

Cái này nếu chỉ kiểm trên máy có clipboard hoạt động thì **không bao giờ thấy**.

#### ⚠️ `prefetch` — đã cài, chưa kiểm chứng được

`SearchResults` đặt `prefetch` cho 5 kết quả đầu và `prefetch={false}` cho phần
còn lại (để mặc định thì cả 50 link lọt vào tầm nhìn đều được tải trước — 50 lượt
tải phí). File payload RSC có thật trong `out/` (1356 file `.txt`).

Nhưng **không kiểm được nó có chạy không**:

| Đo | Kết quả |
| --- | --- |
| `document.visibilityState` | `"hidden"` |
| `IntersectionObserver` trên link đang ở giữa màn hình | callback **không hề được gọi** |
| Số request `.txt` sau khi tìm | **0** |
| Hover thủ công lên link | vẫn 0 |

Prefetch của Next kích hoạt theo tầm nhìn (`IntersectionObserver`), mà pane trình
duyệt trong phiên này không hiển thị nên trang ở trạng thái `hidden` và
`IntersectionObserver` không báo gì hết. **Đây là giới hạn của môi trường kiểm,
không phải bằng chứng code sai** — nhưng cũng không phải bằng chứng code đúng.

**Phase 6 phải kiểm lại mục này bằng Playwright trên browser thật.**

#### 🔎 Đã kiểm tay trên bản export tĩnh

| Việc kiểm | Kết quả |
| --- | --- |
| `/` ở trang chi tiết | overlay mở, ô nhập được focus, `fuse` + index **mới** tải lúc này |
| Gõ `getByRole` trong overlay | 8 kết quả |
| `↓ ↓ ↑` | getByRole → getByText → getByTestId → getByText |
| `Enter` | điều hướng tới `/locators/get-by-text/`, hộp đóng, ghi `"getByRole"` vào lịch sử |
| `?` | bảng phím tắt hiện đủ 7 dòng |
| Nút ghim | `☆Ghim` → `★Đã ghim`, localStorage lưu `{c,i,t}` |
| Mở lại overlay | mục "ĐÃ GHIM" và "TÌM GẦN ĐÂY" hiện đúng |
| Trang `/cli/` | nút "Chép cả 20 đoạn code" |
| Trang chủ: `/` và `Ctrl+K` | focus ô search, **không** mở overlay |

> **Lưu ý cho Phase 6:** gõ vào ô input qua công cụ tự động phải dùng native
> value setter rồi bắn `input` event — gán thẳng `.value` thì React không thấy.
> Và bấm nhiều lần liên tiếp trong cùng một tick sẽ bị React gộp render, phải
> chừa khoảng nghỉ giữa các lần bấm.

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
2. ✅ ~~Phase 0~~ · ✅ ~~Phase 1~~ · ✅ ~~Phase 2~~ — **đang ở Phase 3: giao diện**
3. Cập nhật tiến độ bằng cách tick `[x]` trực tiếp trong file này
