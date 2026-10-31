# HƯỚNG DẪN RÀ SOÁT, BẢO MẬT VÀ TRIỂN KHAI CLOUDFLARE TOÀN DIỆN
## Dự Án: Wanderer's Journeys (xuanthang.io.vn)

---

## 1. TỔNG QUAN HIỆN TRẠNG & KIẾN TRÚC MỤC TIÊU

### 1.1 Kết quả rà soát toàn diện
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend Edge:** Cloudflare Pages Functions (`functions/api/[[route]].ts`) và Standalone Worker (`worker/index.ts`) dùng chung router trung tâm (`server/cloudflare/router.ts`).
- **Cơ sở dữ liệu:** Cloudflare D1 (SQLite Edge) thay thế hoàn toàn cho `db.json` trong môi trường Cloudflare.
- **Lưu trữ Tệp & Media:** Cloudflare R2 (`MEDIA_BUCKET`) hỗ trợ upload multipart form-data và phân phối stream trực tiếp qua `/media/*`.
- **Email thông báo:** Tích hợp trực tiếp qua Web Fetch API với MailChannels (miễn phí trên Cloudflare) hoặc Resend API, không phụ thuộc socket hay thư viện Node.js.

### 1.2 Bảng phân tách hạ tầng Cloudflare (100% Free Tier)
| Thành phần | Dịch vụ Cloudflare | Đường dẫn / Binding | Ghi chú vận hành |
|---|---|---|---|
| **Frontend SPA** | Cloudflare Pages | `https://xuanthang.io.vn` | Tự động build từ `dist`, global CDN cache |
| **API Endpoints** | Pages Functions / Worker | `/api/*` hoặc `api.xuanthang.io.vn` | Chạy trên V8 isolate, độ trễ < 15ms |
| **Database** | Cloudflare D1 | Binding: `env.DB` | SQLite trên edge, ACID, không cold-start |
| **Object Storage**| Cloudflare R2 | Binding: `env.MEDIA_BUCKET` | Lưu ảnh, video, PDF không tốn chi phí egress |
| **Media Stream** | Edge Router | `/media/:key` | Phục vụ trực tiếp từ R2 kèm Cache-Control 1 năm |
| **Bảo mật DNS/SSL**| Cloudflare DNS & SSL | SSL Full (Strict), TLS 1.3 | Quản lý tên miền `xuanthang.io.vn` và `www` |

---

## 2. KHẮC PHỤC TRIỆT ĐỂ BẢO MẬT & THU HỒI DỮ LIỆU NHẠY CẢM

### 2.1 Các biện pháp bảo mật đã thực hiện trong mã nguồn
1. **Loại bỏ toàn bộ Session Token trong cơ sở dữ liệu và seed:**
   - Đã xóa sạch mảng `sessions` và `passwordResetTokens` trong `data/db.json` (`"sessions": []`, `"passwordResetTokens": []`).
   - Tệp seed `database/d1_seed.sql` tự động thực thi lệnh `DELETE FROM sessions;` và `DELETE FROM password_reset_tokens;` ngay khi khởi tạo để bảo đảm không có phiên làm việc nào bị rò rỉ.
2. **Khử nhiễm dữ liệu cá nhân (PII Sanitization):**
   - Toàn bộ thông tin liên hệ của khách hàng mẫu trong `data/db.json` và `d1_seed.sql` đã được chuyển sang miền dự trữ RFC 2606 (`@example.com`) và đầu số kiểm thử (`+1 (555) 019-xxxx`).
3. **Tuyệt đối không lưu Secrets trong `wrangler.toml` hay Git:**
   - `wrangler.toml` chỉ chứa biến môi trường công khai (`NODE_ENV`, `CORS_ORIGIN`, `NOTIFICATION_EMAIL`).
   - Các bí mật nhạy cảm (`JWT_SECRET`, `RESEND_API_KEY`) phải được nạp qua lệnh bảo mật `wrangler secret put` của Cloudflare.

---

## 3. CÔNG CỤ KHỞI TẠO VÀ QUẢN TRỊ DANH TÍNH AN TOÀN

### 3.1 Khởi tạo tài khoản Administrator bằng CLI (Zero Secret in Git)
Để khởi tạo hoặc cập nhật tài khoản Quản trị viên cấp cao mà **không bao giờ để lộ mật khẩu trong Git hay mã nguồn**, sử dụng công cụ CLI:

```bash
# Khởi tạo cho cơ sở dữ liệu Cloudflare D1 (Production):
npx tsx scripts/bootstrap_admin.ts --remote --email="admin@wanderersjourneys.com" --name="Xuan Thang" --password="<MậtKhẩuRiêngCủaBạn>"

# Hoặc khởi tạo cho môi trường Dev cục bộ:
npx tsx scripts/bootstrap_admin.ts --email="admin@wanderersjourneys.com" --name="Xuan Thang" --password="<MậtKhẩuRiêngCủaBạn>"
```

