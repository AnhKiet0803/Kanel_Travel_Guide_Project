# Karnel Travel Guide — Tài liệu API (backend, hạn 09/11)

Tài liệu này thuộc repo backend. Frontend dùng JSON mẫu để làm giao diện, không nằm trong repo này.

Cột và ràng buộc lấy theo `docs/Thiet_Ke_CSDL_Karnel_Travel_Guide.xlsx`. Tên cột trong SQL Server là snake_case (`user_id`, `spot_name`). JSON bên dưới dùng camelCase.

Base URL khi chạy local: `http://localhost:5011`

OpenAPI: `http://localhost:5011/openapi/v1.json`

Múi giờ trong dữ liệu mẫu là UTC. Tiền dùng VND, kiểu số.

API nghiệp vụ (điểm du lịch, tour, đặt dịch vụ, tìm kiếm) do **Đoàn Anh Kiệt** viết. API tài khoản, liên hệ, phản hồi, thông báo, backup do **Vũ Hoàng Giáp** viết. Tài liệu này chốt JSON để frontend làm trước.

## Chạy database

Cần SQL Server LocalDB.

```powershell
dotnet run --project KanelTravelGuide_BE/KanelTravelGuide_BE/KanelTravelGuide_BE.csproj --launch-profile http
```

Lần chạy đầu tự tạo database `KarnelTravelGuide`, chạy migration và đổ dữ liệu mẫu.

Tài khoản mẫu:

| Vai trò | Username | Email | Mật khẩu |
|---|---|---|---|
| Admin | admin | admin@karnel.local | Admin@123 |
| User | minhan | user@karnel.local | User@123 |

CORS đang mở cho `http://localhost:5173`, `http://localhost:3000`, `http://localhost:4200`.

Sau khi đăng nhập, các API cần quyền gửi header:

```http
Authorization: Bearer {token}
```

`token` có ở hạn 13/11. Trước đó frontend có thể gắn giao diện với JSON mẫu bên dưới.

## Giá trị dùng chung

- `role`: `Admin`, `User`
- Liên hệ `isResponded`: `false` chưa xử lý, `true` đã phản hồi
- Phản hồi `isApproved`: `true` hiện trên web, `false` đang ẩn hoặc chờ duyệt
- Thông báo `notificationType`: `BOOKING`, `PROMOTION`, `SYSTEM`
- Dịch vụ `serviceType`: `Hotel`, `Resort`, `Restaurant`
- Xe `vehicleType`: ví dụ `Bus`, `Limousine`, `Ô tô du lịch`
- Lịch chạy `status`: `Đang chạy`, `Tạm ngưng`
- Đơn `bookingType`: `Tour`, `Transport`, `Combo`
- Đơn `paymentStatus`: `Chưa thanh toán`, `Đã thanh toán`
- Đơn `bookingStatus`: `Chờ duyệt`, `Đã xác nhận`, `Hoàn tất`, `Hủy`
- Dòng đơn gắn một trong ba khóa: `tourId`, `scheduleId`, `serviceItemId`
- Vùng miền `region`: `Miền Bắc`, `Miền Trung`, `Miền Nam`

Lỗi dùng chung:

```json
{
  "message": "Mô tả lỗi"
}
```

## Kiểm tra server

`GET /api/health`

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Tài khoản — Giáp (code hạn 13/11 và 15/11)

### Đăng ký

`POST /api/auth/register`

```json
{
  "username": "minhan2",
  "fullName": "Nguyễn Minh An",
  "email": "an.nguyen@example.com",
  "password": "User@123",
  "phone": "0901000002",
  "address": "Sơn Trà, Đà Nẵng"
}
```

Trả về `201`:

```json
{
  "userId": 3,
  "username": "minhan2",
  "fullName": "Nguyễn Minh An",
  "email": "an.nguyen@example.com",
  "phone": "0901000002",
  "role": "User",
  "isActive": true
}
```

### Đăng nhập

`POST /api/auth/login`

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

```json
{
  "token": "jwt-se-co-o-han-13-11",
  "user": {
    "userId": 1,
    "username": "admin",
    "fullName": "Quản trị Karnel",
    "email": "admin@karnel.local",
    "role": "Admin"
  }
}
```

### Đăng xuất

`POST /api/auth/logout` — cần đăng nhập. Trả về `204`.

### Đổi mật khẩu

`POST /api/auth/change-password`

```json
{
  "currentPassword": "User@123",
  "newPassword": "User@456"
}
```

### Quên mật khẩu và đặt lại

`POST /api/auth/forgot-password`

```json
{
  "email": "user@karnel.local"
}
```

`POST /api/auth/reset-password`

```json
{
  "email": "user@karnel.local",
  "token": "ma-trong-email",
  "newPassword": "User@456"
}
```

