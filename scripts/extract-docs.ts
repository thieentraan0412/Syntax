/**
 * Phase 1b — Nguồn B: parse .cache/class-*.md (docs/src/api của repo Playwright).
 *
 * Đây là nguồn GỐC sinh ra playwright.dev nên cấu trúc rất đều. Nó bù đúng thứ
 * types.d.ts không có: `since`.
 *
 * Hai cái bẫy (mục 6.3 implement.md), đã kiểm chứng trên v1.62.1:
 *
 *   Bẫy 1 — mỗi method kèm code mẫu cho js / java / python async / python sync /
 *           csharp. Chỉ lấy khối ```js, không thì cheatsheet lẫn code Python.
 *
 *   Bẫy 2 — option dùng macro %%-...-%% có biến thể theo ngôn ngữ, và GIÁ TRỊ
 *           MẶC ĐỊNH KHÁC NHAU: `input-timeout` = 30000 (python/java/csharp),
 *           `input-timeout-js` = 0 (js). Lấy nhầm là ghi sai cheatsheet.
 *           Cách xử lý chung: bỏ mọi macro/member có `* langs:` không chứa `js`.
 *
 * Chạy: node scripts/extract-docs.ts
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CACHE = ".cache";
const OUT = join(CACHE, "docs.json");

export type DocParam = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
  since?: string;
  deprecated?: string;
};

export type DocMember = {
  /** 'Locator.check' */
  key: string;
  className: string;
  memberName: string;
  kind: "method" | "property" | "event";
  async: boolean;
  since?: string;
  returns?: string;
  description: string;
  /** Chỉ khối ```js. */
  examples: string[];
  params: DocParam[];
  options: DocParam[];
  deprecated?: string;
  sourceFile: string;
};

// ---------------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------------

/** `<[Array]<[Locator]>>` -> `Array<Locator>` ; `<[null]|[string]>` -> `null|string` */
function cleanType(raw: string): string {
  return raw
    .trim()
    .replace(/^<|>$/g, "")
    .replace(/\[([^\]]+)\]/g, "$1")
    .trim();
}

/**
 * Gỡ cú pháp riêng của docs Playwright khỏi đoạn văn:
 *   [`method: Locator.click`]  -> `Locator.click()`
 *   [Learn more](../x.md)      -> Learn more
 */
function cleanProse(md: string): string {
  return md
    .replace(/\[`method:\s*([^`\]]+)`\]/g, (_m, n: string) => "`" + n.trim() + "()`")
    .replace(/\[`(?:property|event|option|param):\s*([^`\]]+)`\]/g, (_m, n: string) => "`" + n.trim() + "`")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Rút giá trị mặc định từ câu mô tả. Docs viết bằng vài kiểu khác nhau:
 *   "Defaults to `30000` (30 seconds)."  -> 30000
 *   "Defaults to **`load`**."            -> load
 *   "Defaults to false."                 -> false
 */
function extractDefault(description: string): string | undefined {
  const m =
    description.match(/Defaults? to `([^`]+)`/i) ??
    description.match(/Defaults? to \*\*`?([^*`]+)`?\*\*/i) ??
    description.match(/Defaults? to (true|false|null|undefined|-?[0-9.]+)\b/i);
  return m ? m[1].trim() : undefined;
}

/**
 * Thân block có thể là một macro nguyên khối: `%%-template-locator-get-by-role-%%`.
 * Không resolve thì mô tả ra đúng chuỗi đó, vô nghĩa với người đọc.
 * Macro của ngôn ngữ khác thì bỏ hẳn (Bẫy 2 áp dụng cả cho template).
 */
function expandMacros(body: string, macros: Map<string, Macro>, depth = 0): string {
  if (depth > 4 || !body.includes("%%-")) return body;
  const expanded = body.replace(/%%-([a-zA-Z0-9-]+)-%%/g, (whole, name: string) => {
    const macro = macros.get(name);
    if (!macro) return whole;
    if (!langsIncludeJs(macro.langs)) return "";
    return macro.body;
  });
  return expandMacros(expanded, macros, depth + 1);
}

type Block = {
  /** class | method | property | event | param | option | template */
  kind: string;
  async: boolean;
  /** Tên sau dấu ':' — 'Locator.check' hoặc 'Locator.check.timeout' */
  name: string;
  /** Tên macro nếu heading có dạng ` = %%-tên-%%` */
  macro?: string;
  meta: Record<string, string>;
  /** Dòng `- returns: ...` hoặc `- \`name\` <[type]>` */
  bullets: string[];
  body: string;
};

