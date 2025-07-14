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
import React, { useEffect, useRef, useState, useCallback } from "react";

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
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDisposedRef = useRef<boolean>(false);

  const [initialData, setInitialData] = useState<CandlestickData[]>([]);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earliestTimestamp, setEarliestTimestamp] = useState<number | null>(null);
  const [loadedTimestamps, setLoadedTimestamps] = useState<Set<number>>(new Set());

  // Fetch historical data from Bybit
  const fetchHistoricalData = async (endTime?: number) => {
    try {
      console.log("Fetching historical data from Bybit...");
      
      // Build URL with optional endTime for pagination
      let url = "https://api.bybit.com/v5/market/kline?category=spot&symbol=BTCUSDT&interval=1&limit=200";
      if (endTime) {
        url += `&end=${endTime * 1000}`; // Convert to milliseconds
      }
      
      const response = await fetch(url);

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
      
      if (klines.length > 0) {
        const firstTimestamp = klines[0].time as number;
        setEarliestTimestamp(firstTimestamp);
        
        if (endTime) {
          // If this is loading more data, prepend to existing data
          setInitialData(prevData => {
            const combined = [...klines, ...prevData];
            
            // Remove duplicates by time using a Map
            const uniqueMap = new Map<number, CandlestickData>();
            combined.forEach(item => {
              const timestamp = item.time as number;
              uniqueMap.set(timestamp, item);
            });
            
            // Convert back to array and sort by time
            const uniqueData = Array.from(uniqueMap.values())
              .sort((a, b) => (a.time as number) - (b.time as number));
            
            // Update loaded timestamps
            setLoadedTimestamps(new Set(uniqueData.map(item => item.time as number)));
            
            console.log("Combined data:", combined.length, "Unique data:", uniqueData.length);
            return uniqueData;
          });
          setIsLoadingMore(false);
        } else {
          // If this is initial load, replace all data
          const uniqueMap = new Map<number, CandlestickData>();
          klines.forEach((item: CandlestickData) => {
            const timestamp = item.time as number;
            uniqueMap.set(timestamp, item);
          });
          
          const sortedData = Array.from(uniqueMap.values())
            .sort((a, b) => (a.time as number) - (b.time as number));
          
          // Update loaded timestamps
          setLoadedTimestamps(new Set(sortedData.map(item => item.time as number)));
          
          console.log("Initial data:", klines.length, "Unique data:", sortedData.length);
          setInitialData(sortedData);
          setIsLoading(false);
        }
      } else {
        if (!endTime) {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    } catch (err) {
      console.error("Error fetching historical data:", err);
      setError(
        `Failed to fetch historical data: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more historical data when scrolling back
  const loadMoreHistoricalData = useCallback(async () => {
    if (isLoadingMore || !earliestTimestamp) return;
    
    // Check if we already have data for this timestamp
    if (loadedTimestamps.has(earliestTimestamp)) {
      console.log("Data for timestamp", earliestTimestamp, "already loaded");
      return;
    }
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Debounce the loading request
    loadingTimeoutRef.current = setTimeout(async () => {
      setIsLoadingMore(true);
      await fetchHistoricalData(earliestTimestamp);
    }, 500); // 500ms debounce
  }, [isLoadingMore, earliestTimestamp, loadedTimestamps]);

  // Initialize chart
  const initializeChart = useCallback(() => {
    if (!chartContainerRef.current || initialData.length === 0 || isDisposedRef.current) {
      console.log("Chart initialization skipped - container or data not ready or disposed");
      return;
    }

    try {
      console.log("Initializing chart with", initialData.length, "data points");

      // If chart already exists, just update the data
      if (chartRef.current && candlestickSeriesRef.current && !isDisposedRef.current) {
        console.log("Updating existing chart with", initialData.length, "data points");
        console.log("First timestamp:", initialData[0]?.time, "Last timestamp:", initialData[initialData.length - 1]?.time);
        
        // Verify data is sorted and has no duplicates
        const timestamps = initialData.map(item => item.time as number);
        const uniqueTimestamps = new Set(timestamps);
        const isSorted = initialData.every((item, index) => 
          index === 0 || (item.time as number) > (initialData[index - 1].time as number)
        );
        
        console.log("Data is sorted:", isSorted, "Has duplicates:", timestamps.length !== uniqueTimestamps.size);
        
        if (isSorted && timestamps.length === uniqueTimestamps.size) {
          try {
            if (!isDisposedRef.current && candlestickSeriesRef.current) {
              candlestickSeriesRef.current.setData(initialData);
              return;
            }
          } catch (error) {
            console.error("Failed to update chart data:", error);
            // If update fails, recreate the chart
            if (chartRef.current && !isDisposedRef.current) {
              try {
                chartRef.current.remove();
              } catch (removeError) {
                console.error("Error removing chart:", removeError);
              }
              chartRef.current = null;
              candlestickSeriesRef.current = null;
            }
          }
        } else {
          console.error("Data is not properly sorted or has duplicates, recreating chart");
          if (chartRef.current && !isDisposedRef.current) {
            try {
              chartRef.current.remove();
            } catch (removeError) {
              console.error("Error removing chart:", removeError);
            }
            chartRef.current = null;
            candlestickSeriesRef.current = null;
          }
        }
      }

      // Don't create new chart if disposed
      if (isDisposedRef.current) {
        return;
      }

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        layout: {
          textColor: "#d1d5db",
          background: { type: ColorType.Solid, color: "#1f2937" },
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        grid: {
          vertLines: { color: "#374151" },
          horzLines: { color: "#374151" },
        },
        rightPriceScale: {
          borderColor: "#6b7280",
        },
        timeScale: {
          borderColor: "#6b7280",
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

      // Add timeScale subscription to detect when user scrolls back in time
      chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (isDisposedRef.current) return;
        
        const timeRange = chart.timeScale().getVisibleRange();
        if (timeRange && earliestTimestamp && !isLoadingMore) {
          // If user is close to the beginning of data, load more
          const timeDiff = (timeRange.from as number) - earliestTimestamp;
          if (timeDiff < 1800) { // Within 30 minutes of earliest data
            loadMoreHistoricalData();
          }
        }
      });

      // Handle resize
      const handleResize = () => {
        if (isDisposedRef.current) return;
        
        if (chartContainerRef.current && chartRef.current) {
          try {
            chartRef.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          } catch (error) {
            console.error("Error resizing chart:", error);
          }
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
  }, [initialData, earliestTimestamp, loadMoreHistoricalData, isLoadingMore]);

  // Connect to Bybit WebSocket
  const connectWebSocket = useCallback(() => {
    if (isDisposedRef.current) {
      console.log("WebSocket connection skipped - component is disposed");
      return;
    }
    
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
            if (kline && candlestickSeriesRef.current && !isDisposedRef.current) {
              const candleData = {
                time: (parseInt(kline.start) / 1000) as Time,
                open: parseFloat(kline.open),
                high: parseFloat(kline.high),
                low: parseFloat(kline.low),
                close: parseFloat(kline.close),
                volume: parseFloat(kline.volume),
              };

              // Get the last timestamp from current data to avoid updating with older data
              const lastDataPoint = initialData[initialData.length - 1];
              const newTimestamp = candleData.time as number;
              const lastTimestamp = lastDataPoint ? (lastDataPoint.time as number) : 0;
              
              // Only update if the new data is newer or equal to the last timestamp
              if (newTimestamp >= lastTimestamp) {
                try {
                  if (!isDisposedRef.current && candlestickSeriesRef.current) {
                    candlestickSeriesRef.current.update(candleData);
                  }
                } catch (error) {
                  console.warn("Failed to update chart with WebSocket data:", error);
                  // If update fails, try to refresh the chart data
                  if (!isDisposedRef.current && chartRef.current && candlestickSeriesRef.current) {
                    try {
                      candlestickSeriesRef.current.setData(initialData);
                    } catch (setDataError) {
                      console.error("Failed to set chart data:", setDataError);
                    }
                  }
                }
              }
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
  }, [initialData]);

  // Cleanup
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up chart component...');
      isDisposedRef.current = true;
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Clear series reference first
      if (candlestickSeriesRef.current) {
        candlestickSeriesRef.current = null;
      }
      
      if (chartRef.current) {
        try {
          chartRef.current.remove();
          chartRef.current = null;
        } catch (error) {
          console.error('Error disposing chart:', error);
        }
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
          <CardDescription>
            Real-time BTCUSDT candlestick chart powered by Bybit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {isLoadingMore && (
              <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-muted-foreground">
                Loading more data...
              </div>
            )}
            <div
              ref={chartContainerRef}
              className="w-full h-96 border border-slate-700 rounded"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BitcoinPriceChart;
