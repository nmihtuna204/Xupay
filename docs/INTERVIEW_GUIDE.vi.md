# 🎓 XuPay — Cẩm nang hiểu sâu dự án để phỏng vấn

> Tài liệu này giải thích **toàn bộ** dự án XuPay từ con số 0, dành cho chính tác giả ôn tập trước phỏng vấn. Đọc xong bạn phải trả lời được 2 câu: **"Em đã xây cái gì?"** và **"Tại sao em làm như vậy?"**

---

## 1. Elevator pitch — 30 giây mở đầu

Khi được hỏi "Em hãy giới thiệu về dự án của mình", trả lời:

> "XuPay là một nền tảng **ví điện tử** em xây theo kiến trúc **microservices**: một service quản lý người dùng (đăng ký, đăng nhập JWT, xác minh danh tính KYC, hạn mức giao dịch) và một service thanh toán (ví, nạp/rút/chuyển tiền). Điểm em tâm đắc nhất là **tiền không bao giờ được lưu dưới dạng một cột `balance`** — mọi giao dịch đều được ghi thành **bút toán kép (double-entry ledger)** bất biến, số dư ví là kết quả **tính từ sổ cái**, có trigger ở database đảm bảo tổng Nợ luôn bằng tổng Có. Hai service nói chuyện với nhau qua **gRPC**, chống trùng lặp giao dịch bằng **idempotency key với Redis**, có **fraud detection** theo rule. Frontend là **Next.js 16** với 457 test, backend 70 test, tất cả chạy bằng một lệnh `docker compose up`."

Ngắn hơn nữa (10 giây): *"Ví điện tử microservices bằng Spring Boot + Next.js, mô phỏng cách công ty thanh toán thật quản lý tiền bằng sổ cái kế toán kép."*

---

## 2. Bức tranh tổng thể

### 2.1. Các thành phần

```
[Trình duyệt] ──REST/JSON──> [User Service :8081]     ← PostgreSQL (user_db)
      │                            ▲
      │                            │ gRPC (nội bộ)
      └──────REST/JSON──> [Payment Service :8082]     ← PostgreSQL (payment_db)
                                   └─────────────────  ← Redis (cache idempotency)
[Frontend Next.js :3000] — phục vụ giao diện
```

| Thành phần | Vai trò | Ví dụ cụ thể |
|---|---|---|
| **User Service** | "Bộ phận CSKH + pháp lý": biết bạn là ai, được phép làm gì | Đăng ký, đăng nhập, KYC, hạn mức ngày/tháng |
| **Payment Service** | "Bộ phận kế toán": giữ sổ sách tiền nong | Tạo ví, nạp, rút, chuyển, chống gian lận |
| **PostgreSQL ×2** | Mỗi service một database riêng | `user_db`, `payment_db` |
| **Redis** | Bộ nhớ đệm siêu nhanh (in-memory) | Cache kết quả giao dịch theo idempotency key, TTL 24h |
| **Frontend** | Giao diện người dùng | Dashboard, trang ví, trang giao dịch |

### 2.2. Microservices là gì? Tại sao dùng?

**Monolith** = cả ứng dụng là 1 khối code, 1 database. **Microservices** = tách thành nhiều service nhỏ, mỗi cái tự chạy, tự có database.

Trong XuPay, tách User/Payment vì:
1. **Ranh giới nghiệp vụ rõ**: "danh tính người dùng" và "sổ sách tiền" là 2 domain khác nhau (giống ngân hàng: phòng KYC ≠ phòng kế toán).
2. **Database-per-service**: Payment Service **không được** đọc thẳng `user_db`. Muốn biết "user này được chuyển 50k không?" nó phải **hỏi** User Service qua gRPC. Nhờ vậy đổi cấu trúc bảng users không làm vỡ Payment Service.
3. **Scale độc lập**: mùa sale, giao dịch tăng 10× nhưng đăng ký user không tăng → chỉ cần scale Payment Service.

