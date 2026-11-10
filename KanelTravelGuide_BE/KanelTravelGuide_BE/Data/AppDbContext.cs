using System.Text.RegularExpressions;
using KanelTravelGuide_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<CategoryType> CategoryTypes => Set<CategoryType>();
    public DbSet<TouristSpot> TouristSpots => Set<TouristSpot>();
    public DbSet<Models.ServiceProvider> ServiceProviders => Set<Models.ServiceProvider>();
    public DbSet<ServiceItem> ServiceItems => Set<ServiceItem>();
    public DbSet<TransportRoute> TransportRoutes => Set<TransportRoute>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<TourPackage> TourPackages => Set<TourPackage>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingDetail> BookingDetails => Set<BookingDetail>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<EmailLog> EmailLogs => Set<EmailLog>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<SystemLog> SystemLogs => Set<SystemLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", table => table.HasCheckConstraint("CK_Users_Role", "[role] IN ('Admin', 'User')"));
            entity.HasKey(x => x.UserId);
            entity.HasIndex(x => x.Username).IsUnique();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Username).HasMaxLength(50);
            entity.Property(x => x.PasswordHash).HasMaxLength(255);
            entity.Property(x => x.FullName).HasMaxLength(100);
            entity.Property(x => x.Email).HasMaxLength(100);
            entity.Property(x => x.Phone).HasMaxLength(20);
            entity.Property(x => x.Address).HasMaxLength(255);
            entity.Property(x => x.Role).HasMaxLength(20).HasDefaultValue("User");
            entity.Property(x => x.DeviceToken).HasMaxLength(255);
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.ToTable("Locations");
            entity.HasKey(x => x.LocationId);
            entity.Property(x => x.LocationName).HasMaxLength(100);
            entity.Property(x => x.Region).HasMaxLength(50);
        });

        modelBuilder.Entity<CategoryType>(entity =>
        {
            entity.ToTable("CategoryTypes");
            entity.HasKey(x => x.CategoryId);
            entity.Property(x => x.CategoryName).HasMaxLength(100);
        });

        modelBuilder.Entity<TouristSpot>(entity =>
        {
            entity.ToTable("TouristSpots");
            entity.HasKey(x => x.SpotId);
            entity.Property(x => x.SpotName).HasMaxLength(200);
            entity.Property(x => x.ThumbnailUrl).HasMaxLength(500);
            entity.Property(x => x.IsFeatured).HasDefaultValue(false);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.HasOne(x => x.Location).WithMany(x => x.TouristSpots).HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CategoryType).WithMany(x => x.TouristSpots).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Models.ServiceProvider>(entity =>
        {
            entity.ToTable("ServiceProviders", table =>
            {
                table.HasCheckConstraint("CK_ServiceProviders_Type", "[service_type] IN ('Hotel', 'Resort', 'Restaurant')");
                table.HasCheckConstraint("CK_ServiceProviders_Star", "[star_rating] IS NULL OR [star_rating] BETWEEN 1 AND 5");
            });
            entity.HasKey(x => x.ProviderId);
            entity.Property(x => x.ServiceType).HasMaxLength(20);
            entity.Property(x => x.ProviderName).HasMaxLength(200);
            entity.Property(x => x.Address).HasMaxLength(255);
            entity.Property(x => x.Phone).HasMaxLength(20);
            entity.Property(x => x.Website).HasMaxLength(255);
            entity.Property(x => x.MinPrice).HasPrecision(18, 2);
            entity.Property(x => x.MaxPrice).HasPrecision(18, 2);
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.Property(x => x.IsActive).HasDefaultValue(true);
            entity.HasOne(x => x.Location).WithMany(x => x.ServiceProviders).HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ServiceItem>(entity =>
        {
            entity.ToTable("ServiceItems");
            entity.HasKey(x => x.ItemId);
            entity.Property(x => x.ItemName).HasMaxLength(150);
            entity.Property(x => x.Price).HasPrecision(18, 2);
            entity.Property(x => x.TotalQuantity).HasDefaultValue(1);
            entity.Property(x => x.IsAvailable).HasDefaultValue(true);
            entity.HasOne(x => x.ServiceProvider).WithMany(x => x.Items).HasForeignKey(x => x.ProviderId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TransportRoute>(entity =>
        {
            entity.ToTable("TransportRoutes");
            entity.HasKey(x => x.RouteId);
            entity.Property(x => x.DistanceKm).HasPrecision(6, 2);
            entity.Property(x => x.EstimatedDuration).HasMaxLength(50);
            entity.HasOne(x => x.DepartureLocation).WithMany(x => x.DepartureRoutes).HasForeignKey(x => x.DepartureLocationId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.DestinationLocation).WithMany(x => x.DestinationRoutes).HasForeignKey(x => x.DestinationLocationId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.ToTable("Vehicles");
            entity.HasKey(x => x.VehicleId);
            entity.Property(x => x.VehicleName).HasMaxLength(100);
            entity.Property(x => x.VehicleType).HasMaxLength(50);
        });

        modelBuilder.Entity<Schedule>(entity =>
        {
            entity.ToTable("Schedules", table => table.HasCheckConstraint("CK_Schedules_Status", "[status] IN ('Running', 'Suspended')"));
            entity.HasKey(x => x.ScheduleId);
            entity.Property(x => x.TicketPrice).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Running");
            entity.HasOne(x => x.Route).WithMany(x => x.Schedules).HasForeignKey(x => x.RouteId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Vehicle).WithMany(x => x.Schedules).HasForeignKey(x => x.VehicleId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Promotion>(entity =>
        {
            entity.ToTable("Promotions");
            entity.HasKey(x => x.PromotionId);
            entity.HasIndex(x => x.PromoCode).IsUnique().HasFilter("[promo_code] IS NOT NULL");
            entity.Property(x => x.PromoCode).HasMaxLength(50);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.DiscountPercent).HasPrecision(5, 2);
            entity.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            entity.Property(x => x.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<TourPackage>(entity =>
        {
            entity.ToTable("TourPackages");
            entity.HasKey(x => x.TourId);
            entity.Property(x => x.TourName).HasMaxLength(255);
            entity.Property(x => x.Duration).HasMaxLength(50);
            entity.Property(x => x.StandardPrice).HasPrecision(18, 2);
            entity.Property(x => x.SalePrice).HasPrecision(18, 2);
            entity.Property(x => x.IsFeatured).HasDefaultValue(false);
            entity.HasOne(x => x.TouristSpot).WithMany(x => x.TourPackages).HasForeignKey(x => x.SpotId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Promotion).WithMany(x => x.TourPackages).HasForeignKey(x => x.PromotionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.ToTable("Bookings", table =>
            {
                table.HasCheckConstraint("CK_Bookings_Type", "[booking_type] IN ('Tour', 'Transport', 'Combo')");
                table.HasCheckConstraint("CK_Bookings_Payment", "[payment_status] IN ('Unpaid', 'Paid')");
                table.HasCheckConstraint("CK_Bookings_Status", "[booking_status] IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')");
            });
            entity.HasKey(x => x.BookingId);
            entity.HasIndex(x => x.BookingCode).IsUnique();
            entity.Property(x => x.BookingCode).HasMaxLength(30);
            entity.Property(x => x.CustomerName).HasMaxLength(100);
            entity.Property(x => x.CustomerPhone).HasMaxLength(20);
            entity.Property(x => x.CustomerEmail).HasMaxLength(100);
            entity.Property(x => x.BookingType).HasMaxLength(30);
            entity.Property(x => x.BookingDate).HasDefaultValueSql("GETDATE()");
            entity.Property(x => x.TotalAmount).HasPrecision(18, 2);
            entity.Property(x => x.PaymentStatus).HasMaxLength(50).HasDefaultValue("Unpaid");
            entity.Property(x => x.BookingStatus).HasMaxLength(50).HasDefaultValue("Pending");
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasOne(x => x.User).WithMany(x => x.Bookings).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BookingDetail>(entity =>
        {
            entity.ToTable("BookingDetails");
            entity.HasKey(x => x.DetailId);
            entity.Property(x => x.Quantity).HasDefaultValue(1);
            entity.Property(x => x.UnitPrice).HasPrecision(18, 2);
            entity.HasOne(x => x.Booking).WithMany(x => x.Details).HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.TourPackage).WithMany(x => x.BookingDetails).HasForeignKey(x => x.TourId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Schedule).WithMany(x => x.BookingDetails).HasForeignKey(x => x.ScheduleId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ServiceItem).WithMany(x => x.BookingDetails).HasForeignKey(x => x.ServiceItemId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications", table => table.HasCheckConstraint("CK_Notifications_Type", "[notification_type] IN ('BOOKING', 'PROMOTION', 'SYSTEM')"));
            entity.HasKey(x => x.NotificationId);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.NotificationType).HasMaxLength(50).HasDefaultValue("BOOKING");
            entity.Property(x => x.ReferenceId).HasMaxLength(50);
            entity.Property(x => x.IsRead).HasDefaultValue(false);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.HasOne(x => x.User).WithMany(x => x.Notifications).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EmailLog>(entity =>
        {
            entity.ToTable("EmailLogs", table => table.HasCheckConstraint("CK_EmailLogs_Status", "[send_status] IN ('PENDING', 'SENT', 'FAILED')"));
            entity.HasKey(x => x.EmailLogId);
            entity.Property(x => x.RecipientEmail).HasMaxLength(100);
            entity.Property(x => x.Subject).HasMaxLength(255);
            entity.Property(x => x.SendStatus).HasMaxLength(30).HasDefaultValue("PENDING");
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.HasOne(x => x.Booking).WithMany(x => x.EmailLogs).HasForeignKey(x => x.BookingId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.User).WithMany(x => x.EmailLogs).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Feedback>(entity =>
        {
            entity.ToTable("Feedbacks", table => table.HasCheckConstraint("CK_Feedbacks_Rating", "[rating] IS NULL OR [rating] BETWEEN 1 AND 5"));
            entity.HasKey(x => x.FeedbackId);
            entity.Property(x => x.FullName).HasMaxLength(100);
            entity.Property(x => x.Email).HasMaxLength(100);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.IsApproved).HasDefaultValue(false);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
        });

        modelBuilder.Entity<Contact>(entity =>
        {
            entity.ToTable("Contacts");
            entity.HasKey(x => x.ContactId);
            entity.Property(x => x.FullName).HasMaxLength(100);
            entity.Property(x => x.Email).HasMaxLength(100);
            entity.Property(x => x.Phone).HasMaxLength(20);
            entity.Property(x => x.Subject).HasMaxLength(200);
            entity.Property(x => x.IsResponded).HasDefaultValue(false);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
        });

        modelBuilder.Entity<SystemLog>(entity =>
        {
            entity.ToTable("SystemLogs");
            entity.HasKey(x => x.LogId);
            entity.Property(x => x.ActionType).HasMaxLength(50);
            entity.Property(x => x.CreatedAt).HasDefaultValueSql("GETDATE()");
            entity.HasOne(x => x.User).WithMany(x => x.SystemLogs).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var tableName = entityType.GetTableName();
            foreach (var property in entityType.GetProperties())
            {
                var columnName = ToSnakeCase(property.Name);
                property.SetColumnName(columnName);

                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetColumnType("datetime");
                }

                if (tableName is not null && VarcharLengths.TryGetValue($"{tableName}.{columnName}", out var length))
                {
                    property.SetColumnType($"varchar({length})");
                }
            }
        }
    }

    private static readonly Dictionary<string, int> VarcharLengths = new()
    {
        ["Users.username"] = 50,
        ["Users.password_hash"] = 255,
        ["Users.email"] = 100,
        ["Users.phone"] = 20,
        ["Users.device_token"] = 255,
        ["TouristSpots.thumbnail_url"] = 500,
        ["ServiceProviders.service_type"] = 20,
        ["ServiceProviders.phone"] = 20,
        ["ServiceProviders.website"] = 255,
        ["ServiceProviders.image_url"] = 500,
        ["Promotions.promo_code"] = 50,
        ["Bookings.booking_code"] = 30,
        ["Bookings.customer_phone"] = 20,
        ["Bookings.customer_email"] = 100,
        ["Bookings.booking_type"] = 30,
        ["Notifications.notification_type"] = 50,
        ["Notifications.reference_id"] = 50,
        ["EmailLogs.recipient_email"] = 100,
        ["EmailLogs.send_status"] = 30,
        ["Feedbacks.email"] = 100,
        ["Contacts.email"] = 100,
        ["Contacts.phone"] = 20,
        ["SystemLogs.action_type"] = 50
    };

    private static string ToSnakeCase(string name)
    {
        return Regex.Replace(name, "([a-z0-9])([A-Z])", "$1_$2").ToLowerInvariant();
    }
}
