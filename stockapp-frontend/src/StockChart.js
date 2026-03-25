import React from 'react';

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

const StockChart = ({ data }) => {

    if (!data || data.length === 0) {
        return null;
    }

    const prices = data.map(x => x.price);

    const min = Math.min(...prices);

    const max = Math.max(...prices);

    const padding = Math.max(
        (max - min) * 0.10,
        max * 0.001
    );

    return (
        <ResponsiveContainer
            width="100%"
            height={320}
        >
            <LineChart
                data={data}
                margin={{
                    top: 10,
                    right: 30,
                    left: 20,
                    bottom: 10
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10 }}
                />

                <YAxis
                    domain={[
                        min - padding,
                        max + padding
                    ]}
                    tickFormatter={(value) =>
                        `$${value.toFixed(2)}`
                    }
                />

                <Tooltip
                    formatter={(value) =>
                        [`$${value.toFixed(2)}`, 'Price']
                    }
                />

                <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#1976d2"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default StockChart;