/**
 * Phase 1b — Nguồn A: parse .cache/pw.d.ts + .cache/pw-test.d.ts bằng
 * TypeScript Compiler API.
 *
 * Nguồn này cho phần MÁY biết chắc chắn: chữ ký hàm, kiểu tham số, kiểu trả về,
 * cờ `@deprecated`, và code mẫu nằm trong JSDoc. Nó KHÔNG có `since` — chỗ đó
 * nguồn B (extract-docs.ts) bù vào.
 *
 * Không dùng kiến thức có sẵn của LLM để đoán signature hay giá trị mặc định
 * (mục 6.7 implement.md) — sai âm thầm là kiểu sai tệ nhất cho một cheatsheet.
 *
 * Chạy: node scripts/extract-types.ts
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";

const CACHE = ".cache";
const OUT = join(CACHE, "types.json");

const SOURCES = [
  { file: "pw.d.ts", origin: "playwright-core" as const },
  { file: "pw-test.d.ts", origin: "playwright-test" as const },
];

export type TypeParam = {
  name: string;
  type: string;
  required: boolean;
  /** Mô tả từ `@param` trong JSDoc (tiếng Anh, sẽ được dịch tay ở bước 1c). */
  description: string;
};

export type TypeMember = {
  /** 'Locator.check' */
  key: string;
  className: string;
  memberName: string;
  kind: "method" | "property";
  /** 'check(options?): Promise<void>' */
  signature: string;
  params: TypeParam[];
  returns: string;
  /** Đoạn mô tả đầu JSDoc. */
  description: string;
  /** Khối ```js trong JSDoc. */
  examples: string[];
  deprecated?: string;
  origin: "playwright-core" | "playwright-test";
};

// ---------------------------------------------------------------------------
// JSDoc
// ---------------------------------------------------------------------------

