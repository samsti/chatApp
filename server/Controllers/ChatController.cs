using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Entities;
using server.Services;
using StateleSSE.AspNetCore;

namespace server.Controllers;

[ApiController]
[Route("[controller]")]
public class ChatController(ISseBackplane backplane, JwtService jwtService, MyDbContext ctx) : ControllerBase
{
    [HttpPost(nameof(Login))]
    public async Task<IActionResult> Login([FromBody] LoginRequest requestDto)
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
    public async Task<IActionResult> Register([FromBody] LoginRequest requestDto)
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
    
    [HttpGet(nameof(Connect))]
    [Produces<ConnectionResponse>]
    public async Task Connect()
    {
        await using var sse = await HttpContext.OpenSseStreamAsync();
        await using var connection = backplane.CreateConnection();

        await sse.WriteAsync(nameof(ConnectionResponse), JsonSerializer.Serialize(new ConnectionResponse(connection.ConnectionId), new JsonSerializerOptions()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
        
        await foreach (var evt in connection.ReadAllAsync(HttpContext.RequestAborted))
        {
            if (evt.Group != null)
                await sse.WriteAsync(evt.Group, evt.Data);
            else
                await sse.WriteAsync(evt.Data);
        }
    }
    
    [Authorize]
    [HttpPost(nameof(JoinGroup))]
    [ProducesResponseType(typeof(JoinGroupBroadcast), 202)]
    [ProducesResponseType(typeof(JoinGroupResponse), 200)]
    [ProducesResponseType(typeof(UserLeftResponse), 400)]
    public async Task<JoinGroupResponse> JoinGroup([FromBody] JoinGroupRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var u = ctx.users.FirstOrDefault(u => u.id == userId);
        var room = ctx.rooms.FirstOrDefault(r => r.id == request.Group) ??
                   throw new ValidationException("Room does not exist");
        var name = u?.nickname ?? "Anonymous";
        await backplane.Groups.AddToGroupAsync("nickname/"+request.ConnectionId, name);
        await backplane.Groups.AddToGroupAsync(request.ConnectionId, request.Group);
        var members = await backplane.Groups.GetMembersAsync(request.Group);
        var list = new List<ConnectionIdAndUserName>();
        foreach (var m in members)
        {
            var nickname = await backplane.Groups.GetClientGroupsAsync("nickname/" + m);
            list.Add(new ConnectionIdAndUserName(m, nickname.FirstOrDefault() ?? "Anonymous"));
        }
        await backplane.Clients.SendToGroupAsync(request.Group, new JoinGroupBroadcast(list));
        
        return new JoinGroupResponse(room);
    }

    [Authorize]
    [HttpPost(nameof(Poke))]
    [ProducesResponseType(typeof(PokeResponseDto), 200)]
    public async Task Poke(PokeRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var u = ctx.users.FirstOrDefault(u => u.id == userId);
        var name = u?.nickname ?? "Anonymous";

        await backplane.Clients.SendToClientAsync(dto.connectionIdToPoke, new PokeResponseDto(name));
    }

    [Authorize]
    [HttpPost(nameof(SendMessageToGroup))]
    [Produces<MessageResponseDto>]
    public async Task SendMessageToGroup([FromBody] SendGroupMessageRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var u = ctx.users.FirstOrDefault(u => u.id == userId);
        var name = u?.nickname ?? "Anonymous";
        var message = new message()
        {
            user_id = userId,
            content = dto.Message,
            room_id = dto.GroupId,
            id = Guid.NewGuid().ToString(),
            created_at = DateTimeOffset.UtcNow.UtcDateTime,
        };
        ctx.messages.Add(message);
        await ctx.SaveChangesAsync();
        await backplane.Clients.SendToGroupAsync(dto.GroupId, new RoomMessageEvent
        {
            Msg = new RoomMessagePayload
            {
                Id = message.id,
                RoomId = message.room_id,
                UserId = name,
                Content = message.content,
                CreatedAtUtc = message.created_at.ToString("O")
            }
        });
    }

    [Authorize]
    [HttpPost(nameof(CreateRoom))]
    public async Task<ActionResult<room>> CreateRoom([FromBody] CreateRoomRequest dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ValidationException("Room name required");

        var room = new room
        {
            id = Guid.NewGuid().ToString(),
            name = dto.Name.Trim(),
            created_by = userId
        };

        ctx.rooms.Add(room);
        await ctx.SaveChangesAsync();

        return Ok(room);
    }


    [HttpGet(nameof(GetRooms))]
    public async Task<List<room>> GetRooms()
        => await ctx.rooms.ToListAsync();

    [Authorize]
    [HttpGet(nameof(GetRoomMembers) + "/{roomId}")]
    public async Task<List<ConnectionIdAndUserName>> GetRoomMembers(string roomId)
    {
        var members = await backplane.Groups.GetMembersAsync(roomId);
        var list = new List<ConnectionIdAndUserName>();
        foreach (var m in members)
        {
            var nickname = await backplane.Groups.GetClientGroupsAsync("nickname/" + m);
            list.Add(new ConnectionIdAndUserName(m, nickname.FirstOrDefault() ?? "Anonymous"));
        }
        return list;
    }

    [HttpGet(nameof(GetMessages) + "/{roomId}")]
    public async Task<IActionResult> GetMessages(string roomId)
    {
        var msgs = await ctx.messages
            .Where(m => m.room_id == roomId)
            .OrderBy(m => m.created_at)
            .Include(m => m.user)
            .ToListAsync();

        return Ok(msgs.Select(m => new RoomMessagePayload
        {
            Id = m.id,
            RoomId = m.room_id,
            UserId = m.user?.nickname ?? "Anonymous",
            Content = m.content,
            CreatedAtUtc = m.created_at.ToString("O")
        }));
    }
    
    
    public record PokeResponseDto(string pokedBy) : BaseResponseDto;
    public record PokeRequestDto(string connectionIdToPoke);

    public record JoinGroupResponse(room room) : BaseResponseDto;
    public record ConnectionResponse(string ConnectionId) : BaseResponseDto;
    public record UserLeftResponse(string ConnectionId) : BaseResponseDto;
    
    public record JoinGroupRequest(string ConnectionId, string Group);

    public record SendGroupMessageRequestDto
    {
        public string Message { get; set; } = "";
        public string GroupId { get; set; } = "";
    }
    
    public record MessageResponseDto : BaseResponseDto
    {
        public string Message { get; set; } = "";
        public string? User { get; set; } = "";
    }
    
    public record CreateRoomRequest(string Name);

    public record LoginRequest(string Username, string Password);
    public record LoginResponse(string Token);


    public record JoinGroupBroadcast(List<ConnectionIdAndUserName> ConnectedUsers) : BaseResponseDto;

    public record ConnectionIdAndUserName(
        [property: JsonPropertyName("connectionId")] string ConnectionId,
        [property: JsonPropertyName("userName")] string UserName);

    public record RoomMessageEvent : BaseResponseDto
    {
        [JsonPropertyName("message")]
        public RoomMessagePayload Msg { get; set; } = null!;
    }

    public record RoomMessagePayload
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";
        [JsonPropertyName("roomId")]
        public string RoomId { get; set; } = "";
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = "";
        [JsonPropertyName("content")]
        public string Content { get; set; } = "";
        [JsonPropertyName("createdAtUtc")]
        public string CreatedAtUtc { get; set; } = "";
    }
}