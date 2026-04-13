using backend.Contracts;
using backend.DbContexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/sustainability")]
    [Authorize]
    public class SustainabilityTrackerController : ControllerBase
    {
        private readonly ISustainabilityTrackerService _sustainabilityTrackerService;
        private readonly AuthDbContext _authDbContext;
        private readonly AppDbContext _appDbContext;

        public SustainabilityTrackerController(
            ISustainabilityTrackerService sustainabilityTrackerService,
            AuthDbContext authDbContext,
            AppDbContext appDbContext)
        {
            _sustainabilityTrackerService = sustainabilityTrackerService;
            _authDbContext = authDbContext;
            _appDbContext = appDbContext;
        }

        /// <summary>
        /// Get sustainability metrics from authenticated user.
        /// </summary>
        [HttpGet("data")]
        public async Task<IActionResult> GetSustainabilityData()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Cannot fetch data using illegal Id.");
            }

            var data = await _sustainabilityTrackerService.GetSustainabilityData(userId);
            return Ok(data);
        }

        /// <summary>
        /// Get sustainability metrics from all users.
        /// </summary>
        [HttpGet("global")]
        public async Task<IActionResult> GetGlobalSustainabilityData()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Cannot fetch data using illegal Id.");
            }

            var data = await _sustainabilityTrackerService.GetGlobalSustainabilityData();
            return Ok(data);
        }

        /// <summary>
        /// Get public sustainability metrics for the landing page
        /// </summary>
        [AllowAnonymous]
        [HttpGet("public")]
        public async Task<IActionResult> GetPublicLandingStats()
        {
            var data = await _sustainabilityTrackerService.GetGlobalSustainabilityData();
            var accountsCreated = await _authDbContext.Users
                .AsNoTracking()
                .CountAsync(user => !user.IsDeleted);

            return Ok(new
            {
                data.Articles,
                data.CO2Kg,
                data.WaterL,
                AccountsCreated = accountsCreated
            });
        }

        /// <summary>
        /// Get monthly sustainability impact activity for the current year
        /// </summary>
        [AllowAnonymous]
        [HttpGet("public/monthly-impact")]
        public async Task<IActionResult> GetPublicMonthlyImpact()
        {
            var currentYear = DateTimeOffset.UtcNow.Year;

            var monthlyCounts = await _appDbContext.Chatrooms
                .AsNoTracking()
                .Where(chatroom =>
                    chatroom.IsDealClosed &&
                    chatroom.SustainabilityMetricsApplied &&
                    chatroom.ClosedAt.HasValue &&
                    chatroom.ClosedAt.Value.Year == currentYear)
                .GroupBy(chatroom => chatroom.ClosedAt!.Value.Month)
                .Select(group => new
                {
                    Month = group.Key,
                    Count = group.Count()
                })
                .ToListAsync();

            var monthlyImpact = new int[12];

            foreach (var monthCount in monthlyCounts)
            {
                monthlyImpact[monthCount.Month - 1] = monthCount.Count;
            }

            return Ok(new
            {
                Year = currentYear,
                MonthlyImpact = monthlyImpact
            });
        }

    }
}