⚠️ **Trung thực khi phỏng vấn**: nếu bị hỏi "dự án nhỏ sao phải microservices?", trả lời: *"Với quy mô hiện tại, monolith đơn giản hơn thật. Em chọn microservices vì mục tiêu học: em muốn tự tay giải quyết các bài toán chỉ xuất hiện khi tách service — giao tiếp gRPC, dữ liệu phân tán, service này validate qua service kia. Đó là trade-off có chủ đích."* — câu trả lời này ăn điểm hơn là cãi microservices luôn tốt.

---

## 3. Các khái niệm nền tảng (giải thích từ số 0)

### 3.1. REST API & JSON

- API = cách 2 chương trình nói chuyện. REST = quy ước dùng HTTP: `GET` (lấy), `POST` (tạo), `PUT` (sửa), `DELETE` (xóa).
- Ví dụ trong XuPay: `POST /api/auth/login` gửi `{"email": "...", "password": "..."}` → nhận về `{"token": "eyJhbG..."}`.
- **DTO (Data Transfer Object)**: class chỉ để "đóng gói" dữ liệu vào/ra API (`TransferRequest`, `TransferResponse`), tách biệt với **Entity** (class ánh xạ bảng database). Tách vậy để đổi cấu trúc DB không làm đổi API và ngược lại.

### 3.2. JWT — đăng nhập không cần session

**Vấn đề**: HTTP không có trí nhớ (stateless). Làm sao server biết request thứ 2 vẫn là bạn?

**Cách cũ (session)**: server lưu "phiên" trong bộ nhớ, đưa bạn mã phiên. Nhược điểm: server phải nhớ → khó scale nhiều máy.

**Cách của XuPay (JWT — JSON Web Token)**: khi login thành công, server phát cho bạn một "thẻ" gồm 3 phần `header.payload.signature`:
- **payload**: chứa userId, email, hạn dùng (24h) — ai cũng đọc được (chỉ là base64!)
- **signature**: chữ ký tạo bằng **secret key chỉ server biết**. Sửa 1 ký tự payload → chữ ký sai → thẻ vô hiệu.

Mỗi request sau, frontend gắn header `Authorization: Bearer <token>`. Server chỉ cần **verify chữ ký** (không cần tra database) → stateless, scale thoải mái.

**Luồng trong code** (`user-service`):
1. `AuthController.login()` → `AuthServiceImpl.login()`: tìm user theo email, so mật khẩu bằng BCrypt, kiểm tra account active/suspended → `JwtService.generateToken()`.
2. Request sau: `JwtAuthenticationFilter` chặn mọi request, đọc header, verify token, đặt user vào SecurityContext.
3. `SecurityConfig`: khai báo endpoint nào public (`/api/auth/login`, `/actuator/health`), còn lại phải có token.

**Câu hỏi hay gặp**: *"JWT bị lộ thì sao?"* → Ai cầm token là mạo danh được đến khi hết hạn. Giảm rủi ro: HTTPS, hạn ngắn, refresh token, revoke list. *"Tại sao không lưu mật khẩu thường?"* → xem BCrypt bên dưới.

### 3.3. BCrypt — băm mật khẩu

- **Không bao giờ lưu mật khẩu gốc**. Lưu **hash** = kết quả của hàm một chiều: từ hash không suy ngược ra mật khẩu.
- BCrypt > MD5/SHA vì: (1) có **salt** ngẫu nhiên — 2 người trùng mật khẩu vẫn ra hash khác, chặn tra bảng có sẵn (rainbow table); (2) **cố tình chậm** (strength 12 ≈ 2¹² vòng) — brute-force hàng tỷ mật khẩu trở nên bất khả thi.
- Khi login: `passwordEncoder.matches(nhập_vào, hash_trong_db)` — băm lại rồi so, không giải mã.

### 3.4. gRPC — 2 service nói chuyện nội bộ

- REST dùng JSON (text, dễ đọc, hơi nặng). **gRPC** dùng **Protocol Buffers** (nhị phân, nhỏ, nhanh) trên HTTP/2, hai bên sinh code từ file hợp đồng `.proto` → **type-safe**: sửa hợp đồng mà quên sửa code là lỗi ngay lúc compile.
- Trong XuPay (`user_service.proto`): Payment Service gọi
  - `ValidateUser(userId, amountCents, "send")` — user tồn tại? KYC đủ tier? còn hạn mức hôm nay? tài khoản không bị khóa?
  - `RecordTransaction(...)` — cộng dồn số đã giao dịch trong ngày (gọi **bất đồng bộ** — xem 4.4).
