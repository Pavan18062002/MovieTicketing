using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicketing.Application.DTOs.Bookings;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.API.Controllers;

[ApiController]
[Route("api/booking")]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    /// <summary>Book seats and optionally order concessions for a show.</summary>
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequestDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _bookingService.CheckoutAsync(userId, dto);
        return result.Success
            ? CreatedAtAction(nameof(GetBookingById), new { id = result.Data!.Id }, result)
            : BadRequest(result);
    }

    /// <summary>Get all bookings for the currently logged-in user.</summary>
    [HttpGet("my-bookings")]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _bookingService.GetUserBookingsAsync(userId);
        return Ok(result);
    }

    /// <summary>Get a single booking by ID — only accessible by the booking's owner.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetBookingById(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var result = await _bookingService.GetBookingByIdAsync(id, userId);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
