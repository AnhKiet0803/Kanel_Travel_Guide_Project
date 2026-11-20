using KanelTravelGuide_BE.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KanelTravelGuide_BE.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261115140000_LinkFeedbackToTour")]
public class LinkFeedbackToTour : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>("tour_id", "Feedbacks", type: "int", nullable: true);
        migrationBuilder.CreateIndex("IX_Feedbacks_tour_id", "Feedbacks", "tour_id");
        migrationBuilder.AddForeignKey(
            name: "FK_Feedbacks_TourPackages_tour_id",
            table: "Feedbacks",
            column: "tour_id",
            principalTable: "TourPackages",
            principalColumn: "tour_id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey("FK_Feedbacks_TourPackages_tour_id", "Feedbacks");
        migrationBuilder.DropIndex("IX_Feedbacks_tour_id", "Feedbacks");
        migrationBuilder.DropColumn("tour_id", "Feedbacks");
    }
}
