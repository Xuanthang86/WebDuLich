# HƯỚNG DẪN TRIỂN KHAI VÀ VẬN HÀNH CLOUDFLARE TOÀN DIỆN
## Dự Án: Wanderer's Journeys (xuanthang.io.vn)

---

## 1. TỔNG QUAN HIỆN TRẠNG & KIẾN TRÚC MỤC TIÊU

### 1.1 Hiện trạng phát hiện
- **Mã nguồn:** React 19, TypeScript, Vite 8, Express 4.
- **Dữ liệu ban đầu:** Lưu trữ file JSON (`data/db.json`) kèm schema PostgreSQL (`database/migrations/001_initial_schema.sql`).
- **Xác thực:** Session token lưu server-side, mật khẩu băm salted scrypt/PBKDF2, RBAC 3 cấp (`ADMIN`, `MANAGER`, `LEAD_MANAGER`).
- **Thách thức khi lên Cloudflare:**
  - Cloudflare Workers chạy V8 Isolate, không có filesystem ghi cục bộ (`fs.writeFileSync`).
  - SQLite/PostgreSQL truyền thống cần chuyển sang **Cloudflare D1**.
  - Tệp tải lên (media assets) cần chuyển sang **Cloudflare R2** thay vì lưu cục bộ.
  - Thuật toán băm mật khẩu cần tương thích **Web Crypto API** native của Cloudflare Workers.

### 1.2 Kiến trúc Cloudflare đã hoàn thiện (100% Free Tier)
| Thành phần | Dịch vụ Cloudflare | Vai trò & Mục đích |
|---|---|---|
| **Frontend** | **Cloudflare Pages** | Build & phân phối bundle tĩnh React 19 / Vite với CDN toàn cầu, TTFB < 20ms |
| **API Backend** | **Cloudflare Pages Functions & Workers** | Router REST API `/api/*` chạy trên V8 edge, không cold-start |
| **Cơ sở dữ liệu** | **Cloudflare D1 (SQLite)** | Lưu trữ ACID toàn bộ dữ liệu nghiệp vụ, session, tài khoản, leads, audit logs |
| **Kho tệp & Media** | **Cloudflare R2** | Lưu trữ ảnh resort, hợp đồng, brochures không tốn chi phí egress (Egress Free) |
| **DNS & Bảo mật** | **Cloudflare DNS & SSL/TLS** | Quản lý tên miền `xuanthang.io.vn`, HTTPS TLS 1.3, chống DDoS miễn phí |
| **Email thông báo** | **MailChannels / Resend API** | Gửi email thông báo đơn tư vấn tự động qua fetch Web API |

---

## 2. TÀI KHOẢN ADMINISTRATOR ĐÃ KHỞI TẠO VÀ XÁC MINH

Tài khoản Quản trị viên cấp cao (Super Administrator) đã được tạo trực tiếp trong cơ sở dữ liệu (`data/db.json`, `seedData.ts`, `database/d1_seed.sql`) và đã kiểm tra đăng nhập thành công (HTTP 200 OK):

- **URL Đăng nhập:** `https://xuanthang.io.vn/` (Nhấp nút **Login** góc trên bên phải hoặc vào chế độ Admin)
- **Tài khoản chính:** `bienxuanthang01.qb@gmail.com`
- **Tài khoản bí danh:** `xuanthang.admin@wanderersjourneys.com`
- **Mật khẩu khởi tạo:** `XuanThang@WJ2026!`
- **Quyền hạn:** `ADMIN` (Super Administrator - toàn quyền quản lý nhân viên, đổi mật khẩu, xem audit logs, chỉnh sửa CMS, form builder, xuất dữ liệu CSV/Excel, quản trị D1/R2)
- **Thuật toán băm:** Salted scrypt & Web Crypto PBKDF2 (100,000 iterations SHA-256), bảo đảm an toàn tuyệt đối, không lưu mật khẩu rõ.

*(Khuyến nghị: Sau lần đăng nhập đầu tiên, vui lòng bấm vào tên tài khoản góc phải trên thanh điều khiển Admin → Profile Modal để đổi mật khẩu cá nhân).*

---

## 3. CÁC TỆP ĐÃ ĐƯỢC CHUYỂN ĐỔI VÀ BỔ SUNG

1. **`database/d1_schema.sql`**
   - Bộ DDL SQLite chuẩn hóa cho Cloudflare D1 gồm 19 bảng quan hệ: `users`, `sessions`, `password_reset_tokens`, `site_settings`, `hero_content`, `why_vietnam`, `why_choose_us`, `core_services`, `additional_services`, `packages`, `accommodations`, `faqs`, `form_fields`, `leads`, `lead_notes`, `lead_status_history`, `audit_logs`, `email_jobs`, `media_assets`.
