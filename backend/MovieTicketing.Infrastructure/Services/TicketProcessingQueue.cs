using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using MovieTicketing.Application.DTOs.Bookings;
using MovieTicketing.Application.Interfaces;

namespace MovieTicketing.Infrastructure.Services;

// In-memory channel queue for asynchronous background ticket/receipt jobs
public class TicketProcessingQueue : ITicketProcessingQueue
{
    private readonly Channel<TicketProcessingMessage> _channel;

    public TicketProcessingQueue()
    {
        // SingleReader optimizes channel performance since only 1 background worker consumes jobs
        _channel = Channel.CreateUnbounded<TicketProcessingMessage>(new UnboundedChannelOptions
        {
            SingleReader = true
        });
    }

    public async ValueTask QueueTicketProcessingAsync(TicketProcessingMessage message, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        await _channel.Writer.WriteAsync(message, cancellationToken);
    }

    public IAsyncEnumerable<TicketProcessingMessage> ReadAllAsync(CancellationToken cancellationToken = default)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