- **Tại sao ngoài REST trong gRPC?** Ngoài (browser→server) cần dễ debug, browser hỗ trợ sẵn → REST. Trong (server→server) gọi nhiều, cần nhanh + hợp đồng chặt → gRPC. Đây là pattern phổ biến ở công ty thật.

### 3.5. PostgreSQL, transaction và ACID

- **Transaction (giao dịch DB)**: gom nhiều thao tác thành 1 khối "được ăn cả, ngã về không". Trong code Java: annotation `@Transactional` — method ném exception giữa chừng là mọi thay đổi DB **rollback** hết.
- **ACID**: **A**tomicity (trọn vẹn), **C**onsistency (đúng ràng buộc), **I**solation (các giao dịch song song không giẫm nhau), **D**urability (commit rồi thì mất điện vẫn còn).
- Ví dụ sống còn: chuyển tiền ghi 2 bút toán. Nếu ghi được 1 rồi sập → **A** đảm bảo bút toán kia cũng biến mất, tiền không "bốc hơi".

### 3.6. ⭐ Double-entry ledger — trái tim của dự án (thuộc lòng phần này!)

**Cách ngây thơ**: bảng `wallets` có cột `balance`. Chuyển 100k: `UPDATE balance - 100k` bên A, `+100k` bên B. Vấn đề: 2 lệnh UPDATE độc lập → lỗi giữa chừng hoặc bug là **mất dấu vết tiền**, không thể truy lại "tại sao số dư ra thế này".

**Cách của XuPay (chuẩn ngành tài chính, kế thừa kế toán 500 năm)**:

1. **Không có cột balance.** Mỗi giao dịch ghi các dòng vào bảng `ledger_entries` (bút toán), mỗi dòng là **DEBIT (Nợ)** hoặc **CREDIT (Có)**.
2. **Mọi giao dịch phải cân**: tổng DEBIT = tổng CREDIT. Ví ở đây là **tài khoản tài sản (asset)**: DEBIT làm tăng số dư, CREDIT làm giảm (quy ước kế toán).

Ví dụ bằng số — Alice chuyển Bob 100.000₫ (`TransactionServiceImpl.createLedgerEntries`):

| Bút toán | Ví | Loại | Số tiền | Ý nghĩa |
|---|---|---|---|---|
| 1 | Ví Alice | CREDIT | 100.000 | số dư Alice **giảm** |
| 2 | Ví Bob | DEBIT | 100.000 | số dư Bob **tăng** |

Nạp tiền (deposit) 500.000₫ cho Alice — tiền từ ngoài vào hệ thống:

| Bút toán | Tài khoản | Loại | Ý nghĩa |
|---|---|---|---|
| 1 | Ví Alice (asset) | DEBIT | ví Alice tăng 500k |
| 2 | GL `2110 User Balances` (liability) | CREDIT | hệ thống **nợ** người dùng thêm 500k |

(`2110` là "tài khoản hệ thống" trong **Chart of Accounts** — danh mục tài khoản kế toán: 1xxx tài sản, 2xxx nợ phải trả, 4xxx doanh thu... Ví của user gắn mã GL `1110/1120/1130` theo loại ví.)

3. **Số dư = truy vấn**: hàm SQL `get_wallet_balance()` = `SUM(DEBIT) − SUM(CREDIT)` trên bút toán của ví đó (với tài khoản asset).
4. **Chốt chặn cuối ở DB**: trigger `validate_balanced_transaction` (constraint trigger, **DEFERRABLE INITIALLY DEFERRED** — chạy lúc COMMIT, sau khi đủ các dòng) → giao dịch lệch Nợ/Có bị DB từ chối **kể cả khi code Java có bug**. Defense in depth.
5. **Bất biến (immutable)**: không UPDATE/DELETE bút toán. Sai thì ghi **bút toán đảo (reversal)**. Nhờ vậy có audit trail trọn vẹn — yêu cầu bắt buộc của ngành tài chính.

