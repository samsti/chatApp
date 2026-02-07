using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Services;
using StackExchange.Redis;
using StateleSSE.AspNetCore.Extensions;

var builder = WebApplication.CreateBuilder(args);

var redis = builder.Configuration.GetConnectionString("Redis")
            ?? builder.Configuration["Redis"]; 

var db = builder.Configuration.GetConnectionString("Default")
         ?? builder.Configuration["DbConnectionString"];

if (string.IsNullOrWhiteSpace(redis))
    throw new Exception("Missing Redis connection string (ConnectionStrings:Redis or Redis).");

if (string.IsNullOrWhiteSpace(db))
    throw new Exception("Missing DB connection string (ConnectionStrings:Default or DbConnectionString).");

builder.Services.AddCors(options =>
{
    options.AddPolicy("dev", p =>
        p.WithOrigins("http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddControllers();
builder.Services.AddScoped<JwtService>();
builder.Services.AddSingleton<JwtService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<MyDbContext>(opt => opt.UseNpgsql(db));

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var config = ConfigurationOptions.Parse(redis);
    config.AbortOnConnectFail = false;
    return ConnectionMultiplexer.Connect(config);
});

builder.Services.AddRedisSseBackplane();

var app = builder.Build();

app.UseCors("dev");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();