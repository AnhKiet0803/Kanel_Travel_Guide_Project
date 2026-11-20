namespace KanelTravelGuide_BE.Services;

public static class TourPricing
{
    public const int MinimumChildAge = 2;
    public const int MaximumChildAge = 17;

    public static DateOnly Today => DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));

    public static decimal ChildPrice(decimal adultPrice, IConfiguration config)
    {
        var percent = Math.Clamp(config.GetValue<decimal?>("Tours:ChildFarePercent") ?? 75, 0, 100);
        return Math.Round(adultPrice * percent / 100, 2, MidpointRounding.AwayFromZero);
    }
}
