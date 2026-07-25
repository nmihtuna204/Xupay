# XuPay — Frontend & UI

> Nền tảng ví điện tử / thanh toán (fintech) — giao diện web dựng bằng **Next.js 16**.
> Tài liệu này mô tả chi tiết kiến trúc frontend, hệ thống thiết kế (design system), toàn bộ màn hình, tầng dữ liệu và cách vận hành.

---

## 1. Tổng quan

XuPay là một nền tảng thanh toán kiểu **Momo / PayPal** với sổ cái chính xác (ledger-accurate). Frontend là một **Single-Page-App server-rendered** giao tiếp với 2 microservice Spring Boot:

| Service | Cổng | Chức năng |
|---------|------|-----------|
| `user-service` | `:8081` | Auth (JWT), hồ sơ, hạn mức, KYC, danh bạ |
| `payment-service` | `:8082` | Ví, nạp/rút/chuyển tiền, giao dịch |

Giao diện chia làm **hai nhóm rõ ràng**:

- **Nhóm chạy API thật** — mọi luồng tiền và tài khoản đều gọi backend thật (đã kiểm chứng end-to-end: đăng ký → tạo ví → nạp/rút/chuyển → số dư cập nhật).
- **Nhóm "showcase" dùng dữ liệu mock (MSW)** — 4 màn hình nghiệp vụ fintech nâng cao (Fraud, Compliance, Analytics, Audit) chưa có backend, được phục vụ bằng **Mock Service Worker** với dữ liệu sinh ngẫu nhiên nhưng **xác định (deterministic)**.

---

## 2. Công nghệ sử dụng

| Nhóm | Thư viện | Phiên bản | Vai trò |
|------|----------|-----------|---------|
| Framework | **Next.js** | 16.2.11 (App Router, Turbopack) | Routing, SSR, build |
| UI runtime | **React** | 19.2 + React Compiler | Render, tối ưu tự động |
| Styling | **Tailwind CSS** | v4 (`@theme` tokens) | Toàn bộ style |
| Components | **shadcn/ui** + **Radix UI** | — | 16 primitive có sẵn a11y |
| Data fetching | **TanStack Query** | v5 | Cache, retry, invalidation |
| HTTP | **Axios** | v1 | 2 client (mỗi service 1) |
| Forms | **React Hook Form** + **Zod** v4 | — | Form + validation type-safe |
| State (client) | **Zustand** | v5 | Session flag đồng bộ |
| Charts | **Recharts** | v3 | Biểu đồ trang showcase |
| Mocking | **MSW** | v2 | Mock 4 domain showcase |
| Icons | **@phosphor-icons/react** | v2 | Bộ icon (`weight="light"`, import từ `/dist/ssr`) |
| Toast | **sonner** | — | Thông báo |
| Fonts | **Geist Sans / Geist Mono** | local (gói `geist`) | Không phụ thuộc mạng |
| Testing | **Vitest** + Testing Library + **jsdom** | — | 29 test |

**Scripts:** `npm run dev` · `npm run build` · `npm start` · `npm run lint` · `npm test`

---

## 3. Kiến trúc route (App Router)

Dùng **route groups** của Next.js để tách layout theo ngữ cảnh:

```
src/app/
├── (marketing)/            → layout công khai
│   └── page.tsx            → Landing page "/"
├── (auth)/                 → layout tối giản, căn giữa
│   ├── login/page.tsx      → "/login"
│   └── register/page.tsx   → "/register"
├── (app)/                  → layout có Sidebar + Topbar (bảo vệ đăng nhập)
│   ├── layout.tsx          → AppShell + MockProvider (boot MSW)
│   ├── dashboard/          → "/dashboard"
│   ├── wallets/            → "/wallets" + "/wallets/[walletId]"
│   ├── payments/           → transfer · deposit · withdraw
│   ├── transactions/       → list + "/transactions/[transactionId]"
│   ├── contacts/  kyc/  settings/
│   ├── fraud/  compliance/  analytics/  audit/   (4 trang MSW)
│   ├── loading.tsx         → skeleton khi chuyển route
│   └── error.tsx           → error boundary cho cả nhóm
├── layout.tsx              → root: font, theme, QueryProvider, Toaster
└── not-found.tsx           → trang 404
```

