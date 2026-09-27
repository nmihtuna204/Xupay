# XuPay redesign v2: audit và đề xuất

Nhánh `redesign/v2`. Tài liệu này là **bước 1**: audit toàn bộ màn hình, rồi đề xuất design system và luồng mới. Chưa có dòng code nào được viết cho redesign; mình chờ bạn duyệt.

## Phạm vi

- **Ràng buộc đã chốt**
  - **Màu:** giữ nguyên bộ token màu hiện tại trong `frontend/xupay-frontend/src/app/globals.css` (dark glass, xem [spec.md](spec.md) §2). Mọi thứ khác đều có thể đổi.
  - **Nền tảng:** chỉ web, responsive. Kiểm tra ở 1440px và 390px bằng Playwright. Không làm app mobile riêng.
  - **Hình ảnh:** không có mascot và không tạo ảnh bằng AI. Đồ họa làm bằng SVG/CSS, vòng kính 3D hiện có giữ lại cho landing.
  - **Tham khảo:** ảnh Fampal trước đó, chỉ lấy cảm giác (mood) và độ chỉn chu, không chép bố cục.
- **Nguyên tắc**
  - Tiết chế kiểu Apple: mỗi phần tử phải có lý do tồn tại, không thêm gì chỉ để "trông ngầu".
  - UX thân thiện: vùng bấm lớn (≥ 44px), tiến trình rõ ràng, lỗi dễ sửa.
- **Bằng chứng:** 49 ảnh chụp ở dữ liệu thật (tài khoản demo và admin), desktop và mobile, gồm cả dialog và trạng thái lỗi. Không có lỗi JavaScript nào.

---

## 1. Audit

### 1.1 Vấn đề xuyên suốt

| # | Vấn đề | Bằng chứng |
|---|---|---|
| S1 | **App cho khách hàng lại mang dáng một công cụ quản trị.** Bảng có tiêu đề cột viết hoa dùng ở cả Home, Activity và Send. Khách hàng không cần "TYPE / STATUS / AMOUNT", họ cần biết *ai, bao nhiêu, vào hay ra*. | dashboard, transactions |
| S2 | **Kiến trúc thông tin sai đối tượng.** Sidebar có 14 mục trong 5 nhóm. Bốn trang dữ liệu *toàn nền tảng* (Fraud, Compliance/SAR, Analytics, Audit Log) hiện cho **mọi khách hàng**, kèm tên và số tiền của người khác. | sidebar, fraud, compliance |
| S3 | **Không thể tìm người nhận.** Chuyển tiền và thêm danh bạ đều bắt dán **UUID** (placeholder `11111111-1111-…`). Backend chưa có API tìm người dùng theo email hay số điện thoại. | transfer, contact_add_dialog |
| S4 | **Chuyển tiền không có bước xác nhận.** Bấm "Send money" là tiền đi ngay: không có màn hình xem lại người nhận, số tiền và phí. | transfer |
| S5 | **Ô nhập tiền yếu.** Ô nhỏ, mặc định là "0" (phải xóa trước khi gõ), không có dấu phân cách hàng nghìn khi đang gõ. Số dư và hạn mức còn lại không hiện trước khi gửi (dù API đã có), nên người dùng chỉ biết mình vượt hạn mức khi đã bị từ chối. | deposit, withdraw, transfer |
| S6 | **Tiền vào và ra trông giống hệt nhau.** Không có dấu +/−, không có màu, không có người đối ứng. Loại giao dịch hiện nguyên tên enum ("Topup"). | transactions, dashboard |
| S7 | **Chữ ồn ào.** Nhãn viết hoa giãn chữ ở khắp nơi (`kicker`, `field-label`, tiêu đề bảng). Số tiền lúc dùng font mono (bảng), lúc dùng sans (thẻ số dư). Quá nhiều cỡ chữ. | mọi trang app |
| S8 | **Bố cục bị trôi.** Các form (Deposit, Withdraw, Send, Transaction detail, Wallets) là một card hẹp ở góc trái trong vùng 1400px, hơn nửa màn hình để trống. | deposit, tx_detail, wallets |
| S9 | **Vùng bấm quá nhỏ.** Button mặc định cao 36px, `sm` 28px, icon button 28–32px. Các nút gửi và xóa trong danh bạ chỉ có icon, không có nhãn và không có `aria-label`. | contacts |
| S10 | **Lỗi xuất hiện sai chỗ và sai lúc.** Lỗi đăng nhập hiện thành toast ở góc trên phải, xa form. Lỗi của trường chỉ hiện sau khi bấm submit, nên form đăng ký biến thành một mảng đỏ cùng lúc. | login_wrong, register_errors |
| S11 | **Mobile chưa được thiết kế riêng, chỉ co lại cho vừa.** Điều hướng là menu hamburger 14 mục, nên hành động chính cách 2 lần chạm. Không có tab bar. | mobile_nav_m |
| S12 | **Không có tiến trình ở luồng nào.** KYC, đăng ký và chuyển tiền đều là một form dài, không cho biết đang ở bước nào, sau đó là gì. | kyc, register |

