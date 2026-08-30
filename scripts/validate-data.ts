/**
 * Phase 1d — kiểm tra dữ liệu cheatsheet trước khi cho qua phase.
 *
 * Bắt các lỗi mà mắt người đọc 340 entry chắc chắn sẽ bỏ sót:
 *   - `id` trùng trong cùng category (hai entry cùng URL -> một cái biến mất)
 *   - `id` không an toàn cho URL
 *   - thiếu field bắt buộc, `category` không có thật
 *   - `related` trỏ tới entry không tồn tại
 *   - `docsUrl` không nằm trong playwright.dev/sitemap.xml  -> link chết
 *
 * Chạy: node scripts/validate-data.ts          (bỏ qua check sitemap nếu offline)
 *       node scripts/validate-data.ts --strict (bắt buộc check được sitemap)
 */
import { entries, meta } from "../data/index.ts";
import { CATEGORY_SLUGS, isCategory } from "../lib/types.ts";
import type { CheatEntry } from "../lib/types.ts";

const STRICT = process.argv.includes("--strict");
const SITEMAP = "https://playwright.dev/sitemap.xml";

const errors: string[] = [];
const warnings: string[] = [];

function err(msg: string) {
  errors.push(msg);
}
function warn(msg: string) {
  warnings.push(msg);
}

// ---------------------------------------------------------------------------
// 1. Field bắt buộc + id an toàn cho URL
// ---------------------------------------------------------------------------

const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function checkShape(e: CheatEntry, at: string) {
  const required: (keyof CheatEntry)[] = [
    "id",
    "title",
    "category",
    "signature",
    "description",
    "code",
    "tags",
    "docsUrl",
  ];
  for (const field of required) {
    const v = e[field];
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
      err(`${at}: thiếu field bắt buộc \`${String(field)}\``);
    }
  }
  if (e.id && !ID_RE.test(e.id)) {
    err(`${at}: id "${e.id}" không phải kebab-case an toàn cho URL`);
  }
  if (e.category && !isCategory(e.category)) {
    err(`${at}: category "${e.category}" không có trong 15 nhóm`);
  }
  if (Array.isArray(e.tags) && e.tags.length === 0) {
    warn(`${at}: chưa có tag nào — search sẽ khó tìm ra`);
  }
  if (e.docsUrl && !e.docsUrl.startsWith("https://playwright.dev/")) {
    err(`${at}: docsUrl phải trỏ về playwright.dev, đang là "${e.docsUrl}"`);
  }
  if (e.description && /[a-z]/.test(e.description) && e.description.length < 15) {
    warn(`${at}: mô tả quá ngắn ("${e.description}")`);
  }

  checkExamples(e, at);
}

/**
 * Ví dụ phụ phần lớn do máy chọn từ docs (scripts/build-examples.ts), nên phải
 * soi ở đây: script đó chấm điểm bằng heuristic, mà heuristic thì hỏng lặng lẽ.
 */
function checkExamples(e: CheatEntry, at: string) {
  const list = e.examples ?? [];
  if (list.length > 4) warn(`${at}: ${list.length} ví dụ phụ — nhiều quá, trang thành cuộn dài`);

  const thayCode = new Set<string>();
  for (const [i, v] of list.entries()) {
    const o = `${at}: ví dụ ${i + 1}`;
    if (!v.title?.trim()) err(`${o} thiếu title`);
    if (!v.code?.trim()) err(`${o} thiếu code`);
    if (v.lang !== "ts" && v.lang !== "bash") err(`${o} có lang lạ: "${v.lang}"`);
    if (!["api", "guide", "tay"].includes(v.source)) err(`${o} có source lạ: "${v.source}"`);
    if (v.source !== "tay" && !v.url) err(`${o} lấy từ docs mà không có link nguồn`);
    if (v.url && !v.url.startsWith("https://playwright.dev/")) {
      err(`${o} có url không trỏ về playwright.dev: "${v.url}"`);
    }
    // Ví dụ trùng y hệt code chính thì chỉ tổ làm trang dài ra.
    if (v.code?.trim() === e.code?.trim()) err(`${o} trùng nguyên đoạn code chính của entry`);
    if (v.code && thayCode.has(v.code)) err(`${o} trùng với một ví dụ khác của cùng entry`);
    if (v.code) thayCode.add(v.code);
  }
}

