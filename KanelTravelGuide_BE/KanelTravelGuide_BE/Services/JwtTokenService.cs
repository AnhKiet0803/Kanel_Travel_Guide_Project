using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using KanelTravelGuide_BE.Models;
using Microsoft.IdentityModel.Tokens;

namespace KanelTravelGuide_BE.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string CreateToken(User user)
    {
        var section = _configuration.GetSection("Jwt");
        var keyText = section["Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
        var issuer = section["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is missing.");
        var audience = section["Audience"] ?? throw new InvalidOperationException("Jwt:Audience is missing.");
        var expiresDays = int.TryParse(section["ExpiresDays"], out var days) ? days : 7;

        var handler = new JwtSecurityTokenHandler();
        handler.OutboundClaimTypeMap.Clear();

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims:
            [
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            ],
            expires: DateTime.UtcNow.AddDays(expiresDays),
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyText)),
                SecurityAlgorithms.HmacSha256));

        return handler.WriteToken(token);
    }
}
