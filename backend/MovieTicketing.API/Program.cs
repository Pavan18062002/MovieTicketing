using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MovieTicketing.Infrastructure.Data;
using MovieTicketing.Application.Services;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Infrastructure.Services;
using MovieTicketing.API.Swagger;
using MovieTicketing.Infrastructure.Hubs;
using MovieTicketing.Domain.Entities;
using StackExchange.Redis;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure EF Core to use PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));
builder.Services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

// Redis setup — safe initialization with fallback to in-memory
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
IConnectionMultiplexer? redisMultiplexer = null;

if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    try
    {
        var redisOptions = ConfigurationOptions.Parse(redisConnectionString);
        redisOptions.AbortOnConnectFail = false;
        redisOptions.ConnectTimeout = 1000;
        redisMultiplexer = ConnectionMultiplexer.Connect(redisOptions);
    }
    catch
    {
        // Connection failed, fall back gracefully
    }
}

if (redisMultiplexer != null && redisMultiplexer.IsConnected)
{
    builder.Services.AddSingleton<IConnectionMultiplexer>(redisMultiplexer);
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
        options.InstanceName = "MovieTicketing:";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
    builder.Services.AddSingleton<IConnectionMultiplexer>(_ => null!);
}

builder.Services.AddSingleton<IRedisCacheService, RedisCacheService>();

// Configure ASP.NET Core Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is missing in appsettings.json.");

builder.Services.AddAuthentication(options =>
{
    // Tell ASP.NET to use JWT bearer tokens for authentication
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Configure how the tokens should be validated
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };

    // Support JWT tokens over SignalR WebSocket query string
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Configure SignalR real-time messaging
builder.Services.AddSignalR();
builder.Services.AddScoped<IRealTimeNotificationService, RealTimeNotificationService>();

// Configure Asynchronous Background Processing
builder.Services.AddSingleton<ITicketProcessingQueue, MovieTicketing.Infrastructure.Services.TicketProcessingQueue>();
builder.Services.AddHostedService<MovieTicketing.Infrastructure.BackgroundServices.TicketProcessingBackgroundService>();

builder.Services.AddScoped<MovieTicketing.Application.Interfaces.Repositories.IUnitOfWork, MovieTicketing.Infrastructure.Repositories.UnitOfWork>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMovieService, MovieService>();
builder.Services.AddScoped<IScreenService, ScreenService>();
builder.Services.AddScoped<IShowService, ShowService>();
builder.Services.AddScoped<IConcessionService, ConcessionService>();
builder.Services.AddScoped<IBookingService, BookingService>();

// Add support for controllers and override default validation response
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value != null && e.Value.Errors.Count > 0)
                .SelectMany(x => x.Value!.Errors)
                .Select(x => x.ErrorMessage).ToList();

            var response = MovieTicketing.Application.Common.ApiResponse<object>.Fail(errors);
            return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(response);
        };
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "MovieTicketing.API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    options.OperationFilter<AuthorizeCheckOperationFilter>();
});

// Configure CORS to allow our Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularDevClient",
        b =>
        {
            b.WithOrigins("http://localhost:4200")
             .AllowAnyHeader()
             .AllowAnyMethod()
             .AllowCredentials();
        });
});

var app = builder.Build();

// Seed Database on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<AppDbContext>();
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
    await DbSeeder.SeedAsync(context, userManager, roleManager);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<MovieTicketing.API.Middleware.ExceptionHandlingMiddleware>();

app.UseHttpsRedirection();

app.UseCors("AllowAngularDevClient");

// Must be exactly in this order: Authentication first, Authorization second
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ShowHub>("/hubs/shows");
app.MapHub<AdminHub>("/hubs/admin");

app.Run();