**Tại sao tiền tính bằng cents (`amount_cents BIGINT`)?** Số thực `float/double` nhị phân không biểu diễn chính xác 0.1 (0.1+0.2 = 0.30000000000000004). Với tiền, sai 1 xu cũng là bug → lưu **số nguyên** đơn vị nhỏ nhất, chỉ format khi hiển thị.

### 3.7. ⭐ Idempotency — chống trừ tiền 2 lần

**Tình huống**: bạn bấm "Chuyển tiền", mạng lag, app timeout. Tiền đã trừ chưa? Bạn bấm lại → nguy cơ **trừ 2 lần**.

**Giải pháp**: client sinh một **idempotency key** (UUID) cho mỗi *ý định* giao dịch. Bấm lại = gửi lại **cùng key**:

```
1. Server nhận request → tra key trong Redis (nhanh, ~1ms)
2. Redis không có → tra PostgreSQL (bảng transactions có UNIQUE constraint trên idempotency_key)
3. Cả 2 không có → xử lý giao dịch thật → lưu kết quả vào Redis (TTL 24h)
4. Retry đến → tìm thấy key → TRẢ LẠI KẾT QUẢ CŨ, không xử lý lại
```

- **Idempotent** nghĩa là: gọi 1 lần hay N lần, kết quả như nhau.
- **Tại sao 2 tầng?** Redis nhanh nhưng là cache (có thể mất khi restart); PostgreSQL bền + UNIQUE constraint là chốt chặn cuối. Cache miss thì đọc DB rồi "làm ấm" lại Redis (pattern **cache-aside**).
- Code: `IdempotencyServiceImpl.getIfExists()` / `.cache()`.

### 3.8. Fraud detection theo rule

Trước khi thực hiện chuyển tiền, `FraudDetectionServiceImpl.evaluateTransaction()` chấm điểm rủi ro theo các rule cấu hình trong bảng `fraud_rules` (bật/tắt không cần deploy lại):
- **VELOCITY**: quá N giao dịch trong X phút (vd >10 giao dịch/giờ) → cộng điểm.
- **AMOUNT_THRESHOLD**: số tiền vượt ngưỡng → cộng điểm.

Tổng điểm quyết định hành động: **cho qua** / **FLAG** (vẫn thực hiện nhưng đánh dấu `is_flagged`, lưu `fraud_score`, `fraud_reason` để đội ngũ review) / **BLOCK** (ném exception, chặn luôn). Đây là mô hình thật của các công ty thanh toán (đơn giản hóa — bản thật dùng thêm ML).

### 3.9. KYC & hạn mức

- **KYC (Know Your Customer)** = định danh khách hàng, yêu cầu pháp lý của ngành tài chính (chống rửa tiền).
- XuPay có 4 tier: `TIER_0` (chưa xác minh — hạn mức thấp) → nộp giấy tờ (CMND, hộ chiếu...) → admin duyệt → lên tier, hạn mức tăng.
- Bảng `transaction_limits` định nghĩa hạn mức ngày/tháng theo tier; bảng `daily_usage` cộng dồn số đã dùng hôm nay. gRPC `ValidateUser` kiểm tra trước mỗi giao dịch; `RecordTransaction` cộng dồn sau giao dịch.

### 3.10. Flyway — quản lý phiên bản schema DB

- Vấn đề: schema DB thay đổi theo thời gian, làm sao mọi môi trường (máy dev, Docker, production) cùng một cấu trúc?
- **Flyway** chạy các file SQL đánh số thứ tự (`V1__init.sql`, `V2__fraud_rules_data.sql`, `V3__add_merchant_wallet_gl_account.sql`...) đúng 1 lần, ghi sổ vào bảng `flyway_schema_history`. Migration đã chạy là **bất biến** — muốn đổi tiếp thì viết file V(n+1), giống git cho database.
- Trong XuPay: schema đầy đủ (V1) nằm ở `infrastructure/db/` chạy khi khởi tạo container Postgres lần đầu; các thay đổi tiếp theo (V2, V3) nằm trong `src/main/resources/db/migration` của từng service, Flyway tự áp khi service khởi động (`baseline-on-migrate: true`).