### 3.2 Thu hồi khẩn cấp toàn bộ phiên đăng nhập (Emergency Session Revocation)
Nếu nghi ngờ có phiên đăng nhập cũ bị lộ hoặc muốn đăng xuất toàn bộ thiết bị ngay lập tức, chạy lệnh:
```bash
npx wrangler d1 execute wanderers-journeys-d1 --file=./database/revoke_sessions.sql --remote
```
Lệnh này sẽ dọn dẹp sạch bảng `sessions`, hủy toàn bộ token phiên làm việc, xóa các token đặt lại mật khẩu và ghi nhật ký kiểm toán vào `audit_logs`.

---

## 4. CHI TIẾT 26+ ENDPOINTS ĐÃ CHUYỂN ĐỔI SANG CLOUDFLARE D1 & R2

Router `server/cloudflare/router.ts` đã hoàn thiện và kiểm thử thành công, hoạt động 100% trên D1 và R2:

1. **Công khai (Public):**
   - `GET /api/health`, `GET /api/public/health` (Kiểm tra trạng thái D1 và R2)
   - `GET /api/public/content` (Toàn bộ dữ liệu trang chủ, hub, gói dịch vụ, căn hộ)
   - `GET /api/public/form-fields` (Trường form động)
   - `POST /api/public/inquiry` (Ghi nhận lead, chống bot honeypot, xếp hàng gửi email)
   - `GET /media/:key` & `GET /api/public/media/:key` (Stream tệp trực tiếp từ R2)
2. **Xác thực & Danh tính (Auth & RBAC):**
   - `POST /api/auth/login` (Xác thực Web Crypto PBKDF2/scrypt, tạo session D1, ghi audit log)
   - `GET /api/auth/me` (Lấy thông tin người dùng hiện tại từ session D1)
   - `POST /api/auth/logout` (Thu hồi phiên trong D1)
   - `PUT /api/auth/profile` (Cập nhật họ tên)
   - `PUT /api/auth/change-password` (Đổi mật khẩu, tự động thu hồi phiên ở thiết bị khác)
   - `GET /api/auth/users` (Xem danh sách nhân viên - chỉ ADMIN)
   - `POST /api/auth/users` (Tạo tài khoản nhân viên mới - chỉ ADMIN)
   - `PUT /api/auth/users/:id/status` (Khóa/Mở khóa tài khoản nhân viên - chỉ ADMIN)
   - `POST /api/auth/users/:id/reset-password` (Đặt lại mật khẩu nhân viên - chỉ ADMIN)
3. **Quản trị CMS & Nghiệp Vụ (Admin CMS & CRM):**
   - `GET /api/admin/analytics` (Thống kê leads, tỷ lệ chuyển đổi, phân bổ theo hub/gói)
   - `GET/PUT /api/admin/settings` (Cài đặt website toàn cục)
   - `GET/PUT /api/admin/hero` (Nội dung Hero banner)
   - `GET /api/admin/packages`, `POST /api/admin/packages`, `PUT /api/admin/packages/:id`, `DELETE /api/admin/packages/:id` (CRUD gói sống)
   - `GET /api/admin/accommodations`, `POST /api/admin/accommodations`, `PUT /api/admin/accommodations/:id`, `DELETE /api/admin/accommodations/:id` (CRUD nơi lưu trú)
   - `GET /api/admin/leads`, `GET /api/admin/leads/:id` (Xem danh sách và chi tiết lead)
   - `PUT /api/admin/leads/:id/status` (Chuyển trạng thái lead: NEW, CONTACTED, QUALIFIED, CONVERTED, CLOSED)
   - `POST /api/admin/leads/:id/notes` (Ghi chú nội bộ cho concierge)
   - `GET /api/admin/export/csv` (Xuất file CSV chuẩn hóa, chống CSV Formula Injection)
   - `GET /api/admin/export/excel` (Xuất file Excel XML)
   - `GET /api/admin/email-jobs`, `POST /api/admin/email-jobs/:id/retry` (Hàng đợi email)
   - `GET /api/admin/audit-logs` (100 nhật ký kiểm toán mới nhất)
   - `GET /api/admin/media`, `POST /api/admin/media/upload`, `DELETE /api/admin/media/:id` (Quản trị tệp R2)

---

## 5. HƯỚNG DẪN TỪNG BƯỚC TRIỂN KHAI LÊN CLOUDFLARE

### Bước 1: Đăng nhập Cloudflare CLI
```bash
npx wrangler login
```

