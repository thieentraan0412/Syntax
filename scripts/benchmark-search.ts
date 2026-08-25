/**
 * Phase 2 — đo hiệu năng search trên máy thật.
 *
 * Kế hoạch đặt mục tiêu p95 < 50ms và trích số mẫu 6,93ms. Số đó đo trên máy
 * khác với dữ liệu khác, nên phải đo lại trên bộ 322 entry thật của dự án này.
 *
 * Chạy bằng Node thuần — không cần Next.js, không cần browser. Nhờ vậy Phase 2
 * kiểm chứng được ngay cả khi Phase 0 chưa cài xong.
 *
 * Chạy: node scripts/benchmark-search.ts
 */
import { readFile } from "node:fs/promises";
import { SearchEngine } from "../lib/search.ts";
import type { SearchIndex } from "../lib/types.ts";

const INDEX_PATH = "public/search-index.json";
const WARMUP = 50;
const RUNS = 500;

/** Truy vấn thật người ta hay gõ, cộng vài cái gõ sai để kiểm tra fuzzy. */
const QUERIES = [
  "getByRole",
  "click",
  "expect",
  "toBeVisible",
  "screenshot",
  "config",
  "timeout",
  "fill",
  "route",
  "storageState",
  "g",
  "get",
  "getby",
  "assert",
  "chờ",
  "đăng nhập",
  // gõ sai chính tả — fuzzy phải bắt được
  "locater",
  "getByRoel",
  "tohavetext",
  "srceenshot",
];

function percentile(sorted: number[], p: number): number {
  const i = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[i];
}

function ms(n: number): string {
  return `${n.toFixed(2)} ms`;
}

async function main() {
  const raw = await readFile(INDEX_PATH, "utf8");

  // --- 1. JSON.parse ------------------------------------------------------
  const parseTimes: number[] = [];
  let index!: SearchIndex;
  for (let i = 0; i < 20; i++) {
    const t = performance.now();
    index = JSON.parse(raw) as SearchIndex;
    parseTimes.push(performance.now() - t);
  }

  // --- 2. Dựng index Fuse -------------------------------------------------
  const buildTimes: number[] = [];
  let engine!: SearchEngine;
  for (let i = 0; i < 20; i++) {
    const t = performance.now();
    engine = SearchEngine.fromIndex(index);
    buildTimes.push(performance.now() - t);
  }

  // --- 3. Search ----------------------------------------------------------
  for (let i = 0; i < WARMUP; i++) engine.search(QUERIES[i % QUERIES.length]);

  const searchTimes: number[] = [];
  const perQuery = new Map<string, number[]>();

  for (let i = 0; i < RUNS; i++) {
    const q = QUERIES[i % QUERIES.length];
    const t = performance.now();
    engine.search(q);
    const dt = performance.now() - t;
    searchTimes.push(dt);
    const list = perQuery.get(q) ?? [];
    list.push(dt);
    perQuery.set(q, list);
  }

  const sorted = [...searchTimes].sort((a, b) => a - b);
  const parseSorted = [...parseTimes].sort((a, b) => a - b);
  const buildSorted = [...buildTimes].sort((a, b) => a - b);

  console.log(`Bộ dữ liệu: ${index.entries.length} entry · ${(raw.length / 1024).toFixed(1)} KB thô`);
  console.log(`Nguồn     : ${index.meta.generatedFrom}`);
  console.log(`Số lần đo : ${RUNS} lượt search trên ${QUERIES.length} truy vấn\n`);

  console.log("Một lần, lúc mở ô search:");
  console.log(`  JSON.parse        trung vị ${ms(percentile(parseSorted, 50))}`);
  console.log(`  Dựng index Fuse   trung vị ${ms(percentile(buildSorted, 50))}`);
  console.log(
    `  Tổng khởi động    ${ms(percentile(parseSorted, 50) + percentile(buildSorted, 50))}\n`,
  );

  console.log("Mỗi lần gõ:");
  console.log(`  trung vị  ${ms(percentile(sorted, 50))}`);
  console.log(`  p95       ${ms(percentile(sorted, 95))}   ← mục tiêu < 50 ms`);
  console.log(`  p99       ${ms(percentile(sorted, 99))}`);
  console.log(`  chậm nhất ${ms(sorted[sorted.length - 1])}\n`);

  const slowest = [...perQuery.entries()]
    .map(([q, times]) => {
      const s = [...times].sort((a, b) => a - b);
      return { q, median: percentile(s, 50) };
    })
    .sort((a, b) => b.median - a.median)
    .slice(0, 5);

  console.log("5 truy vấn chậm nhất:");
  for (const { q, median } of slowest) {
    console.log(`  ${ms(median).padStart(9)}  "${q}"  (${engine.search(q).length} kết quả)`);
  }

  // --- 4. Fuzzy có thật sự chạy không -------------------------------------
  console.log("\nKiểm tra fuzzy (gõ sai vẫn phải ra đúng):");
  const fuzzy: [string, string][] = [
    ["locater", "locator"],
    ["getByRoel", "getByRole"],
    ["tohavetext", "toHaveText"],
    ["srceenshot", "creenshot"],
  ];
  let fuzzyFail = 0;
  for (const [typo, expect] of fuzzy) {
    const hits = engine.search(typo, { limit: 5 });
    const ok = hits.some((h) => h.entry.title.toLowerCase().includes(expect.toLowerCase()));
    console.log(
      `  ${ok ? "✓" : "✗"} "${typo}" → ${hits.length > 0 ? hits.map((h) => h.entry.title).slice(0, 3).join(", ") : "(không có kết quả)"}`,
    );
    if (!ok) fuzzyFail++;
  }

  // --- 5. Kết luận --------------------------------------------------------
  const p95 = percentile(sorted, 95);
  console.log();
  if (p95 >= 50) {
    console.error(`✗ p95 = ${ms(p95)} — KHÔNG đạt mục tiêu < 50 ms`);
    process.exitCode = 1;
    return;
  }
  if (fuzzyFail > 0) {
    console.error(`✗ ${fuzzyFail}/${fuzzy.length} truy vấn gõ sai không ra kết quả đúng`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ đạt — p95 ${ms(p95)}, dư ${(50 / p95).toFixed(1)}× so với mục tiêu 50 ms`);
}

main().catch((err: unknown) => {
  console.error("✗ benchmark thất bại:", err);
  process.exit(1);
});
