using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace KanelTravelGuide_BE.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261116120000_LinkDestinationReviewAuthor")]
public class LinkDestinationReviewAuthor : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>("author_user_id", "Feedbacks", "int", nullable: true);
        migrationBuilder.CreateIndex("IX_Feedbacks_author_user_id", "Feedbacks", "author_user_id");
        migrationBuilder.AddForeignKey(
            "FK_Feedbacks_Users_author_user_id", "Feedbacks", "author_user_id", "Users",
            principalColumn: "user_id", onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey("FK_Feedbacks_Users_author_user_id", "Feedbacks");
        migrationBuilder.DropIndex("IX_Feedbacks_author_user_id", "Feedbacks");
        migrationBuilder.DropColumn("author_user_id", "Feedbacks");
    }
}
