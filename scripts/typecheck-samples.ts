/**
 * Phase 1d — kiểm mọi đoạn code trong cheatsheet có thật sự biên dịch được không.
 *
 * Đọc tay 340 đoạn code rồi gật đầu là cách chắc chắn để lọt lỗi. Script này ghép
 * mỗi đoạn vào một file .ts riêng (bọc trong `test(...)` nếu cần), dựng chương
 * trình bằng TypeScript Compiler API với type thật của @playwright/test, rồi
 * `--noEmit`. Sai một dấu chấm cũng ra.
 *
 * Kiểm CẢ ví dụ phụ (`entry.examples`) — chúng cũng hiện trên trang, mà ví dụ
 * lấy tự động từ docs thì càng phải soi: scripts/build-examples.ts đã lọc một
 * lượt, đây là lượt canh cổng cuối trước khi build.
 *
 * Chạy: node scripts/typecheck-samples.ts
 *       node scripts/typecheck-samples.ts --keep   (giữ lại thư mục tạm để xem)
 */
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";
import { entries } from "../data/index.ts";
import type { CheatEntry } from "../lib/types.ts";
import {
  CACHE_TYPES,
  FORMAT_HOST,
  bienDich,
  loiCua,
  thieuTypeGhim,
  wrapSample,
  writeImportStubs,
} from "./lib-sample.ts";

const TMP = join(".cache", "samples");
const KEEP = process.argv.includes("--keep");

/** Một đoạn code cần kiểm — code chính của entry, hoặc một ví dụ phụ của nó. */
type Doan = {
  path: string;
  code: string;
  /** Nhãn hiện khi báo lỗi. */
  nhan: string;
};

function tenFile(e: CheatEntry, i: number, hau = ""): string {
  return `${String(i).padStart(3, "0")}-${e.category}-${e.id}${hau}.spec.ts`;
}

async function main() {
  const thieu = thieuTypeGhim();
  if (thieu.length > 0) {
    console.error(`✗ thiếu type đã ghim: ${thieu.join(", ")}`);
    console.error("  Thiếu file này thì tsc rơi về node_modules — kiểm xong cũng không tin được.");
    console.error("  Chạy `npm run data:fetch` để tải về rồi thử lại.");
    process.exitCode = 1;
    return;
  }

  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });

  // Entry CLI chứa lệnh shell, không phải TypeScript — không có gì để biên dịch.
  const doans: Doan[] = [];
  let boQua = 0;

  for (const [i, e] of entries.entries()) {
    if (e.codeLang === "ts") {
      doans.push({
        path: join(TMP, tenFile(e, i)),
        code: e.code,
        nhan: `${e.category}/${e.id} — ${e.title}`,
      });
    } else {
      boQua++;
    }

    for (const [j, vd] of (e.examples ?? []).entries()) {
      if (vd.lang !== "ts") {
        boQua++;
        continue;
      }
      doans.push({
        path: join(TMP, tenFile(e, i, `-vd${j + 1}`)),
        code: vd.code,
        nhan: `${e.category}/${e.id} · ví dụ ${j + 1} "${vd.title}"`,
      });
    }
  }

  if (doans.length === 0) {
    console.log("↷ chưa có đoạn code TypeScript nào để kiểm");
    return;
  }

  for (const d of doans) await writeFile(d.path, wrapSample(d.code));
  const stubs = await writeImportStubs(
    TMP,
    doans.map((d) => d.code),
  );

  const soViDu = doans.length - entries.filter((e) => e.codeLang === "ts").length;
  console.log(
    `→ ghép ${doans.length} đoạn code vào ${TMP}/  ` +
      `(${soViDu} là ví dụ phụ · bỏ qua ${boQua} đoạn shell · ${stubs} stub import minh hoạ)`,
  );
  console.log(`→ type ghim: ${CACHE_TYPES}/pw-test.d.ts + ${CACHE_TYPES}/pw.d.ts`);

  const kq = bienDich(doans.map((d) => d.path));

  let failed = 0;
  for (const d of doans) {
    const loi = loiCua(kq, d.path);
    if (loi.length === 0) continue;
    failed++;
    console.error(`\n✗ ${d.nhan}`);
    console.error(ts.formatDiagnostics(loi, FORMAT_HOST).replace(/^/gm, "    ").trimEnd());
  }

  if (kq.chung.length > 0) {
    console.error("\n✗ lỗi không gắn với file nào:");
    console.error(ts.formatDiagnostics(kq.chung, FORMAT_HOST).replace(/^/gm, "    ").trimEnd());
  }

  if (!KEEP) await rm(TMP, { recursive: true, force: true });

  if (failed > 0 || kq.chung.length > 0) {
    console.error(`\n✗ ${failed}/${doans.length} đoạn code không biên dịch được`);
    if (KEEP) console.error(`  File tạm còn ở ${TMP}/ để xem`);
    else console.error(`  Chạy lại với --keep để giữ file tạm mà xem`);
    process.exit(1);
  }

  console.log(`✓ cả ${doans.length} đoạn code đều biên dịch sạch`);
}

main().catch((err: unknown) => {
  console.error("✗ typecheck-samples thất bại:", err);
  process.exit(1);
});
