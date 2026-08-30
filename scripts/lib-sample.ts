/**
 * Phần dùng chung của hai script phải biên dịch code mẫu:
 *
 *   - scripts/typecheck-samples.ts  — canh cổng: mọi đoạn code TRÊN TRANG phải sạch
 *   - scripts/build-examples.ts     — lọc: ví dụ tự động lấy từ docs, cái nào
 *                                      không biên dịch được thì không cho lên trang
 *
 * Hai script phải bọc code y hệt nhau, nếu không thì cái này bảo sạch, cái kia
 * bảo bẩn cho cùng một đoạn.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import ts from "typescript";

export const CACHE_TYPES = ".cache";

/** Fixture có sẵn của @playwright/test mà code mẫu có thể nhắc tới. */
const FIXTURES = ["page", "context", "browser", "request", "browserName"] as const;

function indent(code: string): string {
  return code
    .split("\n")
    .map((l) => (l.trim() === "" ? l : "  " + l))
    .join("\n");
}

/**
 * Đoạn code trong cheatsheet là mảnh rời, không phải file hoàn chỉnh. Bọc lại
 * cho đúng ngữ cảnh thì mới typecheck được:
 *   - có `await` ở ngoài cùng  -> bọc trong test(...)
 *   - có `test(` / `import`    -> để nguyên
 */
export function wrapSample(code0: string): string {
  const code = code0.trim();

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

/**
 * Vài mẫu cố ý import từ file khác trong dự án (`./pom/TrangDangNhap`) — đó
 * chính là điều đang muốn minh hoạ. File đó không tồn tại ở đây nên phải sinh
 * stub, không thì TS2307 che mất những lỗi thật trong cùng đoạn code.
 */
export async function writeImportStubs(dir: string, codes: string[]): Promise<number> {
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
        const name = part
          .trim()
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)[0]
          .trim();
        if (name) names.add(name);
      }
      needed.set(spec, names);
    }
  }

  for (const [spec, names] of needed) {
    const target = join(dir, spec.replace(/^\.\//, "") + ".ts");
    await mkdir(dirname(target), { recursive: true });

    const lines = ["// stub do pipeline sinh — file minh hoạ không có thật."];
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

/**
 * Thiếu type đã ghim thì `paths` bên dưới trỏ vào hư không, TypeScript lặng lẽ
 * rơi về node_modules và vẫn báo "sạch" — nhưng là sạch với bản Playwright đang
 * cài, không phải bản pipeline đã ghim. Kết quả xanh mà vô nghĩa là kiểu sai tệ
 * nhất, nên chặn ngay.
 */
export function thieuTypeGhim(): string[] {
  return [join(CACHE_TYPES, "pw-test.d.ts"), join(CACHE_TYPES, "pw.d.ts")].filter(
    (f) => !existsSync(f),
  );
}

/**
 * Type lấy thẳng từ .cache — cùng bản Playwright mà pipeline đã ghim, nên code
 * mẫu được kiểm với đúng API của bản đó, không phụ thuộc node_modules đang cài
 * bản nào. `pw-test.d.ts` tự import 'playwright-core' nên phải map cả hai.
 */
export function compilerOptions(): ts.CompilerOptions {
  return {
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
}

export type KetQuaBienDich = {
  /** đường dẫn (đã chuẩn hoá) -> lỗi của file đó */
  theoFile: Map<string, ts.Diagnostic[]>;
  /** Lỗi không gắn với file nào (thường là lỗi cấu hình, phải fail cả mẻ). */
  chung: ts.Diagnostic[];
};

function chuanHoa(p: string): string {
  return resolve(p).replace(/\\/g, "/");
}

/** Biên dịch cả mẻ trong MỘT program — nhanh hơn nhiều so với mỗi file một lượt. */
export function bienDich(paths: string[]): KetQuaBienDich {
  const program = ts.createProgram(paths, compilerOptions());
  const theoFile = new Map<string, ts.Diagnostic[]>();
  const chung: ts.Diagnostic[] = [];

  for (const d of ts.getPreEmitDiagnostics(program)) {
    if (!d.file) {
      chung.push(d);
      continue;
    }
    const key = chuanHoa(d.file.fileName);
    const list = theoFile.get(key) ?? [];
    list.push(d);
    theoFile.set(key, list);
  }

  return { theoFile, chung };
}

/** Lỗi của đúng một file trong kết quả biên dịch. */
export function loiCua(kq: KetQuaBienDich, path: string): ts.Diagnostic[] {
  return kq.theoFile.get(chuanHoa(path)) ?? [];
}

export const FORMAT_HOST: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (f) => f,
  getCurrentDirectory: () => process.cwd(),
  getNewLine: () => "\n",
};
