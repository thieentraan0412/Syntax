/**
 * Phase 1d — kiểm mọi đoạn `code` trong cheatsheet có thật sự biên dịch được không.
 *
 * Đọc tay 340 đoạn code rồi gật đầu là cách chắc chắn để lọt lỗi. Script này ghép
 * mỗi đoạn vào một file .ts riêng (bọc trong `test(...)` nếu cần), dựng chương
 * trình bằng TypeScript Compiler API với type thật của @playwright/test, rồi
 * `--noEmit`. Sai một dấu chấm cũng ra.
 *
 * Chạy: node scripts/typecheck-samples.ts
 *       node scripts/typecheck-samples.ts --keep   (giữ lại thư mục tạm để xem)
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import ts from "typescript";
import { entries } from "../data/index.ts";
import type { CheatEntry } from "../lib/types.ts";

const CACHE_TYPES = ".cache";
const TMP = join(".cache", "samples");
const KEEP = process.argv.includes("--keep");

/**
 * Đoạn code trong cheatsheet là mảnh rời, không phải file hoàn chỉnh. Bọc lại
 * cho đúng ngữ cảnh thì mới typecheck được:
 *   - có `await` ở ngoài cùng  -> bọc trong test(...)
 *   - có `test(` / `import`    -> để nguyên
 */
