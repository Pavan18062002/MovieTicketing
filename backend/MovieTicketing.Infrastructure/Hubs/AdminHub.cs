using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace MovieTicketing.Infrastructure.Hubs;

[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminHub : Hub
{
    public const string AdminGroupName = "admin-alerts";

    // Auto-join admins to the alert channel on connection
    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroupName);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, AdminGroupName);
        await base.OnDisconnectedAsync(exception);
    }
}
