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
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isChartInitialized, setIsChartInitialized] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [currentDataSource, setCurrentDataSource] = useState<string>("Unknown");

  // Fetch historical data with multiple data sources as fallback
  const fetchHistoricalData = async (endTime?: number, isLoadingMore = false) => {
    try {
      if (isLoadingMore) {
        setIsLoadingMore(true);
      }
      
      console.log("Fetching historical data...", endTime ? `before ${endTime}` : "latest");
      
      let klines: CandlestickData[] = [];
      
      // Try multiple data sources in order of preference
      try {
        // First try Binance (more reliable for historical data)
        klines = await fetchFromBinance(endTime);
        setCurrentDataSource("Binance");
        console.log("Successfully fetched from Binance:", klines.length, "candles");
      } catch (binanceError) {
        console.warn("Binance failed, trying Bybit:", binanceError);
        
        try {
          // Fallback to Bybit
          klines = await fetchFromBybit(endTime);
          setCurrentDataSource("Bybit");
          console.log("Successfully fetched from Bybit:", klines.length, "candles");
        } catch (bybitError) {
          console.warn("Bybit failed, trying CoinGecko:", bybitError);
          
          // Fallback to CoinGecko (limited but more historical data)
          klines = await fetchFromCoinGecko(endTime);
          setCurrentDataSource("CoinGecko");
          console.log("Successfully fetched from CoinGecko:", klines.length, "candles");
        }
      }
      
      if (klines.length > 0) {
        const firstTimestamp = klines[0].time as number;
        
        if (isLoadingMore && endTime) {
          // If this is loading more data, prepend to existing data
          setInitialData(prevData => {
            // Filter out any potential duplicates and merge
            const existingTimestamps = new Set(prevData.map(item => item.time));
            const newData = klines.filter((item: CandlestickData) => !existingTimestamps.has(item.time));
            
            const combined = [...newData, ...prevData];
            const sortedData = combined.sort((a: CandlestickData, b: CandlestickData) => (a.time as number) - (b.time as number));
            
            console.log(`Combined data: ${newData.length} new + ${prevData.length} existing = ${sortedData.length} total`);
            return sortedData;
          });
          
          // Update earliest timestamp
          setEarliestTimestamp(firstTimestamp);
          
          // Check if we got fewer results than requested (indicating we've reached the end)
          if (klines.length < 100) { // Lower threshold since different APIs have different limits
            setHasMoreData(false);
          }
        } else {
          // If this is initial load, replace all data
          const sortedData = klines.sort((a: CandlestickData, b: CandlestickData) => (a.time as number) - (b.time as number));
          setInitialData(sortedData);
          setEarliestTimestamp(firstTimestamp);
          setIsLoading(false);
        }
      } else {
        if (!isLoadingMore) {
          setIsLoading(false);
        }
        setHasMoreData(false);
      }
      
      if (isLoadingMore) {
        setIsLoadingMore(false);
      }
    } catch (err) {
      console.error("Error fetching historical data from all sources:", err);
      setError(
        `Failed to fetch historical data from all sources: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load more historical data when scrolling back
  const loadMoreHistoricalData = useCallback(async () => {
    if (isLoadingMore || !earliestTimestamp || !hasMoreData) {
      console.log("Skip loading more data:", { isLoadingMore, earliestTimestamp, hasMoreData });
      return;
    }
    
    try {
      console.log("Loading more historical data before timestamp:", earliestTimestamp);
      await fetchHistoricalData(earliestTimestamp, true);
    } catch (error) {
      console.error("Error in loadMoreHistoricalData:", error);
      setError("Failed to load more historical data");
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, earliestTimestamp, hasMoreData]);

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
      setIsChartInitialized(true);

      // Add timeScale subscription to detect when user scrolls back in time
      chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (isDisposedRef.current || !hasMoreData) return;
        
        const timeRange = chart.timeScale().getVisibleRange();
        if (timeRange && earliestTimestamp && !isLoadingMore) {
          // If user is close to the beginning of data, load more
          const timeDiff = (timeRange.from as number) - earliestTimestamp;
          if (timeDiff < 3600) { // Within 1 hour of earliest data
            console.log("User scrolled close to earliest data, loading more...");
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
  }, [initialData, earliestTimestamp, loadMoreHistoricalData, isLoadingMore, hasMoreData]);

  // Connect to WebSocket (try Binance first, fallback to Bybit)
  const connectWebSocket = useCallback(() => {
    if (isDisposedRef.current || isWebSocketConnected) {
      console.log("WebSocket connection skipped - component is disposed or already connected");
      return;
    }
    
    const connectToBinance = () => {
      try {
        console.log("Connecting to Binance WebSocket...");
        const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1m");

        ws.onopen = () => {
          console.log("Binance WebSocket connected successfully");
          setIsWebSocketConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const kline = data.k;
            
            if (kline && candlestickSeriesRef.current && !isDisposedRef.current) {
              const candleData = {
                time: (parseInt(kline.t) / 1000) as Time,
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
                volume: parseFloat(kline.v),
              };

              const lastDataPoint = initialData[initialData.length - 1];
              const newTimestamp = candleData.time as number;
              const lastTimestamp = lastDataPoint ? (lastDataPoint.time as number) : 0;
              
              if (newTimestamp >= lastTimestamp) {
                try {
                  if (!isDisposedRef.current && candlestickSeriesRef.current) {
                    candlestickSeriesRef.current.update(candleData);
                  }
                } catch (error) {
                  console.warn("Failed to update chart with Binance WebSocket data:", error);
                }
              }
            }
          } catch (err) {
            console.error("Error parsing Binance WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("Binance WebSocket error:", error);
          setIsWebSocketConnected(false);
          // Try Bybit as fallback
          setTimeout(() => {
            if (!isDisposedRef.current) {
              connectToBybit();
            }
          }, 2000);
        };

        ws.onclose = (event) => {
          console.log("Binance WebSocket disconnected:", event.code, event.reason);
          setIsWebSocketConnected(false);
          setTimeout(() => {
            if (!isDisposedRef.current && wsRef.current?.readyState === WebSocket.CLOSED) {
              connectToBinance();
            }
          }, 5000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("Error connecting to Binance WebSocket:", err);
        connectToBybit();
      }
    };

    const connectToBybit = () => {
      try {
        console.log("Connecting to Bybit WebSocket...");
        const ws = new WebSocket("wss://stream.bybit.com/v5/public/spot");

        ws.onopen = () => {
          console.log("Bybit WebSocket connected successfully");
          setIsWebSocketConnected(true);

          const subscriptions = {
            op: "subscribe",
            args: ["kline.1.BTCUSDT", "tickers.BTCUSDT"],
          };
          ws.send(JSON.stringify(subscriptions));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.topic === "kline.1.BTCUSDT" && data.data) {
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

                const lastDataPoint = initialData[initialData.length - 1];
                const newTimestamp = candleData.time as number;
                const lastTimestamp = lastDataPoint ? (lastDataPoint.time as number) : 0;
                
                if (newTimestamp >= lastTimestamp) {
                  try {
                    if (!isDisposedRef.current && candlestickSeriesRef.current) {
                      candlestickSeriesRef.current.update(candleData);
                    }
                  } catch (error) {
                    console.warn("Failed to update chart with Bybit WebSocket data:", error);
                  }
                }
              }
            } else if (data.topic === "tickers.BTCUSDT" && data.data) {
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
            console.error("Error parsing Bybit WebSocket message:", err);
          }
        };

        ws.onerror = (error) => {
          console.error("Bybit WebSocket error:", error);
          setError("WebSocket connection failed");
          setIsWebSocketConnected(false);
        };

        ws.onclose = (event) => {
          console.log("Bybit WebSocket disconnected:", event.code, event.reason);
          setIsWebSocketConnected(false);
          setTimeout(() => {
            if (!isDisposedRef.current && wsRef.current?.readyState === WebSocket.CLOSED) {
              connectToBybit();
            }
          }, 5000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("Error connecting to Bybit WebSocket:", err);
        setError(`WebSocket connection failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        setIsWebSocketConnected(false);
      }
    };

    // Start with Binance
    connectToBinance();
  }, [initialData, isWebSocketConnected]);

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
      
      setIsChartInitialized(false);
      setIsWebSocketConnected(false);
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchHistoricalData();
    fetchTickerData();
  }, []);

  // Initialize chart when data is ready (but only once)
  useEffect(() => {
    if (initialData.length > 0 && !isChartInitialized) {
      initializeChart();
    } else if (initialData.length > 0 && isChartInitialized && candlestickSeriesRef.current) {
      // Just update the data without reinitializing
      try {
        candlestickSeriesRef.current.setData(initialData);
      } catch (error) {
        console.error("Failed to update chart data:", error);
        setError("Failed to update chart data");
      }
    }
  }, [initialData, initializeChart, isChartInitialized]);

  // Connect to WebSocket (separate from chart initialization)
  useEffect(() => {
    if (initialData.length > 0 && !isWebSocketConnected) {
      connectWebSocket();
    }
  }, [initialData, connectWebSocket, isWebSocketConnected]);

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

  // Fetch from Binance API
  const fetchFromBinance = async (endTime?: number): Promise<CandlestickData[]> => {
    let url = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1000";
    if (endTime) {
      url += `&endTime=${endTime * 1000}`; // Convert to milliseconds
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((item: any[]) => ({
      time: (parseInt(item[0]) / 1000) as Time,
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
    }));
  };

  // Fetch from Bybit API (original implementation)
  const fetchFromBybit = async (endTime?: number): Promise<CandlestickData[]> => {
    let url = "https://api.bybit.com/v5/market/kline?category=spot&symbol=BTCUSDT&interval=1&limit=200";
    if (endTime) {
      url += `&end=${endTime * 1000}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Bybit API error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.retCode !== 0) {
      throw new Error(`Bybit API error: ${data.retMsg}`);
    }
    
    return data.result.list
      .map((item: string[]) => ({
        time: (parseInt(item[0]) / 1000) as Time,
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }))
      .reverse();
  };

  // Fetch from CoinGecko API (for extended historical data)
  const fetchFromCoinGecko = async (endTime?: number): Promise<CandlestickData[]> => {
    // CoinGecko has different API structure, we'll use their OHLC endpoint
    const days = endTime ? Math.min(90, Math.floor((Date.now() / 1000 - endTime) / 86400) + 1) : 1;
    const url = `https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CoinGecko API error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // CoinGecko returns [timestamp, open, high, low, close] in milliseconds
    let ohlcData = data.map((item: number[]) => ({
      time: (item[0] / 1000) as Time,
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: 0, // CoinGecko OHLC doesn't include volume
    }));
    
    // Filter data based on endTime if provided
    if (endTime) {
      ohlcData = ohlcData.filter((item: CandlestickData) => (item.time as number) < endTime);
    }
    
    // Sort by time to ensure chronological order
    return ohlcData.sort((a: CandlestickData, b: CandlestickData) => (a.time as number) - (b.time as number));
  };

  // Fetch ticker data from Binance
  const fetchTickerData = async () => {
    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
      if (response.ok) {
        const ticker = await response.json();
        setTickerData({
          symbol: ticker.symbol,
          price: ticker.lastPrice,
          priceChange: ticker.priceChange,
          priceChangePercent: (parseFloat(ticker.priceChangePercent) / 100).toString(),
          high24h: ticker.highPrice,
          low24h: ticker.lowPrice,
          volume24h: ticker.volume,
        });
      }
    } catch (error) {
      console.warn("Failed to fetch ticker data from Binance:", error);
    }
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
                  setIsChartInitialized(false);
                  setIsWebSocketConnected(false);
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bitcoin Price Chart</CardTitle>
              <CardDescription>
                Real-time BTCUSDT candlestick chart with multiple data sources
                {initialData.length > 0 && (
                  <span className="ml-2 text-xs">
                    ({initialData.length} data points from {currentDataSource})
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasMoreData && (
                <button
                  onClick={loadMoreHistoricalData}
                  disabled={isLoadingMore}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? "Loading..." : "Load More History"}
                </button>
              )}
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded text-white ${isWebSocketConnected ? 'bg-green-600' : 'bg-red-600'}`}>
                  {isWebSocketConnected ? "Live" : "Offline"}
                </span>
                {currentDataSource !== "Unknown" && (
                  <span className="px-2 py-1 rounded bg-blue-600 text-white">
                    {currentDataSource}
                  </span>
                )}
              </div>
            </div>
          </div>
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
            {!hasMoreData && (
              <div className="text-center text-sm text-muted-foreground mt-2">
                All available historical data has been loaded
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BitcoinPriceChart;
