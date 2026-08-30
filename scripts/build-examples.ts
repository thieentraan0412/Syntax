/**
 * Sinh data/examples.ts — ví dụ phụ cho từng entry, lấy TỰ ĐỘNG từ docs chính thức.
 *
 * Hai nguồn, hai vai:
 *
 *   A. docs/src/api/*.md   -> `candidates[].examples`, ví dụ 2–3 dòng ngay dưới
 *                             chữ ký hàm. Ngắn, chuẩn, gắn đúng API.
 *   C. docs/src/*.md       -> `.cache/guides.json`, ví dụ DÀI ở tầng hướng dẫn:
 *                             file Page Object, playwright.config.ts đầy đủ, một
 *                             bài test mở trang → thao tác → assert.
 *
 * Nguồn C không nói nó thuộc API nào, nên phải chấm điểm (xem `chamDiem`). Chấm
 * ẩu thì entry `page.route()` ăn phải ví dụ về `webServer` — đúng chữ, sai bài.
 *
 * Sau khi chọn, MỌI ví dụ đều bị đem đi biên dịch với type đã ghim; cái nào
 * không sạch thì bỏ. Docs có ví dụ cố ý viết tắt, có ví dụ viết bằng CommonJS,
 * có ví dụ cần thư viện ngoài — lên trang cheatsheet mà không chạy được thì thà
 * đừng lên. Vì vậy phải chọn DƯ rồi mới cắt: cắt trước thì một ví dụ hỏng chiếm
 * mất chỗ của một ví dụ tốt.
 *
 * Chạy: node scripts/build-examples.ts
 *       node scripts/build-examples.ts --keep   (giữ file tạm để xem)
 */
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import { entries } from "../data/index.ts";
import { FACTS } from "../data/facts.ts";
import type { CheatEntry, Example } from "../lib/types.ts";
import type { GuideBlock } from "./extract-guides.ts";
import {
  FORMAT_HOST,
  bienDich,
  loiCua,
  thieuTypeGhim,
  wrapSample,
  writeImportStubs,
} from "./lib-sample.ts";

const CACHE = ".cache";
const TMP = join(CACHE, "examples");
const OUT = join("data", "examples.ts");
const KEEP = process.argv.includes("--keep");

/** Tối đa mỗi entry — nhiều hơn thì trang chi tiết thành một cuộn dài vô tận. */
const TOI_DA = 3;
/** Chọn dư chừng này rồi mới lọc bằng tsc, cuối cùng cắt còn `TOI_DA`. */
const CHON_DU = 7;
/** Ngắn hơn thế này thì không thêm được gì so với `code` sẵn có của entry. */
const NGAN_NHAT = 90;
/** Dài hơn thế này thường là cả một chương guide, không còn là "ví dụ". */
const DAI_NHAT = 2200;

// ---------------------------------------------------------------------------
// Loại sớm những đoạn chắc chắn trượt tsc — chúng chỉ chiếm chỗ.
// ---------------------------------------------------------------------------

/** Module ngoài mà môi trường kiểm có thật (hoặc dựng được stub). */
const MODULE_CHO_PHEP = /^(@playwright\/test|playwright-core|playwright|node:|\.)/;

