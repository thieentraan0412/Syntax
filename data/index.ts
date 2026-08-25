/**
 * Gom 15 nhóm thành một dataset duy nhất.
 *
 * Mọi thứ đọc dữ liệu cheatsheet — trang SSG, script build search index, script
 * validate — đều đi qua đây, để không có hai nguồn sự thật.
 */
import { FACTS_META } from "./facts.ts";
import type { CheatEntry, Category, DataMeta } from "../lib/types.ts";

import cli from "./01-cli.ts";
import testStructure from "./02-test-structure.ts";
import fixtures from "./03-fixtures.ts";
import locators from "./04-locators.ts";
import actions from "./05-actions.ts";
import assertions from "./06-assertions.ts";
import pageEntries from "./07-page.ts";
import browserContext from "./08-browser-context.ts";
import network from "./09-network.ts";
import framesDialogs from "./10-frames-dialogs.ts";
import authState from "./11-auth-state.ts";
import config from "./12-config.ts";
import debugReport from "./13-debug-report.ts";
import visualTesting from "./14-visual-testing.ts";
import advanced from "./15-advanced.ts";

/** Nguồn dữ liệu — do pipeline ghim, không gõ tay. */
export const meta: DataMeta = {
  generatedFrom: FACTS_META.generatedFrom,
  generatedAt: FACTS_META.generatedAt,
};

export const entries: CheatEntry[] = [
  ...cli,
  ...testStructure,
  ...fixtures,
  ...locators,
  ...actions,
  ...assertions,
  ...pageEntries,
  ...browserContext,
  ...network,
  ...framesDialogs,
  ...authState,
  ...config,
  ...debugReport,
  ...visualTesting,
  ...advanced,
];

/** Tra một entry theo category + id — dùng cho trang chi tiết SSG. */
export function getEntry(category: string, id: string): CheatEntry | undefined {
  return entries.find((e) => e.category === category && e.id === id);
}

/** Mọi entry của một nhóm, giữ nguyên thứ tự đã biên tập. */
export function getEntriesByCategory(category: Category): CheatEntry[] {
  return entries.filter((e) => e.category === category);
}

/** Đếm entry theo nhóm — dùng cho trang chủ và sidebar. */
export function countByCategory(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of entries) out[e.category] = (out[e.category] ?? 0) + 1;
  return out;
}
