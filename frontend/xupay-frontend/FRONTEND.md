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
| Testing | **Vitest** + Testing Library + **jsdom** | — | 31 test |

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
Giao diện **tối "dark glass"**, lấy cảm hứng từ Fampal (Dribbble 24487828). Spec đầy đủ, số đo và lý do từng quyết định nằm ở [`docs/design/spec.md`](../../docs/design/spec.md). Tóm tắt:

- Nền gần đen `#030305`, lưới vuông mờ (ô 56px, trắng 5%) có mask hình elip: rõ ở giữa, tan dần ra mép.
- Hero có **hai vòng kính 3D** (React Three Fiber + drei `MeshTransmissionMaterial`), viền cầu vồng lấy từ môi trường dựng hoàn toàn bằng `Lightformer` màu, không tải file HDR nào.
- Ánh sáng thương hiệu indigo → violet. Chiều sâu đến từ **ánh sáng** (bloom indigo, cạnh trên được chiếu sáng) chứ không từ shadow, vì trên nền đen shadow gần như vô hình.

App chỉ có theme tối. `next-themes` bị ép `forcedTheme="dark"` để `<html>` luôn mang class `.dark`, nhờ vậy các biến thể `dark:` của shadcn và `color-scheme` cũng tối theo.

### Hai bề mặt, không thay thế cho nhau
| Recipe | Dùng ở | Lý do |
|---|---|---|
| `.panel` (+ `.panel-lit`) | Mọi bảng, form, màn hình app | **Đục** (`--surface #0a0a0f`). Tiền đặt trên kính mờ phủ nền sáng sẽ không đọc được. `.panel-lit` chỉ vẽ thêm bloom indigo, vẫn đục. |
| `.glass-card`, `.glass-stage` | Landing và auth | Trắng 3% + backdrop blur, viền indigo, vệt sáng ở cạnh trên. `.glass-stage--dense` dùng cho form đăng nhập/đăng ký, để các vòng phía sau không chạy qua ô đang gõ. |

**Lưu ý kỹ thuật:** `.reveal` chỉ bật `will-change` khi đang ẩn. Nếu giữ vĩnh viễn, mỗi khối đã hiện sẽ trở thành một "backdrop root" và kính bên trong không còn nhìn thấy gì phía sau nó.

### Bảng màu (CSS tokens, Tailwind v4 `@theme`)

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--background` | `#030305` | Nền trang |
| `--foreground` | `#ffffff` | Heading, 20.6:1 |
| `--body-foreground` | `#a1a1aa` | Body copy, 8.0:1 |
| `--muted-foreground` | `#8b8b94` | Label/phụ, 6.1:1 (5.4:1 trong vùng bloom indigo) |
| `--surface` / `--card` | `#0a0a0f` | **Đục**, nền cho `.panel` |
| `--glass` / `--glass-strong` / `--glass-edge` | trắng 3% / 6% / 10% | Kính, chỉ landing và auth |
| `--hairline` | `rgb(255 255 255 / 8%)` | Viền |
| `--cta-from` → `--cta-to` | `#4358d1` → `#5a5fe0` | Nút chính, gradient dọc; chữ trắng ≥ 4.9:1 |
| `--cta-bloom` | `#9b90f1` | Quầng tím dưới nút. Chỉ đạt 2.7:1 với chữ trắng, nên **luôn nằm dưới baseline** của nhãn |
| `--primary` | `#4b55db` | Nền đặc dưới chữ trắng, 5.8:1 |
| `--primary-accent` | `#a5a6ff` | Chữ/link accent, 9.3:1 |
| `--success` / `--warning` / `--error` | `#3dd68c` / `#e0a726` / `#f2555a` | Trạng thái, đều ≥ 5:1 trên `--surface` |

### Vòng kính ở hero
- **Nạp:** `components/features/marketing/hero-rings/`. `HeroRings` render sẵn ảnh tĩnh `public/ring-fallback.png` phía server (LCP là ảnh thường, hero không bao giờ trống). Chỉ trên desktop ≥ 768px **và** không bật `prefers-reduced-motion` thì client mới tải `RingScene` qua `dynamic(..., { ssr: false })`, rồi fade sang canvas khi frame đầu đã vẽ.
- **Tiết kiệm:** canvas ngừng render khi hero ra khỏi màn hình (`IntersectionObserver` → `frameloop="never"`).
- **three.js** nằm trong một chunk riêng khoảng 1MB, trang auth và app không tải.
- **Cập nhật ảnh fallback:** chụp lại scene trên nền trong suốt khi đổi hình vòng.