### 3.11. Docker & docker-compose

- **Docker**: đóng gói app + toàn bộ môi trường chạy (JDK, thư viện...) thành **image**; chạy image ra **container** — "chạy được trên máy em thì chạy được mọi nơi".
- **Multi-stage build** (xem `Dockerfile`): stage 1 dùng image Maven để compile ra JAR; stage 2 chỉ copy JAR vào image JRE gọn nhẹ → image cuối nhỏ, không chứa source/toolchain.
- **docker-compose.yml**: khai báo cả hệ (2 Postgres, Redis, 2 service, frontend), mạng nội bộ, thứ tự khởi động qua `depends_on` + `healthcheck` (Payment chỉ chạy khi User Service đã khỏe). Một lệnh `docker compose up -d --build` dựng cả hệ thống.
- Secrets (mật khẩu DB, JWT secret) tách ra file `.env` (không commit) — file `.env.example` làm mẫu.

### 3.12. Frontend Next.js — các mảnh chính

- **Next.js App Router**: mỗi thư mục trong `src/app` là 1 route; `(auth)`/`(app)` là **route group** — nhóm trang dùng chung layout (trang auth không có sidebar, trang app có).
- **TanStack Query (React Query)**: quản lý "server state". Thay vì tự `fetch` + `useState` + `useEffect`, khai báo `useQuery({queryKey: ['wallets'], queryFn: ...})` — tự cache, tự refetch, tự loading/error state. Sau khi chuyển tiền thành công, `invalidateQueries(['wallets'])` → UI tự cập nhật số dư.
- **Lớp API client** (`lib/userServiceClient.ts`, `lib/paymentServiceClient.ts`): class TypeScript typed, interceptor tự gắn JWT vào header, chuẩn hóa lỗi thành `ApiError`. Có **mock client** cùng interface — đặt `NEXT_PUBLIC_USE_MOCKS=true` là frontend chạy không cần backend (dev/demo nhanh).
- **Kiến trúc 1 chiều**: Page → hook (`hooks/api/useWallets`) → client (`lib/`) → REST. Component không bao giờ gọi axios trực tiếp → dễ test, dễ thay backend.
- **Test**: Vitest + Testing Library (test hành vi component qua những gì user thấy) + MSW (giả lập HTTP ở tầng network).

---

## 4. Luồng nghiệp vụ chính — kể được như một câu chuyện

### 4.1. Đăng ký & đăng nhập
```
POST /api/auth/register {email, password, họ tên}
→ check email/phone trùng → BCrypt hash password
→ tạo User (kycStatus=PENDING, kycTier=TIER_0) + UserPreference mặc định
→ sinh JWT trả về → frontend lưu token, chuyển vào dashboard
```

### 4.2. Tạo ví
```
POST /api/wallets {userId, walletType: PERSONAL, currency: VND}
→ mỗi user 1 ví (check existsByUserId)
→ map loại ví → mã GL (PERSONAL→1110) → tạo ví, số dư khởi điểm = 0 (chưa có bút toán nào)
```

### 4.3. Nạp tiền (deposit)
```
POST /api/payments/deposit {idempotencyKey, userId, amountCents}
→ check idempotency → check ví active/không frozen
→ tạo Transaction(type=TOPUP, status=PROCESSING)
→ ghi 2 bút toán: DEBIT ví user / CREDIT GL 2110
→ status=COMPLETED → cache kết quả theo key
```

### 4.4. Chuyển tiền P2P (luồng quan trọng nhất — 8 bước)
```
POST /api/payments/transfer {idempotencyKey, from, to, amountCents}
1. Idempotency check (Redis → DB) — trùng key trả kết quả cũ
2. Fraud evaluation — chấm điểm, có thể FLAG/BLOCK
3. gRPC ValidateUser(sender, "send") — KYC, hạn mức, account status
4. gRPC ValidateUser(receiver, "receive")
5. Lấy 2 ví, check active + không frozen
6. Check số dư (get_wallet_balance) — thiếu tiền: lưu Transaction FAILED (dấu vết audit) rồi báo lỗi
7. Ghi Transaction + 2 bút toán cân trong 1 @Transactional; trigger DB xác nhận cân
8. Async gRPC RecordTransaction cho cả 2 user (cộng dồn hạn mức ngày)
   — chạy nền, KHÔNG chặn response: người dùng không phải đợi việc sổ sách phụ
9. Build response, cache idempotency, trả 201
```

