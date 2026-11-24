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

        // Preserve meeting points stored by older versions inside the itinerary.
        migrationBuilder.Sql("""
            UPDATE dbo.TourPackages
            SET meeting_point = LEFT(LTRIM(RTRIM(SUBSTRING(itinerary_detail, 15,
                CHARINDEX(CHAR(10), itinerary_detail + CHAR(10)) - 15))), 255)
            WHERE itinerary_detail LIKE N'Meeting point:%' AND meeting_point IS NULL;
            """);

        // One-time backfill for the detailed programs already prepared for the project.
        // Keeping this in the migration lets administrators clear fields later.
        var programs = new[]
        {
            (1, "Da Nang 2 days 1 night", "Original central Da Nang meeting point. Planned finish: 15:00 on Day 2.", "Shared road transfers between the published sightseeing stops on both days. Travel to Da Nang and airport transfers are not included."),
            (2, "Hoi An by night", "Song Hoai Square, Hoi An. Planned finish: 20:00.", "Walking tour. Travel to Hoi An and hotel transfers are not included."),
            (3, "Hue heritage", "Hue Railway Station forecourt. Planned finish: 16:00 on Day 2.", "Shared road transfers between the published sightseeing stops on both days. Travel to Hue is arranged separately."),
            (4, "Nha Trang islands", "Tram Huong Tower forecourt, Nha Trang. Planned finish: approximately 16:30.", "Shared road transfers between the meeting point and pier, plus a shared sightseeing boat. Sea conditions and local access rules determine the route.")
        };
        foreach (var (id, name, endPoint, transport) in programs)
        {
            migrationBuilder.Sql($"""
                UPDATE dbo.TourPackages
                SET end_point = N'{endPoint.Replace("'", "''")}',
                    transport_description = N'{transport.Replace("'", "''")}',
                    accommodation_description = N'Accommodation is not included. Optional rooms selected in the booking form are charged separately; each room is for one night on the departure date.',
                    guide_description = N'A guide accompanies the published sightseeing program. Confirm the guide language with Karnel Travels before booking.',
                    meals_description = N'Meals and drinks are not included. Meal breaks are provided in the itinerary; pay the restaurant directly and discuss dietary needs before ordering.',
                    included_services = LTRIM(RTRIM(SUBSTRING(itinerary_detail,
                        CHARINDEX(N'Included:', itinerary_detail) + 9,
                        CHARINDEX(N'Not included:', itinerary_detail) - CHARINDEX(N'Included:', itinerary_detail) - 9))),
                    excluded_services = LTRIM(RTRIM(SUBSTRING(itinerary_detail,
                        CHARINDEX(N'Not included:', itinerary_detail) + 13,
                        CHARINDEX(N'Before you travel:', itinerary_detail) - CHARINDEX(N'Not included:', itinerary_detail) - 13)))
                WHERE tour_id = {id} AND tour_name = N'{name.Replace("'", "''")}'
                    AND CHARINDEX(N'Included:', itinerary_detail) > 0
                    AND CHARINDEX(N'Not included:', itinerary_detail) > CHARINDEX(N'Included:', itinerary_detail) + 9
                    AND CHARINDEX(N'Before you travel:', itinerary_detail) > CHARINDEX(N'Not included:', itinerary_detail) + 13;
                """);
        }
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
