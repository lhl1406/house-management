# Washing Machine & Dryer Manager - Quản Lý Máy Giặt & Sấy Nhà Trọ

Ứng dụng web thông minh để quản lý việc sử dụng máy giặt và máy sấy tại nhà trọ, được xây dựng bằng Vue.js và Tailwind CSS.

## Tính năng

### 🏠 Quản lý cơ bản
- 🏠 Chọn phòng trước khi bắt đầu
- ⏱️ Tính thời gian giặt và sấy riêng biệt
- 🔄 Workflow tự động: Giặt → Sấy
- 📊 Lưu lịch sử chi tiết với thời gian từng bước

### 💬 Thông báo Zalo
- 📱 Tích hợp gửi thông báo qua Zalo
- 🔔 Tự động gửi khi hoàn tất (nếu có số điện thoại)
- 📋 Copy tin nhắn vào clipboard
- ✨ Template tin nhắn đẹp với emoji

### 🎯 Trải nghiệm người dùng
- 📝 Ghi chú cho mỗi lần sử dụng
- 💾 Lưu thông tin người dùng (phòng, số điện thoại)
- 📊 Lịch sử chi tiết với phân tách thời gian giặt/sấy
- 📱 Responsive design, tương thích mobile
- 🎨 Giao diện đẹp với animations và Tailwind CSS

### 🔄 Đồng bộ Real-time
- ⚡ API Backend với Vercel Serverless Functions
- 🌐 Tất cả người dùng thấy cùng một trạng thái
- 📡 Tự động đồng bộ theo thời gian thực (polling)
- 💾 Backup dữ liệu local + server
- 🔌 Hoạt động offline khi không có internet

## Cài đặt

1. Clone hoặc tải project về máy
2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy ứng dụng:
```bash
npm run dev
```

4. Mở trình duyệt và truy cập `http://localhost:3000`

### Deploy với đồng bộ real-time

Ứng dụng đã sẵn sàng deploy lên Vercel với backend API:

1. Push code lên GitHub repository
2. Kết nối repository với Vercel
3. Deploy - Vercel sẽ tự động nhận diện cấu trúc fullstack
4. Tất cả người dùng sẽ thấy cùng trạng thái máy giặt

**Local Development**: Chạy `npm run dev` - ứng dụng hoạt động với localStorage (chế độ offline)

## Cách sử dụng

### 🚀 Workflow cơ bản
1. **Chọn phòng**: Chọn phòng đang sử dụng từ dropdown
2. **Nhập Zalo** (tùy chọn): Nhập số điện thoại để nhận thông báo
3. **Bắt đầu giặt**: Nhấn "Bắt Đầu Giặt" - bộ đếm thời gian sẽ chạy
4. **Hoàn tất giặt**: Nhấn "Xong Giặt" - hệ thống sẽ hỏi có muốn sấy không
5. **Bắt đầu sấy**: Nếu đồng ý, sấy sẽ tự động bắt đầu
6. **Hoàn tất sấy**: Nhấn "Xong Sấy" - tự động lưu lịch sử và gửi Zalo

### 💡 Tính năng nâng cao
- **Ghi chú**: Thêm ghi chú cho mỗi lần sử dụng
- **Thông báo Zalo**: Tự động gửi thông báo hoàn tất với thông tin chi tiết
- **Lịch sử chi tiết**: Xem thời gian giặt/sấy riêng biệt và tổng thời gian
- **Lưu thông tin**: Tự động nhớ phòng và số điện thoại cho lần sau

## Công nghệ sử dụng

### Frontend
- **Vue.js 3** - Framework JavaScript với Composition API
- **Vite** - Build tool nhanh chóng
- **Tailwind CSS** - CSS framework utility-first
- **Font Awesome** - Icon library
- **LocalStorage** - Backup dữ liệu local

### Backend
- **Vercel Serverless Functions** - API backend
- **Node.js** - Runtime environment
- **In-memory storage** - Lưu trữ đơn giản (reset khi restart)

### Deployment
- **Vercel** - Hosting cho cả frontend và backend
- **GitHub** - Source code repository

## Build cho production

```bash
npm run build
```

## Tùy chỉnh

Bạn có thể tùy chỉnh:
- Màu sắc trong `tailwind.config.js`
- Thời gian lưu trữ lịch sử (hiện tại: 50 records)
- Giao diện trong `src/App.vue`

## Hỗ trợ

Ứng dụng tương thích với tất cả các trình duyệt hiện đại và thiết bị di động.

## 🚀 Chạy Project

### Port Cố Định
- **API Server**: `http://localhost:3002` (cố định, không bao giờ thay đổi)
- **Frontend Dev**: `http://localhost:5173` (Vite default)

### Cách 1: Chạy cả FE và BE cùng lúc (Khuyến nghị)
```bash
# Cài đặt dependencies cho cả FE và BE
npm install
cd api && npm install && cd ..

# Chạy cả Frontend và API cùng lúc
npm run dev:full
```

### Cách 2: Chạy riêng lẻ
```bash
# Terminal 1 - Chạy API (cố định port 3002)
cd api
npm run dev

# Terminal 2 - Chạy Frontend  
npm run dev
```

## 📡 API Endpoints

Base URL: `http://localhost:3002`

- `GET /api/health` - Health check
- `GET/POST /api/machine-state` - Quản lý trạng thái máy giặt
- `GET/POST /api/history` - Lịch sử sử dụng

## 🔧 Cấu hình

- API Server sử dụng port **3002 cố định** (không thay đổi)
- Frontend luôn gọi API qua `http://localhost:3002`
- Database: Turso/SQLite

## 📦 Scripts

- `npm run dev` - Chạy frontend only
- `npm run api` - Chạy API only  
- `npm run dev:full` - Chạy cả FE và BE
- `npm run build` - Build production
- `npm run preview` - Preview production build 