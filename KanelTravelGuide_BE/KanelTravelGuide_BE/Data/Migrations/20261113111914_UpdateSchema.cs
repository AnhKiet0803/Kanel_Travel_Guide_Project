using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanelTravelGuide_BE.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Schedules_Status",
                table: "Schedules");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bookings_Payment",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bookings_Status",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bookings_Type",
                table: "Bookings");

            migrationBuilder.AddColumn<int>(
                name: "available_seats",
                table: "Schedules",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "discount_amount",
                table: "Bookings",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "promotion_id",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "Bookings",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Schedules_Status",
                table: "Schedules",
                sql: "[status] IN ('Running', 'Suspended', 'SoldOut', N'Đang chạy', N'Tạm ngưng', N'Hết vé')");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_promotion_id",
                table: "Bookings",
                column: "promotion_id");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bookings_Payment",
                table: "Bookings",
                sql: "[payment_status] IN ('Unpaid', 'Paid', 'Refunded', N'Chưa thanh toán', N'Đã thanh toán', N'Hoàn tiền')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bookings_Status",
                table: "Bookings",
                sql: "[booking_status] IN ('Pending', 'Confirmed', 'Completed', 'Cancelled', N'Chờ duyệt', N'Đã xác nhận', N'Hoàn tất', N'Hủy')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bookings_Type",
                table: "Bookings",
                sql: "[booking_type] IN ('Tour', 'Transport', 'Combo', 'Service')");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Promotions_promotion_id",
                table: "Bookings",
                column: "promotion_id",
                principalTable: "Promotions",
                principalColumn: "promotion_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Promotions_promotion_id",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Schedules_Status",
                table: "Schedules");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_promotion_id",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bookings_Payment",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bookings_Status",
                table: "Bookings");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Bookings_Type",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "available_seats",
                table: "Schedules");

            migrationBuilder.DropColumn(
                name: "discount_amount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "promotion_id",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "Bookings");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Schedules_Status",
                table: "Schedules",
                sql: "[status] IN ('Running', 'Suspended')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bookings_Payment",
                table: "Bookings",
                sql: "[payment_status] IN ('Unpaid', 'Paid')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bookings_Status",
                table: "Bookings",
                sql: "[booking_status] IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Bookings_Type",
                table: "Bookings",
                sql: "[booking_type] IN ('Tour', 'Transport', 'Combo')");
        }
    }
}
