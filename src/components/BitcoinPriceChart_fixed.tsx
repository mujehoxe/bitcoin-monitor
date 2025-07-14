"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TickerData {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high24h: string;
  low24h: string;
  volume24h: string;
}

const BitcoinPriceChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [initialData, setInitialData] = useState<CandlestickData[]>([]);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical data from Bybit
  const fetchHistoricalData = async () => {
    try {
      console.log("Fetching historical data from Bybit...");
      const response = await fetch(
        "https://api.bybit.com/v5/market/kline?category=spot&symbol=BTCUSDT&interval=1&limit=100"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Bybit response:", data);

      if (data.retCode !== 0) {
        throw new Error(`Bybit API error: ${data.retMsg}`);
      }

      const klines = data.result.list
        .map((item: string[]) => ({
          time: (parseInt(item[0]) / 1000) as Time, // Convert to seconds and cast to Time
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5]),
        }))
        .reverse(); // Reverse to get chronological order

      console.log("Processed candlestick data:", klines.length, "candles");
      setInitialData(klines);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching historical data:", err);
      setError(
        `Failed to fetch historical data: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsLoading(false);
    }
  };

  // Initialize chart
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || initialData.length === 0) {
      console.log("Chart initialization skipped - container or data not ready");
      return;
    }

    try {
      console.log("Initializing chart with", initialData.length, "data points");

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          textColor: "black",
          background: { type: ColorType.Solid, color: "white" },
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        grid: {
          vertLines: { color: "#e0e0e0" },
          horzLines: { color: "#e0e0e0" },
        },
        rightPriceScale: {
          borderColor: "#cccccc",
        },
        timeScale: {
          borderColor: "#cccccc",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Add candlestick series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#4caf50",
        downColor: "#f44336",
        borderDownColor: "#f44336",
        borderUpColor: "#4caf50",
        wickDownColor: "#f44336",
        wickUpColor: "#4caf50",
      });

      // Set initial data
      candlestickSeries.setData(initialData);

      // Store references
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      console.log("Chart initialized successfully");

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    } catch (err) {
      console.error("Error initializing chart:", err);
      setError(
        `Failed to initialize chart: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }, [initialData]);

  // Connect to Bybit WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      console.log("Connecting to Bybit WebSocket...");

      // Use Bybit's public WebSocket endpoint
      const ws = new WebSocket("wss://stream.bybit.com/v5/public/spot");

      ws.onopen = () => {
        console.log("WebSocket connected successfully");

        // Subscribe to kline and ticker data
        const subscriptions = {
          op: "subscribe",
          args: ["kline.1.BTCUSDT", "tickers.BTCUSDT"],
        };

        ws.send(JSON.stringify(subscriptions));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message:", data);

          if (data.topic === "kline.1.BTCUSDT" && data.data) {
            // Handle kline updates
            const kline = data.data[0];
            if (kline && candlestickSeriesRef.current) {
              const candleData = {
                time: (parseInt(kline.start) / 1000) as Time,
                open: parseFloat(kline.open),
                high: parseFloat(kline.high),
                low: parseFloat(kline.low),
                close: parseFloat(kline.close),
                volume: parseFloat(kline.volume),
              };

              candlestickSeriesRef.current.update(candleData);
            }
          } else if (data.topic === "tickers.BTCUSDT" && data.data) {
            // Handle ticker updates
            const ticker = data.data;
            setTickerData({
              symbol: ticker.symbol,
              price: ticker.lastPrice,
              priceChange: ticker.price24hPcnt,
              priceChangePercent: ticker.price24hPcnt,
              high24h: ticker.highPrice24h,
              low24h: ticker.lowPrice24h,
              volume24h: ticker.volume24h,
            });
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket connection failed");
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Error connecting to WebSocket:", err);
      setError(
        `WebSocket connection failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchHistoricalData();
  }, []);

  // Initialize chart when data is ready
  useEffect(() => {
    if (initialData.length > 0) {
      initializeChart();
      connectWebSocket();
    }
  }, [initialData, initializeChart, connectWebSocket]);

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(typeof price === "string" ? parseFloat(price) : price);
  };

  const formatPercent = (percent: string | number) => {
    const value = typeof percent === "string" ? parseFloat(percent) : percent;
    return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Bitcoin Price Chart</CardTitle>
          <CardDescription>Loading historical data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Bitcoin Price Chart</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-red-500 mb-4">Failed to load chart</p>
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  fetchHistoricalData();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Price Info Card */}
      {tickerData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">
                {tickerData.symbol} {formatPrice(tickerData.price)}
              </CardTitle>
              <Badge
                variant={
                  parseFloat(tickerData.priceChangePercent) >= 0
                    ? "default"
                    : "destructive"
                }
                className="text-sm"
              >
                {formatPercent(tickerData.priceChangePercent)}
              </Badge>
            </div>
            <CardDescription>
              <span className="flex space-x-4 text-sm">
                <span>24h High: {formatPrice(tickerData.high24h)}</span>
                <span>24h Low: {formatPrice(tickerData.low24h)}</span>
                <span>
                  24h Volume:{" "}
                  {parseFloat(tickerData.volume24h).toLocaleString()}
                </span>
              </span>
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bitcoin Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={chartContainerRef}
            className="w-full h-96 border border-gray-200 rounded"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BitcoinPriceChart;