Điểm nhấn khi kể: bước 6 lưu cả giao dịch FAILED (audit trail), bước 8 là **bất đồng bộ có chủ đích** (trade-off: nhanh hơn, đổi lấy khả năng lệch nhẹ số liệu usage nếu call nền lỗi — chấp nhận được vì đây là số liệu thống kê, không phải tiền).

### 4.5. Rút tiền (withdraw)
Ngược với nạp: check số dư trước → CREDIT ví user / DEBIT GL 2110.

---

## 5. Những quyết định thiết kế & trade-off (trả lời câu "tại sao?")

| Câu hỏi | Trả lời ngắn gọn |
|---|---|
| Tại sao 2 database? | Database-per-service: service tự chủ dữ liệu, đổi schema không vỡ service khác; đổi lại phải giao tiếp qua API/gRPC và chấp nhận không JOIN chéo được. |
| Tại sao gRPC mà không REST nội bộ? | Nhanh (nhị phân, HTTP/2), hợp đồng `.proto` chặt chẽ, sinh code 2 đầu — sai lệch phát hiện lúc compile. |
| Tại sao không lưu cột balance? | Balance là **derived data**. Lưu riêng sẽ có ngày lệch với lịch sử giao dịch (bug, race condition). Sổ cái là nguồn sự thật duy nhất (single source of truth), balance chỉ là cache/truy vấn. |
| Trigger DB làm gì khi code đã đúng? | Defense in depth: code có thể bug, người mới có thể quên. Ràng buộc ở DB là chốt chặn cuối không ai vượt qua được. |
| Tại sao Redis khi đã có PostgreSQL? | Idempotency check chạy trên **mọi** giao dịch — cần ~1ms. Redis in-memory nhanh hơn ~50× truy vấn DB; DB vẫn giữ vai trò bền vững + UNIQUE constraint. |
| Tại sao amount là BIGINT cents? | Float nhị phân không chính xác với thập phân (0.1+0.2≠0.3). Tiền sai 1 xu là bug nghiêm trọng. |
| JWT vs session? | Stateless — server không giữ phiên, scale ngang dễ; đổi lại khó thu hồi token trước hạn (giải pháp: hạn ngắn + refresh token). |
| Vì sao tests quan trọng trong dự án này? | Code tiền bạc: sửa 1 dòng logic ledger có thể âm thầm làm mất cân sổ. 527 test là lưới an toàn để dám refactor. |

---

## 6. Câu hỏi phỏng vấn dự kiến + dàn ý trả lời

**Nhóm kiến trúc**
1. *"Vẽ kiến trúc hệ thống của em?"* → vẽ sơ đồ mục 2.1, kể từ trái sang: browser → REST → 2 service → DB riêng, gRPC ở giữa, Redis cạnh Payment.
2. *"Nếu User Service sập, chuyện gì xảy ra?"* → Chuyển tiền fail ở bước validate (fail-fast, an toàn — thà từ chối còn hơn cho giao dịch thiếu kiểm tra). Nói thêm hướng cải thiện: circuit breaker (Resilience4j), cache kết quả validate ngắn hạn.
3. *"Làm sao 2 service không làm hỏng dữ liệu của nhau?"* → Không chung DB; mọi tương tác qua hợp đồng gRPC.

**Nhóm tiền & dữ liệu**
4. *"Chứng minh tiền không tự sinh ra/mất đi trong hệ của em?"* → Bút toán kép + trigger cân Nợ/Có + immutable ledger. Tổng tài sản = tổng nợ phải trả tại mọi thời điểm (accounting equation).
5. *"User bấm chuyển tiền 2 lần thật nhanh thì sao?"* → Idempotency key (mục 3.7) + UNIQUE constraint. 
6. *"Hai giao dịch cùng rút từ 1 ví cùng lúc?"* → Race condition: cả 2 cùng đọc balance đủ. Phòng bởi: transaction + isolation của Postgres; thiết kế hỗ trợ nâng isolation lên SERIALIZABLE cho payment DB (khi đó 1 trong 2 sẽ bị serialization failure và retry). Trả lời trung thực: "đây là chỗ em đã nghiên cứu kỹ và biết giới hạn hiện tại" — cộng điểm lớn.

