# Hướng dẫn Setup Turso DB

## 🔧 Cài đặt Turso DB

### 1. Tạo tài khoản Turso
1. Truy cập [turso.tech](https://turso.tech)
2. Đăng ký tài khoản miễn phí
3. Cài đặt Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

### 2. Tạo database
```bash
# Đăng nhập Turso CLI
turso auth login

# Tạo database mới
turso db create washing-machine-db

# Lấy database URL
turso db show washing-machine-db --url

# Tạo auth token
turso db tokens create washing-machine-db
```

### 3. Cấu hình môi trường

#### Local Development
1. Copy file `.env.example` thành `.env` trong thư mục `api/`:
   ```bash
   cp api/.env.example api/.env
   ```

2. Cập nhật file `api/.env` với thông tin Turso:
   ```env
   TURSO_DATABASE_URL=libsql://your-database-url.turso.io
   TURSO_AUTH_TOKEN=your_auth_token_here
   ```

#### Production (Vercel)
1. Vào Vercel dashboard
2. Chọn project
3. Settings → Environment Variables
4. Thêm:
   - `TURSO_DATABASE_URL`: URL database của bạn
   - `TURSO_AUTH_TOKEN`: Auth token của bạn

### 4. Database Schema

Database sẽ tự động tạo tables khi chạy lần đầu:

**Table: machine_state**
- `id`: INTEGER PRIMARY KEY
- `is_washing`: BOOLEAN
- `is_drying`: BOOLEAN  
- `wash_time`: INTEGER
- `dry_time`: INTEGER
- `selected_room`: TEXT
- `current_note`: TEXT
- `timestamp`: INTEGER
- `last_updated`: TEXT
- `created_at`: DATETIME
- `updated_at`: DATETIME

**Table: washing_history**
- `id`: TEXT PRIMARY KEY
- `room`: TEXT
- `wash_time`: INTEGER
- `dry_time`: INTEGER
- `total_time`: INTEGER
- `note`: TEXT
- `date`: TEXT
- `timestamp`: INTEGER
- `created_at`: DATETIME

### 5. Kiểm tra kết nối

Chạy ứng dụng và kiểm tra logs:
```bash
cd api
npm start
```

### 6. Migration từ Memory Storage

✅ **Đã hoàn thành:**
- Cài đặt `@libsql/client` và `dotenv`
- Tạo `api/db.js` với Turso DB client
- Cập nhật `api/data.js` để sử dụng Turso DB
- Cập nhật API endpoints để handle async operations
- Đổi tên `useFirebaseSync.js` → `useApiSync.js`
- Cập nhật import trong `App.vue`

### 7. Features mới với Turso DB

✨ **Lợi ích:**
- **Persistent storage**: Dữ liệu không bị mất khi restart server
- **High performance**: SQLite-based với edge locations
- **Backup tự động**: Turso tự động backup data
- **Scalable**: Có thể handle nhiều concurrent users
- **Free tier**: 500MB storage, 1M row reads/month

### 8. Troubleshooting

**Lỗi kết nối database:**
- Kiểm tra `TURSO_DATABASE_URL` và `TURSO_AUTH_TOKEN`
- Đảm bảo database tồn tại trong Turso dashboard
- Kiểm tra network/firewall settings

**Fallback to local storage:**
- Nếu Turso DB không khả dụng, app sẽ tự động fallback về local SQLite
- Set `TURSO_DATABASE_URL=file:local.db` để test local

**Production deployment:**
- Đảm bảo environment variables được set trong Vercel
- Check deployment logs để debug

### 9. Backup & Restore

```bash
# Backup database
turso db backup washing-machine-db

# List backups  
turso db backup list washing-machine-db

# Restore from backup
turso db restore washing-machine-db backup-id
``` 