using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/category-types")]
public class CategoryTypesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoryTypesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _db.CategoryTypes
            .AsNoTracking()
            .Select(c => new
            {
                c.CategoryId,
                c.CategoryName
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _db.CategoryTypes
            .AsNoTracking()
            .Where(c => c.CategoryId == id)
            .Select(c => new
            {
                c.CategoryId,
                c.CategoryName
            })
            .FirstOrDefaultAsync();

        if (category == null)
        {
            return NotFound(new { message = "Category not found." });
        }

        return Ok(category);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create(CategoryTypeRequest request)
    {
        var category = new CategoryType
        {
            CategoryName = request.CategoryName.Trim()
        };

        _db.CategoryTypes.Add(category);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = category.CategoryId }, new
        {
            category.CategoryId,
            category.CategoryName
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CategoryTypeRequest request)
    {
        var category = await _db.CategoryTypes.FindAsync(id);
        if (category == null)
        {
            return NotFound(new { message = "Category not found." });
        }

        category.CategoryName = request.CategoryName.Trim();
        await _db.SaveChangesAsync();

        return Ok(new
        {
            category.CategoryId,
            category.CategoryName
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _db.CategoryTypes.FindAsync(id);
        if (category == null)
        {
            return NotFound(new { message = "Category not found." });
        }

        _db.CategoryTypes.Remove(category);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