**Nhóm bảo mật**
7. *"Lưu mật khẩu thế nào?"* → BCrypt + salt, strength 12; login so hash chứ không giải mã.
8. *"JWT lưu ở đâu phía client, rủi ro gì?"* → Cookie **HttpOnly + SameSite=Strict** do server đặt: JavaScript (kể cả mã XSS) không đọc được nên không lấy cắp được token. Đổi lại, cookie tự đi kèm request nên phải chống CSRF: SameSite=Strict chặn site khác; trên request thay đổi dữ liệu, cookie chỉ được tính khi có header `X-Requested-With` (origin lạ không thêm được vì bị CORS preflight từ chối); CORS chỉ cho đúng origin của web app. Trước đây token nằm ở localStorage — dính XSS là lộ token. Nói được cả lý do đổi lẫn cái giá phải trả (CSRF) là ăn điểm.
9. *"Đăng xuất thì token còn hiệu lực không? Chống dò mật khẩu thế nào?"* → Mỗi token có `jti`; đăng xuất ghi jti vào Redis đến khi token hết hạn, cả hai service từ chối nó — chỉ phiên đó bị đăng xuất. Đăng nhập sai: 5 lần/15 phút cho cùng email+IP, 20 lần/15 phút cho một IP → 429 kèm `Retry-After`, **không khóa tài khoản** (để kẻ xấu không khóa được người khác). Redis sập thì cho qua và ghi log — đánh đổi có chủ đích giữa an toàn và tính sẵn sàng.

**Nhóm quy trình**
10. *"Em test dự án thế nào?"* → 3 tầng: unit (Mockito/Vitest), controller test (MockMvc), và smoke test e2e qua Docker; CI GitHub Actions chạy toàn bộ mỗi lần push.
11. *"Phần nào khó nhất?"* → Gợi ý kể: hiểu và cài đúng double-entry (đọc chuẩn kế toán), làm idempotency 2 tầng, hoặc debug tích hợp gRPC giữa 2 service.

---

## 7. Điểm yếu hiện tại & lộ trình (trả lời "nếu có thêm thời gian?")

Nói được điểm yếu của chính dự án mình = chín chắn kỹ thuật:

1. **Chưa có API Gateway** — browser gọi thẳng 2 service, phải mở CORS cả 2. Kế hoạch: NGINX/Kong làm 1 cửa vào, thêm rate limiting.
2. **Payment Service tin `userId` trong request body** — chuẩn hơn là lấy userId **từ JWT** để không thể chuyển hộ người khác. (Biết lỗ hổng này và nói ra trước = rất ăn điểm.)
3. **Audit Service (Go) chưa xây** — schema đã thiết kế (SAR/AML) nhưng service chưa dựng; kế hoạch dùng RabbitMQ phát event `transaction.completed` để audit bất đồng bộ.
4. **Chưa có distributed tracing/metrics** — kế hoạch: Micrometer + Prometheus + Grafana, OpenTelemetry.
5. **Refresh token chưa có** — hiện token 24h, lộ là dùng được đến hết hạn.

---

## 8. Bảng thuật ngữ nhanh (EN → VI)

| Thuật ngữ | Nghĩa |
|---|---|
| Ledger / Ledger entry | Sổ cái / bút toán |
| Double-entry bookkeeping | Kế toán kép (mỗi giao dịch ghi Nợ và Có cân nhau) |
| Debit / Credit | Nợ / Có (với tài khoản tài sản: Nợ tăng, Có giảm) |
| Chart of Accounts (GL) | Hệ thống danh mục tài khoản kế toán |
| Asset / Liability | Tài sản / Nợ phải trả |
| Idempotency | Tính lũy đẳng — gọi nhiều lần, kết quả như một |
| KYC / AML | Định danh khách hàng / Chống rửa tiền |
| SAR | Báo cáo giao dịch đáng ngờ |
| Immutable | Bất biến (chỉ thêm, không sửa/xóa) |
| Migration | Kịch bản thay đổi schema DB có phiên bản |
| Stateless | Không lưu trạng thái phiên ở server |
| Race condition | Xung đột khi 2 tiến trình cùng sửa 1 dữ liệu |
| Single source of truth | Nguồn sự thật duy nhất |
| Defense in depth | Phòng thủ nhiều lớp |
| Trade-off | Sự đánh đổi giữa các lựa chọn thiết kế |

