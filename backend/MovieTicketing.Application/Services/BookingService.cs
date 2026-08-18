using MovieTicketing.Application.Common;
using MovieTicketing.Application.DTOs.Bookings;
using MovieTicketing.Application.Interfaces;
using MovieTicketing.Application.Interfaces.Repositories;
using MovieTicketing.Domain.Entities;
using MovieTicketing.Domain.Enums;

namespace MovieTicketing.Application.Services;

public class BookingService : IBookingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRedisCacheService _cache;
    private readonly IRealTimeNotificationService _notifier;
    private readonly ITicketProcessingQueue _ticketQueue;

    private static readonly TimeSpan LockTtl = TimeSpan.FromMinutes(5);

    public BookingService(
        IUnitOfWork unitOfWork,
        IRedisCacheService cache,
        IRealTimeNotificationService notifier,
        ITicketProcessingQueue ticketQueue)
    {
        _unitOfWork = unitOfWork;
        _cache = cache;
        _notifier = notifier;
        _ticketQueue = ticketQueue;
    }

    public async Task<ApiResponse<LockSeatsResponseDto>> LockSeatsAsync(string userId, LockSeatsRequestDto dto)
    {
        var locked = new List<int>();

        foreach (var seatId in dto.SeatIds)
        {
            var acquired = await _cache.AcquireSeatLockAsync(dto.ShowId, seatId, userId, LockTtl);
            if (!acquired)
            {
                // Roll back any locks we already acquired in this request
                foreach (var alreadyLocked in locked)
                    await _cache.ReleaseSeatLockAsync(dto.ShowId, alreadyLocked);

                return ApiResponse<LockSeatsResponseDto>.Fail("Seat is already selected by another user. Please choose a different seat.");
            }

            locked.Add(seatId);
        }

        // Broadcast seat locked status to all clients watching this show
        if (locked.Count > 0)
        {
            await _notifier.SendSeatLockedAsync(dto.ShowId, locked, userId);
        }

        return ApiResponse<LockSeatsResponseDto>.Ok(new LockSeatsResponseDto
        {
            Success = true,
            Message = "Seats locked successfully.",
            ExpiresInSeconds = (int)LockTtl.TotalSeconds,
            LockedSeatIds = locked
        });
    }

    // Releases locks when user deselects or leaves the page
    public async Task<ApiResponse<bool>> UnlockSeatsAsync(string userId, LockSeatsRequestDto dto)
    {
        foreach (var seatId in dto.SeatIds)
        {
            await _cache.ReleaseSeatLockAsync(dto.ShowId, seatId);
        }

        if (dto.SeatIds.Count > 0)
        {
            await _notifier.SendSeatUnlockedAsync(dto.ShowId, dto.SeatIds);
        }

        return ApiResponse<bool>.Ok(true, "Seats unlocked.");
    }

    public async Task<ApiResponse<BookingResponseDto>> CheckoutAsync(string userId, CheckoutRequestDto dto)
    {
        var show = await _unitOfWork.Shows.GetWithDetailsByIdAsync(dto.ShowId);
        if (show == null || !show.IsActive)
            return ApiResponse<BookingResponseDto>.Fail("Show not found or is no longer active.");

        var screen = await _unitOfWork.Screens.GetWithSeatsByIdAsync(show.ScreenId);
        if (screen == null)
            return ApiResponse<BookingResponseDto>.Fail("Screen not found.");

        var screenSeatIds = screen.Seats.Select(s => s.Id).ToHashSet();
        var invalidSeats = dto.SeatIds.Where(id => !screenSeatIds.Contains(id)).ToList();
        if (invalidSeats.Any())
            return ApiResponse<BookingResponseDto>.Fail("One or more selected seats do not belong to this show's screen.");

        // Verify the user holds the Redis lock for every seat before we touch the DB
        foreach (var seatId in dto.SeatIds)
        {
            var owner = await _cache.GetSeatLockOwnerAsync(dto.ShowId, seatId);
            if (owner != null && owner != userId)
                return ApiResponse<BookingResponseDto>.Fail("Your seat reservation has expired. Please reselect your seats and try again.");
        }


        var concessionItemIds = dto.ConcessionItems.Select(c => c.ConcessionItemId).ToList();
        var concessionItems = new List<ConcessionItem>();

        await using var transaction = await _unitOfWork.BeginTransactionAsync();
        try
        {
            bool seatsAlreadyBooked = await _unitOfWork.Bookings.AreSeatsBookedForShowAsync(dto.ShowId, dto.SeatIds);
            if (seatsAlreadyBooked)
                return ApiResponse<BookingResponseDto>.Fail("One or more selected seats have already been booked. Please refresh and choose different seats.");

            // Load concession items with fresh data inside the transaction
            if (concessionItemIds.Any())
            {
                var allConcessions = await _unitOfWork.Concessions.GetAllAsync();
                concessionItems = allConcessions.Where(c => concessionItemIds.Contains(c.Id)).ToList();

                var missingIds = concessionItemIds.Except(concessionItems.Select(c => c.Id)).ToList();
                if (missingIds.Any())
                    return ApiResponse<BookingResponseDto>.Fail("One or more concession items were not found.");
            }

            // Check concession stock availability
            foreach (var orderItem in dto.ConcessionItems)
            {
                var item = concessionItems.First(c => c.Id == orderItem.ConcessionItemId);
                if (!item.IsAvailable)
                    return ApiResponse<BookingResponseDto>.Fail($"'{item.ItemName} ({item.ItemSize})' is currently unavailable.");

                if (item.StockCount < orderItem.Quantity)
                    return ApiResponse<BookingResponseDto>.Fail($"Insufficient stock for '{item.ItemName} ({item.ItemSize})'. Requested: {orderItem.Quantity}, Available: {item.StockCount}.");
            }

            // Decrement concession stock
            foreach (var orderItem in dto.ConcessionItems)
            {
                var item = concessionItems.First(c => c.Id == orderItem.ConcessionItemId);
                item.StockCount -= orderItem.Quantity;
                item.IsAvailable = item.StockCount > 0;
                item.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Concessions.Update(item);
            }

            // Calculate seat prices
            var seatLookup = screen.Seats.ToDictionary(s => s.Id);
            decimal ticketsTotal = 0m;

            // Read multipliers from the screen config — same pattern as ShowService.
            // Falls back to sensible defaults if the screen values are not set.
            decimal premMult = screen.PremiumMultiplier > 0 ? screen.PremiumMultiplier : 1.3m;
            decimal vipMult  = screen.VipMultiplier    > 0 ? screen.VipMultiplier    : 1.6m;

            // Tuple now carries SeatNumber and SeatType as snapshots (real-world receipt pattern)
            var bookingSeatEntities = new List<(int SeatId, string SeatNumber, SeatType SeatType, decimal Price)>();

            foreach (var seatId in dto.SeatIds)
            {
                var seat = seatLookup[seatId];
                decimal multiplier = seat.SeatType switch
                {
                    SeatType.Premium  => premMult,
                    SeatType.VIP      => vipMult,
                    SeatType.Standard => 1.0m,
                    _                 => 1.0m
                };
                decimal price = Math.Round(show.BaseTicketPrice * multiplier, 2);
                ticketsTotal += price;
                bookingSeatEntities.Add((seatId, seat.SeatNumber, seat.SeatType, price));
            }

            decimal concessionsTotal = dto.ConcessionItems.Sum(orderItem =>
            {
                var item = concessionItems.First(c => c.Id == orderItem.ConcessionItemId);
                return item.Price * orderItem.Quantity;
            });

            var booking = new Booking
            {
                UserId = userId,
                ShowId = dto.ShowId,
                TotalAmount = ticketsTotal + concessionsTotal,
                Status = BookingStatus.Confirmed,
                BookedAt = DateTime.UtcNow,
                BookingReference = GenerateBookingReference()
            };

            await _unitOfWork.Bookings.AddAsync(booking);
            await _unitOfWork.SaveChangesAsync();

            foreach (var (seatId, seatNumber, seatType, price) in bookingSeatEntities)
            {
                booking.BookingSeats.Add(new BookingSeat
                {
                    BookingId = booking.Id,
                    SeatId = seatId,
                    ShowId = dto.ShowId,
                    Price = price,
                    // Snapshot the seat details at time of purchase
                    SeatNumber = seatNumber,
                    SeatType = seatType
                });
            }

            foreach (var orderItem in dto.ConcessionItems)
            {
                var item = concessionItems.First(c => c.Id == orderItem.ConcessionItemId);
                booking.BookingConcessions.Add(new BookingConcession
                {
                    BookingId = booking.Id,
                    ConcessionItemId = item.Id,
                    ItemName = item.ItemName,
                    ItemSize = item.ItemSize,
                    Quantity = orderItem.Quantity,
                    UnitPrice = item.Price,
                    Subtotal = item.Price * orderItem.Quantity
                });
            }

            await _unitOfWork.SaveChangesAsync();
            await transaction.CommitAsync();

            // locks released after commit — seats now permanently booked in DB
            foreach (var seatId in dto.SeatIds)
                await _cache.ReleaseSeatLockAsync(dto.ShowId, seatId);

            // Broadcast real-time seat booked event to all users viewing this show
            await _notifier.SendSeatBookedAsync(dto.ShowId, dto.SeatIds);

            // Check for low-stock concessions and broadcast real-time alerts to AdminHub
            foreach (var orderItem in dto.ConcessionItems)
            {
                var item = concessionItems.First(c => c.Id == orderItem.ConcessionItemId);
                if (item.StockCount <= 5 || (item.BaseStockCount > 0 && item.StockCount <= (int)Math.Ceiling(item.BaseStockCount * 0.20)))
                {
                    var branchInfo = item.Theater != null ? $" ({item.Theater.Name})" : (screen.Theater != null ? $" ({screen.Theater.Name})" : "");
                    await _notifier.SendLowStockAlertAsync(item.Id, $"{item.ItemName}{branchInfo}", item.ItemSize, item.StockCount, item.BaseStockCount);
                }
            }

            // Enqueue non-blocking background task for simulated PDF generation and email delivery
            var seatNumbersList = bookingSeatEntities.Select(b => b.SeatNumber).ToList();
            await _ticketQueue.QueueTicketProcessingAsync(new TicketProcessingMessage
            {
                BookingId = booking.Id,
                BookingReference = booking.BookingReference,
                UserId = userId,
                UserEmail = "customer@cinemate.com",
                UserFullName = "Valued Customer",
                MovieTitle = show.Movie?.Title ?? "Movie Screening",
                ScreenName = show.Screen?.Name ?? "Main Screen",
                ShowTime = show.ShowTime,
                SeatNumbers = seatNumbersList,
                TotalAmount = booking.TotalAmount,
                BookedAt = booking.BookedAt
            });

            var response = BuildBookingResponse(booking, show, seatLookup, dto.ConcessionItems, concessionItems, ticketsTotal, concessionsTotal);
            return ApiResponse<BookingResponseDto>.Ok(response, "Booking confirmed successfully!");
        }
        catch (Exception)
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<ApiResponse<List<BookingResponseDto>>> GetUserBookingsAsync(string userId)
    {
        var bookings = await _unitOfWork.Bookings.GetByUserIdAsync(userId);
        var result = bookings.Select(b => MapToSimpleDto(b)).ToList();
        return ApiResponse<List<BookingResponseDto>>.Ok(result);
    }

    public async Task<ApiResponse<BookingResponseDto>> GetBookingByIdAsync(int bookingId, string userId)
    {
        var booking = await _unitOfWork.Bookings.GetWithDetailsByIdAsync(bookingId);
        if (booking == null)
            return ApiResponse<BookingResponseDto>.Fail("Booking not found.");

        if (booking.UserId != userId)
            return ApiResponse<BookingResponseDto>.Fail("Booking not found.");

        return ApiResponse<BookingResponseDto>.Ok(MapToSimpleDto(booking));
    }

    private static string GenerateBookingReference()
    {
        var date = DateTime.UtcNow.ToString("yyyyMMdd");
        var random = Guid.NewGuid().ToString("N")[..6].ToUpper();
        return $"BK-{date}-{random}";
    }

    private static BookingResponseDto BuildBookingResponse(
        Booking booking,
        Show show,
        Dictionary<int, Seat> seatLookup,
        List<CheckoutConcessionItemDto> orderedConcessions,
        List<ConcessionItem> concessionItems,
        decimal ticketsTotal,
        decimal concessionsTotal)
    {
        var seats = booking.BookingSeats.Select(bs =>
        {
            var seat = seatLookup.GetValueOrDefault(bs.SeatId);
            return new BookingSeatResponseDto
            {
                SeatId = bs.SeatId,
                // Read from snapshot columns — immune to future theater remodels
                SeatNumber = bs.SeatNumber,
                SeatType = bs.SeatType,
                SeatTypeName = bs.SeatType.ToString(),
                Row = seat?.Row ?? 0,
                Column = seat?.Column ?? 0,
                Price = bs.Price
            };
        }).ToList();

        var concessions = orderedConcessions.Select(oc =>
        {
            var item = concessionItems.First(c => c.Id == oc.ConcessionItemId);
            return new BookingConcessionResponseDto
            {
                ConcessionItemId = item.Id,
                ItemName = item.ItemName,
                ItemSize = item.ItemSize,
                Quantity = oc.Quantity,
                UnitPrice = item.Price,
                Subtotal = item.Price * oc.Quantity
            };
        }).ToList();

        return new BookingResponseDto
        {
            Id = booking.Id,
            BookingReference = booking.BookingReference,
            ShowId = booking.ShowId,
            MovieTitle = show.Movie?.Title ?? string.Empty,
            PosterUrl = show.Movie?.PosterUrl ?? string.Empty,
            ScreenName = show.Screen?.Name ?? string.Empty,
            ShowTime = show.ShowTime,
            Seats = seats,
            Concessions = concessions,
            TicketsTotal = ticketsTotal,
            ConcessionsTotal = concessionsTotal,
            TotalAmount = booking.TotalAmount,
            Status = booking.Status,
            StatusName = booking.Status.ToString(),
            BookedAt = booking.BookedAt
        };
    }

    private static BookingResponseDto MapToSimpleDto(Booking booking)
    {
        var seats = booking.BookingSeats.Select(bs => new BookingSeatResponseDto
        {
            SeatId = bs.SeatId,
            // Read from snapshot columns — immune to future theater remodels
            SeatNumber = bs.SeatNumber,
            SeatType = bs.SeatType,
            SeatTypeName = bs.SeatType.ToString(),
            Row = bs.Seat?.Row ?? 0,
            Column = bs.Seat?.Column ?? 0,
            Price = bs.Price
        }).ToList();

        var concessions = booking.BookingConcessions.Select(bc => new BookingConcessionResponseDto
        {
            ConcessionItemId = bc.ConcessionItemId,
            ItemName = bc.ItemName,
            ItemSize = bc.ItemSize,
            Quantity = bc.Quantity,
            UnitPrice = bc.UnitPrice,
            Subtotal = bc.Subtotal
        }).ToList();

        decimal ticketsTotal = seats.Sum(s => s.Price);
        decimal concessionsTotal = concessions.Sum(c => c.Subtotal);

        return new BookingResponseDto
        {
            Id = booking.Id,
            BookingReference = booking.BookingReference,
            ShowId = booking.ShowId,
            MovieTitle = booking.Show?.Movie?.Title ?? string.Empty,
            PosterUrl = booking.Show?.Movie?.PosterUrl ?? string.Empty,
            ScreenName = booking.Show?.Screen?.Name ?? string.Empty,
            ShowTime = booking.Show?.ShowTime ?? default,
            Seats = seats,
            Concessions = concessions,
            TicketsTotal = ticketsTotal,
            ConcessionsTotal = concessionsTotal,
            TotalAmount = booking.TotalAmount,
            Status = booking.Status,
            StatusName = booking.Status.ToString(),
            BookedAt = booking.BookedAt
        };
    }
}
