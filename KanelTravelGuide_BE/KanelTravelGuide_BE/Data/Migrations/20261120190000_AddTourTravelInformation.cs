using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KanelTravelGuide_BE.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261120190000_AddTourTravelInformation")]
public class AddTourTravelInformation : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "meeting_point", table: "TourPackages",
            type: "nvarchar(255)", maxLength: 255, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "end_point", table: "TourPackages",
            type: "nvarchar(255)", maxLength: 255, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "transport_description", table: "TourPackages",
            type: "nvarchar(2000)", maxLength: 2000, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "accommodation_description", table: "TourPackages",
            type: "nvarchar(2000)", maxLength: 2000, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "guide_description", table: "TourPackages",
            type: "nvarchar(2000)", maxLength: 2000, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "meals_description", table: "TourPackages",
            type: "nvarchar(2000)", maxLength: 2000, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "included_services", table: "TourPackages",
            type: "nvarchar(4000)", maxLength: 4000, nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "excluded_services", table: "TourPackages",
            type: "nvarchar(4000)", maxLength: 4000, nullable: true);
        migrationBuilder.AddColumn<TimeOnly>(
            name: "return_time", table: "TourDepartures", type: "time", nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "meeting_point", table: "TourPackages");
        migrationBuilder.DropColumn(name: "end_point", table: "TourPackages");
        migrationBuilder.DropColumn(name: "transport_description", table: "TourPackages");
        migrationBuilder.DropColumn(name: "accommodation_description", table: "TourPackages");
        migrationBuilder.DropColumn(name: "guide_description", table: "TourPackages");
        migrationBuilder.DropColumn(name: "meals_description", table: "TourPackages");
        migrationBuilder.DropColumn(name: "included_services", table: "TourPackages");
        migrationBuilder.DropColumn(name: "excluded_services", table: "TourPackages");
        migrationBuilder.DropColumn(name: "return_time", table: "TourDepartures");
    }
}
