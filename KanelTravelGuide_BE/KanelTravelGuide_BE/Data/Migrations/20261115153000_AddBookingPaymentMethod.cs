using KanelTravelGuide_BE.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KanelTravelGuide_BE.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261115153000_AddBookingPaymentMethod")]
public class AddBookingPaymentMethod : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>("pay_pal_order_id", "Bookings", "nvarchar(64)", maxLength: 64, nullable: true);
        migrationBuilder.AddColumn<decimal>("pay_pal_amount_usd", "Bookings", "decimal(18,2)", precision: 18, scale: 2, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "payment_method",
            table: "Bookings",
            type: "nvarchar(30)",
            maxLength: 30,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn("payment_method", "Bookings");
        migrationBuilder.DropColumn("pay_pal_order_id", "Bookings");
        migrationBuilder.DropColumn("pay_pal_amount_usd", "Bookings");
    }
}