### Typography
- **Geist Sans** cho chữ giao diện; H1 hero dùng weight **300**, tracking -0.04em. **Geist Mono** chỉ còn cho mã/ID và các cột số trong bảng. Số tiền lớn (`.figure-lg`) dùng sans light + `tabular-nums`.
- **Ký hiệu ₫** — cả hai mặt Geist đều thiếu U+20AB, nên trước đây ₫ bị mượn từ Arial/Consolas (nhỏ, lệch dòng). `src/fonts/dong-*.woff` là font một-glyph ghép từ chính `đ` + gạch dưới của Geist (sinh bằng `scripts/build-dong-font.py`, chạy lại khi nâng cấp gói `geist`), nạp với `unicode-range: U+20AB` và đứng **đầu** stack `--font-sans`/`--font-mono`.
- Nạp cục bộ qua gói `geist` (`next/font/local`) → **không fetch Google Fonts lúc build** (điều kiện tiên quyết để build Docker offline).

### Icon
**Phosphor** (`@phosphor-icons/react`) ở `weight="light"`. Import từ `/dist/ssr`: entrypoint chính kéo theo `IconContext` (client-only) và sẽ ép `"use client"` lên mọi Server Component có icon. Vì bản SSR không đọc được context, `weight="light"` phải đặt **tường minh ở từng chỗ dùng** — thiếu một chỗ là chỗ đó âm thầm render ở weight regular.

### Recipe dùng lại (CSS `@layer components`)
- `.panel` / `.panel-lit`: mặt phẳng dữ liệu đục (xem bảng ở trên).
- `.glass-card` / `.glass-stage` / `.glass-stage--dense`: kính, chỉ dùng ở landing và auth.
- `.grid-ground`: lưới có mask. `.aperture-glow`: đĩa than nằm trong vòng trên. `.app-ground`: nền app, đen với một nguồn sáng indigo nhẹ.
- `.cta-primary` (+ `--sm`): nút viên thuốc gradient dọc, glow lớn dần khi hover. `Button` mặc định của shadcn dùng cùng gradient ở kích thước nhỏ.
- `.hero-badge`: pill 12px trên headline.
- `.segmented` / `.segmented__item[data-active]`: toggle hai lựa chọn.
- `.plan-card` / `.plan-card--featured`: thẻ hạng KYC; thẻ nổi bật có viền và glow indigo.
- `.display-hero` / `.display` / `.h-page` / `.field-label` / `.kicker` / `.figure-lg`: thang chữ.

### Màu biểu đồ (đã kiểm định mù màu, GIỮ NGUYÊN)
Bảng categorical đã qua **validator mù màu**: xanh `#3987e5`, cam `#d95926`, aqua `#199e70`, vàng `#c98500`, CVD ΔE ≥ 8. Đo lại trên `.panel` tối: 5.43 / 5.09 / 5.80 / 6.43:1, đều vượt xa ngưỡng 3:1 của WCAG 1.4.11. Biểu đồ vẫn đặt trên `.panel`.

Mức rủi ro fraud dùng **status palette** (good/warning/serious/critical) luôn kèm nhãn chữ, không bao giờ chỉ dựa vào màu.

