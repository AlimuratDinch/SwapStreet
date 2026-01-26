using backend.DTOs;
using backend.Models;
namespace backend.Contracts;

public interface IListingCommandService
{
    Task<Guid> CreateListingAsync(CreateListingRequestDto request, CancellationToken cancellationToken = default);
}
