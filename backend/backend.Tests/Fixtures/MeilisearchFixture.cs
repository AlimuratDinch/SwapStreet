using Meilisearch;
using Xunit;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using System.Threading.Tasks;

namespace backend.Tests.Fixtures;

public sealed class MeilisearchFixture : IAsyncLifetime
{
    private IContainer _container = default!;
    
    public MeilisearchClient Client { get; private set; } = default!;
    
    public Meilisearch.Index Index { get; private set; } = default!;

    public async Task InitializeAsync()
    {
        _container = new ContainerBuilder()
            .WithImage("getmeili/meilisearch:v1.12")
            .WithPortBinding(7700, true)
            .WithEnvironment("MEILI_MASTER_KEY", "masterKey")
            .WithWaitStrategy(Wait.ForUnixContainer()
                .UntilHttpRequestIsSucceeded(r => r.ForPort(7700)))
            .Build();

        await _container.StartAsync();

        var host = _container.Hostname;
        var port = _container.GetMappedPublicPort(7700);
        
        Client = new MeilisearchClient($"http://{host}:{port}", "masterKey");

        await Client.CreateIndexAsync("listings", "id");
        Index = Client.Index("listings");
        
        await Index.UpdateSortableAttributesAsync(new[] { "createdAtTimestamp", "_geo" });
    }

    public async Task DisposeAsync()
    {
        if (_container != null)
        {
            await _container.DisposeAsync();
        }
    }
}