**Tổng: 19 route.** Việc chuyển đổi giữa "công khai / auth / app" chỉ là đổi layout — không cần logic điều kiện rải rác.

### Bảo vệ route (server-side)

Next.js 16 đổi tên `middleware.ts` → **`proxy.ts`** (hàm export tên `proxy`). File này chặn mọi route trong nhóm `(app)`: nếu không có cookie `xupay_session` → redirect về `/login`. Cookie này **chỉ là cờ non-sensitive**, JWT thật nằm ở `localStorage` và được axios interceptor gắn vào header. Kiểm tra phân quyền thực sự vẫn nằm ở mỗi API call qua Bearer token.

---

## 4. Hệ thống thiết kế (Design System)

### Phong cách
Giao diện **light-first "Agio pastel"**: nền near-white được nâng bởi một lớp mesh pastel rất nhẹ (hồng → lavender → mint), thẻ kính nổi, và gradient thương hiệu tím → xanh → mint. Chiều sâu đến từ độ trong và shadow nhuốm màu, **không** từ viền dày hay shadow đen. Số tiền dùng **font mono tabular** để không bị "nhảy" khi cập nhật.

Theme sáng là mặc định, do `next-themes` điều khiển (`attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`). Bộ token tối trước đây được **giữ lại dưới `.dark`** nhưng **chưa audit lại** sau khi lật sáng — coi như đang tạm gác, chưa ship.

### Quy tắc giữ hệ thống này đứng vững (quan trọng nhất)
Một dải pastel **không thể** vừa làm chữ, vừa làm nền nút, vừa làm trang trí: mint `#5ce0c0` chỉ đạt **1.58:1** trên nền near-white. Vì vậy gradient thương hiệu tồn tại ở **ba dải đã hiệu chỉnh, không thay thế cho nhau được**:

| Nhóm token | Dải màu | Ràng buộc |
|---|---|---|
| `--grad-deco-*` | Toàn dải pastel, có mint | Chỉ trang trí: mesh, glow, tint. **Không bao giờ mang chữ.** |
| `--grad-text-*` | `#7c5cff → #3d7de8 → #1f9d8f` | Chỉ cho **display type** (≥24px, chuẩn 3:1). Đo được 4.20 / 3.83 / 3.24. |
| `--grad-fill-*` | `#6b4aef → #4936d8` | Gradient **duy nhất** được đặt dưới chữ trắng. Đo được 5.45 / 7.49. |

### Bảng màu (CSS tokens — Tailwind v4 `@theme`)

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--background` | `#fafbff` | Nền trang (near-white, hơi lạnh) |
| `--foreground` | `#0f1120` | Heading — 18.1:1 |
| `--body-foreground` | `#3a3d4d` | Body copy — 10.4:1 |
| `--muted-foreground` | `#4a4e5e` | Label/phụ — 8.0:1 nền base, 5.2:1 chỗ mesh đậm nhất |
| `--surface` / `--card` | `#ffffff` | **Đục**, nền cho `.panel` (bảng, form) |
| `--glass` / `--glass-strong` | trắng 68% / 88% | Kính — chỉ landing & auth |
| `--hairline` | `rgb(15 17 32 / 8%)` | Viền (mực alpha thấp, **không** phải trắng) |
| `--primary` | `#5b46e5` | Nền nút dưới chữ trắng — 6.08:1 |
| `--primary-accent` | `#4f3fd0` | Chữ/link accent trên nền sáng — 6.88:1 |
| `--radius` | `0.75rem` | Bo góc (thang sm→4xl) |

### Typography
- **Geist Sans** — chữ giao diện; **Geist Mono** — số tiền & mã.
- Nạp cục bộ qua gói `geist` (`next/font/local`) → **không fetch Google Fonts lúc build** (điều kiện tiên quyết để build Docker offline).

