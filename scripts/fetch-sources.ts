/**
 * Phase 1b — tải nguồn dữ liệu về .cache/
 *
 *   Nguồn A: types.d.ts (unpkg)          -> signature, params, returns, deprecated, code JSDoc
 *   Nguồn B: docs/src/api/*.md (GitHub)  -> since, returns chuẩn, code js, macro params.md
 *
 * Lệch so với kế hoạch: kế hoạch chỉ nói `playwright-core` + `docs/src/api`, nhưng
 * như vậy THIẾU toàn bộ API của `@playwright/test` (test, expect, fixtures, config,
 * testInfo) — tức là 6/15 nhóm không có nguồn. Nên tải thêm:
 *   - `playwright@x/types/test.d.ts`  (nguồn A phần test runner)
 *   - `docs/src/test-api/*.md`        (nguồn B phần test runner, 12 file)
 *
 * Chạy: node scripts/fetch-sources.ts
 */
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { join } from "node:path";

/** Bản Playwright tham chiếu của cheatsheet. Đổi ở đây rồi chạy lại toàn bộ pipeline. */
export const PW_VERSION = process.env.PW_VERSION ?? "1.62.1";

const CACHE = ".cache";
/** File .d.ts nặng ~1 MB, mạng chậm có thể mất vài phút. */
const TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS ?? 300_000);
const RETRIES = 3;

async function get(url: string, accept = "text/plain"): Promise<string> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { accept, "user-agent": "playwright-cheatsheet-build" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < RETRIES) console.warn(`  ↻ thử lại (${attempt}/${RETRIES - 1}) — ${url}`);
    }
  }
  throw lastErr;
}

/**
 * raw.githubusercontent.com chập chờn ở một số mạng (SSL connect error), nên
 * ưu tiên jsdelivr rồi mới fallback về raw.
 */
async function getRepoFile(path: string): Promise<string> {
  const mirrors = [
    `https://cdn.jsdelivr.net/gh/microsoft/playwright@v${PW_VERSION}/${path}`,
    `https://raw.githubusercontent.com/microsoft/playwright/v${PW_VERSION}/${path}`,
  ];
  let lastErr: unknown;
  for (const url of mirrors) {
    try {
      return await get(url);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`Không tải được ${path}: ${String(lastErr)}`);
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Tải song song nhưng giới hạn số request đồng thời — tránh bị mirror chặn. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  await mkdir(CACHE, { recursive: true });

  // --- Nguồn A: types.d.ts + test.d.ts -------------------------------------
  const dtsTargets = [
    { file: "pw.d.ts", url: `https://unpkg.com/playwright-core@${PW_VERSION}/types/types.d.ts` },
    { file: "pw-test.d.ts", url: `https://unpkg.com/playwright@${PW_VERSION}/types/test.d.ts` },
  ];
  for (const { file, url } of dtsTargets) {
    const path = join(CACHE, file);
    if (await exists(path)) {
      console.log(`↷ bỏ qua ${file} (đã có trong ${CACHE})`);
      continue;
    }
    console.log(`→ tải ${file}…`);
    const dts = await get(url);
    await writeFile(path, dts);
    console.log(`  ✓ ${dts.length.toLocaleString()} bytes · ${dts.split("\n").length} dòng`);
  }

  // --- Nguồn B: docs/src/api + docs/src/test-api ---------------------------
  const mdFiles: string[] = [];
  for (const dir of ["docs/src/api", "docs/src/test-api"]) {
    console.log(`→ liệt kê ${dir}…`);
    const listing = JSON.parse(
      await get(
        `https://api.github.com/repos/microsoft/playwright/contents/${dir}?ref=v${PW_VERSION}`,
        "application/vnd.github+json",
      ),
    ) as Array<{ name: string; type: string }>;

    const names = listing.filter((f) => f.type === "file" && f.name.endsWith(".md")).map((f) => f.name);
    console.log(`  ✓ ${names.length} file .md`);

    const missing: string[] = [];
    for (const name of names) {
      mdFiles.push(name);
      if (!(await exists(join(CACHE, name)))) missing.push(name);
    }
    if (missing.length === 0) {
      console.log(`  ↷ đã có đủ trong ${CACHE}`);
      continue;
    }
    let done = 0;
    await pool(missing, 4, async (name) => {
      const body = await getRepoFile(`${dir}/${name}`);
      await writeFile(join(CACHE, name), body);
      console.log(`  ✓ ${(++done).toString().padStart(2)}/${missing.length} ${name}`);
    });
  }

  // --- Ghim version + cảnh báo lỗi thời ------------------------------------
  let latest = "?";
  try {
    const pkg = JSON.parse(
      await get("https://registry.npmjs.org/playwright-core/latest", "application/json"),
    ) as { version: string };
    latest = pkg.version;
  } catch {
    console.warn("  ! không đọc được version mới nhất từ npm registry");
  }

  const meta = {
    generatedFrom: `playwright-core@${PW_VERSION}`,
    generatedAt: new Date().toISOString(),
    latestOnNpm: latest,
    sources: {
      types: `https://unpkg.com/playwright-core@${PW_VERSION}/types/types.d.ts`,
      testTypes: `https://unpkg.com/playwright@${PW_VERSION}/types/test.d.ts`,
      docs: `https://github.com/microsoft/playwright/tree/v${PW_VERSION}/docs/src/api`,
      testDocs: `https://github.com/microsoft/playwright/tree/v${PW_VERSION}/docs/src/test-api`,
    },
    files: ["pw.d.ts", "pw-test.d.ts", ...mdFiles],
  };
  await writeFile(join(CACHE, "meta.json"), JSON.stringify(meta, null, 2) + "\n");

  console.log(`\n✓ xong — nguồn: ${meta.generatedFrom}`);
  if (latest !== "?" && latest !== PW_VERSION) {
    console.log(`  ⚠ npm đang ở ${latest} — cheatsheet đang ghim ${PW_VERSION}`);
  }
}

main().catch((err) => {
  console.error("✗ fetch-sources thất bại:", err);
  process.exit(1);
});