### 1.2 Từng màn hình

**Công khai**

| Màn hình | Vấn đề |
|---|---|
| **Landing** `/` | Hình ảnh ổn sau bản redesign tối. Còn lại: (a) 5 section lặp cùng một khuôn "tiêu đề + thẻ kính"; (b) thẻ "Tiered limits" xuất hiện trước khi trang giải thích sản phẩm làm gì; (c) hàng social proof với avatar chữ cái là đồ độn, trái nguyên tắc "không thêm cho đẹp"; (d) câu "Every cent" cho một ví VND (đồng không có đơn vị lẻ); (e) không có ảnh nào của chính app; (f) footer không có link. |
| **Register** `/register` | 6 trường trên một màn hình, có cả xác nhận mật khẩu; bấm gửi là cả form đỏ. Không có nút hiện/ẩn mật khẩu, yêu cầu mật khẩu chỉ lộ ra khi đã sai. Việc tạo ví diễn ra ngầm: nếu lỗi, người dùng rơi vào trang "No wallet found". Vòng 3D phía sau tranh chỗ với form. |
| **Login** `/login` | Lỗi hiện thành toast ở góc xa form. Không có hiện/ẩn mật khẩu. Không có "Quên mật khẩu" (backend chưa hỗ trợ). |
| **404** | Luôn dẫn về dashboard, kể cả khi chưa đăng nhập. |

**Khung app**

| Màn hình | Vấn đề |
|---|---|
| **Sidebar** | 14 mục (S2). "Wallets" trùng với Home, vì mỗi người chỉ có một ví. Send, Deposit và Withdraw vừa là mục menu vừa là quick action. |
| **Topbar** | Breadcrumb "XuPay / Dashboard" lặp lại đúng tiêu đề trang ngay bên dưới. |
| **Mobile nav** | Ngăn kéo hamburger (S11). |

**Tiền**

| Màn hình | Vấn đề |
|---|---|
| **Home** `/dashboard` | Thẻ số dư chỉ có một con số, không có thu/chi trong tháng hay hạn mức còn lại. Ba quick action là ba hàng rộng trông như dòng danh sách, không giống nút. Hoạt động gần đây là bảng (S1, S6). Tài khoản admin (không có ví) thấy "No wallet found". |
| **Wallets** `/wallets` | Lặp lại thẻ số dư. Hiện nguyên UUID ví. Hành động duy nhất là "Freeze", một pill nhỏ. |
| **Freeze dialog** | Nút "Confirm" đỏ, nhỏ. Không nói cách mở băng lại. |
| **Activity** `/transactions` | Bảng phân trang Previous/Next, không nhóm theo ngày, không có bộ lọc vào/ra hay tìm kiếm. Mô tả trống hiện "-". |
| **Chi tiết giao dịch** | UUID chiếm chỗ nổi bật. Không có người đối ứng, không có nút quay lại, không có cảm giác một biên nhận. API có trả về các bút toán (ledger entries) nhưng UI không dùng. |
| **Send** `/payments/transfer` | S3, S4, S5. Chip danh bạ nhỏ, chỉ có chữ cái viết tắt. |
| **Add money / Withdraw** | Một form nhỏ trơ trọi (S8). Withdraw không hiện số dư khả dụng. Nút Withdraw kiểu outline, Deposit kiểu filled: không nhất quán. |
| **Contacts** | Thêm danh bạ bằng UUID. Dòng "0 transactions" không bao giờ tăng, vì backend không cập nhật số này. Xóa ngay lập tức, không xác nhận, không hoàn tác. |

