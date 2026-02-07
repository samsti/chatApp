using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Dtos;
using server.Entities;
using server.Services;
using StateleSSE.AspNetCore;

namespace server.Controllers;

public class ChatController(ISseBackplane backplane, JwtService jwtService, MyDbContext ctx) : ControllerBase
{
    [HttpPost(nameof(Login))]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto requestDto)
    {
        var user = await ctx.users.FirstOrDefaultAsync(u => u.nickname == requestDto.Username);
        if (user == null)
            return Unauthorized(new { message = "Wrong credentials" });

        var computedHash = Convert.ToBase64String(
            SHA256.HashData(Encoding.UTF8.GetBytes(requestDto.Password + user.salt))
        );

        if (user.hash != computedHash)
            return Unauthorized(new { message = "Wrong credentials" });

        var token = jwtService.GenerateToken(user.id);
        return Ok(new { token });
    }

    
    [HttpPost(nameof(Register))]
    public async Task<IActionResult> Register([FromBody] LoginRequestDto requestDto)
    {
        var existingUser = ctx.users.FirstOrDefault(u => u.nickname == requestDto.Username);
        if (existingUser != null)
        {
            throw new ValidationException("User already exists");
        }

        var salt = Guid.NewGuid().ToString();

        var hash = Convert.ToBase64String(
            SHA256.HashData(
                Encoding.UTF8.GetBytes(requestDto.Password + salt)
            )
        );

        var user = new user
        {
            id = Guid.NewGuid().ToString(),
            nickname = requestDto.Username,
            salt = salt,
            hash = hash
        };

        ctx.users.Add(user);
        await ctx.SaveChangesAsync();
        
        var token = jwtService.GenerateToken(user.id);
        
        return Ok(new { token });
    }

    
    
}