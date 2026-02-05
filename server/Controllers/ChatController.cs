using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using server.Data;
using server.Dtos;
using server.Services;
using StateleSSE.AspNetCore;

namespace server.Controllers;

public class ChatController(ISseBackplane backplane, JwtService jwtService, MyDbContext ctx) : ControllerBase
{
    [HttpPost(nameof(Login))]
    public async Task Login([FromBody] LoginRequestDto requestDto)
    {
        var user = ctx.users.FirstOrDefault(u => u.nickname == requestDto.Username);
        if (user == null)
        {
            throw new ValidationException("User do not exist");
        }

        if (user.hash ==
            Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(requestDto.Password + user.salt))))
        {
            throw new ValidationException("Wrong credentials");
        }
    }
}