**Tin cậy**

| Màn hình | Vấn đề |
|---|---|
| **KYC** `/kyc` | Mọi trường hiện cùng lúc. Hạng hiện tại chỉ là một dòng chữ phụ, không có thang bậc hay mô tả bậc kế tiếp mở khóa gì. Ô chọn file là input gốc chưa style ("Choose File No file chosen"). Tài liệu bị từ chối **không hiện lý do**. |
| **Settings** | Form hồ sơ và bảng hạn mức đặt cạnh nhau, hạng hiện dạng thô "TIER_0". Không có nút đăng xuất ở đây (chỉ có trong menu avatar). |
| **KYC Review** (admin) | Người dùng hiện bằng UUID rút gọn, không có tên hay email. "Open file" mở một data URL mà Chrome chặn khi mở từ link, nên admin không xem được giấy tờ. Không có ô xem trước. |

**Showcase** (dữ liệu mock)

| Màn hình | Vấn đề |
|---|---|
| **Fraud, Compliance, Analytics, Audit** | Tự thân các dashboard làm tốt, nhưng đặt sai chỗ (S2). Hàng 4 ô KPI lặp ở mọi trang. Thanh màu xanh/vàng/đỏ quá chói trên nền tối. Trên mobile các trang này dài lê thê. |

---

## 2. Design system đề xuất

### 2.1 Màu (giữ nguyên, chỉ thêm quy tắc dùng)

Token giữ nguyên, bổ sung các quy tắc:

- **Indigo** (`--primary`, gradient CTA) chỉ dành cho **một** hành động chính mỗi màn hình và cho focus ring.
- **Màu trạng thái** (`--success`, `--warning`, `--error`) chỉ dùng cho trạng thái và cho chiều tiền: vào = `--success`, ra = `--foreground`.
- Kính (`glass`) chỉ ở landing và auth. Dữ liệu luôn nằm trên `--surface` đục.

### 2.2 Chữ

Chỉ dùng Geist Sans; Geist Mono chỉ còn cho mã và ID. Số tiền luôn dùng `tabular-nums`. Chữ viết thường kiểu câu (sentence case) ở mọi nơi; bỏ nhãn viết hoa giãn chữ.

| Vai trò | Cỡ / dòng | Độ đậm | Dùng cho |
|---|---|---|---|
| Display | 40 / 44 | 300 | Số dư, số tiền đang nhập |
| Title | 28 / 34 | 500 | Tiêu đề trang |
| Heading | 20 / 26 | 500 | Tiêu đề section, sheet |
| Body | 16 / 24 | 400 | Nội dung, input |
| Callout | 14 / 20 | 400–500 | Dòng phụ, nhãn nút nhỏ |
| Caption | 12 / 16 | 400 | Thời gian, chú thích |

Sáu cỡ, không hơn. Hero của landing giữ thang riêng như trong spec.md.

### 2.3 Khoảng cách, bố cục, bo góc

- **Lưới 4pt:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- **Cột nội dung:** 560px cho luồng (Send, Add money, Withdraw, KYC, form hồ sơ); 880px cho danh sách và Home. Căn giữa, không trôi về góc trái.
- **Lề trang:** 16px trên mobile, 32px trên desktop.
- **Bo góc:** 12 (control) · 16 (card, list) · 24 (sheet, thẻ số dư) · full (pill, avatar).
- **Độ nổi:** ba lớp: nền, `surface`, `surface-2`. Trong app không dùng shadow, trừ sheet và dialog.
- **Chuyển động:** 200ms ease-out cho trạng thái, 300ms cho sheet. Tôn trọng `prefers-reduced-motion`.

### 2.4 Component

