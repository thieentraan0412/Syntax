import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Xuất HTML tĩnh thuần -> deploy được GitHub Pages / Cloudflare Pages / bất kỳ CDN nào.
  output: "export",
  // next/image không tối ưu được khi export tĩnh (không có server).
  images: { unoptimized: true },
  // Mỗi route thành thư mục riêng có index.html -> /locators/get-by-role/ chạy
  // trên host tĩnh mà không cần cấu hình rewrite.
  trailingSlash: true,
};

export default nextConfig;