### Icon
**Phosphor** (`@phosphor-icons/react`) ở `weight="light"`. Import từ `/dist/ssr`: entrypoint chính kéo theo `IconContext` (client-only) và sẽ ép `"use client"` lên mọi Server Component có icon. Vì bản SSR không đọc được context, `weight="light"` phải đặt **tường minh ở từng chỗ dùng** — thiếu một chỗ là chỗ đó âm thầm render ở weight regular.

### Recipe dùng lại (CSS `@layer components`)
- `.panel` — **mặt phẳng dữ liệu, đục**. Nền mọi bảng/form. Không kính: tiền trên kính mờ phủ mesh pastel là cách nhanh nhất để một bản redesign sáng trở nên khó đọc.
- `.glass-card` / `.float-card` — kính trong, blur, shadow nhuốm tím. **Chỉ** landing & auth.
- `.bezel` + `.bezel-core` — vỏ lồng hai lớp; bán kính lõi = bán kính vỏ trừ padding để hai đường cong song song.
- `.cta-island` — pill nén khi nhấn, "well" icon lồng bên trong trượt chéo lên.
- `.mesh-bg` (landing) / `.mesh-bg--subtle` (app, ~⅓ độ đậm) / `--rose` `--sky` `--mint` (nhịp từng section).
- `.dot-field` — lớp chấm bi, mask thành vòng cung.
- `.accent-gradient-text` — heading gradient (**dải text**). `.accent-gradient-fill` — nền gradient dưới chữ trắng (**dải fill**).
- `.figure-lg` — số tiền lớn, mono, tabular-nums.

### Màu biểu đồ (đã kiểm định mù màu — GIỮ NGUYÊN)
Bảng categorical đã qua **validator mù màu** (skill dataviz): xanh `#3987e5`, cam `#d95926`, aqua `#199e70`, vàng `#c98500` — CVD ΔE ≥ 8. **Đã đo lại trên nền sáng và giữ nguyên**, vì trên `.panel` trắng cả 4 series đều vượt ngưỡng 3:1 của WCAG 1.4.11: 3.64 / 3.88 / 3.41 / 3.07.

> **Ràng buộc cứng:** biểu đồ **phải** nằm trên `.panel` đục, không được đặt thẳng lên nền mesh của app. Trên nền mesh, vàng tụt xuống 2.65:1 và aqua 2.94:1 — cả hai đều trượt. Đây là ràng buộc kỹ thuật của bảng màu, không phải lựa chọn thẩm mỹ.

Mức rủi ro fraud dùng **status palette** (good/warning/serious/critical) luôn kèm nhãn chữ, không bao giờ chỉ dựa vào màu.

> `CHART_INK` (grid, axis) buộc phải là giá trị màu thật chứ không dùng `var(--token)`: Recharts ghi chúng thành **SVG presentation attribute**, mà trình duyệt không resolve `var()` trong attribute. Nếu đổi `--grid-line` / `--muted-foreground` thì phải sửa tay `chart-colors.ts`.

---

## 5. Cấu trúc thư mục `src/`

```
src/
├── app/                 # Route (xem mục 3)
├── components/
│   ├── ui/              # 16 primitive shadcn (button, dialog, table, sheet…)
│   ├── layout/          # AppShell, Sidebar, Topbar, MobileNav, PageHeader
│   ├── common/          # StatCard, EmptyState, DetailField, PaginationControls
│   └── features/        # Theo domain: auth, dashboard, wallets, payments,
│                        #   contacts, kyc, settings, fraud, compliance,
│                        #   analytics, audit, charts
├── hooks/
│   ├── queries/         # useWallet, useTransactions, useContacts, useKyc,
│   │                    #   useProfile, useFraud, useAnalytics, useAuditLog…
│   ├── mutations/       # useTransfer, useDeposit, useWithdraw, useFreezeWallet…
│   ├── use-auth.ts      # "ai đang đăng nhập"
│   ├── use-idempotency-key.ts
│   └── use-debounce.ts
├── lib/
│   ├── api/             # client-factory + module theo service (auth, wallets,
│   │                    #   payments, kyc, profile, contacts)
│   ├── format.ts        # tiền tệ, số gọn, %, ngày, initials
│   ├── query-keys.ts    # khóa cache tập trung
│   └── session.ts       # token localStorage + cookie cờ
├── mocks/               # MSW: browser.ts, server.ts, seed.ts, data/, handlers/
├── providers/           # QueryProvider, MockProvider
├── store/               # session-store (Zustand)
├── config/              # navigation.ts (cấu trúc menu)
└── test/                # test-utils (render + provider)
```
*(~149 file TS/TSX)*

