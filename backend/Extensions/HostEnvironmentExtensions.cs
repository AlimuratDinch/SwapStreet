using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Configuration;
namespace backend.Extensions;
public static class HostEnvironmentExtensions
{
    public static bool IsTest(this IHostEnvironment env)
        => env.IsEnvironment(EnvironmentConstants.Test);

    public static bool IsLocalStaging(this IHostEnvironment env)
        => env.IsEnvironment(EnvironmentConstants.LocalStaging);

    public static bool IsStagingOnly(this IHostEnvironment env)
        => env.IsEnvironment(EnvironmentConstants.Staging);

    // Helpful helper for "Anything that isn't local development"
    public static bool IsDeployed(this IHostEnvironment env)
        => env.IsStagingOnly() || env.IsProduction();
}