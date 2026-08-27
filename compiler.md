KẾ HOẠCH XÂY DỰNG PLAYWRIGHT ONLINE TRÊN NEXT.JS + VERCEL

MỤC TIÊU

Tích hợp chức năng chạy Playwright trực tiếp vào project Next.js hiện tại đang deploy trên Vercel.

Người dùng có thể:

Viết code Playwright trên trình duyệt.
Chạy test bằng nút RUN.
Xem log chạy realtime.
Xem kết quả Pass/Fail.
Chụp screenshot.
Lưu video khi test.
Lưu Playwright Trace.
Xem HTML Report.
Lưu và quản lý các test case.
Chạy Chromium.
Sau này mở rộng Firefox và WebKit.

Kiến trúc ban đầu:

User
↓
Next.js
↓
Vercel
↓
API Route
↓
Playwright
↓
Chromium
↓
Website cần test

STACK CÔNG NGHỆ

Frontend:

Next.js
React
TypeScript
Tailwind CSS
Monaco Editor

Backend:

Next.js API Route / Route Handler
Playwright

Database:

Có thể dùng PostgreSQL / Supabase sau này

Storage:

Có thể dùng Cloudflare R2 sau này để lưu screenshot, video, trace

Deployment:

Vercel

Giai đoạn đầu:

Không cần VPS
Không cần Kubernetes
Không cần Redis
Không cần BullMQ
GIAI ĐOẠN 1 - PROTOTYPE

Mục tiêu:

Next.js nhận code Playwright từ frontend và thực thi test.

Tạo trang:

/playwright

Giao diện:

Playwright Online [ RUN ]

Code Editor

test('Google', async ({ page }) => {
await page.goto('https://google.com');
});

Console

Running...
✓ Test started
✓ Navigate to Google
✓ Test passed

MONACO EDITOR

Tích hợp Monaco Editor vào Next.js.

Chức năng:

Syntax highlighting
TypeScript
Autocomplete
Line number
Error highlighting
Code formatting
Dark mode
Copy code
Save code
API PLAYWRIGHT

Tạo API:

POST /api/playwright/run

Frontend gửi:

{
"code": "test('Google', async ({ page }) => { ... })"
}

Backend thực hiện:

Nhận code.
Tạo file test.spec.ts tạm thời.
Chạy Playwright.
Thu thập stdout/stderr.
Xác định Pass/Fail.
Trả kết quả về frontend.

Response:

{
"status": "passed",
"duration": 3210,
"output": "1 passed"
}

PLAYWRIGHT CONFIG

Cấu hình:

Chromium
Screenshot
Video
Trace
Timeout
Headless mode

Ví dụ:

use: {
headless: true,
screenshot: 'only-on-failure',
video: 'retain-on-failure',
trace: 'retain-on-failure'
}

HIỂN THỊ KẾT QUẢ

Frontend cần hiển thị:

PASS:

✓ Test passed
Duration: 3.2s

FAIL:

✗ Test failed
Duration: 5.4s

Error:
Expected URL:
https://example.com/dashboard

Actual URL:
https://example.com/login

CONSOLE LOG

Hiển thị log:

[10:20:01] Starting test
[10:20:02] Launching browser
[10:20:03] Navigate to website
[10:20:04] Fill username
[10:20:05] Fill password
[10:20:06] Click Login
[10:20:07] Test passed

SCREENSHOT

Khi test fail:

test-results/
screenshot.png

Frontend hiển thị:

[ View Screenshot ]

Sau này upload screenshot lên Cloudflare R2.

VIDEO

Cấu hình:

video: 'retain-on-failure'

Khi test fail:

test-results/
video.webm

Frontend:

[ Watch Video ]

PLAYWRIGHT TRACE

Cấu hình:

trace: 'retain-on-failure'

Khi test fail:

test-results/
trace.zip

Frontend:

[ Open Trace ]

Sau này có thể dùng Playwright Trace Viewer.

LƯU TEST CASE

Sau khi prototype chạy ổn, thêm database.

Database:

users
projects
test_cases
test_runs
artifacts

Quan hệ:

User
↓
Projects
↓
Test Cases
↓
Test Runs
↓
Artifacts

CẤU TRÚC PROJECT

my-next-app/

├── app/
│ ├── playwright/
│ │ └── page.tsx
│ │
│ └── api/
│ └── playwright/
│ └── run/
│ └── route.ts
│
├── components/
│ ├── PlaywrightEditor.tsx
│ ├── Console.tsx
│ ├── TestResult.tsx
│ ├── ScreenshotViewer.tsx
│ └── TestRunner.tsx
│
├── lib/
│ └── playwright/
│ ├── runner.ts
│ └── config.ts
│
├── package.json
└── ...

