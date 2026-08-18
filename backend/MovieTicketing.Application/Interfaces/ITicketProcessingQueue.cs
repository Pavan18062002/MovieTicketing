using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MovieTicketing.Application.DTOs.Bookings;

namespace MovieTicketing.Application.Interfaces;

public interface ITicketProcessingQueue
{
    ValueTask QueueTicketProcessingAsync(TicketProcessingMessage message, CancellationToken cancellationToken = default);
    IAsyncEnumerable<TicketProcessingMessage> ReadAllAsync(CancellationToken cancellationToken = default);
}
