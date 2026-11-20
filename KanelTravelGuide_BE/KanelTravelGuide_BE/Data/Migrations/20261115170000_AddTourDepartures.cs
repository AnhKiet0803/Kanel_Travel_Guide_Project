using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KanelTravelGuide_BE.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTourDepartures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "tour_departure_id",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "traveler_type",
                table: "BookingDetails",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TourDepartures",
                columns: table => new
                {
                    tour_departure_id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    tour_id = table.Column<int>(type: "int", nullable: false),
                    departure_date = table.Column<DateOnly>(type: "date", nullable: false),
                    return_date = table.Column<DateOnly>(type: "date", nullable: false),
                    capacity = table.Column<int>(type: "int", nullable: false),
                    adult_price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourDepartures", x => x.tour_departure_id);
                    table.ForeignKey(
                        name: "FK_TourDepartures_TourPackages_tour_id",
                        column: x => x.tour_id,
                        principalTable: "TourPackages",
                        principalColumn: "tour_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_tour_departure_id",
                table: "Bookings",
                column: "tour_departure_id");

            migrationBuilder.CreateIndex(
                name: "IX_TourDepartures_tour_id_departure_date",
                table: "TourDepartures",
                columns: new[] { "tour_id", "departure_date" });

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_TourDepartures_tour_departure_id",
                table: "Bookings",
                column: "tour_departure_id",
                principalTable: "TourDepartures",
                principalColumn: "tour_departure_id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_TourDepartures_tour_departure_id",
                table: "Bookings");

            migrationBuilder.DropTable(
                name: "TourDepartures");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_tour_departure_id",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "tour_departure_id",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "traveler_type",
                table: "BookingDetails");
        }
    }
}
