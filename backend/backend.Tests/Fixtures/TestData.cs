using System;

namespace backend.Tests.Fixtures;

/// <summary>
/// Constant test data used across integration tests
/// </summary>
public static class TestData
{
    public static readonly Guid TestProfileId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    public static readonly Guid TestTagId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    public static readonly Guid TestArticleTypeId = Guid.Parse("00000000-0000-0000-0000-000000000010");
    public static readonly Guid TestStyleId = Guid.Parse("00000000-0000-0000-0000-000000000011");
    public static readonly Guid TestSizeId = Guid.Parse("00000000-0000-0000-0000-000000000012");
    public static readonly Guid TestBrandId = Guid.Parse("00000000-0000-0000-0000-000000000013");
    public static readonly Guid TestSecondProfileId = Guid.Parse("00000000-0000-0000-0000-000000000020");
    public static readonly Guid TestSecondTagId = Guid.Parse("00000000-0000-0000-0000-000000000021");
}
