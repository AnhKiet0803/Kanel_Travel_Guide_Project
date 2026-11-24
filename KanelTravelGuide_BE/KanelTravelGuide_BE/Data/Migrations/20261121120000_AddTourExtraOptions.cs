using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KanelTravelGuide_BE.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261121120000_AddTourExtraOptions")]
public class AddTourExtraOptions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable("TourExtraOptions", columns: table => new
        {
            option_id = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
            tour_id = table.Column<int>(nullable: false),
            service_item_id = table.Column<int>(nullable: true),
            schedule_id = table.Column<int>(nullable: true),
            is_enabled = table.Column<bool>(nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_TourExtraOptions", x => x.option_id);
            table.CheckConstraint("CK_TourExtraOptions_Target", "([service_item_id] IS NOT NULL AND [schedule_id] IS NULL) OR ([service_item_id] IS NULL AND [schedule_id] IS NOT NULL)");
            table.ForeignKey("FK_TourExtraOptions_TourPackages_tour_id", x => x.tour_id, "TourPackages", "tour_id", onDelete: ReferentialAction.Cascade);
            table.ForeignKey("FK_TourExtraOptions_ServiceItems_service_item_id", x => x.service_item_id, "ServiceItems", "item_id", onDelete: ReferentialAction.Cascade);
            table.ForeignKey("FK_TourExtraOptions_Schedules_schedule_id", x => x.schedule_id, "Schedules", "schedule_id", onDelete: ReferentialAction.Cascade);
        });
        migrationBuilder.CreateIndex("IX_TourExtraOptions_tour_id_service_item_id", "TourExtraOptions", new[] { "tour_id", "service_item_id" }, unique: true, filter: "[service_item_id] IS NOT NULL");
        migrationBuilder.CreateIndex("IX_TourExtraOptions_tour_id_schedule_id", "TourExtraOptions", new[] { "tour_id", "schedule_id" }, unique: true, filter: "[schedule_id] IS NOT NULL");
        migrationBuilder.CreateIndex("IX_TourExtraOptions_service_item_id", "TourExtraOptions", "service_item_id");
        migrationBuilder.CreateIndex("IX_TourExtraOptions_schedule_id", "TourExtraOptions", "schedule_id");
        // Preserve the previously visible destination-based suggestions as initial links.
        migrationBuilder.Sql("""
            INSERT INTO dbo.TourExtraOptions (tour_id, service_item_id, schedule_id, is_enabled)
            SELECT t.tour_id, i.item_id, NULL, 1
            FROM dbo.TourPackages t
            JOIN dbo.TouristSpots p ON p.spot_id = t.spot_id
            JOIN dbo.ServiceProviders v ON v.location_id = p.location_id
            JOIN dbo.ServiceItems i ON i.provider_id = v.provider_id
            WHERE v.is_active = 1 AND i.is_available = 1 AND i.price > 0;
            INSERT INTO dbo.TourExtraOptions (tour_id, service_item_id, schedule_id, is_enabled)
            SELECT t.tour_id, NULL, s.schedule_id, 1
            FROM dbo.TourPackages t
            JOIN dbo.TouristSpots p ON p.spot_id = t.spot_id
            JOIN dbo.TransportRoutes r ON r.destination_location_id = p.location_id
            JOIN dbo.Schedules s ON s.route_id = r.route_id
            WHERE s.status = N'Running' AND s.ticket_price > 0;
            """);
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("TourExtraOptions");
}