---

## 6. Chi tiết từng màn hình

### Công khai & Auth
- **Landing `/`** — trang giới thiệu sản phẩm.
- **Login / Register** — form RHF + Zod. Đăng ký **tự động tạo ví** ngay sau khi thành công. Lưu token, set cookie cờ, điều hướng vào dashboard.

### Nhóm ứng dụng (API thật)
| Màn hình | Mô tả |
|----------|-------|
| **Dashboard** | Thẻ số dư trên `.panel` đục, thao tác nhanh (gửi/nạp/rút), bảng giao dịch gần đây |
| **Wallets** | Số dư, mã ví (copy), nút **Freeze/Unfreeze** (dialog kèm lý do) |
| **Wallet detail** | Chi tiết 1 ví theo `[walletId]` |
| **Send money** | Chọn người nhận từ **danh bạ** hoặc dán user ID; validate UUID + số tiền; hiển thị đúng lỗi **giới hạn KYC** từ backend |
| **Deposit / Withdraw** | Form số tiền, tạo giao dịch thật, điều hướng sang chi tiết |
| **Transactions** | Danh sách phân trang, badge trạng thái; click → **chi tiết giao dịch** |
| **Contacts** | Danh bạ (avatar initials), thêm/xóa, nút chuyển tiền nhanh |
| **KYC** | Upload tài liệu (chọn loại, số, quốc gia, file); danh sách tài liệu + trạng thái xác minh |
| **Settings** | Sửa hồ sơ (RHF+Zod), xem **hạn mức giao dịch** theo tier KYC |

### Nhóm showcase (dữ liệu MSW)
| Màn hình | Thành phần UI |
|----------|---------------|
| **Fraud Detection** | 4 stat tile, biểu đồ vùng "flagged vs blocked" (2 series + legend), bar mức rủi ro (status colors), bảng cảnh báo phân trang + filter theo mức rủi ro |
| **Compliance / SAR** | Bảng báo cáo hoạt động đáng ngờ, filter theo trạng thái, dialog chi tiết |
| **Analytics** | Toggle 7/30/90 ngày, 4 KPI, biểu đồ khối lượng theo thời gian, bar theo loại & theo "corridor" |
| **Audit Log** | Bảng log bất biến, filter theo category + **ô tìm kiếm debounce**, phân trang |

### Trạng thái & phản hồi
Mọi trang có: **skeleton loading** per-query, **empty state** thân thiện, **toast** lỗi/thành công, `error.tsx` bắt lỗi render, `not-found.tsx` cho 404.

---

## 7. Tầng dữ liệu

### TanStack Query
- Khóa cache tập trung tại `lib/query-keys.ts` (tránh trùng lặp, dễ invalidate).
- Query hooks (đọc) và mutation hooks (ghi) tách riêng; mutation `onSuccess` **invalidate** đúng nhánh cache → UI tự cập nhật (vd nạp tiền xong, số dư refetch).

### Axios (2 client)
`client-factory.ts` tạo 1 client dùng chung cho cả 2 service với:
- **Request interceptor** gắn `Authorization: Bearer <token>`.
- **Response interceptor** chuẩn hóa lỗi; nếu 401 → xóa session + đẩy về `/login`.

### MSW (4 domain showcase)
- Dữ liệu sinh bằng **PRNG xác định (mulberry32)** → mỗi lần tải giống hệt nhau, test assert ổn định.
- Handler hỗ trợ phân trang, filter, tìm kiếm, độ trễ giả lập (loading state thật).
- Worker chỉ chặn `/mock-api/*`, **không đụng** API thật.

---

## 8. Các pattern đáng chú ý