| Component | Mô tả |
|---|---|
| **Button** | Kiểu primary / secondary / plain / destructive. Cỡ `lg` 52px (nút chính của luồng), `md` 44px. Không có cỡ nhỏ hơn 44px trên thiết bị cảm ứng. |
| **AmountInput** | Ô nhập tiền lớn, căn giữa, dùng cỡ Display. Tự thêm dấu chấm hàng nghìn khi gõ (`1.250.000 ₫`), không có "0" mặc định. Bên dưới là số dư và hạn mức còn lại; kèm chip số tiền nhanh. |
| **Field** | Nhãn ở trên, chữ gợi ý bên dưới. Lỗi hiện ngay dưới trường khi rời trường (blur), không đợi submit. Có hiện/ẩn mật khẩu. |
| **ListRow / ListSection** | Thay cho bảng ở mọi màn hình khách hàng: avatar hoặc icon, tiêu đề, dòng phụ, số tiền hoặc chevron ở cuối. Các dòng gom vào nhóm có tiêu đề kiểu iOS Settings. |
| **Sheet** | Bottom sheet trên mobile, dialog trên desktop. Dùng cho biên nhận, xác nhận, thêm danh bạ. |
| **Steps** | Chỉ báo tiến trình gọn ("Bước 2/3") cho Send, Add money, Withdraw, KYC và đăng ký. |
| **Banner** | Lỗi cấp form nằm ngay trên nút gửi, thay cho toast ở góc. Toast chỉ dùng cho xác nhận thành công, đặt ở cạnh dưới. |
| **TabBar** | Mobile: 4 tab ở đáy (Home · Send · Activity · Profile). Desktop dùng sidebar gọn với đúng 4 mục đó. |
| **Receipt** | Biên nhận: số tiền lớn, người đối ứng, trạng thái, thời gian, mã tham chiếu (nút copy). Bút toán sổ cái để trong phần "Chi tiết" thu gọn. |
| **EmptyState / Skeleton / ErrorState** | Giữ như hiện tại, chỉnh theo thang chữ mới. |

---

## 3. Kiến trúc thông tin và luồng mới

### 3.1 Điều hướng

**Khách hàng** (4 mục):

- **Home:** số dư, hành động nhanh (Gửi, Nạp, Rút), hoạt động gần đây.
- **Send:** luồng chuyển tiền.
- **Activity:** toàn bộ lịch sử giao dịch.
- **Profile:** thông tin cá nhân, xác minh, hạn mức, danh bạ, bảo mật (đóng băng ví, đăng xuất).

Các trang Wallets, Deposit, Withdraw, Contacts, KYC, Settings không còn là mục menu riêng. Chúng vẫn tồn tại, nhưng mở từ Home hoặc Profile.

**Nhân viên** (chỉ ADMIN):
- Một khu **Console** riêng, `/admin/...`, gồm KYC review, Fraud, Compliance, Analytics và Audit.
- Có điều hướng riêng. Khách hàng không còn thấy dữ liệu toàn nền tảng.

### 3.2 Các luồng

1. **Onboarding:**
   - Landing dẫn tới đăng ký 2 bước: (1) tên + email; (2) mật khẩu, yêu cầu hiển thị trực tiếp và đổi dấu tích khi đạt. Số điện thoại chuyển sang Profile.
   - Sau đó là **màn hình chào**: báo ví đã sẵn sàng, gợi ý "Nạp tiền" và "Xác minh để nâng hạn mức" (nói rõ hạn mức hiện tại), rồi vào Home.
   - Nếu tạo ví thất bại, màn hình này cho phép thử lại, thay vì để người dùng rơi vào "No wallet found".
2. **Đăng nhập:** lỗi hiện ngay trong form, có hiện/ẩn mật khẩu, và giữ lại email đã nhập.
3. **Chuyển tiền (3 bước):**
   - (1) *Gửi cho ai:* danh bạ gần đây, cộng ô tìm theo email hoặc số điện thoại.
   - (2) *Bao nhiêu:* AmountInput, số dư và hạn mức ngày còn lại hiện trực tiếp, kèm ghi chú.
   - (3) *Xem lại:* người nhận, số tiền, phí 0 ₫, "đến ngay", rồi nút **Xác nhận chuyển**.
   - Sau đó là biên nhận với "Xong" và "Gửi tiếp".