Hai API này đi cùng gửi email, hạn 17/11.

### Hồ sơ

`GET /api/account/profile`

```json
{
  "userId": 2,
  "username": "minhan",
  "fullName": "Nguyễn Minh An",
  "email": "user@karnel.local",
  "phone": "0901000002",
  "address": "Sơn Trà, Đà Nẵng",
  "role": "User",
  "deviceToken": null,
  "isActive": true
}
```

`PUT /api/account/profile`

```json
{
  "fullName": "Nguyễn Minh An",
  "phone": "0901000009",
  "address": "Hải Châu, Đà Nẵng",
  "deviceToken": null
}
```

### Quản lý tài khoản (Admin)

`GET /api/account/users`

```json
[
  {
    "userId": 2,
    "username": "minhan",
    "fullName": "Nguyễn Minh An",
    "email": "user@karnel.local",
    "phone": "0901000002",
    "role": "User",
    "isActive": true
  }
]
```

`PUT /api/account/users/{id}`

```json
{
  "role": "User",
  "isActive": false
}
```

## Liên hệ và phản hồi — Giáp (code hạn 11/11 và 15/11)

### Gửi liên hệ

`POST /api/contacts`

```json
{
  "fullName": "Trần Thu Hà",
  "email": "ha.tran@example.com",
  "phone": "0912000001",
  "subject": "Hỏi tour Hội An",
  "message": "Cho mình xin lịch tour cuối tuần."
}
```

```json
{
  "contactId": 1,
  "isResponded": false,
  "createdAt": "2026-11-08T08:00:00"
}
```

### Danh sách liên hệ (Admin)

`GET /api/contacts`

```json
[
  {
    "contactId": 1,
    "fullName": "Trần Thu Hà",
    "email": "ha.tran@example.com",
    "phone": "0912000001",
    "subject": "Hỏi tour Hội An",
    "message": "Cho mình xin lịch tour cuối tuần.",
    "isResponded": false,
    "createdAt": "2026-11-08T08:00:00"
  }
]
```

### Đánh dấu đã xử lý (Admin)

`PUT /api/contacts/{id}/responded` — đặt `isResponded = true`. Trả về `204`.

### Gửi phản hồi

`POST /api/feedbacks`

```json
{
  "fullName": "Nguyễn Minh An",
  "email": "user@karnel.local",
  "rating": 5,
  "title": "Cầu Vàng",
  "content": "Cầu Vàng rất đẹp."
}
```

```json
{
  "feedbackId": 3,
  "isApproved": false
}
```

### Phản hồi đã duyệt (trang công khai)

`GET /api/feedbacks`

```json
[
  {
    "feedbackId": 1,
    "fullName": "Nguyễn Minh An",
    "rating": 5,
    "title": "Cầu Vàng",
    "content": "Cầu Vàng rất đẹp.",
    "createdAt": "2026-11-06T08:00:00"
  }
]
```

Chỉ trả bản ghi `isApproved = true`.

### Quản lý phản hồi (Admin)

`GET /api/feedbacks/manage`

`PUT /api/feedbacks/{id}/approval`

```json
{
  "isApproved": true
}
```

## Thông báo, nhật ký, backup — Giáp (code hạn 17/11)

`GET /api/notifications`

```json
[
  {
    "notificationId": 1,
    "title": "Đơn đã được xác nhận",
    "message": "Đơn BK20261108-001 đã được xác nhận.",
    "notificationType": "BOOKING",
    "referenceId": "BK20261108-001",
    "isRead": false,
    "createdAt": "2026-11-08T08:00:00"
  }
]
```

`PUT /api/notifications/{id}/read` — trả về `204`.

`GET /api/system/logs` (Admin)

```json
[
  {
    "logId": 1,
    "userId": 1,
    "actionType": "INSERT",
    "actionDescription": "Khởi tạo dữ liệu mẫu.",
    "createdAt": "2026-11-08T08:00:00"
  }
]
```

`POST /api/system/backup` và `POST /api/system/restore` (Admin). Restore nhận file backup. Chi tiết file chốt khi làm CN24.

## Trang chủ, điểm du lịch, loại hình — Kiệt

`GET /api/home`

```json
{
  "spots": [
    {
      "spotId": 1,
      "spotName": "Bà Nà Hills",
      "locationName": "Đà Nẵng",
      "categoryName": "Sinh thái",
      "thumbnailUrl": "/images/ba-na.jpg",
      "isFeatured": true
    }
  ],
  "tours": [
    {
      "tourId": 1,
      "tourName": "Đà Nẵng 2 ngày 1 đêm",
      "duration": "2 ngày 1 đêm",
      "standardPrice": 2500000,
      "salePrice": 2250000,
      "isFeatured": true
    }
  ],
  "promotions": [
    {
      "promotionId": 1,
      "title": "Giảm tour Đà Nẵng",
      "promoCode": "DANANG10",
      "discountPercent": 10
    }
  ]
}
```

