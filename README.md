# 🏛️ Gia Phả Họ Phạm — PWA Interactive Family Tree

Ứng dụng Web App Gia Phả đa nền tảng (Progressive Web App) với giao diện Dashboard trực quan, Cây Phả Hệ tương tác, dual-theme, lịch giỗ âm lịch, và hỗ trợ offline.

## ✨ Tính năng chính

- **🎨 Dual Theme**: Chuyển đổi tức thì giữa giao diện Truyền thống (giấy điệp, gỗ sẫm) và Hiện đại (glassmorphism, dark mode)
- **🌳 Cây Phả Hệ Tương Tác**: Vẽ bằng D3.js, hỗ trợ zoom/pan, thu gọn/mở rộng nhánh, hiển thị vợ/chồng
- **📊 Dashboard KPI**: Thống kê tổng thành viên, số thế hệ, nam/nữ, còn sống/đã khuất
- **🔍 Tìm kiếm thông minh**: Tìm theo tên hoặc vai vế, tự động pan/zoom đến node
- **📅 Lịch Giỗ Âm Lịch**: Thuật toán Hồ Ngọc Đức chuyển đổi dương-âm lịch, đếm ngược ngày giỗ
- **👤 Chi tiết thành viên**: Drawer hiển thị đầy đủ thông tin, ngày giỗ Can Chi, link Google Maps
- **📤 Xuất file**: PNG, SVG, PDF chất lượng cao
- **📱 PWA**: Cài đặt như app native, xem offline

## 🚀 Cách chạy

### Cách 1: Live Server (Khuyến nghị)
```bash
# Cài VS Code extension "Live Server", click chuột phải vào index.html -> Open with Live Server
# Hoặc dùng npx:
npx serve .
```

### Cách 2: Mở trực tiếp
Mở file `index.html` trong trình duyệt Chrome/Edge (có fallback cho giao thức file://)

### Cách 3: Deploy
- **Vercel**: `npx vercel --prod`
- **GitHub Pages**: Push code lên GitHub, bật Pages từ Settings
- **Netlify**: Kéo thả thư mục vào Netlify Dashboard

## 📁 Cấu trúc thư mục

```
gia_pha_ho_PHAM/
├── index.html                  # Entry point chính
├── manifest.json               # PWA manifest
├── service-worker.js           # Service Worker (offline)
├── css/
│   ├── main.css                # CSS chung, layout, responsive
│   ├── theme-traditional.css   # Theme Hoàng gia / Giấy điệp
│   ├── theme-modern.css        # Theme Hiện đại / Glassmorphism
│   ├── tree.css                # CSS cây phả hệ
│   └── components.css          # CSS modal, drawer, dashboard
├── js/
│   ├── app.js                  # Điều phối chính
│   ├── data.js                 # Load & quản lý dữ liệu
│   ├── theme.js                # Chuyển đổi theme
│   ├── dashboard.js            # KPI stats + tìm kiếm
│   ├── tree.js                 # D3.js interactive tree
│   ├── member-detail.js        # Chi tiết thành viên
│   ├── memorial.js             # Lịch giỗ & đếm ngược
│   ├── lunar-calendar.js       # Thuật toán âm lịch Hồ Ngọc Đức
│   ├── export.js               # Xuất PNG/SVG/PDF
│   └── pwa.js                  # Service worker registration
├── data/
│   └── data.json               # Dữ liệu gia phả (21 thành viên, 4 thế hệ)
└── assets/
    └── icons/                  # PWA icons
```

## 📝 Sửa dữ liệu gia phả

Mở file `data/data.json` và chỉnh sửa:

- **people**: Thêm/sửa thông tin thành viên (id, tên, giới tính, năm sinh, ngày giỗ...)
- **relationships**: Thiết lập quan hệ (cha, mẹ, vợ/chồng, con cái)

### Thêm thành viên mới:
```json
{
  "id": "P022",
  "fullName": "Phạm Văn Abc",
  "gender": "male",
  "generation": 4,
  "birthYear": 2010,
  "isDeceased": false,
  "isFirstBorn": false,
  "role": "member",
  "childOrder": 2,
  "familyTitle": "Con thứ hai",
  "biography": "Mô tả ngắn...",
  "avatarUrl": null
}
```

## 🛠️ Công nghệ

- **Frontend**: Vanilla HTML/CSS/JavaScript (ES6+)
- **Visualization**: D3.js v7
- **Âm lịch**: Thuật toán Hồ Ngọc Đức
- **Export**: html2canvas + jsPDF
- **PWA**: Service Worker + Web App Manifest

## 📜 Giấy phép

Dự án phục vụ mục đích gia đình. Mã nguồn mở, tùy ý sử dụng và chỉnh sửa.