function wrap(entry: CheatEntry): string {
  const code = entry.code.trim();

  const hasImport = /^\s*import\s/m.test(code);

  /**
   * Chỉ để nguyên khi đoạn code đã là một file hoàn chỉnh. Nhận diện bằng thứ
   * xuất hiện ở ĐẦU DÒNG, không phải ở bất kỳ đâu — trước đây `expect(...)` ở
   * dòng thứ hai bị nhận nhầm là khai báo test, nên cả đoạn không được bọc và
   * `page` thành biến không tồn tại.
   */
  const isCompleteFile =
    hasImport ||
    /^(test|setup)\s*[(.]/m.test(code) ||
    /^export\s+(default|const|class|function|type|interface)\b/m.test(code) ||
    /^(class|async function|function)\s/m.test(code);

  const header = hasImport
    ? ""
    : "import { test, expect, defineConfig, devices, chromium, firefox, webkit } from '@playwright/test';\n";

  if (isCompleteFile) return `${header}${code}\n`;

  // Chỉ bind fixture mà đoạn code THẬT SỰ dùng và KHÔNG tự khai báo. Bind hết
  // thì mẫu nào tự tạo `const context = await browser.newContext()` sẽ đụng tên.
  const declared = new Set(
    [...code.matchAll(/^\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]),
  );
  const used = FIXTURES.filter((f) => !declared.has(f) && new RegExp(`\\b${f}\\b`).test(code));
  const args = used.length > 0 ? `{ ${used.join(", ")} }` : "";

  return `${header}test('sample', async (${args}) => {\n${indent(code)}\n});\n`;
}

/** Fixture có sẵn của @playwright/test mà code mẫu có thể nhắc tới. */
const FIXTURES = ["page", "context", "browser", "request", "browserName"] as const;

/**
 * Vài mẫu cố ý import từ file khác trong dự án (`./pom/TrangDangNhap`) — đó
 * chính là điều đang muốn minh hoạ. File đó không tồn tại ở đây nên phải sinh
 * stub, không thì TS2307 che mất những lỗi thật trong cùng đoạn code.
 */
async function writeImportStubs(dir: string, codes: string[]): Promise<number> {
  /** đường dẫn -> tên được import từ đó */
  const needed = new Map<string, Set<string>>();

  for (const code of codes) {
    for (const m of code.matchAll(/^\s*import\s+([^'"]+?)\s+from\s+['"](\.[^'"]+)['"]/gm)) {
      const clause = m[1];
      const spec = m[2];
      const names = needed.get(spec) ?? new Set<string>();

      // `import X from` -> default ; `import { A, B as C } from` -> A, B
      const defaultName = clause.match(/^\s*(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,|$)/)?.[1];
      if (defaultName) names.add("default");

      const braces = clause.match(/\{([^}]*)\}/)?.[1];
      for (const part of braces?.split(",") ?? []) {
        const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
        if (name) names.add(name);
      }
      needed.set(spec, names);
    }
  }

  for (const [spec, names] of needed) {
    const target = join(dir, spec.replace(/^\.\//, "") + ".ts");
    await mkdir(dirname(target), { recursive: true });

    const lines = ["// stub do scripts/typecheck-samples.ts sinh — file minh hoạ không có thật."];
    for (const name of names) {
      if (name === "default") {
        lines.push("const _default: any = {};", "export default _default;");
      } else {
        // Khai cả hai không gian tên: mẫu Page Object dùng cùng một tên vừa làm
        // giá trị (`new TrangDangNhap(page)`) vừa làm kiểu (`{ trang: TrangDangNhap }`).
        //
        // Giá trị để `any` cho mọi cách dùng đều lọt; nhưng KIỂU phải là object
        // cụ thể chứ không phải `any` — `test.extend<{ x: any }>()` làm TypeScript
        // không chọn được overload, rồi báo tham số của fixture là implicit any.
        lines.push(
          `declare const _${name}: any;`,
          `export { _${name} as ${name} };`,
          `export type ${name} = { [key: string]: any };`,
        );
      }
    }
    await writeFile(target, lines.join("\n") + "\n");
  }
  return needed.size;
}

function indent(code: string): string {
  return code
    .split("\n")
    .map((l) => (l.trim() === "" ? l : "  " + l))
    .join("\n");
}

function fileNameFor(e: CheatEntry, i: number): string {
  return `${String(i).padStart(3, "0")}-${e.category}-${e.id}.spec.ts`;
}

async function main() {
  // `paths` bên dưới chỉ là GỢI Ý: trỏ vào file không có thật thì TypeScript
  // lặng lẽ rơi về node_modules và vẫn báo "sạch" — nhưng là sạch với bản
  // Playwright đang cài, không phải bản pipeline đã ghim. Kết quả xanh mà vô
  // nghĩa là kiểu sai tệ nhất, nên chặn ngay từ đây thay vì để nó lọt.
  const thieuType = [join(CACHE_TYPES, "pw-test.d.ts"), join(CACHE_TYPES, "pw.d.ts")].filter(
    (f) => !existsSync(f),
  );
  if (thieuType.length > 0) {
    console.error(`✗ thiếu type đã ghim: ${thieuType.join(", ")}`);
    console.error("  Thiếu file này thì tsc rơi về node_modules — kiểm xong cũng không tin được.");
    console.error("  Chạy `npm run data:fetch` để tải về rồi thử lại.");
    process.exitCode = 1;
    return;
  }

  // Entry CLI chứa lệnh shell, không phải TypeScript — không có gì để biên dịch.
  const tsEntries = entries.filter((e) => e.codeLang === "ts");
  const skipped = entries.length - tsEntries.length;

  if (tsEntries.length === 0) {
    console.log("↷ chưa có đoạn code TypeScript nào để kiểm");
    return;
  }

  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });

  const files: { path: string; entry: CheatEntry }[] = [];
  for (const [i, entry] of tsEntries.entries()) {
    const path = join(TMP, fileNameFor(entry, i));
    await writeFile(path, wrap(entry));
    files.push({ path, entry });
  }
  const stubs = await writeImportStubs(TMP, files.map((f) => f.entry.code));
  console.log(
    `→ ghép ${files.length} đoạn code vào ${TMP}/  ` +
      `(bỏ qua ${skipped} đoạn shell· ${stubs} stub import minh hoạ)`,
  );
  console.log(`→ type ghim: ${CACHE_TYPES}/pw-test.d.ts + ${CACHE_TYPES}/pw.d.ts`);

  // Type lấy thẳng từ .cache — cùng bản Playwright mà pipeline đã ghim, nên code
  // mẫu được kiểm với đúng API của bản đó, không phụ thuộc node_modules đang cài
  // bản nào. `pw-test.d.ts` tự import 'playwright-core' nên phải map cả hai.
  const options: ts.CompilerOptions = {
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    esModuleInterop: true,
    types: existsSync("node_modules/@types/node") ? ["node"] : [],
    baseUrl: resolve("."),
    paths: {
      "@playwright/test": [resolve(CACHE_TYPES, "pw-test.d.ts")],
      "playwright-core": [resolve(CACHE_TYPES, "pw.d.ts")],
    },
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
  };

  const program = ts.createProgram(
    files.map((f) => f.path),
    options,
  );
  const diagnostics = ts.getPreEmitDiagnostics(program);

  // Gom lỗi về từng entry để báo cho đúng chỗ cần sửa.
  const byFile = new Map<string, ts.Diagnostic[]>();
  const global: ts.Diagnostic[] = [];
  for (const d of diagnostics) {
    if (!d.file) {
      global.push(d);
      continue;
    }
    const name = d.file.fileName.replace(/\\/g, "/");
    const list = byFile.get(name) ?? [];
    list.push(d);
    byFile.set(name, list);
  }

  const host: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: (f) => f,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  };

  let failed = 0;
  for (const { path, entry } of files) {
    const key = resolve(path).replace(/\\/g, "/");
    const found = [...byFile.entries()].find(([f]) => resolve(f).replace(/\\/g, "/") === key);
    if (!found) continue;
    failed++;
    console.error(`\n✗ ${entry.category}/${entry.id} — ${entry.title}`);
    console.error(ts.formatDiagnostics(found[1], host).replace(/^/gm, "    ").trimEnd());
  }

  if (global.length > 0) {
    console.error("\n✗ lỗi không gắn với file nào:");
    console.error(ts.formatDiagnostics(global, host).replace(/^/gm, "    ").trimEnd());
  }

  if (!KEEP) await rm(TMP, { recursive: true, force: true });

  if (failed > 0 || global.length > 0) {
    console.error(`\n✗ ${failed}/${files.length} đoạn code không biên dịch được`);
    if (KEEP) console.error(`  File tạm còn ở ${TMP}/ để xem`);
    else console.error(`  Chạy lại với --keep để giữ file tạm mà xem`);
    process.exit(1);
  }

  console.log(`✓ cả ${files.length} đoạn code đều biên dịch sạch`);
}

main().catch((err: unknown) => {
  console.error("✗ typecheck-samples thất bại:", err);
  process.exit(1);
});
