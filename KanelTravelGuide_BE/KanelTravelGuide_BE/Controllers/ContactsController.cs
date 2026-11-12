using KanelTravelGuide_BE.Contracts;
using KanelTravelGuide_BE.Data;
using KanelTravelGuide_BE.Models;
using Microsoft.AspNetCore.Mvc;

namespace KanelTravelGuide_BE.Controllers;

[ApiController]
[Route("api/contacts")]
public class ContactsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ContactsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    public async Task<IActionResult> Create(ContactRequest request)
    {
        var contact = new Contact
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            Subject = string.IsNullOrWhiteSpace(request.Subject) ? null : request.Subject.Trim(),
            Message = request.Message.Trim(),
            IsResponded = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Contacts.Add(contact);
        await _db.SaveChangesAsync();

        return Created($"/api/contacts/{contact.ContactId}", new
        {
            contact.ContactId,
            contact.IsResponded,
            contact.CreatedAt
        });
    }
}
