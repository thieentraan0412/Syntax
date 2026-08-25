/**
 * Phase 2 — kiểm hành vi tầng search (không phải hiệu năng — cái đó ở
 * scripts/benchmark-search.ts).
 *
 * Kiểm những thứ dễ sai mà nhìn mắt không thấy: tô sáng có trỏ đúng ký tự
 * không, khoảng chồng nhau có gộp không, lọc nhóm có giữ thứ hạng không, tải
 * lazy có gọi đúng một lần không.
 *
 * Chạy: node scripts/check-search.ts
 */
import { readFile } from "node:fs/promises";
import {
  SearchEngine,
  highlight,
  hrefOf,
  loadSearchEngine,
  matchIndices,
  resetSearchEngineCache,
  type Segment,
} from "../lib/search.ts";
import type { SearchIndex } from "../lib/types.ts";

let failed = 0;
let passed = 0;

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Ghép segment lại phải ra đúng chuỗi gốc — nếu không là tô sáng làm mất chữ. */
function join(segments: Segment[]): string {
  return segments.map((s) => s.text).join("");
}

function marked(segments: Segment[]): string {
  return segments.map((s) => (s.hit ? `[${s.text}]` : s.text)).join("");
}

async function main() {
  const index = JSON.parse(await readFile("public/search-index.json", "utf8")) as SearchIndex;
  const engine = SearchEngine.fromIndex(index);

  console.log(`→ kiểm tầng search trên ${index.entries.length} entry\n`);

  // --- Tô sáng ------------------------------------------------------------
  console.log("Tô sáng đoạn khớp:");

  check(
    "không có khoảng khớp -> một đoạn, không tô",
    (() => {
      const s = highlight("getByRole", []);
      return s.length === 1 && !s[0].hit && s[0].text === "getByRole";
    })(),
  );

  check(
    "tô đúng ký tự",
    marked(highlight("getByRole", [[3, 4]])) === "get[By]Role",
    marked(highlight("getByRole", [[3, 4]])),
  );

  check(
    "khớp ở đầu chuỗi",
    marked(highlight("click", [[0, 2]])) === "[cli]ck",
    marked(highlight("click", [[0, 2]])),
  );

  check(
    "khớp ở cuối chuỗi",
    marked(highlight("click", [[3, 4]])) === "cli[ck]",
    marked(highlight("click", [[3, 4]])),
  );

  check(
    "khoảng chồng nhau -> gộp làm một",
    marked(highlight("abcdef", [[0, 2], [1, 3]])) === "[abcd]ef",
    marked(highlight("abcdef", [[0, 2], [1, 3]])),
  );

  check(
    "khoảng liền kề -> gộp làm một",
    marked(highlight("abcdef", [[0, 1], [2, 3]])) === "[abcd]ef",
    marked(highlight("abcdef", [[0, 1], [2, 3]])),
  );

  check(
    "khoảng đảo thứ tự vẫn đúng",
    marked(highlight("abcdef", [[4, 5], [0, 1]])) === "[ab]cd[ef]",
    marked(highlight("abcdef", [[4, 5], [0, 1]])),
  );

  check(
    "ghép segment lại ra đúng chuỗi gốc",
    (() => {
      for (const hit of engine.search("getByRole", { limit: 10 })) {
        const segs = highlight(hit.entry.title, matchIndices(hit, "title"));
        if (join(segs) !== hit.entry.title) return false;
      }
      return true;
    })(),
  );

  check(
    "tô sáng chữ có dấu tiếng Việt không vỡ",
    (() => {
      const text = "Tích vào checkbox";
      const segs = highlight(text, [[0, 3]]);
      return join(segs) === text;
    })(),
  );

  // --- Tìm kiếm -----------------------------------------------------------
  console.log("\nTìm kiếm:");

  check("gõ 1 ký tự -> không tìm", engine.search("g").length === 0);
  check("chuỗi rỗng -> không tìm", engine.search("").length === 0);
  check("chỉ khoảng trắng -> không tìm", engine.search("   ").length === 0);

  check(
    "tên hàm chính xác lên đầu",
    engine.search("getByRole")[0]?.entry.title === "page.getByRole()",
    engine.search("getByRole")[0]?.entry.title,
  );

  check(
    "tìm được theo tag",
    engine.search("checkbox").some((h) => h.entry.tags.includes("checkbox")),
  );

  check(
    "tìm được theo mô tả tiếng Việt",
    engine.search("đăng nhập").length > 0,
    `${engine.search("đăng nhập").length} kết quả`,
  );

  check("tôn trọng limit", engine.search("get", { limit: 3 }).length <= 3);

  check(
    "lọc nhóm chỉ trả entry của nhóm đó",
    engine.search("click", { category: "actions" }).every((h) => h.entry.category === "actions"),
  );

  check(
    "lọc nhóm giữ nguyên thứ hạng tương đối",
    (() => {
      const all = engine.search("click", { limit: 1000 }).filter((h) => h.entry.category === "actions");
      const filtered = engine.search("click", { limit: 1000, category: "actions" });
      return all.map((h) => h.entry.id).join() === filtered.map((h) => h.entry.id).join();
    })(),
  );

  check(
    "điểm sắp tăng dần (khớp tốt nhất trước)",
    (() => {
      const s = engine.search("locator", { limit: 20 }).map((h) => h.score);
      return s.every((v, i) => i === 0 || s[i - 1] <= v);
    })(),
  );

  check(
    "countByCategory khớp tổng số kết quả",
    (() => {
      const q = "click";
      const counts = engine.countByCategory(q);
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return total === engine.search(q, { limit: Number.MAX_SAFE_INTEGER }).length;
    })(),
  );

  // --- Trạng thái rỗng ----------------------------------------------------
  console.log("\nTrạng thái rỗng:");

  const nonsense = "xyzqwkjhg";
  check("truy vấn vô nghĩa -> 0 kết quả", engine.search(nonsense).length === 0);
  check("truy vấn vô nghĩa -> cũng không gợi ý bừa", engine.suggest(nonsense).length === 0);

  check(
    "gõ sai -> có gợi ý",
    engine.suggest("getByRoel").length > 0,
    engine
      .suggest("getByRoel")
      .map((e) => e.title)
      .join(", "),
  );

  check("gợi ý tối đa 3", engine.suggest("get").length <= 3);

  // --- URL ----------------------------------------------------------------
  console.log("\nĐường dẫn:");

  check(
    "href có trailing slash (khớp next.config trailingSlash)",
    hrefOf({ category: "locators", id: "get-by-role" }) === "/locators/get-by-role/",
    hrefOf({ category: "locators", id: "get-by-role" }),
  );

  check(
    "mọi entry sinh được href hợp lệ",
    index.entries.every((e) => /^\/[a-z0-9-]+\/[a-z0-9-]+\/$/.test(hrefOf(e))),
  );

  // --- Tải lazy -----------------------------------------------------------
  console.log("\nTải lazy:");

  resetSearchEngineCache();
  let calls = 0;
  const fakeFetch = (async () => {
    calls++;
    return {
      ok: true,
      status: 200,
      json: async () => index,
    } as Response;
  }) as unknown as typeof fetch;

  const [a, b, c] = await Promise.all([
    loadSearchEngine(fakeFetch),
    loadSearchEngine(fakeFetch),
    loadSearchEngine(fakeFetch),
  ]);
  check("3 lần gọi song song -> chỉ fetch 1 lần", calls === 1, `fetch ${calls} lần`);
  check("cả 3 nhận cùng một engine", a === b && b === c);

  resetSearchEngineCache();
  let failCalls = 0;
  const failingFetch = (async () => {
    failCalls++;
    return { ok: false, status: 500 } as Response;
  }) as unknown as typeof fetch;

  await loadSearchEngine(failingFetch).catch(() => {});
  await loadSearchEngine(failingFetch).catch(() => {});
  check("hỏng thì lần sau thử lại, không kẹt cache", failCalls === 2, `fetch ${failCalls} lần`);

  resetSearchEngineCache();

  // --- Kết luận -----------------------------------------------------------
  console.log();
  if (failed > 0) {
    console.error(`✗ ${failed} lỗi / ${passed + failed} phép kiểm`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ cả ${passed} phép kiểm đều đạt`);
}

main().catch((err: unknown) => {
  console.error("✗ check-search thất bại:", err);
  process.exit(1);
});
