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
            FullName = "Karnel Admin",
            Email = "admin@karnel.local",
            Phone = "0901000001",
            Address = "Hai Chau, Da Nang",
            Role = "Admin",
            IsActive = true,
            CreatedAt = now
        };
        var user = new User
        {
            Username = "minhan",
            PasswordHash = PasswordHasher.Hash("User@123"),
            FullName = "Nguyen Minh An",
            Email = "user@karnel.local",
            Phone = "0901000002",
            Address = "Son Tra, Da Nang",
            Role = "User",
            IsActive = true,
            CreatedAt = now
        };
        db.Users.AddRange(admin, user);

        var locations = new[]
        {
            new Location { LocationName = "Da Nang", Region = "Central", Description = "A coastal city in central Vietnam." },
            new Location { LocationName = "Quang Nam", Region = "Central", Description = "Hoi An ancient town and the surrounding area." },
            new Location { LocationName = "Thua Thien Hue", Region = "Central", Description = "The former imperial capital and Nguyen dynasty sites." },
            new Location { LocationName = "Khanh Hoa", Region = "Central", Description = "Nha Trang bay and nearby islands." }
        };
        db.Locations.AddRange(locations);

        var categories = new[]
        {
            new CategoryType { CategoryName = "Beach" },
            new CategoryType { CategoryName = "Culture and heritage" },
            new CategoryType { CategoryName = "Ecotourism" },
            new CategoryType { CategoryName = "Cuisine" }
        };
        db.CategoryTypes.AddRange(categories);
        db.SaveChanges();

        var spots = new[]
        {
            new TouristSpot { LocationId = locations[0].LocationId, CategoryId = categories[2].CategoryId, SpotName = "Ba Na Hills", ThumbnailUrl = "/images/ba-na.jpg", Description = "A mountain resort known for the Golden Bridge.", DetailedContent = "Ba Na Hills is in Hoa Vang, Da Nang. The main highlights are the Golden Bridge and the amusement area on the mountain.", IsFeatured = true, CreatedAt = now },
            new TouristSpot { LocationId = locations[0].LocationId, CategoryId = categories[0].CategoryId, SpotName = "My Khe Beach", ThumbnailUrl = "/images/my-khe.jpg", Description = "The main beach in central Da Nang.", DetailedContent = "My Khe Beach runs along Vo Nguyen Giap Street and is suitable for swimming and walking.", IsFeatured = true, CreatedAt = now },
            new TouristSpot { LocationId = locations[1].LocationId, CategoryId = categories[1].CategoryId, SpotName = "Hoi An Ancient Town", ThumbnailUrl = "/images/hoi-an.jpg", Description = "The ancient town along the Hoai River.", DetailedContent = "Hoi An Ancient Town keeps its trading-port architecture, lanterns, and assembly halls.", IsFeatured = true, CreatedAt = now },
            new TouristSpot { LocationId = locations[2].LocationId, CategoryId = categories[1].CategoryId, SpotName = "Hue Imperial City", ThumbnailUrl = "/images/dai-noi.jpg", Description = "The Nguyen dynasty citadel.", DetailedContent = "The Imperial City is a palace complex on the north bank of the Perfume River.", IsFeatured = false, CreatedAt = now },
            new TouristSpot { LocationId = locations[3].LocationId, CategoryId = categories[0].CategoryId, SpotName = "Nha Trang Bay", ThumbnailUrl = "/images/nha-trang.jpg", Description = "A bay with island trips.", DetailedContent = "Nha Trang Bay includes Hon Mun, Hon Tam, and swimming activities.", IsFeatured = false, CreatedAt = now },
            new TouristSpot { LocationId = locations[1].LocationId, CategoryId = categories[3].CategoryId, SpotName = "Hoi An Market", ThumbnailUrl = "/images/cho-hoi-an.jpg", Description = "Local food and specialties.", DetailedContent = "Hoi An Market sells cao lau, Quang noodles, and gifts.", IsFeatured = false, CreatedAt = now }
        };
        db.TouristSpots.AddRange(spots);

        var providers = new[]
        {
            new ServiceProvider { LocationId = locations[0].LocationId, ServiceType = "Hotel", ProviderName = "Karnel Beach Hotel", StarRating = 4, Address = "Vo Nguyen Giap, Da Nang", Phone = "02361111001", Website = "https://karnel.local/beach-hotel", MinPrice = 1500000, MaxPrice = 2200000, Description = "A sea-view hotel.", ImageUrl = "/images/hotel-beach.jpg", IsActive = true },
            new ServiceProvider { LocationId = locations[1].LocationId, ServiceType = "Hotel", ProviderName = "Hoi An Riverside Hotel", StarRating = 3, Address = "Nhieu Loc, Hoi An", Phone = "02351111002", MinPrice = 900000, MaxPrice = 900000, Description = "A hotel next to the ancient town.", ImageUrl = "/images/hotel-hoian.jpg", IsActive = true },
            new ServiceProvider { LocationId = locations[0].LocationId, ServiceType = "Restaurant", ProviderName = "My Quang Ba Restaurant", Address = "Tran Quoc Toan, Da Nang", Phone = "09031111003", MinPrice = 50000, MaxPrice = 120000, Description = "A Quang noodle restaurant.", ImageUrl = "/images/restaurant.jpg", IsActive = true },
            new ServiceProvider { LocationId = locations[3].LocationId, ServiceType = "Resort", ProviderName = "Karnel Bay Resort", StarRating = 5, Address = "Tran Phu, Nha Trang", Phone = "02581111004", Website = "https://karnel.local/bay-resort", MinPrice = 3500000, MaxPrice = 3500000, Description = "A resort facing the bay.", ImageUrl = "/images/resort.jpg", IsActive = true }
        };
        db.ServiceProviders.AddRange(providers);

        var vehicles = new[]
        {
            new Vehicle { VehicleName = "VIP 9-seat limousine", VehicleType = "Limousine", TotalSeats = 9 },
            new Vehicle { VehicleName = "40-sleeper bus", VehicleType = "Bus", TotalSeats = 40 },
            new Vehicle { VehicleName = "16-seat tourist car", VehicleType = "Tourist car", TotalSeats = 16 }
        };
        db.Vehicles.AddRange(vehicles);
        db.SaveChanges();

        var routes = new[]
        {
            new TransportRoute { DepartureLocationId = locations[0].LocationId, DestinationLocationId = locations[1].LocationId, DistanceKm = 30, EstimatedDuration = "1 hour" },
            new TransportRoute { DepartureLocationId = locations[0].LocationId, DestinationLocationId = locations[2].LocationId, DistanceKm = 100, EstimatedDuration = "3 hours" },
            new TransportRoute { DepartureLocationId = locations[0].LocationId, DestinationLocationId = locations[3].LocationId, DistanceKm = 530, EstimatedDuration = "12 hours" }
        };
        db.TransportRoutes.AddRange(routes);
        db.SaveChanges();

        db.Schedules.AddRange(
            new Schedule { RouteId = routes[0].RouteId, VehicleId = vehicles[2].VehicleId, DepartureTime = new TimeOnly(8, 0), TicketPrice = 150000, Status = "Running" },
            new Schedule { RouteId = routes[1].RouteId, VehicleId = vehicles[2].VehicleId, DepartureTime = new TimeOnly(7, 30), TicketPrice = 250000, Status = "Running" },
            new Schedule { RouteId = routes[2].RouteId, VehicleId = vehicles[1].VehicleId, DepartureTime = new TimeOnly(18, 0), TicketPrice = 450000, Status = "Running" },
            new Schedule { RouteId = routes[1].RouteId, VehicleId = vehicles[0].VehicleId, DepartureTime = new TimeOnly(9, 0), TicketPrice = 350000, Status = "Suspended" }
        );

        var promotions = new[]
        {
            new Promotion { PromoCode = "DANANG10", Title = "Da Nang tour discount", DiscountPercent = 10, StartDate = now.Date, EndDate = now.Date.AddMonths(2), IsActive = true },
            new Promotion { PromoCode = "HOIAN15", Title = "Hoi An weekend offer", DiscountPercent = 15, StartDate = now.Date, EndDate = now.Date.AddMonths(1), IsActive = true },
            new Promotion { PromoCode = "WELCOME100", Title = "Opening offer", DiscountAmount = 100000, StartDate = now.Date, EndDate = now.Date.AddMonths(3), IsActive = true }
        };
        db.Promotions.AddRange(promotions);
        db.SaveChanges();

        var tours = new[]
        {
            new TourPackage { SpotId = spots[0].SpotId, PromotionId = promotions[0].PromotionId, TourName = "Da Nang 2 days 1 night", Duration = "2 days 1 night", StandardPrice = 2500000, SalePrice = 2250000, ItineraryDetail = "Day 1: Ba Na Hills. Day 2: My Khe Beach.", IsFeatured = true },
            new TourPackage { SpotId = spots[2].SpotId, PromotionId = promotions[1].PromotionId, TourName = "Hoi An by night", Duration = "1 day", StandardPrice = 890000, SalePrice = 756500, ItineraryDetail = "Ancient town, Hoai River, and lanterns.", IsFeatured = true },
            new TourPackage { SpotId = spots[3].SpotId, TourName = "Hue heritage", Duration = "2 days 1 night", StandardPrice = 2100000, ItineraryDetail = "Imperial City and royal tombs.", IsFeatured = false },
            new TourPackage { SpotId = spots[4].SpotId, TourName = "Nha Trang islands", Duration = "1 day", StandardPrice = 750000, ItineraryDetail = "A one-day bay tour.", IsFeatured = false }
        };
        db.TourPackages.AddRange(tours);

        db.ServiceItems.AddRange(
            new ServiceItem { ProviderId = providers[0].ProviderId, ItemName = "Deluxe room", Capacity = 2, Price = 1500000, TotalQuantity = 20, IsAvailable = true },
            new ServiceItem { ProviderId = providers[0].ProviderId, ItemName = "Family room", Capacity = 4, Price = 2200000, TotalQuantity = 8, IsAvailable = true },
            new ServiceItem { ProviderId = providers[1].ProviderId, ItemName = "Superior room", Capacity = 2, Price = 900000, TotalQuantity = 15, IsAvailable = true },
            new ServiceItem { ProviderId = providers[2].ProviderId, ItemName = "Table for 4", Capacity = 4, Price = 0, TotalQuantity = 12, IsAvailable = true },
            new ServiceItem { ProviderId = providers[3].ProviderId, ItemName = "Bay-view villa", Capacity = 3, Price = 3500000, TotalQuantity = 6, IsAvailable = true }
        );

        db.Contacts.AddRange(
            new Contact { FullName = "Tran Thu Ha", Email = "ha.tran@example.com", Phone = "0912000001", Subject = "Hoi An tour question", Message = "Please send me the weekend tour schedule.", IsResponded = false, CreatedAt = now },
            new Contact { FullName = "Le Quoc Bao", Email = "bao.le@example.com", Phone = "0912000002", Subject = "Group transport booking", Message = "A group of 12 people is traveling to Hue.", IsResponded = true, CreatedAt = now.AddDays(-1) }
        );

        db.Feedbacks.AddRange(
            new Feedback { FullName = user.FullName, Email = user.Email, Rating = 5, Title = "Golden Bridge", Content = "The Golden Bridge is beautiful.", IsApproved = true, CreatedAt = now.AddDays(-2) },
            new Feedback { FullName = user.FullName, Email = user.Email, Rating = 4, Title = "Hoi An tour", Content = "The guide was very helpful.", IsApproved = true, CreatedAt = now.AddDays(-1) },
            new Feedback { FullName = "Pham Lan", Email = "lan.pham@example.com", Rating = 3, Title = "Website feedback", Content = "The website loads a bit slowly.", IsApproved = false, CreatedAt = now }
        );

        db.SystemLogs.Add(new SystemLog
        {
            User = admin,
            ActionType = "INSERT",
            ActionDescription = "Seeded sample data.",
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
            PaymentStatus = "Paid",
            BookingStatus = "Confirmed",
            Notes = "Two travelers.",
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
            Title = "Booking confirmed",
            Message = "Booking BK20261108-001 has been confirmed.",
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
            Subject = "Tour booking confirmed",
            BodyContent = "Booking BK20261108-001 has been confirmed. Departure date: 16 Nov 2026.",
            SendStatus = "SENT",
            SentAt = now,
            CreatedAt = now
        });
        db.SaveChanges();
    }
}
