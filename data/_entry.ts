/**
 * Cầu nối giữa phần máy lo và phần người lo.
 *
 * File data/NN-*.ts chỉ viết phần người: chọn API nào, xếp vào nhóm nào, giải
 * thích tiếng Việt ra sao, code mẫu gọn thế nào. Còn `signature`, `params`,
 * `returns`, `since`, `docsUrl` thì lấy từ data/facts.ts — do pipeline sinh ra
 * từ types.d.ts + docs/src/api, nên luôn đúng với bản Playwright đang ghim.
 *
 * Nhờ vậy khi bump version Playwright chỉ cần chạy lại pipeline: mọi chữ ký hàm
 * tự cập nhật, không phải sờ vào 340 entry.
 */
import { FACTS, type Fact } from "./facts.ts";
import type { CheatEntry, Category, Param } from "../lib/types.ts";

/** Phần người viết cho một entry. */
export type Curated = {
  /** URL segment. Bỏ trống thì suy ra từ tên member, vd getByRole -> get-by-role. */
  id?: string;
  /** Hiển thị. Bỏ trống thì lấy từ facts, vd 'locator.getByRole()'. */
  title?: string;
  /** Mô tả tiếng Việt, 1–2 câu, trả lời "khi nào dùng". */
  description: string;
  /** Ví dụ gọn, chạy được. Bắt buộc viết tay — code trong docs thường dài dòng. */
  code: string;
  /** Ngôn ngữ của `code`. Mặc định 'ts'; lệnh dòng lệnh thì đặt 'bash'. */
  codeLang?: "ts" | "bash";
  tags: string[];
  /** Chỉ liệt kê param/option đáng nhớ. Bỏ trống = lấy hết param từ facts. */
  showParams?: string[];
  /** Mô tả tiếng Việt đè lên mô tả tiếng Anh của param, theo tên param. */
  paramNotes?: Record<string, string>;
  /** 'id' nếu cùng nhóm, 'category/id' nếu khác nhóm. */
  related?: string[];
  /** Cảnh báo / deprecated / best practice. */
  note?: string;
};

/** Entry không ứng với API nào trong facts (lệnh CLI, biến môi trường, mẫu code). */
export type Standalone = Curated & {
  id: string;
  title: string;
  signature: string;
  docsUrl: string;
  returns?: string;
  since?: string;
  params?: Param[];
};

/** 'getByRole' -> 'get-by-role' */
function kebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function toParams(fact: Fact, curated: Curated): Param[] | undefined {
  const pool = [...fact.params, ...fact.options];
  const picked = curated.showParams
    ? curated.showParams.map((name) => {
        const found = pool.find((p) => p.name === name);
        if (!found) {
          throw new Error(`${fact.key}: showParams có "${name}" nhưng API không có param/option đó`);
        }
        return found;
      })
    : fact.params;

  if (picked.length === 0) return undefined;

  return picked.map((p) => ({
    name: p.name,
    type: p.type,
    required: p.required,
    description: curated.paramNotes?.[p.name] ?? p.description,
    default: p.default,
  }));
}

/**
 * Dựng một entry từ khoá API (`Class.method`) + phần biên tập tay.
 * Gõ sai khoá là ném lỗi ngay lúc build, không im lặng ra trang trống.
 */
export function entry(key: string, category: Category, curated: Curated): CheatEntry {
  const fact = FACTS[key];
  if (!fact) {
    throw new Error(
      `Không có API "${key}" trong data/facts.ts. ` +
        `Kiểm tra lại chính tả, hoặc dùng standalone() nếu đây không phải API của Playwright.`,
    );
  }

  return {
    id: curated.id ?? kebab(key.slice(key.indexOf(".") + 1)),
    title: curated.title ?? fact.title,
    category,
    signature: fact.signature,
    description: curated.description,
    code: curated.code.trim(),
    codeLang: curated.codeLang ?? "ts",
    params: toParams(fact, curated),
    returns: fact.returns,
    since: fact.since,
    tags: curated.tags,
    docsUrl: fact.docsUrl,
    related: curated.related,
    note: curated.note ?? fact.deprecated,
  };
}

/**
 * Entry không map tới API nào: lệnh CLI (`npx playwright test`), biến môi trường
 * (`PWDEBUG`), hay mẫu code (Page Object Model). Những thứ này không có trong
 * types.d.ts nên phải khai đầy đủ bằng tay.
 */
export function standalone(category: Category, curated: Standalone): CheatEntry {
  return {
    id: curated.id,
    title: curated.title,
    category,
    signature: curated.signature,
    description: curated.description,
    code: curated.code.trim(),
    codeLang: curated.codeLang ?? "ts",
    params: curated.params,
    returns: curated.returns,
    since: curated.since,
    tags: curated.tags,
    docsUrl: curated.docsUrl,
    related: curated.related,
    note: curated.note,
  };
}
