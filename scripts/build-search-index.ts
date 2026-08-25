/**
 * Phase 1d — sinh public/search-index.json.
 *
 * Trang search là Client Component, nên mọi byte ở đây đều phải tải xuống trình
 * duyệt. Vì vậy index chỉ giữ 6 field (mục 3.2 implement.md):
 *   id, title, signature, description, tags, category
 *
 * Phần `code`, `params`, `note`… nằm trong trang SSG — không cần ship xuống client.
 * Ngân sách: ~15.5 KB sau brotli cho 340 entry.
 *
 * Chạy: node scripts/build-search-index.ts
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync, brotliCompressSync, constants } from "node:zlib";
import { entries, meta } from "../data/index.ts";
import type { SearchIndex, SearchIndexEntry } from "../lib/types.ts";

const OUT_DIR = "public";
const OUT = join(OUT_DIR, "search-index.json");

/** Ngân sách brotli — vượt là cảnh báo, không fail build. */
const BROTLI_BUDGET_KB = 25;

function fmt(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const indexEntries: SearchIndexEntry[] = entries.map((e) => ({
    id: e.id,
    title: e.title,
    signature: e.signature,
    description: e.description,
    tags: e.tags,
    category: e.category,
  }));

  const index: SearchIndex = { meta, entries: indexEntries };
  // Không format — file này máy đọc, mỗi khoảng trắng là byte phải tải về.
  const json = JSON.stringify(index);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT, json);

  const raw = Buffer.byteLength(json);
  const gzip = gzipSync(json, { level: 9 }).length;
  const brotli = brotliCompressSync(json, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;

  console.log(`✓ ${OUT}`);
  console.log(`  entry  : ${indexEntries.length}`);
  console.log(`  thô    : ${fmt(raw)}`);
  console.log(`  gzip   : ${fmt(gzip)}`);
  console.log(`  brotli : ${fmt(brotli)}  ← số thật user phải tải`);

  if (brotli > BROTLI_BUDGET_KB * 1024) {
    console.warn(
      `  ⚠ vượt ngân sách ${BROTLI_BUDGET_KB} KB brotli. ` +
        `Cân nhắc bỏ \`signature\` khỏi index (mục 3.2: bản siêu gọn chỉ 1.5 KB).`,
    );
  }
}

main().catch((err: unknown) => {
  console.error("✗ build-search-index thất bại:", err);
  process.exit(1);
});