- **Idempotency key** — mỗi form thanh toán sinh 1 UUID (qua `useState` lazy init) gắn vào cả header và body; retry cùng key = cùng 1 giao dịch (khớp yêu cầu idempotency của backend).
- **Số tiền = integer cents** — backend luôn dùng "amountCents" (1 đơn vị = 100 cents); `formatCurrencyFromCents` luôn chia 100 và ép 2 chữ số thập phân, không tin default theo tiền tệ của `Intl`.
- **Next.js 16 async params** — route động (`[walletId]`, `[transactionId]`) nhận `params` là `Promise`, phải `await`.
- **React Compiler-friendly** — tránh đọc ref khi render, dùng `useWatch` thay `form.watch`, không `setState` trực tiếp trong effect.
- **Điều hướng mobile** — dưới `md`, sidebar cố định bị ẩn; nút ☰ mở **drawer (Sheet)** dùng lại đúng component Sidebar, tự đóng khi bấm link.

---

## 9. Kiểm thử

**29 test** (Vitest + Testing Library + MSW + jsdom), 8 file:

- `format.test.ts` — tiền tệ, số gọn, %, ngày, initials.
- `mock-data.test.ts` — tính xác định của seed, tính nhất quán số liệu fraud/analytics.
- `payment-validation.test.ts` — schema Zod chuyển tiền (UUID, số dương, coerce).
- `RiskBadge` / `StatCard` — component.
- **`fraud/compliance/audit` page tests** — render trang showcase với MSW, kiểm tra bảng có dữ liệu và **tương tác filter** hoạt động (đây là phần thay thế cho ảnh chụp màn hình).

`Recharts ResponsiveContainer` được mock kích thước cố định để biểu đồ mount được trong jsdom.

---

## 10. Docker & vận hành

`Dockerfile` multi-stage (deps → builder → runner) dùng **Next.js standalone output**, chạy bằng user non-root:

```bash
# Chạy dev (cần backend ở :8081/:8082)
npm run dev            # http://localhost:3000

# Build & kiểm thử
npm run build
npm test
npm run lint

# Đóng gói production
docker build -t xupay-frontend .
docker run -p 3000:3000 xupay-frontend
```

URL API base bake vào lúc build qua `NEXT_PUBLIC_USER_SERVICE_URL` / `NEXT_PUBLIC_PAYMENT_SERVICE_URL` (mặc định `localhost:8081` / `8082`).

---

## 11. Ghi chú tích hợp backend (đã kiểm chứng trực tiếp)

Trong lúc dựng, một số điểm hợp đồng API thực tế **khác tài liệu**, đã xử lý ở frontend:

- Response đăng ký/đăng nhập là **phẳng** (`token`, `expiresIn`, `userId`) — không có object user lồng nhau; phải gọi thêm `GET /api/auth/me` để lấy hồ sơ đầy đủ.
- `idempotencyKey` bắt buộc nằm trong **body** (không chỉ header).
- Danh bạ trả về **`contactName`** (tên gộp), không phải `firstName`/`lastName`.
- Upload KYC bắt buộc thêm **`fileSizeBytes`** và **`mimeType`**.
- Giới hạn giao dịch chuyển tiền phụ thuộc **tier KYC** (user chưa xác minh bị giới hạn rất thấp) — frontend hiển thị đúng lỗi này.

---

## 12. Điểm nhấn kỹ thuật (dành cho review/CV)

- Next.js 16 mới nhất: App Router, Turbopack, `proxy.ts`, async params, React Compiler.
- Tách bạch **domain thật vs mock** rõ ràng, MSW cô lập hoàn toàn.
- Design system light-pastel nhất quán bằng token: gradient thương hiệu chia **ba dải hiệu chỉnh theo contrast**, bề mặt kính tách khỏi bề mặt dữ liệu, biểu đồ **kiểm định mù màu** và đo lại trên nền sáng.
- Type-safe từ đầu tới cuối: Zod ↔ RHF ↔ axios ↔ TanStack Query.
- Chất lượng CI: **lint sạch, `tsc` sạch, build sạch, 29 test xanh, Docker image chạy được**.
- Chú trọng chi tiết fintech: idempotency, tiền tệ integer-cents, hạn mức KYC, đóng băng ví, audit log.
