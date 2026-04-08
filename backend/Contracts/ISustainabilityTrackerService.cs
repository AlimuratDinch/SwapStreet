using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using backend.DTOs.SustainabilityTracker;

namespace backend.Contracts
{
    public interface ISustainabilityTrackerService
    {
        Task<SustainabilityTrackerStatsDTO> GetSustainabilityData(Guid userId);
    }
}