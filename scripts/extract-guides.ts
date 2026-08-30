/**
 * Nguồn C — bóc ví dụ dài từ tầng guide (`docs/src/*.md`).
 *
 * `docs/src/api/*.md` chỉ cho ví dụ 2–3 dòng cho từng hàm: đủ để nhớ cú pháp,
 * không đủ để thấy hàm đó sống trong một bài test thật ra sao. Tầng guide mới có
 * thứ đó — cả file Page Object, cả `playwright.config.ts` đầy đủ, cả một test
 * mở trang → thao tác → assert.
 *
 * Script này chỉ BÓC và gắn ngữ cảnh; việc chọn ví dụ nào cho entry nào là của
 * scripts/build-examples.ts.
 *
 * Ra: .cache/guides.json
 * Chạy: node scripts/extract-guides.ts
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const GUIDES = join(".cache", "guides");
const OUT = join(".cache", "guides.json");

export type GuideBlock = {
  /** Tên file nguồn, vd 'locators.md'. */
  file: string;
  /** `id` trong frontmatter -> trang trên playwright.dev. */
  docId: string;
  /** `title` trong frontmatter, vd 'Locators'. */
  docTitle: string;
  /** Tiêu đề `##` gần nhất phía trên. */
  h2: string;
  /** Tiêu đề `###` gần nhất phía trên (nếu có). */
  h3: string;
  lang: "js" | "ts";
  code: string;
  /**
   * Tên file docs gán cho khối, từ ```js title="playwright.config.ts". Có ở 130+
   * khối, và nó là nửa còn lại của bài học: cùng một đoạn code, để trong
   * `playwright.config.ts` hay trong `tests/example.spec.ts` là hai chuyện khác.
   */
  fileName?: string;
  /**
   * `tab=` trong fence: 'js-test' (dùng @playwright/test) hay 'js-library'
   * (dùng Playwright như thư viện). Cùng một ví dụ viết hai kiểu — cheatsheet
   * này nói về test runner nên chỉ lấy bản test.
   */
  tab?: string;
  /**
   * Khối ```html đứng ngay trước — docs hay bày "HTML thế này thì locator thế
   * kia". Thiếu nó thì ví dụ mất một nửa ý nghĩa.
   */
  html?: string;
  /**
   * Các API mà ĐOẠN VĂN cùng mục nhắc tới, dạng `[`method: Page.goto`]`. Đây là
   * tín hiệu map mạnh hơn đoán theo tên biến, nhưng vẫn chỉ là tín hiệu: một mục
   * có thể nhắc 5 API mà code chỉ dùng 1.
   */
  refs: string[];
  /** Link về đúng mục trên playwright.dev. */
  url: string;
};

/** 'Locate by role' -> 'locate-by-role' — đúng quy ước neo của Docusaurus. */
function slug(title: string): string {
  return title
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function frontmatter(md: string): { id?: string; title?: string } {
  const m = /^---\n([\s\S]*?)\n---/.exec(md);
  if (!m) return {};
  const id = /^id:\s*(.+)$/m.exec(m[1])?.[1]?.trim();
  const title = /^title:\s*"?(.*?)"?\s*$/m.exec(m[1])?.[1]?.trim();
  return { id, title };
}

/**
 * Docs viết bằng một phương ngữ markdown có tab theo ngôn ngữ:
 *
 *   ```js tab=js-ts
 *   ```python async
 *   ```html card
 *
 * Chỉ lấy `js`/`ts`; `python`/`java`/`csharp` là cùng một ví dụ viết lại cho
 * ngôn ngữ khác, giữ lại chỉ tổ trùng.
 */
function bocFile(md: string, file: string): GuideBlock[] {
  const { id = file.replace(/\.md$/, ""), title = "" } = frontmatter(md);
  const dong = md.split("\n");
  const ra: GuideBlock[] = [];

  let h2 = "";
  let h3 = "";
  let refs = new Set<string>();
  let htmlTruoc: string | undefined;

  for (let i = 0; i < dong.length; i++) {
    const l = dong[i];

    const mh = /^(#{2,3})\s+(.*?)\s*$/.exec(l);
    if (mh) {
      if (mh[1] === "##") {
        h2 = mh[2];
        h3 = "";
      } else {
        h3 = mh[2];
      }
      // Ref chỉ tính trong phạm vi mục hiện tại — mục trước nhắc gì thì kệ nó.
      refs = new Set();
      htmlTruoc = undefined;
      continue;
    }

    for (const m of l.matchAll(/\[`(?:method|property|event): ([A-Za-z]+\.[A-Za-z0-9_]+)`\]/g)) {
      refs.add(m[1]);
    }

    const mo = /^```(\S+)(.*)$/.exec(l);
    if (!mo) continue;
    const meta = mo[2] ?? "";

    const than: string[] = [];
    let j = i + 1;
    for (; j < dong.length && !/^```\s*$/.test(dong[j]); j++) than.push(dong[j]);
    const code = than.join("\n").trim();
    i = j;

    const lang = mo[1];
    if (lang === "html") {
      htmlTruoc = code;
      continue;
    }
    if (lang !== "js" && lang !== "ts") {
      // Bản python/java/csharp của cùng ví dụ — bỏ, nhưng HTML minh hoạ phía
      // trên vẫn thuộc về khối js đã lấy rồi, không xoá.
      continue;
    }

    const anchor = slug(h3 || h2);
    ra.push({
      file,
      docId: id,
      docTitle: title,
      h2,
      h3,
      lang,
      code,
      fileName: /title="([^"]+)"/.exec(meta)?.[1],
      tab: /tab=(\S+)/.exec(meta)?.[1],
      html: htmlTruoc,
      refs: [...refs],
      url: `https://playwright.dev/docs/${id}${anchor ? `#${anchor}` : ""}`,
    });
    htmlTruoc = undefined;
  }

  return ra;
}

async function main() {
  const files = (await readdir(GUIDES).catch(() => [])).filter((f) => f.endsWith(".md"));
  if (files.length === 0) {
    console.error(`✗ ${GUIDES}/ trống — chạy \`npm run data:fetch\` trước`);
    process.exit(1);
  }

  const blocks: GuideBlock[] = [];
  for (const f of files) {
    blocks.push(...bocFile(await readFile(join(GUIDES, f), "utf8"), f));
  }

  await writeFile(OUT, JSON.stringify({ blocks }, null, 1) + "\n");

  const dai = blocks.filter((b) => b.code.length >= 200);
  const theoFile = new Map<string, number>();
  for (const b of blocks) theoFile.set(b.file, (theoFile.get(b.file) ?? 0) + 1);

  console.log(`✓ ${OUT}`);
  console.log(`  guide đọc     : ${files.length}`);
  console.log(`  khối js/ts    : ${blocks.length}`);
  console.log(`  >= 200 ký tự  : ${dai.length}`);
  console.log(`  kèm HTML      : ${blocks.filter((b) => b.html).length}`);
  console.log(`  có ref API    : ${blocks.filter((b) => b.refs.length > 0).length}`);
  console.log(`  có tên file   : ${blocks.filter((b) => b.fileName).length}`);
  console.log(
    `  bản library   : ${blocks.filter((b) => b.tab === "js-library").length} (sẽ bỏ khi chọn)`,
  );
  console.log(`\n  Guide nhiều ví dụ nhất:`);
  for (const [f, n] of [...theoFile].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`    ${String(n).padStart(3)}  ${f}`);
  }
}

main().catch((err: unknown) => {
  console.error("✗ extract-guides thất bại:", err);
  process.exit(1);
});
