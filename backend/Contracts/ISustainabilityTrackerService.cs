using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs.SustainabilityTracker;

namespace backend.Contracts
{
    public interface ISustainabilityTrackerService
    {
        Task<SustainabilityTrackerStatsDTO> GetSustainabilityData(Guid userId);
        Task<SustainabilityTrackerStatsDTO> GetGlobalSustainabilityData();
        backend.DTOs.Chat.ListingSustainabilityImpactDto GetImpactForListing(Listing listing);
        void UpdateWith(Guid userAId, Guid userBId, Listing listing);
    }
}