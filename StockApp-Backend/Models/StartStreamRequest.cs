namespace StockAppBackend.Models
{
    public class StartStreamRequest
    {
        public string ApiKey { get; set; } = "";

        public List<string> Tickers { get; set; } = new();
    }
}