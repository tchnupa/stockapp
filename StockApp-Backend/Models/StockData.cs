namespace StockAppBackend.Models
{
    public class StockData
    {
        public string Ticker { get; set; } = "";
        public decimal OpeningPrice { get; set; }
        public decimal CurrentPrice { get; set; }
        public decimal Change { get; set; }
        public decimal ChangePercentage { get; set; }
        public bool IsValid { get; set; } = true;
        public string Error { get; set; } = "";
    }
}