import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Thư mục do script/công cụ sinh — cùng danh sách với .prettierignore.
    // `.cache` chứa pw.d.ts + pw-test.d.ts tải từ Playwright: 1,5 MB type của
    // người khác, lint vào là 504 lỗi không liên quan gì tới code của mình.
    ".cache/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);

export default eslintConfig;