const HEADING =
  /^(#{1,3})\s+(?:(async)\s+)?(class|method|property|event|param|option|template):\s*([^\s=]+)\s*(?:=\s*%%-([a-zA-Z0-9-]+)-%%\s*)?$/;

const META_LINE = /^\*\s+(\w+):\s*(.*)$/;

/** Tách phần `* key: value` và `- bullet` ra khỏi thân block. */
function splitMeta(buf: string[]): { meta: Record<string, string>; bullets: string[]; body: string } {
  const meta: Record<string, string> = {};
  const bullets: string[] = [];
  const rest: string[] = [];
  let inFence = false;
  let stillHeader = true;

  for (const line of buf) {
    if (/^```/.test(line)) inFence = !inFence;

    if (!inFence && stillHeader) {
      const m = line.match(META_LINE);
      if (m) {
        meta[m[1]] = m[2].trim();
        continue;
      }
      if (/^-\s+/.test(line)) {
        bullets.push(line.replace(/^-\s+/, "").trim());
        continue;
      }
      if (line.trim() === "") continue;
      stillHeader = false;
    }
    rest.push(line);
  }

  return { meta, bullets, body: rest.join("\n").trim() };
}

/** Tách một file .md thành danh sách block theo heading. */
function parseBlocks(md: string): Block[] {
  const lines = md.split(/\r?\n/);
  const blocks: Block[] = [];
  let head: { kind: string; async: boolean; name: string; macro?: string } | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (!head) return;
    blocks.push({ ...head, ...splitMeta(buf) });
    head = null;
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(HEADING);
    if (m) {
      flush();
      head = { kind: m[3], async: Boolean(m[2]), name: m[4], macro: m[5] };
      continue;
    }
    if (head) buf.push(line);
  }
  flush();
  return blocks;
}

/** Danh sách langs có chứa `js` không? Không khai báo `* langs:` = mọi ngôn ngữ. */
function langsIncludeJs(langs: string | undefined): boolean {
  if (langs === undefined) return true;
  if (langs.trim() === "") return true;
  return langs
    .split(",")
    .map((s) => s.trim())
    .includes("js");
}

/** Lấy các khối ```js (kể cả ```js title="..."), bỏ java/python/csharp — Bẫy 1. */
function extractJsExamples(body: string): string[] {
  const out: string[] = [];
  const re = /^```(\w+)([^\n]*)\n([\s\S]*?)^```/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m[1] !== "js") continue;
    if (/\bbrowser\b/.test(m[2])) continue; // ```js browser — chạy trong trang, không phải test
    out.push(m[3].replace(/\s+$/, ""));
  }
  return out;
}

/** Bỏ code fence + directive `:::` để lấy phần văn xuôi mô tả. */
function proseOf(body: string): string {
  const withoutFences = body.replace(/^```[\s\S]*?^```/gm, "");
  const withoutDirectives = withoutFences.replace(/^:::[\s\S]*?^:::[ \t]*$/gm, "");
  const beforeUsage = withoutDirectives.split(/^\*\*(?:Usage|Details|Arguments)\*\*[ \t]*$/m)[0];
  // Vài option có tên dạng `-inline-` nên heading không khớp regex chuẩn và lọt
  // vào thân bài (Page.screenshot, ElementHandle.screenshot, Browser.newPage).
  const beforeStrayHeading = beforeUsage.split(/^###\s+(?:option|param):/m)[0];
  return cleanProse(beforeStrayHeading);
}

// ---------------------------------------------------------------------------
// params.md — bảng macro
// ---------------------------------------------------------------------------

type Macro = {
  name: string;
  langs?: string;
  bullets: string[];
  body: string;
  deprecated?: string;
};

/** params.md dùng heading `## <tên-macro>`, không theo dạng `kind: Name`. */
function parseMacros(md: string): Map<string, Macro> {
  const map = new Map<string, Macro>();
  const lines = md.split(/\r?\n/);
  let name: string | null = null;
  let buf: string[] = [];

  const flush = () => {
    if (!name) return;
    const { meta, bullets, body } = splitMeta(buf);
    map.set(name, { name, langs: meta.langs, bullets, body, deprecated: meta.deprecated });
    name = null;
    buf = [];
  };

  for (const line of lines) {
    const m = line.match(/^##\s+([a-zA-Z0-9][a-zA-Z0-9-]*)[ \t]*$/);
    if (m) {
      flush();
      name = m[1];
      continue;
    }
    if (name) buf.push(line);
  }
  flush();
  return map;
}

// ---------------------------------------------------------------------------
// param / option -> DocParam
// ---------------------------------------------------------------------------

/** Dòng bullet dạng: `` `timeout` <[float]> `` */
function parseParamBullet(bullet: string): { name: string; type: string } | null {
  const m = bullet.match(/^`([^`]+)`\s*(<.*>)?/);
  if (!m) return null;
  return { name: m[1], type: m[2] ? cleanType(m[2]) : "unknown" };
}

type BuildResult =
  | { status: "ok"; param: DocParam }
  | { status: "skip-lang" }
  | { status: "unresolved" }
  | { status: "no-bullet" };

function buildParam(block: Block, macros: Map<string, Macro>): BuildResult {
  if (!langsIncludeJs(block.meta.langs)) return { status: "skip-lang" };

  let bullets = block.bullets;
  let body = block.body;
  let deprecated: string | undefined = block.meta.deprecated;

  if (block.macro) {
    const macro = macros.get(block.macro);
    if (!macro) return { status: "unresolved" };
    if (!langsIncludeJs(macro.langs)) return { status: "skip-lang" }; // ← Bẫy 2
    bullets = macro.bullets;
    body = macro.body;
    deprecated ??= macro.deprecated;
  }

  const bullet = bullets.find((b) => b.startsWith("`"));
  if (!bullet) return { status: "no-bullet" };
  const parsed = parseParamBullet(bullet);
  if (!parsed) return { status: "no-bullet" };

  const description = cleanProse(body.replace(/^```[\s\S]*?^```/gm, ""));
  const optional = block.kind === "option" || parsed.name.endsWith("?");

  return {
    status: "ok",
    param: {
      name: parsed.name.replace(/\?$/, ""),
      type: parsed.type,
      required: !optional,
      description,
      default: extractDefault(description),
      since: block.meta.since,
      deprecated,
    },
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const files = (await readdir(CACHE)).filter((f) => f.startsWith("class-") && f.endsWith(".md")).sort();
  if (files.length === 0) {
    throw new Error("Chưa có .cache/class-*.md — chạy `node scripts/fetch-sources.ts` trước");
  }

  const macros = parseMacros(await readFile(join(CACHE, "params.md"), "utf8"));
  console.log(`→ ${macros.size} macro trong params.md`);

  const members = new Map<string, DocMember>();
  let skippedMembers = 0;
  let skippedParams = 0;
  let unresolved = 0;

  for (const file of files) {
    const md = await readFile(join(CACHE, file), "utf8");

    for (const block of parseBlocks(md)) {
      if (block.kind === "class" || block.kind === "template") continue;

      if (block.kind === "method" || block.kind === "property" || block.kind === "event") {
        if (!langsIncludeJs(block.meta.langs)) {
          skippedMembers++;
          continue;
        }
        const dot = block.name.indexOf(".");
        if (dot < 0) continue;

        const returnsBullet = block.bullets.find((b) => b.startsWith("returns:"));
        // Resolve macro TRƯỚC khi tách mô tả và code mẫu — nhiều method có thân
        // bài chỉ gồm đúng một macro template.
        block.body = expandMacros(block.body, macros);
        // Bản js ghi đè bản đa-ngôn-ngữ khai báo trước (vd Locator.description).
        members.set(block.name, {
          key: block.name,
          className: block.name.slice(0, dot),
          memberName: block.name.slice(dot + 1),
          kind: block.kind,
          async: block.async,
          since: block.meta.since,
          returns: returnsBullet ? cleanType(returnsBullet.replace(/^returns:\s*/, "")) : undefined,
          description: proseOf(block.body),
          examples: extractJsExamples(block.body),
          params: [],
          options: [],
          deprecated: block.meta.deprecated,
          sourceFile: file,
        });
        continue;
      }

      if (block.kind === "param" || block.kind === "option") {
        const lastDot = block.name.lastIndexOf(".");
        if (lastDot < 0) continue;
        const owner = members.get(block.name.slice(0, lastDot));
        if (!owner) continue;

        const built = buildParam(block, macros);
        if (built.status === "skip-lang") {
          skippedParams++;
          continue;
        }
        if (built.status === "unresolved") {
          unresolved++;
          continue;
        }
        if (built.status === "no-bullet") continue;

        const list = block.kind === "param" ? owner.params : owner.options;
        const idx = list.findIndex((p) => p.name === built.param.name);
        if (idx >= 0) list[idx] = built.param;
        else list.push(built.param);
      }
    }
  }

  const all = [...members.values()].sort((a, b) => a.key.localeCompare(b.key));
  await writeFile(OUT, JSON.stringify(all, null, 2) + "\n");

  console.log(`✓ ${OUT}`);
  console.log(`  member (js)        : ${all.length}`);
  console.log(`  có \`since\`         : ${all.filter((m) => m.since).length}`);
  console.log(`  có code mẫu js     : ${all.filter((m) => m.examples.length > 0).length}`);
  console.log(`  bỏ vì khác ngôn ngữ: ${skippedMembers} member · ${skippedParams} param/option`);
  if (unresolved) console.log(`  ! macro không resolve được: ${unresolved}`);

  // --- Spot-check Bẫy 2 ngay trong script: sai là fail build, không chờ người kiểm ---
  const timeout = members.get("Locator.check")?.options.find((o) => o.name === "timeout");
  if (!timeout) throw new Error("Spot-check thất bại: không thấy option Locator.check.timeout");
  if (timeout.default !== "0") {
    throw new Error(
      `Bẫy 2! Locator.check.timeout default = ${timeout.default}, phải là 0 (biến thể -js).\n` +
        "Nghĩa là đang lấy nhầm macro input-timeout của python/java/csharp.",
    );
  }
  console.log(`  ✓ spot-check Bẫy 2 — Locator.check.timeout default = ${timeout.default}`);
}

main().catch((err: unknown) => {
  console.error("✗ extract-docs thất bại:", err);
  process.exit(1);
});
