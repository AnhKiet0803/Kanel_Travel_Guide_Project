# Kanel Travel Guide — Backend (hạn 09/11)

Phần này là backend trong repo chung. `KanelTravelGuide_FE` và `KanelTravelGuide_App` không nằm ở đây.

Hạn 09/11 gồm:

- `DbContext` cho 18 bảng
- Migration `InitialCreate`
- Dữ liệu mẫu
- Danh sách API và JSON mẫu: `docs/api-endpoints.md`
- File thiết kế CSDL: `docs/Thiet_Ke_CSDL_Karnel_Travel_Guide.xlsx`

Chưa có code API đăng nhập, liên hệ, điểm du lịch hay đặt dịch vụ.

## Chạy

Từ thư mục gốc của repo:

```powershell
dotnet run --project KanelTravelGuide_BE/KanelTravelGuide_BE/KanelTravelGuide_BE.csproj --launch-profile http
```

API chạy tại `http://localhost:5011`. Lần chạy đầu tạo database `KarnelTravelGuide` trên LocalDB và đổ dữ liệu mẫu.

| Vai trò | Username | Mật khẩu |
|---|---|---|
| Admin | admin | Admin@123 |
| User | minhan | User@123 |
