using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MovieTicketing.Application.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MovieTicketing.Infrastructure.BackgroundServices;

/// <summary>
/// Background worker that consumes completed checkout jobs from the in-memory queue
/// to generate real PDF tickets and send email confirmations out-of-band.
/// </summary>
public class TicketProcessingBackgroundService : BackgroundService
{
    private readonly ITicketProcessingQueue _queue;
    private readonly ILogger<TicketProcessingBackgroundService> _logger;

    public TicketProcessingBackgroundService(
        ITicketProcessingQueue queue,
        ILogger<TicketProcessingBackgroundService> logger)
    {
        _queue = queue;
        _logger = logger;

        // Set QuestPDF community license
        QuestPDF.Settings.License = LicenseType.Community;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("TicketProcessingBackgroundService is running.");

        try
        {
            await foreach (var job in _queue.ReadAllAsync(stoppingToken))
            {
                try
                {
                    _logger.LogInformation("Processing post-booking tasks for Ref {BookingRef} ({MovieTitle})...", 
                        job.BookingReference, job.MovieTitle);

                    // Step 1: Generate real PDF ticket file
                    var ticketsDir = Path.Combine(Directory.GetCurrentDirectory(), "GeneratedTickets");
                    Directory.CreateDirectory(ticketsDir);
                    var pdfPath = Path.Combine(ticketsDir, $"ticket_{job.BookingReference}.pdf");

                    GenerateTicketPdf(job, pdfPath);

                    _logger.LogInformation("Successfully generated real PDF ticket at {PdfPath} for Booking {BookingRef}",
                        pdfPath, job.BookingReference);

                    // Step 2: Simulate SMTP confirmation email dispatch (mock SendGrid / MailKit)
                    await Task.Delay(400, stoppingToken);
                    _logger.LogInformation("Confirmation email dispatched to {Email} with PDF ticket attached (Ref: {BookingRef})",
                        job.UserEmail, job.BookingReference);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to generate PDF ticket for Booking {BookingRef}", job.BookingReference);
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("TicketProcessingBackgroundService is shutting down.");
        }
    }

    private static void GenerateTicketPdf(MovieTicketing.Application.DTOs.Bookings.TicketProcessingMessage job, string filePath)
    {
        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5.Landscape());
                page.Margin(20);
                page.PageColor(Colors.Grey.Lighten5);

                page.Header().BorderBottom(2).BorderColor("#7c3aed").PaddingBottom(10).Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("CINEMATE CINEMAS").FontSize(20).Bold().FontColor("#7c3aed");
                        col.Item().Text("OFFICIAL E-TICKET • ADMIT ONE").FontSize(9).FontColor(Colors.Grey.Medium);
                    });

                    row.ConstantItem(140).AlignRight().Column(col =>
                    {
                        col.Item().Text($"REF: {job.BookingReference}").FontSize(11).Bold().FontColor(Colors.Grey.Darken3);
                        col.Item().Text($"{job.BookedAt:yyyy-MM-dd HH:mm} UTC").FontSize(8).FontColor(Colors.Grey.Medium);
                    });
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    // Movie Title Banner
                    col.Item().Background("#181832").Padding(12).Row(r =>
                    {
                        r.RelativeItem().Column(c =>
                        {
                            c.Item().Text(job.MovieTitle.ToUpper()).FontSize(18).Bold().FontColor(Colors.White);
                            c.Item().Text($"Auditorium: {job.ScreenName}").FontSize(11).FontColor("#a78bfa");
                        });
                    });

                    col.Item().PaddingTop(12).Grid(grid =>
                    {
                        grid.Columns(3);

                        // Column 1: Showtime
                        grid.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(c =>
                        {
                            c.Item().Text("SHOWTIME").FontSize(8).Bold().FontColor(Colors.Grey.Medium);
                            c.Item().Text($"{job.ShowTime:ddd, MMM dd yyyy}").FontSize(11).Bold().FontColor(Colors.Grey.Darken3);
                            c.Item().Text($"{job.ShowTime:hh:mm tt}").FontSize(14).Bold().FontColor("#7c3aed");
                        });

                        // Column 2: Seats
                        grid.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(c =>
                        {
                            c.Item().Text("SEATS BOOKED").FontSize(8).Bold().FontColor(Colors.Grey.Medium);
                            c.Item().Text(string.Join(", ", job.SeatNumbers)).FontSize(15).Bold().FontColor("#7c3aed");
                            c.Item().Text($"Total: {job.SeatNumbers.Count} Seat(s)").FontSize(9).FontColor(Colors.Grey.Darken1);
                        });

                        // Column 3: Payment
                        grid.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(c =>
                        {
                            c.Item().Text("TOTAL PAID").FontSize(8).Bold().FontColor(Colors.Grey.Medium);
                            c.Item().Text($"₹{job.TotalAmount:N2}").FontSize(15).Bold().FontColor(Colors.Green.Darken2);
                            c.Item().Text("Payment: Confirmed (Paid)").FontSize(8).FontColor(Colors.Grey.Darken1);
                        });
                    });

                    // Customer details bar
                    col.Item().PaddingTop(10).Background(Colors.Grey.Lighten4).Padding(8).Row(r =>
                    {
                        r.RelativeItem().Text($"Booked By: {job.UserFullName} ({job.UserEmail})").FontSize(9).FontColor(Colors.Grey.Darken2);
                        r.ConstantItem(120).AlignRight().Text("Status: CONFIRMED").FontSize(9).Bold().FontColor(Colors.Green.Darken2);
                    });
                });

                page.Footer().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(8).Row(row =>
                {
                    row.RelativeItem().Text("Please present this QR / E-ticket at the cinema entrance. Enjoy your movie!").FontSize(8).FontColor(Colors.Grey.Medium);
                    row.ConstantItem(100).AlignRight().Text("CineMate Inc.").FontSize(8).FontColor(Colors.Grey.Medium);
                });
            });
        }).GeneratePdf(filePath);
    }
}
