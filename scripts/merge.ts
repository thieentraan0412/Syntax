/**
 * Phase 1b — join nguồn A (types.d.ts) + nguồn B (docs/src/api/*.md) theo khoá
 * `Class.method`, ra data/candidates.json.
 *
 * Đây là DANH SÁCH ỨNG VIÊN, không phải cheatsheet. Nó chính xác 100% vì không
 * có chữ nào gõ tay, nhưng cũng chưa có giá trị biên tập: chưa chọn lọc, chưa
 * phân nhóm, mô tả còn nguyên tiếng Anh. Bước 1c mới biến nó thành cheatsheet.
 *
 * Ai thắng khi hai nguồn khác nhau:
 *   signature, params (kiểu)   ← A  (types.d.ts là nguồn chuẩn của TypeScript)
 *   since                      ← B  (A không có)
 *   default của option         ← B  (A không ghi default trong kiểu)
 *   code mẫu                   ← B trước, A sau  (B đã lọc đúng ```js)
 *   returns                    ← A, thiếu thì lấy B
 *
 * Chạy: node scripts/merge.ts
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { DocMember, DocParam } from "./extract-docs.ts";
import type { TypeMember } from "./extract-types.ts";

const CACHE = ".cache";
const OUT_DIR = "data";
const OUT = join(OUT_DIR, "candidates.json");
/** Bản gọn, gõ kiểu sẵn, để data/NN-*.ts import — xem chú thích ở cuối file. */
const OUT_FACTS = join(OUT_DIR, "facts.ts");

export type CandidateParam = {
  name: string;
  type: string;
  required: boolean;
  /** Tiếng Anh, lấy nguyên từ nguồn. Bước 1c dịch sang tiếng Việt. */
  description: string;
  default?: string;
  since?: string;
  deprecated?: string;
};

export type Candidate = {
  key: string;
  className: string;
  memberName: string;
  /** Gợi ý title cho entry: 'locator.check()' */
  title: string;
  /** Gợi ý id kebab-case: 'check' */
  suggestedId: string;
  signature: string;
  returns?: string;
  since?: string;
  /** Mô tả tiếng Anh từ nguồn — tài liệu tham chiếu khi viết mô tả tiếng Việt. */
  descriptionEn: string;
  examples: string[];
  params: CandidateParam[];
  options: CandidateParam[];
  deprecated?: string;
  docsUrl: string;
  /** Nguồn nào đóng góp: 'A' | 'B' | 'AB' */
  sources: string;
  origin?: "playwright-core" | "playwright-test";
};

// ---------------------------------------------------------------------------

/** 'getByRole' -> 'get-by-role' ; 'toHaveJSProperty' -> 'to-have-js-property' */
export function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/**
 * Anchor trên playwright.dev theo đúng quy ước của họ:
 *   Locator.check           -> class-locator#locator-check
 *   Locator.getByRole       -> class-locator#locator-get-by-role
 *   LocatorAssertions.toBeVisible -> class-locatorassertions#locator-assertions-to-be-visible
 *   Test.describe           -> class-test#test-describe
 */
const ANCHOR_CLASS_OVERRIDES: Record<string, string> = {
  LocatorAssertions: "locator-assertions",
  PageAssertions: "page-assertions",
  APIResponseAssertions: "api-response-assertions",
  SnapshotAssertions: "snapshot-assertions",
  GenericAssertions: "generic-assertions",
  PlaywrightAssertions: "playwright-assertions",
  APIRequestContext: "api-request-context",
  APIRequest: "api-request",
  APIResponse: "api-response",
  BrowserContext: "browser-context",
  BrowserType: "browser-type",
  BrowserServer: "browser-server",
  CDPSession: "cdp-session",
  ConsoleMessage: "console-message",
  ElementHandle: "element-handle",
  FileChooser: "file-chooser",
  FrameLocator: "frame-locator",
  JSHandle: "js-handle",
  RequestOptions: "request-options",
  TestConfig: "test-config",
  TestOptions: "test-options",
  TestInfo: "test-info",
  TestInfoError: "test-info-error",
  TestProject: "test-project",
  TestStepInfo: "test-step-info",
  FullConfig: "full-config",
  FullProject: "full-project",
  WorkerInfo: "worker-info",
  WebError: "web-error",
  WebSocket: "web-socket",
  WebSocketFrame: "web-socket-frame",
  WebSocketRoute: "web-socket-route",
  WebStorage: "web-storage",
  TimeoutError: "timeout-error",
  PlaywrightException: "playwright-exception",
};