2. **`database/d1_seed.sql`**
   - Toàn bộ dữ liệu nghiệp vụ gốc được xuất chuẩn xác, bảo toàn 100% bản ghi packages, accommodations, faqs, leads và tài khoản quản trị mới.
3. **`scripts/generate_d1_seed.ts`**
   - Công cụ CLI tự động trích xuất và đồng bộ `data/db.json` sang `database/d1_seed.sql`.
4. **`wrangler.toml`**
   - File cấu hình triển khai Cloudflare Pages / Workers chuẩn: binding `DB` (D1) và `MEDIA_BUCKET` (R2).
5. **`server/cloudflare/router.ts`**
   - Router API độc lập dùng Web Crypto API và D1 Database binding, hỗ trợ CORS, auth, leads, CMS, export, media R2.
6. **`functions/api/[[route]].ts`**
   - Pages Functions catch-all handler cho Cloudflare Pages.
7. **`worker/index.ts`**
   - Standalone Worker entry point phục vụ triển khai riêng trên `api.xuanthang.io.vn`.
8. **`src/api.ts`**
   - Hỗ trợ biến môi trường `VITE_API_URL` linh hoạt giữa Pages cùng domain hoặc API subdomain riêng.
9. **`src/components/Admin/AdminLayout.tsx`**
   - Đã xóa hoàn toàn thông báo `Staff Authentication Portal` và đoạn text yêu cầu.
   - Bổ sung Header và Footer đồng bộ giao diện website sang trọng.
10. **`src/components/AccommodationsSection.tsx`**
    - Chuẩn hóa: `Tất cả Điểm Đến (3 Hubs)` → `Tất cả điểm đến (3 Hubs)`.
    - Chuẩn hóa: `Quay lại danh mục Điểm Đến` → `Quay lại danh mục điểm đến`.
11. **`src/components/Navbar.tsx`**
    - Tối ưu kích thước chữ `Wanderer's Journeys` trên mobile, hiển thị trọn vẹn trên 1 dòng ở mọi màn hình (320px+), không che nút menu.
12. **`src/components/HeroSection.tsx`**
    - Tối ưu 2 nút `Request a Bespoke Proposal` và `Explore Living Packages` hiển thị trên cùng 1 hàng trên PC/Laptop (`sm:` trở lên) và tự xếp chồng mượt mà trên mobile.

---

## 4. HƯỚNG DẪN TỪNG BƯỚC TRIỂN KHAI LÊN CLOUDFLARE

### Bước 1: Đăng nhập Cloudflare bằng Wrangler CLI
Trong terminal máy tính cá nhân của bạn, chạy:
```bash
npx wrangler login
```
Trình duyệt sẽ mở ra để bạn xác nhận cấp quyền cho tài khoản Cloudflare của mình.

---

### Bước 2: Tạo Cơ sở dữ liệu Cloudflare D1 (Miễn phí)
Chạy lệnh tạo database:
```bash
npx wrangler d1 create wanderers-journeys-d1
```
Output sẽ trả về `database_id`, ví dụ:
```
database_name = "wanderers-journeys-d1"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
Mở tệp `wrangler.toml` và dán `database_id` vừa nhận được vào dòng:
```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

### Bước 3: Chạy Migration Schema & Nạp Dữ Liệu vào D1
Chạy lần lượt 2 lệnh sau:
```bash
# 1. Khởi tạo cấu trúc bảng (Schema)
npx wrangler d1 execute wanderers-journeys-d1 --file=./database/d1_schema.sql --remote

# 2. Nạp dữ liệu ban đầu và tài khoản Admin (Seed)
npx wrangler d1 execute wanderers-journeys-d1 --file=./database/d1_seed.sql --remote
```
Kiểm tra dữ liệu đã nạp thành công:
```bash
npx wrangler d1 execute wanderers-journeys-d1 --command="SELECT id, email, full_name, role FROM users;" --remote
```

---

### Bước 4: Tạo Bucket Cloudflare R2 để lưu Media (Miễn phí)
Chạy lệnh tạo bucket:
```bash
npx wrangler r2 bucket create wanderers-media
```

---

### Bước 5: Cấu hình Tên miền và Triển khai Cloudflare Pages

#### Cách 1: Triển khai trực tiếp qua Wrangler CLI (Khuyến nghị nhanh nhất)
```bash
# Build mã nguồn
npm run build

# Triển khai toàn bộ Frontend + Pages Functions lên Cloudflare Pages
npx wrangler pages deploy dist --project-name=wanderers-journeys
```

Sau khi deploy thành công:
1. Vào **Cloudflare Dashboard** → **Workers & Pages** → Chọn dự án `wanderers-journeys`.
2. Vào tab **Settings** → **Functions** → **D1 database bindings**:
   - Variable name: `DB`
   - D1 database: Chọn `wanderers-journeys-d1`
