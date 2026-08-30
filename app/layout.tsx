import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeToggle } from "../components/ThemeToggle.tsx";
import { SearchTrigger } from "../components/SearchTrigger.tsx";
import { HeaderSearch } from "../components/HeaderSearch.tsx";
import { ScrollTop } from "../components/ScrollTop.tsx";
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
 * Thanh địa chỉ trên di động ăn theo màu này — để mặc định thì nó trắng toát
 * nằm trên nền tím, nhìn như trang bị hở một đường ở mép trên.
 *
 * `themeColor` thuộc export `viewport`, không phải `metadata` (Next 16).
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#180a2b" },
  ],
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

        {/*
          Header trong suốt có `backdrop-blur`: nền gradient chạy tiếp phía sau
          nó chứ không bị cắt ngang bằng một dải màu đặc.
        */}
        <header className="border-border bg-bg/55 sticky top-0 z-20 border-b backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6 2xl:max-w-[84rem]">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 tracking-tight">
              <span className="tile flex h-8 w-8 items-center justify-center rounded-xl">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="m9 8-5 4 5 4" />
                  <path d="m15 8 5 4-5 4" />
                </svg>
              </span>
              <span className="flex items-baseline gap-1.5 font-semibold">
                <span className="text-gradient">Playwright</span>
                <span className="text-muted hidden sm:inline">Cheatsheet</span>
              </span>
            </Link>

            {/* Ô search chiếm phần giữa và co giãn — nó là việc chính của trang này. */}
            <div className="flex flex-1 justify-center">
              <HeaderSearch />
            </div>

            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 2xl:max-w-[84rem]">
          {children}
        </main>

        <footer className="border-border bg-bg/40 mt-8 border-t backdrop-blur-xl">
          <div className="text-muted mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm 2xl:max-w-[84rem]">
            <span>
              <strong className="text-fg font-semibold">{entries.length}</strong> cú pháp · dữ liệu
              trích từ <code className="text-accent font-mono">{meta.generatedFrom}</code>
            </span>
            <a
              href="https://playwright.dev"
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent underline-offset-4 transition-colors hover:underline"
            >
              playwright.dev ↗
            </a>
          </div>
        </footer>

        <ScrollTop />
      </body>
    </html>
  );
}