// ---------------------------------------------------------------------------
// 2. Trùng id trong cùng category + related trỏ đúng
// ---------------------------------------------------------------------------

function checkUniqueness(all: CheatEntry[]) {
  const seen = new Map<string, string>();
  for (const e of all) {
    const key = `${e.category}/${e.id}`;
    if (seen.has(key)) {
      err(`Trùng id: "${key}" xuất hiện ở cả "${seen.get(key)}" và "${e.title}"`);
    } else {
      seen.set(key, e.title);
    }
  }

  for (const e of all) {
    for (const ref of e.related ?? []) {
      // 'category/id' nếu khác nhóm, 'id' nếu cùng nhóm
      const key = ref.includes("/") ? ref : `${e.category}/${ref}`;
      if (!seen.has(key)) {
        err(`${e.category}/${e.id}: related "${ref}" không trỏ tới entry nào`);
      }
      if (key === `${e.category}/${e.id}`) {
        warn(`${e.category}/${e.id}: related trỏ về chính nó`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Phủ đủ 15 nhóm
// ---------------------------------------------------------------------------

function checkCoverage(all: CheatEntry[]) {
  const count = new Map<string, number>();
  for (const e of all) count.set(e.category, (count.get(e.category) ?? 0) + 1);

  console.log("\n  Số entry theo nhóm:");
  for (const slug of CATEGORY_SLUGS) {
    const n = count.get(slug) ?? 0;
    const mark = n === 0 ? "✗" : "·";
    console.log(`    ${mark} ${String(n).padStart(4)}  ${slug}`);
    if (n === 0) err(`Nhóm "${slug}" chưa có entry nào — v1 phải phủ đủ 15 nhóm`);
  }

  // Mốc tối thiểu cho v1 theo mục 7 implement.md.
  if (all.length < 200) {
    warn(`Mới có ${all.length} entry — mốc tối thiểu cho v1 là 200`);
  }
}

// ---------------------------------------------------------------------------
// 4. docsUrl có thật (đối chiếu sitemap.xml)
// ---------------------------------------------------------------------------

async function checkDocsUrls(all: CheatEntry[]) {
  let xml: string;
  try {
    const res = await fetch(SITEMAP, { signal: AbortSignal.timeout(120_000) });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    xml = await res.text();
  } catch (e) {
    const msg = `Không tải được ${SITEMAP} (${String(e)})`;
    if (STRICT) err(msg);
    else warn(`${msg} — bỏ qua check link chết. Chạy lại với --strict khi có mạng.`);
    return;
  }

  const urls = new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/\/$/, "")),
  );
  console.log(`\n  sitemap.xml: ${urls.size} URL`);

  const missing = new Set<string>();
  for (const e of all) {
    const page = e.docsUrl.split("#")[0].replace(/\/$/, "");
    if (!urls.has(page)) missing.add(`${e.category}/${e.id} -> ${page}`);
  }
  if (missing.size > 0) {
    for (const m of missing) err(`docsUrl không có trong sitemap: ${m}`);
  } else {
    console.log(`  ✓ ${all.length} docsUrl đều có thật`);
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const all = entries;
  console.log(`→ kiểm tra ${all.length} entry (nguồn: ${meta.generatedFrom})`);

  for (const e of all) checkShape(e, `${e.category}/${e.id ?? "?"}`);
  checkUniqueness(all);
  checkCoverage(all);
  await checkDocsUrls(all);

  if (warnings.length > 0) {
    console.log(`\n  ⚠ ${warnings.length} cảnh báo:`);
    for (const w of warnings) console.log(`    - ${w}`);
  }

  if (errors.length > 0) {
    console.error(`\n✗ ${errors.length} lỗi:`);
    for (const e of errors) console.error(`    - ${e}`);
    // Đặt exitCode thay vì process.exit(): fetch tới sitemap còn giữ handle,
    // thoát cứng ở đây làm libuv báo assertion trên Windows.
    process.exitCode = 1;
    return;
  }

  console.log(`\n✓ dữ liệu sạch — ${all.length} entry`);
}

main().catch((err: unknown) => {
  console.error("✗ validate-data thất bại:", err);
  process.exit(1);
});
