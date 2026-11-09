using KanelTravelGuide_BE.Data;
using Microsoft.AspNetCore.Mvc;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _db;

    public HealthController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var canConnect = await _db.Database.CanConnectAsync();
        return Ok(new
        {
            status = "ok",
            database = canConnect ? "connected" : "unavailable"
        });
    }
}