/** JSDoc trong types.d.ts của Playwright dùng ``` không kèm tag ngôn ngữ. */
function extractExamples(text: string): string[] {
  const out: string[] = [];
  const re = /^```(\w*)[^\n]*\n([\s\S]*?)^```/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const lang = m[1];
    if (lang && lang !== "js" && lang !== "ts" && lang !== "javascript" && lang !== "typescript") {
      continue; // bỏ ```html, ```bash, ```python…
    }
    out.push(m[2].replace(/\s+$/, ""));
  }
  return out;
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```[\s\S]*?^```/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function jsDocText(node: ts.Node): string {
  const docs = (node as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc;
  if (!docs?.length) return "";
  return docs
    .map((d) =>
      typeof d.comment === "string" ? d.comment : (ts.getTextOfJSDocComment(d.comment) ?? ""),
    )
    .join("\n\n")
    .trim();
}

function jsDocTags(node: ts.Node): ts.JSDocTag[] {
  const docs = (node as ts.Node & { jsDoc?: ts.JSDoc[] }).jsDoc;
  return docs?.flatMap((d) => (d.tags ? [...d.tags] : [])) ?? [];
}

function paramDocs(node: ts.Node): Map<string, string> {
  const map = new Map<string, string>();
  for (const tag of jsDocTags(node)) {
    if (!ts.isJSDocParameterTag(tag)) continue;
    const name = tag.name.getText();
    const comment =
      typeof tag.comment === "string" ? tag.comment : (ts.getTextOfJSDocComment(tag.comment) ?? "");
    map.set(name, stripCodeFences(comment));
  }
  return map;
}

function deprecatedOf(node: ts.Node): string | undefined {
  for (const tag of jsDocTags(node)) {
    if (tag.tagName.getText() !== "deprecated") continue;
    const comment =
      typeof tag.comment === "string" ? tag.comment : (ts.getTextOfJSDocComment(tag.comment) ?? "");
    return stripCodeFences(comment) || "API này đã deprecated.";
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

/** Gọn kiểu về 1 dòng: bỏ xuống dòng và khoảng trắng thừa của object type dài. */
function oneLine(text: string): string {
  return text
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Kiểu dài thì rút gọn cho dễ đọc — cheatsheet cần liếc là hiểu, không cần
 * chép nguyên 69 giá trị của union `role`:
 *   object literal dài  -> `Object`
 *   union string dài    -> `"alert"|"button"|"checkbox"|… (69 giá trị)`
 */
function compactType(text: string, maxLen = 60): string {
  const flat = oneLine(text);
  if (flat.length <= maxLen) return flat;

  const literals = flat.split("|").map((s) => s.trim());
  if (literals.length > 4 && literals.every((s) => /^["'].*["']$/.test(s))) {
    return `${literals.slice(0, 3).join("|")}|… (${literals.length} giá trị)`;
  }

  if (flat.startsWith("{")) return "Object";
  return flat.slice(0, maxLen - 1) + "…";
}

function renderParam(p: ts.ParameterDeclaration): string {
  const name = p.name.getText();
  const optional = Boolean(p.questionToken || p.initializer);
  const type = p.type ? compactType(p.type.getText()) : "any";
  return `${name}${optional ? "?" : ""}: ${type}`;
}

// ---------------------------------------------------------------------------
// Duyệt file
// ---------------------------------------------------------------------------

type Container = ts.InterfaceDeclaration | ts.ClassDeclaration;

function collect(
  sourceFile: ts.SourceFile,
  origin: TypeMember["origin"],
  into: Map<string, TypeMember>,
) {
  const visitContainer = (container: Container) => {
    const className = container.name?.getText();
    if (!className) return;

    for (const member of container.members) {
      const isMethod = ts.isMethodSignature(member) || ts.isMethodDeclaration(member);
      const isProp = ts.isPropertySignature(member) || ts.isPropertyDeclaration(member);
      if (!isMethod && !isProp) continue;

      // Bỏ member private / không public.
      const mods = ts.getModifiers(member as ts.HasModifiers);
      if (mods?.some((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) continue;

      const nameNode = member.name;
      if (!nameNode) continue;
      const memberName =
        ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)
          ? nameNode.text
          : nameNode.getText();
      if (memberName.startsWith("_")) continue;

      const key = `${className}.${memberName}`;
      const doc = jsDocText(member);
      const docs = paramDocs(member);

      let signature: string;
      let params: TypeParam[] = [];
      let returns: string;

      if (isMethod) {
        const m = member as ts.MethodSignature | ts.MethodDeclaration;
        params = m.parameters.map((p) => ({
          name: p.name.getText(),
          type: p.type ? compactType(p.type.getText(), 120) : "any",
          required: !(p.questionToken || p.initializer),
          description: docs.get(p.name.getText()) ?? "",
        }));
        returns = m.type ? compactType(m.type.getText(), 120) : "void";
        signature = `${memberName}(${m.parameters.map(renderParam).join(", ")}): ${returns}`;
      } else {
        const p = member as ts.PropertySignature | ts.PropertyDeclaration;
        returns = p.type ? compactType(p.type.getText(), 120) : "any";
        signature = `${memberName}: ${returns}`;
      }

      const entry: TypeMember = {
        key,
        className,
        memberName,
        kind: isMethod ? "method" : "property",
        signature,
        params,
        returns,
        description: stripCodeFences(doc),
        examples: extractExamples(doc),
        deprecated: deprecatedOf(member),
        origin,
      };

      // Overload: giữ bản đầu tiên nhưng gộp thêm code mẫu của các bản sau.
      const existing = into.get(key);
      if (existing) {
        for (const ex of entry.examples) {
          if (!existing.examples.includes(ex)) existing.examples.push(ex);
        }
        if (!existing.description && entry.description) existing.description = entry.description;
        continue;
      }
      into.set(key, entry);
    }
  };

  const walk = (node: ts.Node) => {
    if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) visitContainer(node);
    ts.forEachChild(node, walk);
  };
  walk(sourceFile);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const members = new Map<string, TypeMember>();
  let containers = 0;

  for (const { file, origin } of SOURCES) {
    let text: string;
    try {
      text = await readFile(join(CACHE, file), "utf8");
    } catch {
      throw new Error(`Chưa có ${CACHE}/${file} — chạy \`node scripts/fetch-sources.ts\` trước`);
    }
    const sourceFile = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
    );
    const before = members.size;
    collect(sourceFile, origin, members);
    ts.forEachChild(sourceFile, (n) => {
      if (ts.isInterfaceDeclaration(n) || ts.isClassDeclaration(n)) containers++;
    });
    console.log(`→ ${file}: +${members.size - before} member (${text.split("\n").length} dòng)`);
  }

  const all = [...members.values()].sort((a, b) => a.key.localeCompare(b.key));
  await writeFile(OUT, JSON.stringify(all, null, 2) + "\n");

  console.log(`✓ ${OUT}`);
  console.log(`  member public    : ${all.length}`);
  console.log(`  interface/class  : ${containers}`);
  console.log(`  có code mẫu      : ${all.filter((m) => m.examples.length > 0).length}`);
  console.log(
    `  có @param mô tả  : ${all.reduce((n, m) => n + m.params.filter((p) => p.description).length, 0)}`,
  );
  console.log(`  @deprecated      : ${all.filter((m) => m.deprecated).length}`);

  // Spot-check: getByRole phải có signature và code mẫu.
  const getByRole = members.get("Page.getByRole");
  if (!getByRole) throw new Error("Spot-check thất bại: không thấy Page.getByRole");
  console.log(`  ✓ spot-check — Page.getByRole: ${getByRole.signature.slice(0, 70)}…`);
}

main().catch((err: unknown) => {
  console.error("✗ extract-types thất bại:", err);
  process.exit(1);
});