4. **Nạp và rút:**
   - Cùng khuôn với chuyển tiền: số tiền, xem lại, biên nhận.
   - Rút tiền luôn hiện số dư khả dụng. Vượt hạn mức thì báo *trước* khi gửi.
5. **Hoạt động:**
   - Danh sách gom theo ngày, có dấu +/− và màu.
   - Chip lọc: Tất cả / Tiền vào / Tiền ra; tìm theo ghi chú; cuộn để tải thêm.
   - Chạm vào một dòng để mở biên nhận.
6. **Xác minh:**
   - Thang bậc: bậc hiện tại, và bậc kế tiếp mở khóa gì (hạn mức VND thật).
   - Tải lên có hướng dẫn: chọn loại giấy tờ dạng thẻ, tải file kèm xem trước và mẹo chụp, rồi xem lại và gửi.
   - Sau khi gửi có dòng thời gian trạng thái. Nếu bị từ chối thì hiện lý do và nút "Tải lại".
7. **Profile:** các nhóm danh sách: Cá nhân · Xác minh · Hạn mức (thanh đã dùng/còn lại) · Danh bạ · Bảo mật (đóng băng ví, có giải thích cách mở lại) · Đăng xuất.
8. **Danh bạ:**
   - Thêm bằng email hoặc số điện thoại.
   - Xóa có hoàn tác (undo) trong vài giây.
   - Bỏ dòng "0 transactions" cho tới khi backend thật sự đếm.
9. **KYC review (admin):**
   - Hàng đợi hiện tên và email người dùng, xem trước giấy tờ ở panel bên.
   - Duyệt kèm chọn bậc; từ chối kèm lý do soạn sẵn hoặc tự nhập.

### 3.3 Thứ tự làm (mỗi màn hình một commit, chụp và soát lại trước khi sang màn tiếp)

1. **Nền móng:** token chữ, khoảng cách, bo góc; các primitive Button, Field, AmountInput, ListRow, Sheet, Steps, Banner.
2. **Khung app:** sidebar 4 mục, tab bar trên mobile, tách Console cho admin.
3. **Home**
4. **Chuyển tiền:** 3 bước và biên nhận.
5. **Nạp và rút**
6. **Hoạt động** và biên nhận.
7. **Xác minh**
8. **Profile:** gộp Settings, Contacts, Wallets và đóng băng ví.
9. **Đăng ký, đăng nhập, màn hình chào**
10. **Landing:** chỉnh theo thang chữ mới, bỏ phần độn, thêm ảnh thật của app (dựng bằng chính component, không dùng AI).
11. **Console:** KYC review cùng 4 trang showcase.
12. **404, error, loading.**

---

## 4. Câu hỏi mở (cần bạn trả lời trước khi code)

1. **Đối tượng người dùng.** Mình giả định chính là người dùng cá nhân tại Việt Nam, dùng để chuyển, nạp, rút VND; phụ là nhân viên XuPay (duyệt KYC, rủi ro). Có đúng không?
2. **Ngôn ngữ giao diện.** Hiện toàn bộ là tiếng Anh. Giữ tiếng Anh, chuyển sang tiếng Việt, hay làm song ngữ?
3. **Tìm người nhận theo email hoặc số điện thoại** cần thêm một API nhỏ ở user-service (`GET /api/users/lookup?q=`, trả về tên và ID; có giới hạn tần suất gọi). Cho phép làm không? Nếu không, luồng chuyển tiền chỉ còn danh bạ và dán ID.
4. **Chuyển 4 trang showcase** (Fraud, Compliance, Analytics, Audit) vào Console chỉ dành cho admin? Mình khuyến nghị có.
5. **Xem giấy tờ KYC.** Tệp đang lưu thẳng dưới dạng data URL trong database, và admin không mở được từ link. Chấp nhận phương án hiện ảnh xem trước ngay trong trang (không đụng backend), hay muốn chuyển sang lưu file thật?
6. **Quên mật khẩu / đổi mật khẩu:** backend chưa có. Để ngoài phạm vi redesign lần này?