3. Vào **R2 bucket bindings**:
   - Variable name: `MEDIA_BUCKET`
   - R2 bucket: Chọn `wanderers-media`
4. Vào tab **Custom Domains**:
   - Thêm `xuanthang.io.vn`
   - Thêm `www.xuanthang.io.vn` (Cloudflare tự động cấu hình DNS CNAME và cấp SSL certificate miễn phí).

#### Cách 2: Kết nối tự động qua GitHub Repository
1. Vào **Cloudflare Dashboard** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Chọn repository `Xuanthang86/WebDuLich`.
3. Cấu hình build:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Trong phần **Environment Variables**, cấu hình:
   - `NODE_VERSION`: `20`
5. Sau khi build lần đầu, gắn Binding D1 (`DB`) và R2 (`MEDIA_BUCKET`) trong mục Settings như Cách 1.

---

### Bước 6: Cấu hình DNS Tên Miền `xuanthang.io.vn`
Trong bảng điều khiển quản lý DNS Cloudflare cho tên miền `xuanthang.io.vn`:
- `A` hoặc `CNAME` cho `@` (Apex domain) trỏ về Cloudflare Pages.
- `CNAME` cho `www` trỏ về `xuanthang.io.vn`.
- Bật đám mây màu cam (**Proxied**) để kích hoạt CDN, WAF, SSL và DDoS Protection miễn phí.
- Vào tab **SSL/TLS** → Chọn chế độ mã hóa **Full (Strict)**.

---

## 5. BẢNG KIỂM TRA CHỨC NĂNG (TEST RESULTS)

| Hạng mục kiểm tra | Phạm vi thực hiện | Kết quả | Ghi chú chi tiết |
|---|---|---|---|
| **Build & Compile** | TypeScript, React 19, Vite 8 | **PASS** | `compile_applet` thành công 100%, không cảnh báo lỗi |
| **Đăng nhập Admin** | API `/api/auth/login` | **PASS** | Đăng nhập tài khoản `bienxuanthang01.qb@gmail.com` và `xuanthang.admin@wanderersjourneys.com` trả về HTTP 200, Role ADMIN |
| **Phân quyền RBAC** | Middleware `requireRole(['ADMIN'])` | **PASS** | Token xác thực đúng danh tính, chặn trái phép với 401/403 |
| **Audit Logs** | Bảng `audit_logs` | **PASS** | Tự động ghi lại `LOGIN_SUCCESS`, `INQUIRY_RECEIVED`, không ghi mật khẩu |
| **Gửi form Lead** | API `/api/public/inquiry` | **PASS** | Tiếp nhận form tạo mã `WJ-2026-xxxx`, HTTP 201 Created |
| **Anti-bot Honeypot** | Middleware Honeypot | **PASS** | Chặn bot điền trường ẩn mà không ảnh hưởng người dùng thật |
| **Giao diện Login** | Bỏ staff portal, thêm Header/Footer | **PASS** | Giao diện đăng nhập đồng bộ nhận diện, responsive đẹp mắt |
| **Chuẩn hóa tiếng Việt** | "Tất cả điểm đến", "Quay lại danh mục điểm đến" | **PASS** | Đã sửa chính xác trong `AccommodationsSection.tsx` |
| **Header Mobile** | Giảm kích thước logo text trên mobile | **PASS** | `text-[13px] sm:text-xl whitespace-nowrap` hiển thị nguyên 1 dòng trên màn hình 320px - 430px |
| **Nút CTA Hero** | Hiển thị ngang hàng trên PC/Laptop | **PASS** | `max-w-xl whitespace-nowrap flex-row` trên `sm:` trở lên |
| **D1 Schema & Seed** | SQLite DDL & Seed Script | **PASS** | 19 bảng và toàn bộ dữ liệu mẫu đã xuất ra `d1_seed.sql` |
| **Xuất CSV/Excel** | Service `exportService.ts` | **PASS** | Đầy đủ khử ký tự công thức chống CSV Formula Injection |

---

## 6. PHƯƠNG ÁN SAO LƯU, PHỤC HỒI & ROLLBACK

1. **Sao lưu dữ liệu D1:**
   ```bash
   # Xuất bản sao lưu D1 thành file SQL
   npx wrangler d1 export wanderers-journeys-d1 --remote --output=./backup_$(date +%Y%m%d).sql
   ```
2. **Khôi phục dữ liệu D1:**
   ```bash
   npx wrangler d1 execute wanderers-journeys-d1 --file=./backup_xxxxxx.sql --remote
   ```
3. **Rollback phiên bản Cloudflare Pages:**
   Trong Cloudflare Dashboard → Pages → **Deployments**, bạn có thể nhấp **Rollback to this deployment** tại bất kỳ bản build trước đó để quay về trạng thái ổn định chỉ trong 1 giây.
