using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using StockAppBackend.Models;
using StockAppBackend.Services;

namespace StockAppBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockController : ControllerBase
    {
        private readonly HttpClient _httpClient;

        private readonly FinnhubStreamer _streamer;

        public StockController(
            HttpClient httpClient,
            FinnhubStreamer streamer)
        {
            _httpClient = httpClient;
            _streamer = streamer;
        }

        [HttpPost("start-stream")]
        public async Task<IActionResult> StartStream(
            [FromBody] StartStreamRequest request)
        {
            if (request.Tickers.Count == 0 ||
                request.Tickers.Count > 5)
            {
                return BadRequest(
                    "Please provide up to 5 symbols.");
            }

            var stockData =
                new List<StockData>();

            var validTickers =
                new List<string>();

            foreach (var ticker in request.Tickers)
            {
                try
                {
                    var response =
                        await _httpClient.GetAsync(
                            $"https://finnhub.io/api/v1/quote?symbol={ticker}&token={request.ApiKey}");

                    if (!response.IsSuccessStatusCode)
                    {
                        stockData.Add(
                            new StockData
                            {
                                Ticker = ticker,
                                IsValid = false,
                                Error = "Ticker not found"
                            });

                        continue;
                    }

                    var json =
                        await response.Content.ReadAsStringAsync();

                    dynamic result =
                        JsonConvert.DeserializeObject(json)!;

                    decimal open =
                        (decimal)result.o;

                    decimal current =
                        (decimal)result.c;

                    if (open <= 0 || current <= 0)
                    {
                        stockData.Add(
                            new StockData
                            {
                                Ticker = ticker,
                                IsValid = false,
                                Error = "No quote data"
                            });

                        continue;
                    }

                    decimal change =
                        current - open;

                    stockData.Add(
                        new StockData
                        {
                            Ticker = ticker,

                            OpeningPrice = open,

                            CurrentPrice = current,

                            Change = change,

                            ChangePercentage =
                                Math.Round(
                                    (change / open) * 100,
                                    2)
                        });

                    validTickers.Add(ticker);
                }
                catch (Exception ex)
                {
                    stockData.Add(
                        new StockData
                        {
                            Ticker = ticker,
                            IsValid = false,
                            Error = ex.Message
                        });
                }
            }

            if (validTickers.Any())
            {
                await _streamer.StartStreamingAsync(
                    request.ApiKey,
                    validTickers);
            }

            return Ok(stockData);
        }

        [HttpPost("stop-stream")]
        public async Task<IActionResult> StopStream()
        {
            await _streamer.StopStreamingAsync();

            return Ok();
        }
    }
}