Trang chủ lấy `TouristSpots.isFeatured = true` và `TourPackages.isFeatured = true`.

`GET /api/locations`

```json
[
  { "locationId": 1, "locationName": "Đà Nẵng", "region": "Miền Trung" }
]
```

`GET /api/category-types`

```json
[
  { "categoryId": 1, "categoryName": "Du lịch biển" }
]
```

`GET /api/tourist-spots?locationId=2&categoryId=2&q=Hội`

```json
[
  {
    "spotId": 3,
    "spotName": "Phố cổ Hội An",
    "locationId": 2,
    "locationName": "Quảng Nam",
    "categoryId": 2,
    "categoryName": "Văn hóa - Di tích",
    "thumbnailUrl": "/images/hoi-an.jpg",
    "description": "Khu phố cổ bên sông Hoài.",
    "isFeatured": true
  }
]
```

`GET /api/tourist-spots/{id}`

```json
{
  "spotId": 1,
  "locationId": 1,
  "locationName": "Đà Nẵng",
  "categoryId": 3,
  "categoryName": "Sinh thái",
  "spotName": "Bà Nà Hills",
  "thumbnailUrl": "/images/ba-na.jpg",
  "description": "Khu du lịch trên núi với cầu Vàng.",
  "detailedContent": "Bà Nà Hills nằm ở Hòa Vang, Đà Nẵng.",
  "isFeatured": true,
  "createdAt": "2026-11-08T08:00:00"
}
```

`POST /api/tourist-spots`, `PUT /api/tourist-spots/{id}`, `DELETE /api/tourist-spots/{id}` (Admin). Body tạo/sửa giống JSON chi tiết, bỏ `id` và các trường `*Name`.

## Tour và ưu đãi — Kiệt

`GET /api/tours` và `GET /api/tours/{id}`

```json
{
  "tourId": 1,
  "spotId": 1,
  "spotName": "Bà Nà Hills",
  "promotionId": 1,
  "tourName": "Đà Nẵng 2 ngày 1 đêm",
  "duration": "2 ngày 1 đêm",
  "standardPrice": 2500000,
  "salePrice": 2250000,
  "itineraryDetail": "Ngày 1: Bà Nà Hills. Ngày 2: biển Mỹ Khê.",
  "isFeatured": true
}
```

`POST /api/tours`, `PUT /api/tours/{id}`, `DELETE /api/tours/{id}` (Admin).

`GET /api/promotions`

```json
[
  {
    "promotionId": 1,
    "promoCode": "DANANG10",
    "title": "Giảm tour Đà Nẵng",
    "discountPercent": 10,
    "discountAmount": null,
    "startDate": "2026-11-08T00:00:00",
    "endDate": "2027-01-08T00:00:00",
    "isActive": true
  }
]
```

`POST /api/promotions`, `PUT /api/promotions/{id}`, `DELETE /api/promotions/{id}` (Admin).

## Lưu trú và ẩm thực — Kiệt

`GET /api/services?type=Hotel`

`type` nhận `Hotel`, `Restaurant`, `Resort`. Bỏ trống thì trả cả ba.

```json
[
  {
    "providerId": 1,
    "providerName": "Karnel Beach Hotel",
    "serviceType": "Hotel",
    "locationId": 1,
    "locationName": "Đà Nẵng",
    "address": "Võ Nguyên Giáp, Đà Nẵng",
    "phone": "02361111001",
    "starRating": 4,
    "minPrice": 1500000,
    "maxPrice": 2200000,
    "imageUrl": "/images/hotel-beach.jpg"
  }
]
```

`GET /api/services/{id}` kèm phòng hoặc bàn:

```json
{
  "providerId": 1,
  "providerName": "Karnel Beach Hotel",
  "serviceType": "Hotel",
  "locationId": 1,
  "locationName": "Đà Nẵng",
  "address": "Võ Nguyên Giáp, Đà Nẵng",
  "description": "Khách sạn view biển.",
  "phone": "02361111001",
  "website": "https://karnel.local/beach-hotel",
  "starRating": 4,
  "minPrice": 1500000,
  "maxPrice": 2200000,
  "imageUrl": "/images/hotel-beach.jpg",
  "isActive": true,
  "items": [
    {
      "itemId": 1,
      "itemName": "Phòng Deluxe",
      "capacity": 2,
      "price": 1500000,
      "totalQuantity": 20,
      "isAvailable": true
    }
  ]
}
```