---

## 9. Hai câu chuyện debug CÓ THẬT trong dự án (kể khi được hỏi "bug khó nhất em từng gặp?")

### Chuyện 1: gRPC chết với "Panic! This is a bug!" — xung đột phiên bản thư viện

**Triệu chứng**: mọi thứ chạy ổn ở local, nhưng khi chạy cả hệ trong Docker, Payment Service gọi gRPC sang User Service là sập với log rất đáng sợ:
```
io.grpc.internal.ManagedChannelImpl: Uncaught exception in the SynchronizationContext. Panic!
java.lang.NoSuchFieldError: Class io.grpc.util.MultiChildLoadBalancer does not have member field 'IS_PETIOLE_POLICY'
```

**Cách truy vết**: đọc kỹ stack trace và để ý **tên file jar trong từng dòng**: `grpc-util-1.63.0.jar` gọi xuống `grpc-api-1.60.0.jar`. Tức là trên classpath đang trộn **2 phiên bản gRPC khác nhau**: pom tự khai `grpc.version=1.60.0` cho grpc-stub/grpc-protobuf, nhưng thư viện `grpc-spring-boot-starter` kéo theo grpc-core/grpc-util **1.63.0**. Class version 1.63 truy cập một field chỉ tồn tại từ 1.62 → `NoSuchFieldError` lúc runtime (compile vẫn qua!).

**Fix**: đồng bộ toàn bộ về một phiên bản (`grpc.version=1.63.0` ở cả 2 service).

**Bài học để nói trong phỏng vấn**: (1) lỗi `NoSuchFieldError/NoSuchMethodError` gần như luôn là xung đột phiên bản dependency; (2) stack trace ghi cả tên jar — đó là manh mối vàng; (3) nên dùng BOM (Bill of Materials) để quản lý bộ thư viện cùng phiên bản.

### Chuyện 2: KYC upload trả 500 — jsonb vs varchar

**Triệu chứng**: `POST /api/kyc/upload-document` trả 500. Log Postgres:
```
ERROR: column "extracted_data" is of type jsonb but expression is of type character varying
```

**Nguyên nhân**: schema SQL khai báo cột `extracted_data JSONB`, nhưng entity Java khai `private String extractedData` — Hibernate gửi lên như `varchar`, Postgres từ chối vì khác kiểu. Đây là lỗi **chỉ lộ ra khi chạy với Postgres thật** — unit test với mock không bao giờ bắt được.

**Fix**: thêm `@JdbcTypeCode(SqlTypes.JSON)` lên field để Hibernate 6 biết serialize đúng kiểu JSON.

**Bài học**: unit test không thay được integration test với database thật; contract giữa entity và schema phải được kiểm chứng (đó là lý do nên chạy `ddl-auto: validate` + e2e smoke test).

---

## 10. Checklist trước ngày phỏng vấn

- [ ] Chạy `docker compose up -d --build`, tự đi hết demo flow (đăng ký → ví → nạp → chuyển) ít nhất 2 lần
- [ ] Mở `TransactionServiceImpl.java` đọc lại 8 bước transfer, tự kể to thành lời không nhìn code
- [ ] Tự vẽ lại sơ đồ kiến trúc trên giấy trong < 2 phút
- [ ] Giải thích bảng bút toán của 1 lần nạp + 1 lần chuyển (mục 3.6) không nhìn tài liệu
- [ ] Thuộc 2 câu chuyện debug ở mục 9 — kể được trong 90 giây mỗi chuyện
- [ ] Đọc lại mục 7 — chủ động nói điểm yếu trước khi bị hỏi
