using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanelTravelGuide_BE.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CategoryTypes",
                columns: table => new
                {
                    category_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    category_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryTypes", x => x.category_id);
                });

            migrationBuilder.CreateTable(
                name: "Contacts",
                columns: table => new
                {
                    contact_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    full_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    phone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    subject = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_responded = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Contacts", x => x.contact_id);
                });

            migrationBuilder.CreateTable(
                name: "Feedbacks",
                columns: table => new
                {
                    feedback_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    full_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    rating = table.Column<int>(type: "int", nullable: true),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    is_approved = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Feedbacks", x => x.feedback_id);
                    table.CheckConstraint("CK_Feedbacks_Rating", "[rating] IS NULL OR [rating] BETWEEN 1 AND 5");
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    location_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    location_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    region = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.location_id);
                });

            migrationBuilder.CreateTable(
                name: "Promotions",
                columns: table => new
                {
                    promotion_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    promo_code = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    discount_percent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    discount_amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    start_date = table.Column<DateTime>(type: "datetime", nullable: false),
                    end_date = table.Column<DateTime>(type: "datetime", nullable: false),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Promotions", x => x.promotion_id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    username = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    password_hash = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false),
                    full_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    phone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    role = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "User"),
                    device_token = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.user_id);
                    table.CheckConstraint("CK_Users_Role", "[role] IN ('Admin', 'User')");
                });

            migrationBuilder.CreateTable(
                name: "Vehicles",
                columns: table => new
                {
                    vehicle_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    vehicle_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    vehicle_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    total_seats = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vehicles", x => x.vehicle_id);
                });

            migrationBuilder.CreateTable(
                name: "ServiceProviders",
                columns: table => new
                {
                    provider_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    location_id = table.Column<int>(type: "int", nullable: false),
                    service_type = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    provider_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    star_rating = table.Column<int>(type: "int", nullable: true),
                    address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    phone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    website = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true),
                    min_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    max_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    image_url = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    is_active = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceProviders", x => x.provider_id);
                    table.CheckConstraint("CK_ServiceProviders_Star", "[star_rating] IS NULL OR [star_rating] BETWEEN 1 AND 5");
                    table.CheckConstraint("CK_ServiceProviders_Type", "[service_type] IN ('Hotel', 'Resort', 'Restaurant')");
                    table.ForeignKey(
                        name: "FK_ServiceProviders_Locations_location_id",
                        column: x => x.location_id,
                        principalTable: "Locations",
                        principalColumn: "location_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TouristSpots",
                columns: table => new
                {
                    spot_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    location_id = table.Column<int>(type: "int", nullable: false),
                    category_id = table.Column<int>(type: "int", nullable: false),
                    spot_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    thumbnail_url = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    detailed_content = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_featured = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TouristSpots", x => x.spot_id);
                    table.ForeignKey(
                        name: "FK_TouristSpots_CategoryTypes_category_id",
                        column: x => x.category_id,
                        principalTable: "CategoryTypes",
                        principalColumn: "category_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TouristSpots_Locations_location_id",
                        column: x => x.location_id,
                        principalTable: "Locations",
                        principalColumn: "location_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TransportRoutes",
                columns: table => new
                {
                    route_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    departure_location_id = table.Column<int>(type: "int", nullable: false),
                    destination_location_id = table.Column<int>(type: "int", nullable: false),
                    distance_km = table.Column<decimal>(type: "decimal(6,2)", precision: 6, scale: 2, nullable: true),
                    estimated_duration = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransportRoutes", x => x.route_id);
                    table.ForeignKey(
                        name: "FK_TransportRoutes_Locations_departure_location_id",
                        column: x => x.departure_location_id,
                        principalTable: "Locations",
                        principalColumn: "location_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TransportRoutes_Locations_destination_location_id",
                        column: x => x.destination_location_id,
                        principalTable: "Locations",
                        principalColumn: "location_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    booking_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    booking_code = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    customer_name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    customer_phone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    customer_email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    booking_type = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false),
                    booking_date = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()"),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    total_passengers = table.Column<int>(type: "int", nullable: false),
                    total_amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    payment_status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Chưa thanh toán"),
                    booking_status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Chờ duyệt"),
                    notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.booking_id);
                    table.CheckConstraint("CK_Bookings_Payment", "[payment_status] IN (N'Chưa thanh toán', N'Đã thanh toán')");
                    table.CheckConstraint("CK_Bookings_Status", "[booking_status] IN (N'Chờ duyệt', N'Đã xác nhận', N'Hoàn tất', N'Hủy')");
                    table.CheckConstraint("CK_Bookings_Type", "[booking_type] IN ('Tour', 'Transport', 'Combo')");
                    table.ForeignKey(
                        name: "FK_Bookings_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    notification_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    notification_type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "BOOKING"),
                    reference_id = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                    is_read = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.notification_id);
                    table.CheckConstraint("CK_Notifications_Type", "[notification_type] IN ('BOOKING', 'PROMOTION', 'SYSTEM')");
                    table.ForeignKey(
                        name: "FK_Notifications_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SystemLogs",
                columns: table => new
                {
                    log_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    action_type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    action_description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemLogs", x => x.log_id);
                    table.ForeignKey(
                        name: "FK_SystemLogs_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ServiceItems",
                columns: table => new
                {
                    item_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    provider_id = table.Column<int>(type: "int", nullable: false),
                    item_name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    capacity = table.Column<int>(type: "int", nullable: true),
                    price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    total_quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    is_available = table.Column<bool>(type: "bit", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceItems", x => x.item_id);
                    table.ForeignKey(
                        name: "FK_ServiceItems_ServiceProviders_provider_id",
                        column: x => x.provider_id,
                        principalTable: "ServiceProviders",
                        principalColumn: "provider_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TourPackages",
                columns: table => new
                {
                    tour_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    spot_id = table.Column<int>(type: "int", nullable: true),
                    promotion_id = table.Column<int>(type: "int", nullable: true),
                    tour_name = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    duration = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    standard_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    sale_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    itinerary_detail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    is_featured = table.Column<bool>(type: "bit", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourPackages", x => x.tour_id);
                    table.ForeignKey(
                        name: "FK_TourPackages_Promotions_promotion_id",
                        column: x => x.promotion_id,
                        principalTable: "Promotions",
                        principalColumn: "promotion_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TourPackages_TouristSpots_spot_id",
                        column: x => x.spot_id,
                        principalTable: "TouristSpots",
                        principalColumn: "spot_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Schedules",
                columns: table => new
                {
                    schedule_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    route_id = table.Column<int>(type: "int", nullable: false),
                    vehicle_id = table.Column<int>(type: "int", nullable: false),
                    departure_time = table.Column<TimeOnly>(type: "time", nullable: false),
                    ticket_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Đang chạy")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Schedules", x => x.schedule_id);
                    table.CheckConstraint("CK_Schedules_Status", "[status] IN (N'Đang chạy', N'Tạm ngưng')");
                    table.ForeignKey(
                        name: "FK_Schedules_TransportRoutes_route_id",
                        column: x => x.route_id,
                        principalTable: "TransportRoutes",
                        principalColumn: "route_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Schedules_Vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "Vehicles",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EmailLogs",
                columns: table => new
                {
                    email_log_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    booking_id = table.Column<int>(type: "int", nullable: true),
                    user_id = table.Column<int>(type: "int", nullable: true),
                    recipient_email = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    subject = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    body_content = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    send_status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false, defaultValue: "PENDING"),
                    error_message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    sent_at = table.Column<DateTime>(type: "datetime", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "GETDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailLogs", x => x.email_log_id);
                    table.CheckConstraint("CK_EmailLogs_Status", "[send_status] IN ('PENDING', 'SENT', 'FAILED')");
                    table.ForeignKey(
                        name: "FK_EmailLogs_Bookings_booking_id",
                        column: x => x.booking_id,
                        principalTable: "Bookings",
                        principalColumn: "booking_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EmailLogs_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "BookingDetails",
                columns: table => new
                {
                    detail_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    booking_id = table.Column<int>(type: "int", nullable: false),
                    tour_id = table.Column<int>(type: "int", nullable: true),
                    schedule_id = table.Column<int>(type: "int", nullable: true),
                    service_item_id = table.Column<int>(type: "int", nullable: true),
                    quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    unit_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingDetails", x => x.detail_id);
                    table.ForeignKey(
                        name: "FK_BookingDetails_Bookings_booking_id",
                        column: x => x.booking_id,
                        principalTable: "Bookings",
                        principalColumn: "booking_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingDetails_Schedules_schedule_id",
                        column: x => x.schedule_id,
                        principalTable: "Schedules",
                        principalColumn: "schedule_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BookingDetails_ServiceItems_service_item_id",
                        column: x => x.service_item_id,
                        principalTable: "ServiceItems",
                        principalColumn: "item_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BookingDetails_TourPackages_tour_id",
                        column: x => x.tour_id,
                        principalTable: "TourPackages",
                        principalColumn: "tour_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookingDetails_booking_id",
                table: "BookingDetails",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_BookingDetails_schedule_id",
                table: "BookingDetails",
                column: "schedule_id");

            migrationBuilder.CreateIndex(
                name: "IX_BookingDetails_service_item_id",
                table: "BookingDetails",
                column: "service_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_BookingDetails_tour_id",
                table: "BookingDetails",
                column: "tour_id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_booking_code",
                table: "Bookings",
                column: "booking_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_user_id",
                table: "Bookings",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_booking_id",
                table: "EmailLogs",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_user_id",
                table: "EmailLogs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_user_id",
                table: "Notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_promo_code",
                table: "Promotions",
                column: "promo_code",
                unique: true,
                filter: "[promo_code] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Schedules_route_id",
                table: "Schedules",
                column: "route_id");

            migrationBuilder.CreateIndex(
                name: "IX_Schedules_vehicle_id",
                table: "Schedules",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceItems_provider_id",
                table: "ServiceItems",
                column: "provider_id");

            migrationBuilder.CreateIndex(
                name: "IX_ServiceProviders_location_id",
                table: "ServiceProviders",
                column: "location_id");

            migrationBuilder.CreateIndex(
                name: "IX_SystemLogs_user_id",
                table: "SystemLogs",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_TouristSpots_category_id",
                table: "TouristSpots",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_TouristSpots_location_id",
                table: "TouristSpots",
                column: "location_id");

            migrationBuilder.CreateIndex(
                name: "IX_TourPackages_promotion_id",
                table: "TourPackages",
                column: "promotion_id");

            migrationBuilder.CreateIndex(
                name: "IX_TourPackages_spot_id",
                table: "TourPackages",
                column: "spot_id");

            migrationBuilder.CreateIndex(
                name: "IX_TransportRoutes_departure_location_id",
                table: "TransportRoutes",
                column: "departure_location_id");

            migrationBuilder.CreateIndex(
                name: "IX_TransportRoutes_destination_location_id",
                table: "TransportRoutes",
                column: "destination_location_id");

            migrationBuilder.CreateIndex(
                name: "IX_Users_email",
                table: "Users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_username",
                table: "Users",
                column: "username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingDetails");

            migrationBuilder.DropTable(
                name: "Contacts");

            migrationBuilder.DropTable(
                name: "EmailLogs");

            migrationBuilder.DropTable(
                name: "Feedbacks");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "SystemLogs");

            migrationBuilder.DropTable(
                name: "Schedules");

            migrationBuilder.DropTable(
                name: "ServiceItems");

            migrationBuilder.DropTable(
                name: "TourPackages");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "TransportRoutes");

            migrationBuilder.DropTable(
                name: "Vehicles");

            migrationBuilder.DropTable(
                name: "ServiceProviders");

            migrationBuilder.DropTable(
                name: "Promotions");

            migrationBuilder.DropTable(
                name: "TouristSpots");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "CategoryTypes");

            migrationBuilder.DropTable(
                name: "Locations");
        }
    }
}
