using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KanelTravelGuide_BE.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261116113000_LinkFeedbackToTouristSpot")]
public class LinkFeedbackToTouristSpot : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>("spot_id", "Feedbacks", "int", nullable: true);
        migrationBuilder.CreateIndex("IX_Feedbacks_spot_id", "Feedbacks", "spot_id");
        migrationBuilder.AddForeignKey(
            "FK_Feedbacks_TouristSpots_spot_id", "Feedbacks", "spot_id", "TouristSpots",
            principalColumn: "spot_id", onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey("FK_Feedbacks_TouristSpots_spot_id", "Feedbacks");
        migrationBuilder.DropIndex("IX_Feedbacks_spot_id", "Feedbacks");
        migrationBuilder.DropColumn("spot_id", "Feedbacks");
    }
}