function docsUrlFor(className: string, memberName: string): string {
  const fileSlug = className.toLowerCase();
  const anchorClass = ANCHOR_CLASS_OVERRIDES[className] ?? className.toLowerCase();
  const anchor = `${anchorClass}-${kebab(memberName)}`;
  return `https://playwright.dev/docs/api/class-${fileSlug}#${anchor}`;
}

/** 'Locator' + 'check' -> 'locator.check()' ; 'Test' + 'describe' -> 'test.describe()' */
function titleFor(className: string, memberName: string, kind: string): string {
  const receiver = className.charAt(0).toLowerCase() + className.slice(1);
  return kind === "property" ? `${receiver}.${memberName}` : `${receiver}.${memberName}()`;
}

function toCandidateParam(p: DocParam): CandidateParam {
  return {
    name: p.name,
    type: p.type,
    required: p.required,
    description: p.description,
    default: p.default,
    since: p.since,
    deprecated: p.deprecated,
  };
}

/**
 * Ghép param của A và B: tên + thứ tự lấy theo A (đúng với TypeScript), mô tả và
 * `default` lấy theo B nếu B có (B viết rõ default hơn).
 */
function mergeParams(a: TypeMember | undefined, b: DocMember | undefined): CandidateParam[] {
  if (!a) return (b?.params ?? []).map(toCandidateParam);

  const byName = new Map((b?.params ?? []).map((p) => [p.name.toLowerCase(), p]));
  return a.params.map((p) => {
    const doc = byName.get(p.name.toLowerCase());
    return {
      name: p.name,
      type: p.type,
      required: p.required,
      description: doc?.description || p.description,
      default: doc?.default,
      since: doc?.since,
      deprecated: doc?.deprecated,
    };
  });
}

// ---------------------------------------------------------------------------
// data/facts.ts — phần "máy lo" mà file cheatsheet viết tay sẽ import
// ---------------------------------------------------------------------------

/**
 * Bài toán: entry viết tay cần `signature`, `params`, `since`, `docsUrl` — toàn
 * thứ máy đã biết chính xác. Chép tay vào 340 file là vừa mất công vừa lệch dần
 * mỗi lần Playwright ra bản mới.
 *
 * Nên máy xuất ra đây một bảng tra `Class.method` -> sự thật, còn file
 * data/NN-*.ts chỉ viết phần người: chọn cái nào, thuộc nhóm nào, giải thích
 * tiếng Việt ra sao. Bump version Playwright -> chạy lại pipeline -> signature
 * tự cập nhật, không phải sửa tay entry nào.
 *
 * Xuất ra .ts chứ không .json để mọi chỗ (script chạy bằng node, app chạy bằng
 * Next) import cùng một kiểu, không vướng khác biệt về import attributes.
 */
function renderFacts(candidates: Candidate[], meta: { generatedFrom: string; generatedAt: string }): string {
  const slim = candidates.map((c) => ({
    key: c.key,
    title: c.title,
    signature: c.signature,
    returns: c.returns,
    since: c.since,
    docsUrl: c.docsUrl,
    deprecated: c.deprecated,
    params: c.params.map((p) => ({
      name: p.name,
      type: p.type,
      required: p.required,
      description: p.description,
      default: p.default,
    })),
    options: c.options.map((p) => ({
      name: p.name,
      type: p.type,
      required: p.required,
      description: p.description,
      default: p.default,
    })),
  }));

  const body = slim.map((f) => `  ${JSON.stringify(f.key)}: ${JSON.stringify(f)},`).join("\n");

  return `// FILE NÀY DO MÁY SINH — đừng sửa tay.
// Sinh bởi scripts/merge.ts từ ${meta.generatedFrom}
// Muốn đổi nội dung: sửa nguồn rồi chạy lại
//   node scripts/fetch-sources.ts && node scripts/extract-types.ts \\
//     && node scripts/extract-docs.ts && node scripts/merge.ts

export type FactParam = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
};

export type Fact = {
  key: string;
  title: string;
  signature: string;
  returns?: string;
  since?: string;
  docsUrl: string;
  deprecated?: string;
  params: FactParam[];
  options: FactParam[];
};

export const FACTS_META = ${JSON.stringify(meta)} as const;

export const FACTS: Record<string, Fact> = {
${body}
};
`;
}

// ---------------------------------------------------------------------------

