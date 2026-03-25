using Microsoft.AspNetCore.SignalR;
using Newtonsoft.Json.Linq;
using StockAppBackend.Hubs;
using StockAppBackend.Models;
using System.Net.WebSockets;
using System.Text;

namespace StockAppBackend.Services
{
    public class FinnhubStreamer
    {
        private readonly IHubContext<StockHub> _hub;

        private ClientWebSocket? _socket;

        private CancellationTokenSource? _cts;

        public FinnhubStreamer(IHubContext<StockHub> hub)
        {
            _hub = hub;
        }

        public async Task StartStreamingAsync(
            string apiKey,
            List<string> tickers)
        {
            await StopStreamingAsync();

            _cts = new CancellationTokenSource();

            _socket = new ClientWebSocket();

            await _socket.ConnectAsync(
                new Uri($"wss://ws.finnhub.io?token={apiKey}"),
                _cts.Token);

            foreach (var ticker in tickers)
            {
                var subscribeMessage =
                    $"{{\"type\":\"subscribe\",\"symbol\":\"{ticker}\"}}";

                await _socket.SendAsync(
                    Encoding.UTF8.GetBytes(subscribeMessage),
                    WebSocketMessageType.Text,
                    true,
                    _cts.Token);
            }

            _ = Task.Run(
                () => ReceiveLoop(_cts.Token),
                _cts.Token);
        }

        public async Task StopStreamingAsync()
        {
            try
            {
                if (_cts != null)
                {
                    _cts.Cancel();
                }

                if (_socket != null &&
                    _socket.State == WebSocketState.Open)
                {
                    await _socket.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "Closing",
                        CancellationToken.None);
                }
            }
            catch
            {
            }
        }

        private async Task ReceiveLoop(
            CancellationToken cancellationToken)
        {
            if (_socket == null)
                return;

            var buffer = new byte[8192];

            while (!cancellationToken.IsCancellationRequested &&
                   _socket.State == WebSocketState.Open)
            {
                try
                {
                    var result =
                        await _socket.ReceiveAsync(
                            new ArraySegment<byte>(buffer),
                            cancellationToken);

                    if (result.MessageType ==
                        WebSocketMessageType.Close)
                    {
                        break;
                    }

                    var json =
                        Encoding.UTF8.GetString(
                            buffer,
                            0,
                            result.Count);

                    var root = JObject.Parse(json);

                    if (root["type"]?.ToString() != "trade")
                        continue;

                    var trades = root["data"];

                    if (trades == null)
                        continue;

                    foreach (var trade in trades)
                    {
                        var update =
                            new LiveStockPrice
                            {
                                Ticker =
                                    trade["s"]?.ToString() ?? "",

                                Price =
                                    trade["p"]?.Value<decimal>() ?? 0,

                                Timestamp =
                                    trade["t"]?.Value<long>() ?? 0
                            };

                        await _hub.Clients.All.SendAsync(
                            "StockUpdate",
                            update,
                            cancellationToken);
                    }
                }
                catch
                {
                }
            }
        }
    }
}