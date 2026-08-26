import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle.tsx";
import { SearchTrigger } from "../components/SearchTrigger.tsx";
import { entries, meta } from "../data/index.ts";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "vietnamese"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const TEN = "Playwright Cheatsheet";
const MO_TA = `Tra cứu nhanh ${entries.length} cú pháp, hàm và tuỳ chọn của Playwright — có ví dụ chạy được, giải thích tiếng Việt.`;

export const metadata: Metadata = {
  title: { default: `${TEN} — tra cứu cú pháp Playwright`, template: `%s · ${TEN}` },
  description: MO_TA,
  applicationName: TEN,
};

/**
 * Chạy đồng bộ trong <head>, TRƯỚC lượt vẽ đầu tiên — nên không có cú nháy màu
 * nào. Chỉ đặt thuộc tính khi người dùng đã chọn tay; chưa chọn thì để nguyên
 * cho `@media (prefers-color-scheme)` trong globals.css quyết định.
 *
 * Viết thẳng chuỗi thay vì import từ file .ts: nó phải là inline script, không
 * được là một request riêng — request riêng thì lại nháy.
 */
const SCRIPT_THEME = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      // Script trên sửa DOM trước khi React hydrate — báo cho React biết là cố ý.
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_THEME }} />
      </head>
      <body className="flex min-h-full flex-col">
        {/* Chỉ là một listener bàn phím; overlay tìm kiếm nằm sau next/dynamic. */}
        <SearchTrigger />

        <header className="sticky top-0 z-10 border-b border-border bg-bg/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-baseline gap-2 font-semibold tracking-tight">
              <span className="text-accent">Playwright</span>
              <span className="text-muted">Cheatsheet</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
              >
                Tìm kiếm
                <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px]">
                  /
                </kbd>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-sm text-muted">
            <span>
              {entries.length} cú pháp · dữ liệu trích từ{" "}
              <code className="font-mono">{meta.generatedFrom}</code>
            </span>
            <a
              href="https://playwright.dev"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:text-accent hover:underline"
            >
              playwright.dev ↗
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