async function main() {
  const [typesRaw, docsRaw, metaRaw] = await Promise.all([
    readFile(join(CACHE, "types.json"), "utf8").catch(() => {
      throw new Error("Chưa có .cache/types.json — chạy `node scripts/extract-types.ts` trước");
    }),
    readFile(join(CACHE, "docs.json"), "utf8").catch(() => {
      throw new Error("Chưa có .cache/docs.json — chạy `node scripts/extract-docs.ts` trước");
    }),
    readFile(join(CACHE, "meta.json"), "utf8"),
  ]);

  const types = JSON.parse(typesRaw) as TypeMember[];
  const docs = JSON.parse(docsRaw) as DocMember[];
  const cacheMeta = JSON.parse(metaRaw) as { generatedFrom: string; generatedAt: string };

  const typeByKey = new Map(types.map((t) => [t.key, t]));
  const docByKey = new Map(docs.map((d) => [d.key, d]));

  const keys = [...new Set([...typeByKey.keys(), ...docByKey.keys()])].sort();

  const candidates: Candidate[] = [];
  let onlyA = 0;
  let onlyB = 0;
  let both = 0;

  for (const key of keys) {
    const a = typeByKey.get(key);
    const b = docByKey.get(key);

    // Bỏ member chỉ có trong types.d.ts mà docs không nhắc tới: thường là kiểu
    // nội bộ, event handler `on`/`off`, hoặc interface phụ trợ không phải API.
    if (a && !b && !/^(Locator|Page|Frame|Browser|BrowserContext|BrowserType|Test|Expect)$/.test(a.className)) {
      onlyA++;
      continue;
    }

    const className = a?.className ?? b!.className;
    const memberName = a?.memberName ?? b!.memberName;
    const kind = a?.kind ?? b!.kind;

    if (a && b) both++;
    else if (b) onlyB++;
    else onlyA++;

    // Code mẫu: B trước (đã lọc đúng ```js và ngắn gọn hơn), rồi bổ sung của A.
    const examples = [...(b?.examples ?? [])];
    for (const ex of a?.examples ?? []) {
      if (!examples.includes(ex)) examples.push(ex);
    }

    candidates.push({
      key,
      className,
      memberName,
      title: titleFor(className, memberName, kind),
      suggestedId: kebab(memberName),
      signature: a?.signature ?? `${memberName}(): ${b?.returns ?? "void"}`,
      returns: a?.returns ?? b?.returns,
      since: b?.since,
      descriptionEn: b?.description || a?.description || "",
      examples,
      params: mergeParams(a, b),
      options: (b?.options ?? []).map(toCandidateParam),
      deprecated: a?.deprecated ?? b?.deprecated,
      docsUrl: docsUrlFor(className, memberName),
      sources: a && b ? "AB" : a ? "A" : "B",
      origin: a?.origin,
    });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    OUT,
    JSON.stringify(
      {
        meta: { generatedFrom: cacheMeta.generatedFrom, generatedAt: cacheMeta.generatedAt },
        candidates,
      },
      null,
      2,
    ) + "\n",
  );

  await writeFile(OUT_FACTS, renderFacts(candidates, cacheMeta));

  const byClass = new Map<string, number>();
  for (const c of candidates) byClass.set(c.className, (byClass.get(c.className) ?? 0) + 1);
  const top = [...byClass.entries()].sort((x, y) => y[1] - x[1]).slice(0, 12);

  console.log(`✓ ${OUT}`);
  console.log(`  ứng viên       : ${candidates.length}`);
  console.log(`  cả 2 nguồn (AB): ${both}`);
  console.log(`  chỉ docs   (B) : ${onlyB}`);
  console.log(`  bỏ (chỉ A)     : ${onlyA}`);
  console.log(`  có \`since\`     : ${candidates.filter((c) => c.since).length}`);
  console.log(`  có code mẫu    : ${candidates.filter((c) => c.examples.length > 0).length}`);
  console.log(`  deprecated     : ${candidates.filter((c) => c.deprecated).length}`);
  console.log(`\n  Lớp nhiều nhất:`);
  for (const [name, n] of top) console.log(`    ${String(n).padStart(4)}  ${name}`);

  // --- Spot-check bắt buộc theo Phase 1b ---
  const check = candidates.find((c) => c.key === "Locator.check");
  if (!check) throw new Error("Spot-check thất bại: không thấy Locator.check");
  const timeout = check.options.find((o) => o.name === "timeout");
  if (timeout?.default !== "0") {
    throw new Error(`Bẫy 2! Locator.check.timeout default = ${timeout?.default}, phải là 0.`);
  }
  console.log(`\n  ✓ Locator.check — since ${check.since} · timeout default ${timeout.default}`);
  console.log(`    ${check.docsUrl}`);
}

main().catch((err: unknown) => {
  console.error("✗ merge thất bại:", err);
  process.exit(1);
});
