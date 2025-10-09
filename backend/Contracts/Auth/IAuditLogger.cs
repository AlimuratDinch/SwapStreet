using System.Text.Json;

namespace backend.Contracts.Auth
{
    public interface IAuditLogger
    {
        Task LogAsync(Guid? userId, string action, JsonDocument payload = null, string ipAddress = null);
    }
}