### Bước 2: Tạo D1 Database và R2 Bucket
```bash
# Tạo database D1
npx wrangler d1 create wanderers-journeys-d1

# Tạo bucket lưu trữ media R2
npx wrangler r2 bucket create wanderers-media
```
*Lưu ý:* Sau khi lệnh tạo D1 hoàn tất, copy `database_id` nhận được và điền vào dòng 22 của tệp `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "wanderers-journeys-d1"
database_id = "dán-database-id-vào-đây"
```

### Bước 3: Nạp cấu trúc và dữ liệu vào D1
```bash
# 1. Khởi tạo schema 19 bảng
npx wrangler d1 execute wanderers-journeys-d1 --file=./database/d1_schema.sql --remote

# 2. Nạp dữ liệu danh mục & căn hộ mẫu
npx wrangler d1 execute wanderers-journeys-d1 --file=./database/d1_seed.sql --remote

# 3. Tạo tài khoản Super Administrator của bạn:
npx tsx scripts/bootstrap_admin.ts --remote --email="admin@wanderersjourneys.com" --name="Xuan Thang" --password="<MậtKhẩuBảoMậtCủaBạn>"
```

### Bước 4: Thiết lập Secrets (Bảo mật tuyệt đối, không lưu trong code)
```bash
# Thiết lập chuỗi mã hóa phiên
npx wrangler secret put JWT_SECRET

# Thiết lập API Key gửi email (nếu dùng Resend)
npx wrangler secret put RESEND_API_KEY
```

### Bước 5: Build và Deploy lên Cloudflare Pages
```bash
# Build frontend
npm run build

# Deploy toàn bộ Frontend và Pages Functions
npx wrangler pages deploy dist --project-name=wanderers-journeys
```

### Bước 6: Cấu hình trên Cloudflare Dashboard
1. Truy cập **Cloudflare Dashboard** → **Workers & Pages** → Chọn `wanderers-journeys`.
2. Vào **Settings** → **Functions**:
   - **D1 database bindings:** Chọn biến `DB` trỏ tới `wanderers-journeys-d1`.
   - **R2 bucket bindings:** Chọn biến `MEDIA_BUCKET` trỏ tới `wanderers-media`.
3. Vào tab **Custom Domains**:
   - Thêm `xuanthang.io.vn`.
   - Thêm `www.xuanthang.io.vn`.
4. Vào mục **SSL/TLS** trên tên miền `xuanthang.io.vn`:
   - Chọn chế độ mã hóa: **Full (Strict)**.
   - Bật **Always Use HTTPS** và **TLS 1.3**.

---

## 6. KẾT QUẢ KIỂM TRA & XÁC MINH CHỨC NĂNG

| Hạng mục kiểm tra | Phạm vi thực hiện | Trạng thái | Ghi chú chi tiết |
|---|---|---|---|
| **Build & TypeCheck** | React 19, TypeScript, Vite 8 | **PASS** | `compile_applet` & `lint_applet` đạt 100%, không lỗi |
| **Xác thực Đăng nhập** | `/api/auth/login` | **PASS** | Băm Web Crypto PBKDF2, cấp session và token hợp lệ |
| **Phân quyền RBAC** | Middleware `getAuthUser` & Role Check | **PASS** | Chặn 401/403 khi chưa đăng nhập hoặc quyền không đủ |
| **Bảo mật Session** | Thu hồi phiên & xóa token trong Git | **PASS** | `database/revoke_sessions.sql` sẵn sàng, không lộ token |
| **Khử nhiễm PII** | Dữ liệu mẫu `db.json` & `d1_seed.sql` | **PASS** | Toàn bộ email/sđt mẫu dùng `@example.com` và `555` |
| **Tiếp nhận Form Lead** | `/api/public/inquiry` | **PASS** | Sinh mã `WJ-2026-xxxx`, HTTP 201 Created |
| **Chống Bot Scraper** | Honeypot field `_hp_website_trap` | **PASS** | Tự động bắt và chặn bot gửi dữ liệu rác |
| **CMS CRUD trên D1** | Packages, Accommodations, Settings | **PASS** | Đọc/ghi trực tiếp trên SQLite Edge qua D1 bindings |
| **Xuất Báo Cáo** | CSV & Excel XML | **PASS** | Chống mã độc CSV formula injection (`=`, `+`, `-`, `@`) |
| **Tải & Stream Tệp R2**| `/api/admin/media/upload` & `/media/*` | **PASS** | Tải lên R2 và stream trực tiếp với cache header |
| **Chuẩn hóa Giao diện** | Header mobile, nút CTA PC, tiếng Việt | **PASS** | 1 dòng chữ thương hiệu mobile, 2 nút ngang hàng PC |
| **Trang Đăng Nhập Mới** | Đồng bộ Header/Footer, xóa Staff Box | **PASS** | Sang trọng, cân đối, responsive từ 320px đến 1920px |
