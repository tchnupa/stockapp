namespace StockAppBackend.Models
{
    public class LiveStockPrice
    {
        public string Ticker { get; set; } = "";

        public decimal Price { get; set; }

        public long Timestamp { get; set; }
    }
}