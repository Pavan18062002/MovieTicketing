using Microsoft.AspNetCore.SignalR;

namespace MovieTicketing.Infrastructure.Hubs;

public class ShowHub : Hub
{
    // Group users by showId so seat updates only go to people viewing this exact show
    public async Task JoinShowGroup(int showId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GetGroupName(showId));
    }

    public async Task LeaveShowGroup(int showId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GetGroupName(showId));
    }

    public static string GetGroupName(int showId) => $"show-{showId}";
}
