using KanelTravelGuide_BE.Models;
using ServiceProvider = KanelTravelGuide_BE.Models.ServiceProvider;

namespace KanelTravelGuide_BE.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (db.Users.Any())
        {
            return;
        }

        var now = new DateTime(2026, 11, 8, 8, 0, 0);

        var admin = new User
        {
            Username = "admin",
            PasswordHash = PasswordHasher.Hash("Admin@123"),
            FullName = "Quản trị Karnel",
            Email = "admin@karnel.local",
            Phone = "0901000001",
            Address = "Hải Châu, Đà Nẵng",
            Role = "Admin",
            IsActive = true,
            CreatedAt = now
        };
        var user = new User
        {
            Username = "minhan",
            PasswordHash = PasswordHasher.Hash("User@123"),
            FullName = "Nguyễn Minh An",
            Email = "user@karnel.local",
            Phone = "0901000002",
            Address = "Sơn Trà, Đà Nẵng",
            Role = "User",
            IsActive = true,
            CreatedAt = now
        };
        db.Users.AddRange(admin, user);

        var locations = new[]
        {
            new Location { LocationName = "Đà Nẵng", Region = "Miền Trung", Description = "Thành phố biển miền Trung." },
            new Location { LocationName = "Quảng Nam", Region = "Miền Trung", Description = "Phố cổ Hội An và vùng phụ cận." },
            new Location { LocationName = "Thừa Thiên Huế", Region = "Miền Trung", Description = "Cố đô và di tích triều Nguyễn." },
            new Location { LocationName = "Khánh Hòa", Region = "Miền Trung", Description = "Vịnh Nha Trang và các đảo." }
        };
        db.Locations.AddRange(locations);

        var categories = new[]
        {
            new CategoryType { CategoryName = "Du lịch biển" },
            new CategoryType { CategoryName = "Văn hóa - Di tích" },
            new CategoryType { CategoryName = "Sinh thái" },
            new CategoryType { CategoryName = "Ẩm thực" }
        };
        db.CategoryTypes.AddRange(categories);
        db.SaveChanges();

        var spots = new[]
        {
            new TouristSpot { LocationId = locations[0].LocationId, CategoryId = categories[2].CategoryId, SpotName = "Bà Nà Hills", ThumbnailUrl = "/images/ba-na.jpg", Description = "Khu du lịch trên núi với cầu Vàng.", DetailedContent = "Bà Nà Hills nằm ở Hòa Vang, Đà Nẵng. Điểm nhấn là Cầu Vàng và khu vui chơi trên đỉnh núi.", IsFeatured = true, CreatedAt = now },
            new TouristSpot { LocationId = locations[0].LocationId, CategoryId = categories[0].CategoryId, SpotName = "Biển Mỹ Khê", ThumbnailUrl = "/images/my-khe.jpg", Description = "Bãi biển trung tâm Đà Nẵng.", DetailedContent = "Mỹ Khê kéo dài dọc đường Võ Nguyên Giáp, thích hợp tắm biển và đi bộ.", IsFeatured = true, CreatedAt = now },
            new TouristSpot { LocationId = locations[1].LocationId, CategoryId = categories[1].CategoryId, SpotName = "Phố cổ Hội An", ThumbnailUrl = "/images/hoi-an.jpg", Description = "Khu phố cổ bên sông Hoài.", DetailedContent = "Phố cổ Hội An giữ kiến trúc thương cảng, đèn lồng và hội quán.", IsFeatured = true, CreatedAt = now },
            new TouristSpot { LocationId = locations[2].LocationId, CategoryId = categories[1].CategoryId, SpotName = "Đại Nội Huế", ThumbnailUrl = "/images/dai-noi.jpg", Description = "Hoàng thành triều Nguyễn.", DetailedContent = "Đại Nội là quần thể kiến trúc cung đình ở bờ bắc sông Hương.", IsFeatured = false, CreatedAt = now },
            new TouristSpot { LocationId = locations[3].LocationId, CategoryId = categories[0].CategoryId, SpotName = "Vịnh Nha Trang", ThumbnailUrl = "/images/nha-trang.jpg", Description = "Tham quan vịnh và các đảo.", DetailedContent = "Vịnh Nha Trang gồm các đảo Hòn Mun, Hòn Tằm và hoạt động tắm biển.", IsFeatured = false, CreatedAt = now },
            new TouristSpot { LocationId = locations[1].LocationId, CategoryId = categories[3].CategoryId, SpotName = "Chợ Hội An", ThumbnailUrl = "/images/cho-hoi-an.jpg", Description = "Đặc sản và ẩm thực địa phương.", DetailedContent = "Chợ Hội An bán cao lầu, mì Quảng và đặc sản làm quà.", IsFeatured = false, CreatedAt = now }
        };
        db.TouristSpots.AddRange(spots);

        var providers = new[]
        {
            new ServiceProvider { LocationId = locations[0].LocationId, ServiceType = "Hotel", ProviderName = "Karnel Beach Hotel", StarRating = 4, Address = "Võ Nguyên Giáp, Đà Nẵng", Phone = "02361111001", Website = "https://karnel.local/beach-hotel", MinPrice = 1500000, MaxPrice = 2200000, Description = "Khách sạn view biển.", ImageUrl = "/images/hotel-beach.jpg", IsActive = true },
            new ServiceProvider { LocationId = locations[1].LocationId, ServiceType = "Hotel", ProviderName = "Hội An Riverside Hotel", StarRating = 3, Address = "Nhiêu Lộc, Hội An", Phone = "02351111002", MinPrice = 900000, MaxPrice = 900000, Description = "Khách sạn sát phố cổ.", ImageUrl = "/images/hotel-hoian.jpg", IsActive = true },
            new ServiceProvider { LocationId = locations[0].LocationId, ServiceType = "Restaurant", ProviderName = "Nhà hàng Mỳ Quảng Bà", Address = "Trần Quốc Toản, Đà Nẵng", Phone = "09031111003", MinPrice = 50000, MaxPrice = 120000, Description = "Đặc sản mì Quảng.", ImageUrl = "/images/restaurant.jpg", IsActive = true },
            new ServiceProvider { LocationId = locations[3].LocationId, ServiceType = "Resort", ProviderName = "Karnel Bay Resort", StarRating = 5, Address = "Trần Phú, Nha Trang", Phone = "02581111004", Website = "https://karnel.local/bay-resort", MinPrice = 3500000, MaxPrice = 3500000, Description = "Resort sát vịnh.", ImageUrl = "/images/resort.jpg", IsActive = true }
        };
        db.ServiceProviders.AddRange(providers);

        var vehicles = new[]
        {
            new Vehicle { VehicleName = "Limousine VIP 9 chỗ", VehicleType = "Limousine", TotalSeats = 9 },
            new Vehicle { VehicleName = "Xe giường nằm 40 chỗ", VehicleType = "Bus", TotalSeats = 40 },
            new Vehicle { VehicleName = "Ô tô du lịch 16 chỗ", VehicleType = "Ô tô du lịch", TotalSeats = 16 }
        };
        db.Vehicles.AddRange(vehicles);
        db.SaveChanges();

        var routes = new[]
        {
            new TransportRoute { DepartureLocationId = locations[0].LocationId, DestinationLocationId = locations[1].LocationId, DistanceKm = 30, EstimatedDuration = "1 giờ" },
            new TransportRoute { DepartureLocationId = locations[0].LocationId, DestinationLocationId = locations[2].LocationId, DistanceKm = 100, EstimatedDuration = "3 giờ" },
            new TransportRoute { DepartureLocationId = locations[0].LocationId, DestinationLocationId = locations[3].LocationId, DistanceKm = 530, EstimatedDuration = "12 giờ" }
        };
        db.TransportRoutes.AddRange(routes);
        db.SaveChanges();

        db.Schedules.AddRange(
            new Schedule { RouteId = routes[0].RouteId, VehicleId = vehicles[2].VehicleId, DepartureTime = new TimeOnly(8, 0), TicketPrice = 150000, Status = "Đang chạy" },
            new Schedule { RouteId = routes[1].RouteId, VehicleId = vehicles[2].VehicleId, DepartureTime = new TimeOnly(7, 30), TicketPrice = 250000, Status = "Đang chạy" },
            new Schedule { RouteId = routes[2].RouteId, VehicleId = vehicles[1].VehicleId, DepartureTime = new TimeOnly(18, 0), TicketPrice = 450000, Status = "Đang chạy" },
            new Schedule { RouteId = routes[1].RouteId, VehicleId = vehicles[0].VehicleId, DepartureTime = new TimeOnly(9, 0), TicketPrice = 350000, Status = "Tạm ngưng" }
        );

        var promotions = new[]
        {
            new Promotion { PromoCode = "DANANG10", Title = "Giảm tour Đà Nẵng", DiscountPercent = 10, StartDate = now.Date, EndDate = now.Date.AddMonths(2), IsActive = true },
            new Promotion { PromoCode = "HOIAN15", Title = "Hội An cuối tuần", DiscountPercent = 15, StartDate = now.Date, EndDate = now.Date.AddMonths(1), IsActive = true },
            new Promotion { PromoCode = "WELCOME100", Title = "Ưu đãi mở bán", DiscountAmount = 100000, StartDate = now.Date, EndDate = now.Date.AddMonths(3), IsActive = true }
        };
        db.Promotions.AddRange(promotions);
        db.SaveChanges();

        var tours = new[]
        {
            new TourPackage { SpotId = spots[0].SpotId, PromotionId = promotions[0].PromotionId, TourName = "Đà Nẵng 2 ngày 1 đêm", Duration = "2 ngày 1 đêm", StandardPrice = 2500000, SalePrice = 2250000, ItineraryDetail = "Ngày 1: Bà Nà Hills. Ngày 2: biển Mỹ Khê.", IsFeatured = true },
            new TourPackage { SpotId = spots[2].SpotId, PromotionId = promotions[1].PromotionId, TourName = "Hội An về đêm", Duration = "1 ngày", StandardPrice = 890000, SalePrice = 756500, ItineraryDetail = "Phố cổ, sông Hoài và đèn lồng.", IsFeatured = true },
            new TourPackage { SpotId = spots[3].SpotId, TourName = "Huế di sản", Duration = "2 ngày 1 đêm", StandardPrice = 2100000, ItineraryDetail = "Đại Nội và lăng tẩm.", IsFeatured = false },
            new TourPackage { SpotId = spots[4].SpotId, TourName = "Nha Trang đảo", Duration = "1 ngày", StandardPrice = 750000, ItineraryDetail = "Tour vịnh trong ngày.", IsFeatured = false }
        };
        db.TourPackages.AddRange(tours);

        db.ServiceItems.AddRange(
            new ServiceItem { ProviderId = providers[0].ProviderId, ItemName = "Phòng Deluxe", Capacity = 2, Price = 1500000, TotalQuantity = 20, IsAvailable = true },
            new ServiceItem { ProviderId = providers[0].ProviderId, ItemName = "Phòng Family", Capacity = 4, Price = 2200000, TotalQuantity = 8, IsAvailable = true },
            new ServiceItem { ProviderId = providers[1].ProviderId, ItemName = "Phòng Superior", Capacity = 2, Price = 900000, TotalQuantity = 15, IsAvailable = true },
            new ServiceItem { ProviderId = providers[2].ProviderId, ItemName = "Bàn 4 người", Capacity = 4, Price = 0, TotalQuantity = 12, IsAvailable = true },
            new ServiceItem { ProviderId = providers[3].ProviderId, ItemName = "Villa hướng vịnh", Capacity = 3, Price = 3500000, TotalQuantity = 6, IsAvailable = true }
        );

        db.Contacts.AddRange(
            new Contact { FullName = "Trần Thu Hà", Email = "ha.tran@example.com", Phone = "0912000001", Subject = "Hỏi tour Hội An", Message = "Cho mình xin lịch tour cuối tuần.", IsResponded = false, CreatedAt = now },
            new Contact { FullName = "Lê Quốc Bảo", Email = "bao.le@example.com", Phone = "0912000002", Subject = "Đặt xe nhóm", Message = "Nhóm 12 người đi Huế.", IsResponded = true, CreatedAt = now.AddDays(-1) }
        );

        db.Feedbacks.AddRange(
            new Feedback { FullName = user.FullName, Email = user.Email, Rating = 5, Title = "Cầu Vàng", Content = "Cầu Vàng rất đẹp.", IsApproved = true, CreatedAt = now.AddDays(-2) },
            new Feedback { FullName = user.FullName, Email = user.Email, Rating = 4, Title = "Tour Hội An", Content = "Hướng dẫn viên nhiệt tình.", IsApproved = true, CreatedAt = now.AddDays(-1) },
            new Feedback { FullName = "Phạm Lan", Email = "lan.pham@example.com", Rating = 3, Title = "Góp ý website", Content = "Web tải hơi chậm.", IsApproved = false, CreatedAt = now }
        );

        db.SystemLogs.Add(new SystemLog
        {
            User = admin,
            ActionType = "INSERT",
            ActionDescription = "Khởi tạo dữ liệu mẫu.",
            CreatedAt = now
        });
        db.SaveChanges();

        var booking = new Booking
        {
            BookingCode = "BK20261108-001",
            UserId = user.UserId,
            CustomerName = user.FullName,
            CustomerPhone = user.Phone!,
            CustomerEmail = user.Email,
            BookingType = "Tour",
            BookingDate = now,
            StartDate = new DateOnly(2026, 11, 16),
            TotalPassengers = 2,
            TotalAmount = 1513000,
            PaymentStatus = "Đã thanh toán",
            BookingStatus = "Đã xác nhận",
            Notes = "Đi 2 người.",
            Details =
            {
                new BookingDetail
                {
                    TourId = tours[1].TourId,
                    Quantity = 2,
                    UnitPrice = 756500
                }
            }
        };
        db.Bookings.Add(booking);
        db.SaveChanges();

        db.Notifications.Add(new Notification
        {
            UserId = user.UserId,
            Title = "Đơn đã được xác nhận",
            Message = "Đơn BK20261108-001 đã được xác nhận.",
            NotificationType = "BOOKING",
            ReferenceId = booking.BookingCode,
            IsRead = false,
            CreatedAt = now
        });
        db.EmailLogs.Add(new EmailLog
        {
            BookingId = booking.BookingId,
            UserId = user.UserId,
            RecipientEmail = user.Email,
            Subject = "Xác nhận đặt tour thành công",
            BodyContent = "Đơn BK20261108-001 đã được xác nhận. Ngày khởi hành 16/11/2026.",
            SendStatus = "SENT",
            SentAt = now,
            CreatedAt = now
        });
        db.SaveChanges();
    }
}
