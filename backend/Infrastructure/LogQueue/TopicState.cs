using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace backend.Infrastructure.LogQueue;

public class TopicState
{
    private readonly string _topicJsonPath;

    public TopicData TopicData { get; private set; }

    // Private constructor
    private TopicState(string topicDirectory)
    {
        _topicJsonPath = Path.Combine(topicDirectory, "state.json");
    }

    // ---------- FACTORIES ----------

    // Create new state and save it
    public static async Task<TopicState> CreateAsync(
        string topicDirectory,
        TopicData topicData)
    {
        var state = new TopicState(topicDirectory)
        {
            TopicData = topicData
        };

        await state.SaveAsync();
        return state;
    }

    // Load existing state
    public static async Task<TopicState?> LoadAsync(string topicDirectory)
    {
        var state = new TopicState(topicDirectory);

        if (!File.Exists(state._topicJsonPath))
            return null;

        await state.LoadInternalAsync();
        return state;
    }

    // ---------- PERSISTENCE ----------

    private async Task LoadInternalAsync()
    {
        using FileStream fs = File.OpenRead(_topicJsonPath);

        TopicData? topicData =
            await JsonSerializer.DeserializeAsync<TopicData>(fs);

        if (topicData is null)
            throw new InvalidDataException("state.json is empty or invalid");

        TopicData = topicData;
    }

    public async Task SaveAsync()
    {
        using FileStream fs = File.Create(_topicJsonPath);

        await JsonSerializer.SerializeAsync(fs, TopicData);
    }
}
