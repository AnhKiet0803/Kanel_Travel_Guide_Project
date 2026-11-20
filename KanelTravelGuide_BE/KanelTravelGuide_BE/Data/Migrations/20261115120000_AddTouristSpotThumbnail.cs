using KanelTravelGuide_BE.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KanelTravelGuide_BE.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261115120000_AddTouristSpotThumbnail")]
public class AddTouristSpotThumbnail : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<byte[]>(
            name: "thumbnail_image",
            table: "TouristSpots",
            type: "varbinary(max)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "thumbnail_image", table: "TouristSpots");
    }
}