`POST /api/services`, `PUT /api/services/{id}`, `DELETE /api/services/{id}` (Admin).

`POST /api/services/{id}/items`, `PUT /api/services/{serviceId}/items/{itemId}`, `DELETE /api/services/{serviceId}/items/{itemId}` (Admin).

## Tìm kiếm — Kiệt

`GET /api/search?q=Hội An`

```json
{
  "spots": [],
  "tours": [],
  "services": []
}
```

Mỗi mảng dùng JSON rút gọn của danh sách tương ứng.

`GET /api/search/advanced?locationId=1&serviceType=Hotel&minPrice=0&maxPrice=3000000&starRating=4&sort=price_asc`

`sort` nhận `price_asc`, `price_desc`, `name_asc`.

## Vận chuyển — Kiệt

`GET /api/routes`

```json
[
  {
    "routeId": 1,
    "departureLocationId": 1,
    "departureLocationName": "Đà Nẵng",
    "destinationLocationId": 2,
    "destinationLocationName": "Quảng Nam",
    "distanceKm": 30,
    "estimatedDuration": "1 giờ"
  }
]
```

`GET /api/routes/{id}` kèm lịch chạy:

```json
{
  "routeId": 1,
  "departureLocationId": 1,
  "departureLocationName": "Đà Nẵng",
  "destinationLocationId": 2,
  "destinationLocationName": "Quảng Nam",
  "distanceKm": 30,
  "estimatedDuration": "1 giờ",
  "schedules": [
    {
      "scheduleId": 1,
      "vehicleId": 3,
      "vehicleName": "Ô tô du lịch 16 chỗ",
      "vehicleType": "Ô tô du lịch",
      "departureTime": "08:00:00",
      "ticketPrice": 150000,
      "status": "Đang chạy"
    }
  ]
}
```

`POST /api/routes`, `PUT /api/routes/{id}`, `DELETE /api/routes/{id}` (Admin).

`GET /api/vehicles`

`POST /api/vehicles`, `PUT /api/vehicles/{id}`, `DELETE /api/vehicles/{id}` (Admin).

```json
{
  "vehicleName": "Ô tô du lịch 16 chỗ",
  "vehicleType": "Ô tô du lịch",
  "totalSeats": 16
}
```

`GET /api/schedules?routeId=1`

`POST /api/schedules`, `PUT /api/schedules/{id}`, `DELETE /api/schedules/{id}` (Admin).

```json
{
  "routeId": 1,
  "vehicleId": 3,
  "departureTime": "08:00:00",
  "ticketPrice": 150000,
  "status": "Đang chạy"
}
```

## Đặt dịch vụ — Kiệt

`POST /api/bookings`

```json
{
  "customerName": "Nguyễn Minh An",
  "customerPhone": "0901000002",
  "customerEmail": "user@karnel.local",
  "bookingType": "Tour",
  "startDate": "2026-11-16",
  "totalPassengers": 2,
  "notes": "Đi 2 người.",
  "details": [
    {
      "tourId": 2,
      "quantity": 2
    }
  ]
}
```

```json
{
  "bookingId": 1,
  "bookingCode": "BK20261108-001",
  "bookingType": "Tour",
  "bookingStatus": "Chờ duyệt",
  "paymentStatus": "Chưa thanh toán",
  "totalAmount": 1513000,
  "bookingDate": "2026-11-08T08:00:00"
}
```

`GET /api/bookings` — đơn của user đang đăng nhập.

`GET /api/bookings/{id}`

```json
{
  "bookingId": 1,
  "bookingCode": "BK20261108-001",
  "userId": 2,
  "customerName": "Nguyễn Minh An",
  "customerPhone": "0901000002",
  "customerEmail": "user@karnel.local",
  "bookingType": "Tour",
  "bookingDate": "2026-11-08T08:00:00",
  "startDate": "2026-11-16",
  "totalPassengers": 2,
  "totalAmount": 1513000,
  "paymentStatus": "Đã thanh toán",
  "bookingStatus": "Đã xác nhận",
  "notes": "Đi 2 người.",
  "details": [
    {
      "detailId": 1,
      "tourId": 2,
      "scheduleId": null,
      "serviceItemId": null,
      "quantity": 2,
      "unitPrice": 756500
    }
  ]
}
```

`PUT /api/bookings/{id}/cancel`

```json
{
  "reason": "Đổi ngày đi"
}
```

`GET /api/bookings/manage?bookingStatus=Chờ duyệt` (Admin).

`PUT /api/bookings/{id}/status` (Admin)

```json
{
  "bookingStatus": "Đã xác nhận",
  "paymentStatus": "Đã thanh toán"
}
```

Khi tạo hoặc hủy đơn, API gọi sang phần thông báo và nhật ký của Giáp.