> `CHART_INK` (grid, axis, cursor) buộc phải là giá trị màu thật chứ không dùng `var(--token)`: Recharts ghi chúng thành **SVG presentation attribute**, mà trình duyệt không resolve `var()` trong attribute. Nếu đổi `--grid-line` / `--muted-foreground` thì phải sửa tay `chart-colors.ts`.

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
- **Landing `/`**: hero với vòng kính 3D, thẻ "Tiered limits" chồng lên hero (hạn mức thật theo hạng KYC, lấy từ seed `transaction_limits`, **không phải bảng giá**), rồi đến các section Ledger, Risk, Compliance và CTA cuối.
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
| **KYC Review** `/admin/kyc` | Chỉ ADMIN (mục menu tự ẩn với người khác, API trả 403). Hàng đợi tài liệu chờ duyệt: chọn bậc cấp (Tier 1–3) rồi **Approve**, hoặc **Reject** kèm lý do. Duyệt không bao giờ hạ bậc; người bị từ chối nộp tài liệu mới là quay lại PENDING. Tài khoản admin được tạo lúc user-service khởi động từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` (mặc định dev: `admin@xupay.local` / `Admin@12345`). |
| **Settings** | Sửa hồ sơ (RHF+Zod), xem **hạn mức giao dịch** theo tier KYC |

### Nhóm showcase (dữ liệu MSW)
| Màn hình | Thành phần UI |
|----------|---------------|
| **Fraud Detection** | 4 stat tile, biểu đồ vùng "flagged vs blocked" (2 series + legend), bar mức rủi ro (status colors), bảng cảnh báo phân trang + filter theo mức rủi ro |
| **Compliance / SAR** | Bảng báo cáo hoạt động đáng ngờ, filter theo trạng thái, dialog chi tiết |
| **Analytics** | Toggle 7/30/90 ngày, 4 KPI, biểu đồ khối lượng theo thời gian, bar theo loại & theo "corridor" |
| **Audit Log** | Bảng log bất biến, filter theo category + **ô tìm kiếm debounce**, phân trang |

### Trạng thái & phản hồi
Mọi trang có: **skeleton loading** per-query, **empty state** thân thiện, **`ErrorState`** (lỗi mạng/5xx, có nút *Try again*) — tách bạch với empty state: chỉ khi backend trả lời "không có" (404, hoặc 400 của payment-service cho ví/giao dịch không tồn tại — xem `isNotFoundError`) mới hiện empty state. Thêm **toast** lỗi/thành công, `error.tsx` bắt lỗi render, `not-found.tsx` cho 404.

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
- **Số tiền = integer cents** — backend luôn dùng "amountCents" (1 đơn vị = 100 cents); `formatCurrencyFromCents` luôn chia 100. Tiền viết theo quy ước của chính nó: VND theo `vi-VN` → `11.847.920 ₫` (không `,00`; phần lẻ chỉ hiện khi thật sự có, để không làm tròn ngầm). Tiền tệ khác giữ dạng en-US 2 chữ số lẻ. Số gọn trên biểu đồ cùng locale: `3,7 Tr ₫`.
- **Session không làm lệch hydration** — token nằm ở localStorage mà server không thấy; `useHasSession()` (`useSyncExternalStore`) trả `false` lúc hydrate rồi cập nhật ngay sau, và `useAuth().user` bị chặn theo nó, nên HTML server và lần render đầu của client luôn khớp.
- **Next.js 16 async params** — route động (`[walletId]`, `[transactionId]`) nhận `params` là `Promise`, phải `await`.
- **React Compiler-friendly** — tránh đọc ref khi render, dùng `useWatch` thay `form.watch`, không `setState` trực tiếp trong effect.
- **Điều hướng mobile** — dưới `md`, sidebar cố định bị ẩn; nút ☰ mở **drawer (Sheet)** dùng lại đúng component Sidebar, tự đóng khi bấm link.

---

## 9. Kiểm thử

**31 test** (Vitest + Testing Library + MSW + jsdom), 8 file:

- `format.test.ts` — tiền tệ (VND kiểu vi-VN, phần lẻ không bị làm tròn, USD), số gọn, %, ngày, initials.
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
- Design system dark glass nhất quán bằng token: vòng kính 3D (R3F) có fallback tĩnh và chỉ render khi hiển thị, bề mặt kính tách khỏi bề mặt dữ liệu đục, mọi màu chữ đã đo contrast, biểu đồ **kiểm định mù màu** và đo lại trên nền tối.
- Type-safe từ đầu tới cuối: Zod ↔ RHF ↔ axios ↔ TanStack Query.
- Chất lượng CI: **lint sạch, `tsc` sạch, build sạch, 31 test xanh, Docker image chạy được**.
- Chú trọng chi tiết fintech: idempotency, tiền tệ integer-cents, hạn mức KYC, đóng băng ví, audit log.
