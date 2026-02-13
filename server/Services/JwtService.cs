using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace server.Services;

public class JwtService( IConfiguration configuration)
{

    public string GenerateToken(string userId)
    {
        var secret = configuration["Jwt:Key"] ?? "DEV_ONLY_CHANGE_ME_32_CHARS_MINIMUM";
        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
            claims: [new Claim(ClaimTypes.NameIdentifier, userId)],
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)), SecurityAlgorithms.HmacSha256)));
    }
}