GIAI ĐOẠN 2 - REALTIME LOG

Sau khi API chạy ổn, thêm realtime.

Flow:

User
↓
RUN
↓
Next.js API
↓
Playwright
↓
WebSocket / SSE
↓
Frontend

Frontend nhận từng log:

Starting...
Launching browser...
Navigating...
Clicking...
Assertion...
Passed.

GIAI ĐOẠN 3 - MULTI-BROWSER

Thêm lựa chọn:

Browser:

[ Chromium ]
[ Firefox ]
[ WebKit ]

Kết quả:

Chromium PASS
Firefox PASS
WebKit PASS

GIAI ĐOẠN 4 - PROJECT MANAGEMENT

Cho phép user:

Tạo project.
Tạo test case.
Đổi tên test.
Xóa test.
Copy test.
Chạy test.
Xem lịch sử chạy.
Xem kết quả lần chạy trước.

Ví dụ:

Project: Demo E-commerce

tests/
├── login.spec.ts
├── product.spec.ts
├── cart.spec.ts
└── checkout.spec.ts

TEST HISTORY

Hiển thị:

Test Run #100
Status: PASS
Duration: 3.2s
Date: 27/08/2026

Test Run #99
Status: FAIL
Duration: 5.1s
Date: 27/08/2026

Test Run #98
Status: PASS
Duration: 2.8s
Date: 26/08/2026

SECURITY

Đây là phần cực kỳ quan trọng.

Không cho phép user chạy code tùy ý trực tiếp trên server mà không kiểm soát.

Phải giới hạn:

CPU
RAM
Execution time
Network
Filesystem
Process
Environment variables

Không cho user truy cập:

process.env
Server filesystem
Database credentials
Vercel secrets
Internal APIs

GIAI ĐOẠN 5 - NẾU VERCEL KHÔNG ĐỦ

Nếu sau này gặp:

Timeout
Memory limit
Chromium resource problem
Test chạy quá lâu
Nhiều test chạy đồng thời
Nhiều user
Cần parallel execution

thì tách Playwright Runner ra server riêng.

Kiến trúc lúc đó:

Vercel
↓
API
↓
Playwright Worker
↓
Docker
↓
Chromium

SCALE SAU NÀY

Khi có nhiều user:

Vercel
↓
Redis
↓
BullMQ
↓
Worker 1
Worker 2
Worker 3
Worker 4

Mỗi Worker chạy Docker + Playwright.

ROADMAP

Phase 1:
Next.js + Monaco + Playwright
Mục tiêu: Chạy được 1 test.

Phase 2:
Console + Test Result
Mục tiêu: Hiển thị kết quả đẹp.

Phase 3:
Screenshot + Video + Trace
Mục tiêu: Debug test.

Phase 4:
Database + Project + Test Case
Mục tiêu: Lưu test.

Phase 5:
Realtime log
Mục tiêu: Theo dõi test đang chạy.

Phase 6:
Chromium + Firefox + WebKit
Mục tiêu: Multi-browser.

Phase 7:
Security + Sandbox
Mục tiêu: Cho phép user chạy code an toàn.

Phase 8:
Parallel execution
Mục tiêu: Chạy nhiều test cùng lúc.

Phase 9:
Docker Worker
Mục tiêu: Tách Playwright khỏi Vercel.

Phase 10:
Redis + BullMQ + Multiple Workers
Mục tiêu: Scale.

THỨ TỰ IMPLEMENT

Không làm tất cả cùng lúc.

Thứ tự nên là:

Tạo /playwright page.
Cài Monaco Editor.
Tạo code editor.
Tạo nút RUN.
Tạo /api/playwright/run.
Cài Playwright.
Chạy Chromium.
Trả PASS/FAIL.
Hiển thị console.
Thêm screenshot.
Thêm video.
Thêm trace.
Thêm database.
Thêm project.
Thêm test history.
Thêm realtime log.
Thêm Firefox/WebKit.
Kiểm tra giới hạn Vercel.
Nếu cần thì chuyển Runner sang VPS/Docker.
Cuối cùng mới làm Redis/BullMQ/parallel.
KIẾN TRÚC MVP

Giai đoạn đầu chỉ cần:

Next.js
+
Monaco Editor
+
Next.js API
+
Playwright
+
Chromium
+
Vercel

Không cần:

VPS
Redis
BullMQ
Kubernetes
Docker
Microservices

Sau khi MVP hoạt động ổn mới tăng độ phức tạp.