function chacChanTruot(code: string): boolean {
  // Bản CommonJS của cùng ví dụ — docs cho cả hai, bản ESM luôn có ở ngay trên.
  if (/\brequire\s*\(/.test(code)) return true;
  // Ví dụ dùng `page` mà không khai và cũng không nhận từ fixture — mảnh rời
  // của một mục nhiều khối, đứng một mình thì không biên dịch được.
  if (/^\s*\/\/\s*\.\.\.\s*$/m.test(code) && code.length < 200) return true;
  // Thư viện bên thứ ba (@axe-core/playwright, allure…) không có type ở đây.
  for (const m of code.matchAll(/^\s*import\s[^'"]*from\s+['"]([^'"]+)['"]/gm)) {
    if (!MODULE_CHO_PHEP.test(m[1])) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Chấm điểm: khối guide này có thật sự nói về API kia không?
// ---------------------------------------------------------------------------

/**
 * `Page.getByRole` -> tìm `.getByRole(`
 * `Test.describe`  -> tìm `test.describe(`  (lớp Test gọi qua biến `test`)
 * `TestConfig.webServer` -> tìm `webServer:` (property trong file config)
 */
function mauGoi(key: string): RegExp[] {
  const [lop, member] = key.split(".");
  if (!member) return [];
  const esc = member.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (lop === "Test") return [new RegExp(`\\btest\\.${esc}\\s*[(<]`)];
  if (/^(TestConfig|TestOptions|TestProject|PlaywrightTestConfig)$/.test(lop)) {
    return [new RegExp(`(^|[\\s{,])${esc}\\s*:`, "m")];
  }
  return [new RegExp(`\\.${esc}\\s*\\(`)];
}

/**
 * Guide này nói về nhóm nào của cheatsheet.
 *
 * Đây là chốt chặn thứ hai, và nó cần thiết vì chốt "code có gọi API đó không"
 * quá dễ dãi: `page.goto()` xuất hiện trong 98 khối, `expect(...).toBeVisible()`
 * trong 28 khối, mà gần hết chỉ là dòng dựng cảnh cho một bài học khác. Ví dụ
 * về `toBeVisible` phải nằm trong guide nói về assertion, không phải trong guide
 * dạy dùng đồng hồ giả.
 *
 * Guide không có trong bảng này (ci.md, docker.md, puppeteer-js.md…) vẫn dùng
 * được, nhưng chỉ khi cả mục có ref `[`method: X.y`]` trỏ đúng API.
 */
const NHOM_CUA_GUIDE: Record<string, string> = {
  "locators.md": "locators",
  "other-locators.md": "locators",
  "aria-snapshots.md": "assertions",
  "test-assertions-js.md": "assertions",
  "actionability.md": "actions",
  "input.md": "actions",
  "touch-events.md": "actions",
  "auth.md": "auth-state",
  "network.md": "network",
  "mock.md": "network",
  "api-testing-js.md": "network",
  "test-fixtures-js.md": "fixtures",
  "test-configuration-js.md": "config",
  "test-use-options-js.md": "config",
  "test-projects-js.md": "config",
  "test-webserver-js.md": "config",
  "test-parallel-js.md": "config",
  "test-timeouts-js.md": "config",
  "test-retries-js.md": "config",
  "test-sharding-js.md": "config",
  "debug.md": "debug-report",
  "trace-viewer.md": "debug-report",
  "trace-viewer-intro-js.md": "debug-report",
  "test-reporters-js.md": "debug-report",
  "test-ui-mode-js.md": "debug-report",
  "codegen.md": "debug-report",
  "test-snapshots-js.md": "visual-testing",
  "screenshots.md": "visual-testing",
  "pom.md": "advanced",
  "test-parameterize-js.md": "advanced",
  "test-global-setup-teardown-js.md": "advanced",
  "test-components-js.md": "advanced",
  "extensibility.md": "advanced",
  "best-practices-js.md": "advanced",
  "browsers.md": "browser-context",
  "browser-contexts.md": "browser-context",
  "emulation.md": "browser-context",
  "clock.md": "browser-context",
  "videos.md": "browser-context",
  "frames.md": "frames-dialogs",
  "dialogs.md": "frames-dialogs",
  "downloads.md": "frames-dialogs",
  "pages.md": "page",
  "navigations.md": "page",
  "evaluating.md": "page",
  "handles.md": "page",
  "events.md": "page",
  "writing-tests-js.md": "test-structure",
  "test-annotations-js.md": "test-structure",
  "running-tests-js.md": "cli",
  "test-cli-js.md": "cli",
  "intro-js.md": "cli",
};

/** Bỏ khoảng trắng + nháy để so hai đoạn code "có phải một" không. */
function gonGang(s: string): string {
  return s.replace(/["']/g, "'").replace(/\s+/g, " ").trim();
}

/** Điểm cho độ dài: vùng "ví dụ thật, đọc hết được" được ưu tiên. */
function diemDoDai(n: number): number {
  if (n < NGAN_NHAT || n > DAI_NHAT) return -1;
  if (n >= 250 && n <= 1200) return 2;
  if (n >= 150) return 1;
  return 0;
}

/**
 * Điểm âm = loại. Thang điểm cố ý thô: mục tiêu là xếp hạng trong cùng một API,
 * không phải đo độ liên quan tuyệt đối.
 */
function chamDiem(key: string, b: GuideBlock, e: CheatEntry): number {
  if (b.tab === "js-library") return -1; // bản viết lại cho Playwright-as-library
  // Không gọi API đó trong code thì dù cả mục có nhắc tên nó cũng vẫn là ví dụ
  // của chuyện khác.
  const soLanGoi = mauGoi(key).reduce(
    (n, re) => n + [...b.code.matchAll(new RegExp(re.source, "gm"))].length,
    0,
  );
  if (soLanGoi === 0) return -1;
  if (gonGang(b.code) === gonGang(e.code)) return -1;

  const dai = diemDoDai(b.code.length);
  if (dai < 0) return -1;

  const coRef = b.refs.includes(key);
  const dungNhom = NHOM_CUA_GUIDE[b.file] === e.category;

  // Hai chốt chặn, phải qua ít nhất một: hoặc mục này ĐANG nói về đúng API đó,
  // hoặc cả guide đang nói về đúng nhóm đó. Thiếu cả hai thì lời gọi kia chỉ là
  // dòng dựng cảnh — `page.goto()` có mặt ở 98 khối, giữ hết thì entry nào cũng
  // ra một mớ ví dụ chẳng liên quan.
  if (!coRef && !dungNhom) return -1;

  let d = 3 + dai;
  if (coRef) d += 3;
  if (dungNhom) d += 2;
  if (soLanGoi >= 2) d += 1; // gọi nhiều lần -> ví dụ thật sự xoay quanh API này
  if (b.html) d += 1; // có HTML minh hoạ thì dạy được nhiều hơn
  if (/^import /m.test(b.code)) d += 1; // file hoàn chỉnh, thấy cả ngữ cảnh
  return d;
}

/**
 * Entry không ứng với API nào (mẫu POM, `npx playwright test`, biến môi trường)
 * thì không có gì để dò lời gọi hàm. Nhưng `docsUrl` của nó trỏ thẳng vào một
 * trang guide — `/docs/pom`, `/docs/auth` — nên cả trang đó chính là nguồn.
 */
function chamDiemTheoTrang(b: GuideBlock, neo: string, codeCuaEntry: string): number {
  if (b.tab === "js-library") return -1;
  if (gonGang(b.code) === gonGang(codeCuaEntry)) return -1;
  // Trang guide có cả đoạn 2 dòng minh hoạ cú pháp; ở đây chỉ cần ví dụ có sức nặng.
  if (b.code.length < 150) return -1;
  const dai = diemDoDai(b.code.length);
  if (dai < 0) return -1;

  let d = 1 + dai;
  if (neo && b.url.endsWith(`#${neo}`)) d += 3; // đúng mục mà entry đang trỏ tới
  if (b.html) d += 1;
  if (/^import /m.test(b.code)) d += 1;
  return d;
}

/** Tiêu đề cho ví dụ lấy từ guide: "Locators › Locate by role". */
function tieuDe(b: GuideBlock): string {
  const muc = b.h3 || b.h2;
  if (!muc) return b.docTitle || b.docId;
  return b.docTitle && b.docTitle !== muc ? `${b.docTitle} › ${muc}` : muc;
}

// ---------------------------------------------------------------------------

type UngVien = Example & { entryId: string; diem: number };

/** Nhóm khối guide theo `docId` để tra nhanh cho entry standalone. */
function theoTrang(blocks: GuideBlock[]): Map<string, GuideBlock[]> {
  const m = new Map<string, GuideBlock[]>();
  for (const b of blocks) {
    const l = m.get(b.docId) ?? [];
    l.push(b);
    m.set(b.docId, l);
  }
  return m;
}

async function main() {
  const thieu = thieuTypeGhim();
  if (thieu.length > 0) {
    console.error(`✗ thiếu type đã ghim: ${thieu.join(", ")} — chạy \`npm run data:fetch\``);
    process.exit(1);
  }

  const guides = JSON.parse(
    await readFile(join(CACHE, "guides.json"), "utf8").catch(() => {
      throw new Error("Chưa có .cache/guides.json — chạy `node scripts/extract-guides.ts` trước");
    }),
  ) as { blocks: GuideBlock[] };

  const { candidates } = JSON.parse(await readFile(join("data", "candidates.json"), "utf8")) as {
    candidates: { key: string; examples: string[]; docsUrl: string }[];
  };
  const apiByKey = new Map(candidates.map((c) => [c.key, c]));
  const trang = theoTrang(guides.blocks);

  /**
   * Entry nào ứng với API nào. Entry cố tình không giữ lại khoá API, nên phải
   * nối ngược: `docsUrl` trước (có cả anchor nên là định danh chính xác nhất),
   * `title` sau (entry có thể tự đặt title khác).
   */
  const keyTheoUrl = new Map<string, string>();
  const keyTheoTitle = new Map<string, string>();
  for (const [key, f] of Object.entries(FACTS)) {
    if (!keyTheoUrl.has(f.docsUrl)) keyTheoUrl.set(f.docsUrl, key);
    if (!keyTheoTitle.has(f.title)) keyTheoTitle.set(f.title, key);
  }
  const keyCua = (e: CheatEntry) => keyTheoUrl.get(e.docsUrl) ?? keyTheoTitle.get(e.title);

  const ungVien: UngVien[] = [];
  let theoApi = 0;
  let theoGuide = 0;

  for (const e of entries) {
    /*
      Entry viết tay ví dụ rồi thì không chen thêm ví dụ máy vào nữa.

      Phải soi `source` chứ không chỉ hỏi "có ví dụ chưa": lượt chạy trước đã gắn
      ví dụ máy vào chính những entry này rồi, hỏi trống không thì lần chạy thứ
      hai bỏ qua sạch và ghi đè data/examples.ts thành file rỗng.
    */
    if (e.examples?.some((v) => v.source === "tay")) continue;

    const entryId = `${e.category}/${e.id}`;
    const cua: UngVien[] = [];
    const key = keyCua(e);

    if (key) {
      // --- nguồn A: ví dụ ngắn ngay trong docs của API ------------------------
      for (const code of apiByKey.get(key)?.examples ?? []) {
        if (chacChanTruot(code)) continue;
        if (diemDoDai(code.length) < 0) continue;
        if (gonGang(code) === gonGang(e.code)) continue;
        cua.push({
          entryId,
          title: "Ví dụ trong docs API",
          code,
          lang: "ts",
          source: "api",
          url: apiByKey.get(key)?.docsUrl,
          // Xếp dưới nguồn C: ngắn hơn, và hay trùng ý với `code` của entry.
          diem: 2 + (code.length >= 200 ? 1 : 0),
        });
      }

      // --- nguồn C: ví dụ dài ở tầng guide, dò theo lời gọi hàm ---------------
      for (const b of guides.blocks) {
        if (chacChanTruot(b.code)) continue;
        const diem = chamDiem(key, b, e);
        if (diem < 0) continue;
        cua.push({
          entryId,
          title: tieuDe(b),
          code: b.code,
          lang: "ts",
          source: "guide",
          url: b.url,
          file: b.fileName,
          html: b.html,
          diem,
        });
      }
      if (cua.length > 0) theoApi++;
    } else if (e.codeLang === "ts") {
      // --- entry standalone: cả trang guide mà `docsUrl` trỏ tới là nguồn -----
      const m = /^https:\/\/playwright\.dev\/docs\/([a-z0-9-]+)\/?(?:#(.*))?$/.exec(e.docsUrl);
      for (const b of trang.get(m?.[1] ?? "") ?? []) {
        if (chacChanTruot(b.code)) continue;
        const diem = chamDiemTheoTrang(b, m?.[2] ?? "", e.code);
        if (diem < 0) continue;
        cua.push({
          entryId,
          title: tieuDe(b),
          code: b.code,
          lang: "ts",
          source: "guide",
          url: b.url,
          file: b.fileName,
          html: b.html,
          diem,
        });
      }
      if (cua.length > 0) theoGuide++;
    }

    if (cua.length === 0) continue;

    // Cùng một ví dụ hay xuất hiện ở nhiều guide — giữ bản điểm cao nhất.
    const theoCode = new Map<string, UngVien>();
    for (const v of cua.sort((a, b) => b.diem - a.diem)) {
      const k = gonGang(v.code);
      if (!theoCode.has(k)) theoCode.set(k, v);
    }
    ungVien.push(...[...theoCode.values()].slice(0, CHON_DU));
  }

  console.log(
    `→ ${ungVien.length} ví dụ ứng viên ` +
      `(${theoApi} entry dò theo API · ${theoGuide} entry dò theo trang guide)`,
  );

  // --- lọc bằng tsc --------------------------------------------------------
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });

  const files = ungVien.map((_, i) => join(TMP, `${String(i).padStart(4, "0")}.spec.ts`));
  for (const [i, v] of ungVien.entries()) await writeFile(files[i], wrapSample(v.code));
  await writeImportStubs(
    TMP,
    ungVien.map((v) => v.code),
  );

  console.log(`→ biên dịch ${files.length} ví dụ với type đã ghim…`);
  const kq = bienDich(files);

  if (kq.chung.length > 0) {
    console.error("✗ lỗi cấu hình, không phải lỗi của ví dụ nào:");
    console.error(ts.formatDiagnostics(kq.chung, FORMAT_HOST).replace(/^/gm, "    ").trimEnd());
    process.exit(1);
  }

  const dat: UngVien[] = [];
  const truot: { v: UngVien; loi: string }[] = [];
  for (const [i, v] of ungVien.entries()) {
    const loi = loiCua(kq, files[i]);
    if (loi.length === 0) dat.push(v);
    else truot.push({ v, loi: ts.flattenDiagnosticMessageText(loi[0].messageText, " ") });
  }

  if (!KEEP) await rm(TMP, { recursive: true, force: true });

  // --- ghi data/examples.ts ------------------------------------------------
  const theoEntry = new Map<string, Example[]>();
  for (const v of dat) {
    const list = theoEntry.get(v.entryId) ?? [];
    if (list.length >= TOI_DA) continue; // `dat` giữ nguyên thứ tự điểm
    list.push({
      title: v.title,
      code: v.code,
      lang: v.lang,
      source: v.source,
      url: v.url,
      file: v.file,
      html: v.html,
    });
    theoEntry.set(v.entryId, list);
  }

  const body = [...theoEntry]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, list]) => `  ${JSON.stringify(id)}: ${JSON.stringify(list)},`)
    .join("\n");

  await writeFile(
    OUT,
    `// FILE NÀY DO MÁY SINH — đừng sửa tay.
// Sinh bởi scripts/build-examples.ts từ docs/src của Playwright.
// Muốn đổi nội dung: sửa cách chấm điểm trong script rồi chạy lại
//   npm run data:examples
//
// Khoá là "category/id" của entry. Mọi đoạn code ở đây đã qua tsc với type ghim
// trong .cache — cái nào không biên dịch được đã bị loại từ lúc sinh.
import type { Example } from "../lib/types.ts";

export const EXAMPLES: Record<string, Example[]> = {
${body}
};
`,
  );

  const giu = [...theoEntry.values()].flat();
  console.log(`\n✓ ${OUT}`);
  console.log(`  entry có ví dụ : ${theoEntry.size}/${entries.length}`);
  console.log(
    `  ví dụ giữ lại  : ${giu.length}  ` +
      `(guide ${giu.filter((v) => v.source === "guide").length} · api ${giu.filter((v) => v.source === "api").length})`,
  );
  console.log(`  >= 300 ký tự   : ${giu.filter((v) => v.code.length >= 300).length}`);
  console.log(`  kèm HTML       : ${giu.filter((v) => v.html).length}`);
  console.log(`  loại vì không biên dịch được: ${truot.length}/${ungVien.length}`);
  for (const t of truot.slice(0, 5)) {
    console.log(`    - ${t.v.entryId} · "${t.v.title}" — ${t.loi.slice(0, 80)}`);
  }
  if (truot.length > 5) console.log(`    … và ${truot.length - 5} cái nữa`);
}

main().catch((err: unknown) => {
  console.error("✗ build-examples thất bại:", err);
  process.exit(1);
});
