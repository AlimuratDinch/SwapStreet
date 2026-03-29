using System;
using System.Threading.Channels;
using backend.DbContexts;
using backend.Infrastructure.LogQueue;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace backend.Tests.BackendTestFactories
{
    /// <summary>
    /// No-op ITopicManager so tests never touch App_Data/listings/state.json.
    /// Eliminates the file-lock IOException when multiple test instances start in parallel.
    /// </summary>
    internal sealed class NullTopicManager : ITopicManager
    {
        private readonly Channel<bool> _channel = Channel.CreateUnbounded<bool>();

        public IPartition? GetTopic(string topic, int index = -1) => null;

        public Task CreateTopic(string topic, int partitionCount, bool autoFlush, int maxFileSize, TimeSpan timeSpan)
            => Task.CompletedTask;

        public ChannelReader<bool> GetSignalReader(string topicName) => _channel.Reader;

        public void Dispose() { }
    }

    public class InMemoryWebAppFactory : TestWebApplicationFactory
    {
        private readonly string _databaseName;

        public InMemoryWebAppFactory()
        {
            _databaseName = Guid.NewGuid().ToString();
        }

        protected override void ConfigureDatabase(IServiceCollection services)
        {
            // Replace ITopicManager with a no-op so tests don't race over App_Data/listings/state.json
            services.RemoveAll<ITopicManager>();
            services.AddSingleton<ITopicManager, NullTopicManager>();

            // AppDbContext
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase($"TestAppDb_{_databaseName}")
                       .EnableSensitiveDataLogging()
                       .EnableDetailedErrors()
                       .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning));
            });

            // AuthDbContext
            services.AddDbContext<AuthDbContext>(options =>
            {
                options.UseInMemoryDatabase($"TestAuthDb_{_databaseName}")
                       .EnableSensitiveDataLogging()
                       .EnableDetailedErrors()
                       .ConfigureWarnings(x => x.Ignore(InMemoryEventId.TransactionIgnoredWarning));
            });
        }
    }
}