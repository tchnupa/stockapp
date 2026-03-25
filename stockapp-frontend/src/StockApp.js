import React, {
    useState,
    useEffect,
    useRef
} from 'react';
import axios from 'axios';
import * as signalR from '@microsoft/signalr';
import StockChart from './StockChart';
import Modal from './Modal';

const API_URL =
    'https://localhost:7203/api/stock';
const HUB_URL =
    'https://localhost:7203/stockhub';
const StockApp = () => {
    const [apiKey, setApiKey] = useState('');
    const [tickers, setTickers] =
        useState(['', '', '', '', '']);
    const [stockData, setStockData] =
        useState([]);
    const [chartData, setChartData] =
        useState({});
    const [error, setError] =
        useState('');
	const [modalOpen, setModalOpen] =
		useState(false);
	const [modalTitle, setModalTitle] =
		useState('');
	const [modalMessage, setModalMessage] =
		useState('');
	const [isStreaming, setIsStreaming] =
		useState(false);
    const connectionRef = useRef(null);

    useEffect(() => {
        const connection =
            new signalR.HubConnectionBuilder()
                .withUrl(HUB_URL)
                .withAutomaticReconnect()
                .build();

        connection.on(
            'StockUpdate',
            (update) => {
                setChartData(prev => {
                    const existing =
                        prev[update.ticker] || [];

                    const point = {
                        time:
                            new Date(
                                update.timestamp
                            ).toLocaleTimeString(),
                        price:
                            Number(update.price)
                    };

                    return {
                        ...prev,
                        [update.ticker]:
                            [
                                ...existing,
                                point
                            ].slice(-300)
                    };
                });

                setStockData(prev =>
                    prev.map(stock => {
                        if (
                            stock.ticker !==
                            update.ticker
                        ) {
                            return stock;
                        }

                        const current =
                            Number(update.price);

                        const open =
                            Number(
                                stock.openingPrice
                            );

                        const change =
                            current - open;

                        return {
                            ...stock,
                            currentPrice:
                                current,
                            change,
                            changePercentage:
                                (
                                    change /
                                    open
                                ) * 100
                        };
                    })
                );
            });

        connection
            .start()
            .then(() => {
                console.log(
                    'SignalR connected'
                );
            })
            .catch(console.error);

        connectionRef.current =
            connection;

        return () => {
            if (connectionRef.current) {
                connectionRef.current
                    .stop();
            }
        };
    }, []);

	const showModal = (
		title,
		message
	) => {
		setModalTitle(title);
		setModalMessage(message);
		setModalOpen(true);
	};

    const handleApiKeyChange =
        (e) => {
            setApiKey(e.target.value);
        };

    const handleTickerChange =
        (index, e) => {
            const copy =
                [...tickers];

            copy[index] =
                e.target.value
                    .toUpperCase();

            setTickers(copy);
        };

    const startStreaming =
        async () => {
            setError('');

            const validTickers =
                tickers
                    .filter(
                        x => x.trim()
                    )
                    .slice(0, 5);

            if (
                validTickers.length === 0
            ) {
                setError(
                    'Please enter at least one ticker.'
                );
                return;
            }

            try {
                const response =
                    await axios.post(
                        `${API_URL}/start-stream`,
                        {
                            apiKey,
                            tickers:
                                validTickers
                        });

                const stocks =
                    response.data;

                setStockData(stocks);

                const initialCharts =
                    {};

                stocks.forEach(stock => {
                    if (
                        stock.isValid
                    ) {
                        initialCharts[
                            stock.ticker
                        ] = [
                            {
                                time: 'Open',
                                price:
                                    Number(
                                        stock.openingPrice
                                    )
                            },
                            {
                                time: 'Current',
                                price:
                                    Number(
                                        stock.currentPrice
                                    )
                            }
                        ];
                    }
                });

                setChartData(
                    initialCharts
                );
				
				setIsStreaming(true);
				
				showModal(
					'Start',
					'Streaming started.'
				);
            }
            catch (err) {
                setError(
                    `Error: ${err.message}`
                );
				  showModal(
					'Error',
					err.message
				);
            }
        };

    const stopStreaming =
        async () => {
            try {
                await axios.post(
                    `${API_URL}/stop-stream`
                );
				
				setIsStreaming(false);
				
				showModal(
					'Stop',
					'Streaming stopped.'
				);
            }
            catch {
            }
        };

    const formatMoney =
        (value) =>
            `$${Number(value)
                .toFixed(2)}`;

    const renderChange =
        (value) => {

            const color =
                value >= 0
                    ? 'green'
                    : 'red';

            return (
                <span
                    style={{
                        color
                    }}
                >
                    {value.toFixed(2)}
                </span>
            );
        };

    const renderPercent =
        (value) => {

            const color =
                value >= 0
                    ? 'green'
                    : 'red';

            return (
                <span
                    style={{
                        color
                    }}
                >
                    {value.toFixed(2)}%
                </span>
            );
        };

    return (
        <div>

		<Modal
			isOpen={modalOpen}
			title={modalTitle}
			message={modalMessage}
			onClose={() =>
				setModalOpen(false)
			}
		/>
            <h1>
                Live Stock Viewer
            </h1>

            <input
                type="password"
                placeholder="Finnhub API Key"
                value={apiKey}
                onChange={
                    handleApiKeyChange
                }
            />

            <br />
            <br />

            {tickers.map(
                (
                    ticker,
                    index
                ) => (
                    <div
                        key={index}
                    >
                        <input
                            type="text"
                            maxLength="10"
                            placeholder={
                                `Ticker ${index + 1}`
                            }
                            value={
                                ticker
                            }
                            onChange={(e) =>
                                handleTickerChange(
                                    index,
                                    e
                                )
                            }
                        />
                    </div>
                )
            )}

            <br />

            <button
                onClick={
                    startStreaming
                }
				disabled={isStreaming}
            >
                Start Streaming
            </button>

            &nbsp;

            <button
                onClick={
                    stopStreaming
                }
				disabled={!isStreaming}
            >
                Stop Streaming
            </button>

            {error && (
                <p
                    style={{
                        color:
                            'red'
                    }}
                >
                    {error}
                </p>
            )}

            <br />

            {stockData.map(
                (stock) => (

                    <div
                        key={
                            stock.ticker
                        }
                        className="stock-card"
                    >

                        <h2>
                            {
                                stock.ticker
                            }
                        </h2>

                        {!stock.isValid &&
                        stock.error ? (

                            <div
                                className="error-box"
                            >
                                {
                                    stock.error
                                }
                            </div>

                        ) : (

                            <>
                                <div
                                    className="stock-info"
                                >
                                    <div>
                                        Open:
                                        {' '}
                                        {
                                            formatMoney(
                                                stock.openingPrice
                                            )
                                        }
                                    </div>

                                    <div>
                                        Current:
                                        {' '}
                                        {
                                            formatMoney(
                                                stock.currentPrice
                                            )
                                        }
                                    </div>

                                    <div>
                                        Change:
                                        {' '}
                                        {
                                            renderChange(
                                                stock.change
                                            )
                                        }
                                    </div>

                                    <div>
                                        %:
                                        {' '}
                                        {
                                            renderPercent(
                                                stock.changePercentage
                                            )
                                        }
                                    </div>
                                </div>

                                <StockChart
                                    data={
                                        chartData[
                                            stock.ticker
                                        ]
                                    }
                                />
                            </>
                        )}
                    </div>
                )
            )}

        </div>
    );
};

export default StockApp;