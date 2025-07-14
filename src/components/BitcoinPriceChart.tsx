"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
  Time,
} from "lightweight-charts";
import { Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MovingAverageData {
  time: Time;
  value: number;
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
  const ma7SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma25SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma99SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDisposedRef = useRef<boolean>(false);

  const [initialData, setInitialData] = useState<CandlestickData[]>([]);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earliestTimestamp, setEarliestTimestamp] = useState<number | null>(
    null
  );
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isChartInitialized, setIsChartInitialized] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [currentDataSource, setCurrentDataSource] = useState<string>("Unknown");

  // Fetch historical data with multiple data sources as fallback
  const fetchHistoricalData = async (
    endTime?: number,
    isLoadingMore = false
  ) => {
    try {
      if (isLoadingMore) {
        setIsLoadingMore(true);
      }

      console.log(
        "Fetching historical data...",
        endTime ? `before ${endTime}` : "latest"
      );

      let klines: CandlestickData[] = [];

      // Try multiple data sources in order of preference
      try {
        // First try Binance (more reliable for historical data)
        klines = await fetchFromBinance(endTime);
        setCurrentDataSource("Binance");
        console.log(
          "Successfully fetched from Binance:",
          klines.length,
          "candles"
        );
      } catch (binanceError) {
        console.warn("Binance failed, trying Bybit:", binanceError);

        try {
          // Fallback to Bybit
          klines = await fetchFromBybit(endTime);
          setCurrentDataSource("Bybit");
          console.log(
            "Successfully fetched from Bybit:",
            klines.length,
            "candles"
          );
        } catch (bybitError) {
          console.warn("Bybit failed, trying CoinGecko:", bybitError);

          // Fallback to CoinGecko (limited but more historical data)
          klines = await fetchFromCoinGecko(endTime);
          setCurrentDataSource("CoinGecko");
          console.log(
            "Successfully fetched from CoinGecko:",
            klines.length,
            "candles"
          );
        }
      }

      if (klines.length > 0) {
        const firstTimestamp = klines[0].time as number;

        if (isLoadingMore && endTime) {
          // If this is loading more data, prepend to existing data
          setInitialData((prevData) => {
            // Filter out any potential duplicates and merge
            const existingTimestamps = new Set(
              prevData.map((item) => item.time)
            );
            const newData = klines.filter(
              (item: CandlestickData) => !existingTimestamps.has(item.time)
            );

            const combined = [...newData, ...prevData];
            const sortedData = combined.sort(
              (a: CandlestickData, b: CandlestickData) =>
                (a.time as number) - (b.time as number)
            );

            console.log(
              `Combined data: ${newData.length} new + ${prevData.length} existing = ${sortedData.length} total`
            );
            return sortedData;
          });

          // Update earliest timestamp
          setEarliestTimestamp(firstTimestamp);

          // Check if we got fewer results than requested (indicating we've reached the end)
          if (klines.length < 100) {
            // Lower threshold since different APIs have different limits
            setHasMoreData(false);
          }
        } else {
          // If this is initial load, replace all data
          const sortedData = klines.sort(
            (a: CandlestickData, b: CandlestickData) =>
              (a.time as number) - (b.time as number)
          );
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
      console.log("Skip loading more data:", {
        isLoadingMore,
        earliestTimestamp,
        hasMoreData,
      });
      return;
    }

    try {
      console.log(
        "Loading more historical data before timestamp:",
        earliestTimestamp
      );
      await fetchHistoricalData(earliestTimestamp, true);
    } catch (error) {
      console.error("Error in loadMoreHistoricalData:", error);
      setError("Failed to load more historical data");
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, earliestTimestamp, hasMoreData]);

  // Calculate moving average
  const calculateMovingAverage = (
    data: CandlestickData[],
    period: number
  ): MovingAverageData[] => {
    if (data.length < period) return [];

    const result: MovingAverageData[] = [];

    for (let i = period - 1; i < data.length; i++) {
      const sum = data
        .slice(i - period + 1, i + 1)
        .reduce((acc, candle) => acc + candle.close, 0);
      const average = sum / period;

      result.push({
        time: data[i].time,
        value: average,
      });
    }

    return result;
  };

  // Initialize chart
  const initializeChart = useCallback(() => {
    if (
      !chartContainerRef.current ||
      initialData.length === 0 ||
      isDisposedRef.current
    ) {
      console.log(
        "Chart initialization skipped - container or data not ready or disposed"
      );
      return;
    }

    try {
      console.log("Initializing chart with", initialData.length, "data points");

      // If chart already exists, just update the data
      if (
        chartRef.current &&
        candlestickSeriesRef.current &&
        !isDisposedRef.current
      ) {
        console.log(
          "Updating existing chart with",
          initialData.length,
          "data points"
        );
        console.log(
          "First timestamp:",
          initialData[0]?.time,
          "Last timestamp:",
          initialData[initialData.length - 1]?.time
        );

        // Verify data is sorted and has no duplicates
        const timestamps = initialData.map((item) => item.time as number);
        const uniqueTimestamps = new Set(timestamps);
        const isSorted = initialData.every(
          (item, index) =>
            index === 0 ||
            (item.time as number) > (initialData[index - 1].time as number)
        );

        console.log(
          "Data is sorted:",
          isSorted,
          "Has duplicates:",
          timestamps.length !== uniqueTimestamps.size
        );

        if (isSorted && timestamps.length === uniqueTimestamps.size) {
          try {
            if (!isDisposedRef.current && candlestickSeriesRef.current) {
              candlestickSeriesRef.current.setData(initialData);

              // Update moving averages
              if (ma7SeriesRef.current) {
                const ma7Data = calculateMovingAverage(initialData, 7);
                ma7SeriesRef.current.setData(ma7Data);
              }
              if (ma25SeriesRef.current) {
                const ma25Data = calculateMovingAverage(initialData, 25);
                ma25SeriesRef.current.setData(ma25Data);
              }
              if (ma99SeriesRef.current) {
                const ma99Data = calculateMovingAverage(initialData, 99);
                ma99SeriesRef.current.setData(ma99Data);
              }

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
              ma7SeriesRef.current = null;
              ma25SeriesRef.current = null;
              ma99SeriesRef.current = null;
            }
          }
        } else {
          console.error(
            "Data is not properly sorted or has duplicates, recreating chart"
          );
          if (chartRef.current && !isDisposedRef.current) {
            try {
              chartRef.current.remove();
            } catch (removeError) {
              console.error("Error removing chart:", removeError);
            }
            chartRef.current = null;
            candlestickSeriesRef.current = null;
            ma7SeriesRef.current = null;
            ma25SeriesRef.current = null;
            ma99SeriesRef.current = null;
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
        height: chartContainerRef.current.clientHeight,
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

      // Add moving average series
      const ma7Series = chart.addSeries(LineSeries, {
        color: "#3b82f6",
        lineWidth: 2,
        title: "MA (7)",
      });

      const ma25Series = chart.addSeries(LineSeries, {
        color: "#4ecdc4",
        lineWidth: 2,
        title: "MA (25)",
      });

      const ma99Series = chart.addSeries(LineSeries, {
        color: "#f59e0b",
        lineWidth: 2,
        title: "MA (99)",
      });

      // Set initial data
      candlestickSeries.setData(initialData);

      // Calculate and set moving averages
      const ma7Data = calculateMovingAverage(initialData, 7);
      const ma25Data = calculateMovingAverage(initialData, 25);
      const ma99Data = calculateMovingAverage(initialData, 99);

      ma7Series.setData(ma7Data);
      ma25Series.setData(ma25Data);
      ma99Series.setData(ma99Data);

      // Store references
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      ma7SeriesRef.current = ma7Series;
      ma25SeriesRef.current = ma25Series;
      ma99SeriesRef.current = ma99Series;
      setIsChartInitialized(true);

      // Add timeScale subscription to detect when user scrolls back in time
      chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (isDisposedRef.current || !hasMoreData) return;

        const timeRange = chart.timeScale().getVisibleRange();
        if (timeRange && earliestTimestamp && !isLoadingMore) {
          // If user is close to the beginning of data, load more
          const timeDiff = (timeRange.from as number) - earliestTimestamp;
          if (timeDiff < 3600) {
            // Within 1 hour of earliest data
            console.log(
              "User scrolled close to earliest data, loading more..."
            );
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
              height: chartContainerRef.current.clientHeight,
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
  }, [
    initialData,
    earliestTimestamp,
    loadMoreHistoricalData,
    isLoadingMore,
    hasMoreData,
  ]);

  // Connect to WebSocket (try Binance first, fallback to Bybit)
  const connectWebSocket = useCallback(() => {
    if (isDisposedRef.current || isWebSocketConnected) {
      console.log(
        "WebSocket connection skipped - component is disposed or already connected"
      );
      return;
    }

    const connectToBinance = () => {
      try {
        console.log("Connecting to Binance WebSocket...");
        const ws = new WebSocket(
          "wss://stream.binance.com:9443/ws/btcusdt@kline_1m"
        );

        ws.onopen = () => {
          console.log("Binance WebSocket connected successfully");
          setIsWebSocketConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const kline = data.k;

            if (
              kline &&
              candlestickSeriesRef.current &&
              !isDisposedRef.current
            ) {
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
              const lastTimestamp = lastDataPoint
                ? (lastDataPoint.time as number)
                : 0;

              if (newTimestamp >= lastTimestamp) {
                try {
                  if (!isDisposedRef.current && candlestickSeriesRef.current) {
                    candlestickSeriesRef.current.update(candleData);
                  }
                } catch (error) {
                  console.warn(
                    "Failed to update chart with Binance WebSocket data:",
                    error
                  );
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
          console.log(
            "Binance WebSocket disconnected:",
            event.code,
            event.reason
          );
          setIsWebSocketConnected(false);
          setTimeout(() => {
            if (
              !isDisposedRef.current &&
              wsRef.current?.readyState === WebSocket.CLOSED
            ) {
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
              if (
                kline &&
                candlestickSeriesRef.current &&
                !isDisposedRef.current
              ) {
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
                const lastTimestamp = lastDataPoint
                  ? (lastDataPoint.time as number)
                  : 0;

                if (newTimestamp >= lastTimestamp) {
                  try {
                    if (
                      !isDisposedRef.current &&
                      candlestickSeriesRef.current
                    ) {
                      candlestickSeriesRef.current.update(candleData);
                    }
                  } catch (error) {
                    console.warn(
                      "Failed to update chart with Bybit WebSocket data:",
                      error
                    );
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
          console.log(
            "Bybit WebSocket disconnected:",
            event.code,
            event.reason
          );
          setIsWebSocketConnected(false);
          setTimeout(() => {
            if (
              !isDisposedRef.current &&
              wsRef.current?.readyState === WebSocket.CLOSED
            ) {
              connectToBybit();
            }
          }, 5000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("Error connecting to Bybit WebSocket:", err);
        setError(
          `WebSocket connection failed: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
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
      console.log("Cleaning up chart component...");
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
          console.error("Error disposing chart:", error);
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
    } else if (
      initialData.length > 0 &&
      isChartInitialized &&
      candlestickSeriesRef.current
    ) {
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
  const fetchFromBinance = async (
    endTime?: number
  ): Promise<CandlestickData[]> => {
    let url =
      "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=1000";
    if (endTime) {
      url += `&endTime=${endTime * 1000}`; // Convert to milliseconds
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.map(
      (item: [string, string, string, string, string, string]) => ({
        time: (parseInt(item[0]) / 1000) as Time,
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      })
    );
  };

  // Fetch from Bybit API (original implementation)
  const fetchFromBybit = async (
    endTime?: number
  ): Promise<CandlestickData[]> => {
    let url =
      "https://api.bybit.com/v5/market/kline?category=spot&symbol=BTCUSDT&interval=1&limit=200";
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
  const fetchFromCoinGecko = async (
    endTime?: number
  ): Promise<CandlestickData[]> => {
    // CoinGecko has different API structure, we'll use their OHLC endpoint
    const days = endTime
      ? Math.min(90, Math.floor((Date.now() / 1000 - endTime) / 86400) + 1)
      : 1;
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
      ohlcData = ohlcData.filter(
        (item: CandlestickData) => (item.time as number) < endTime
      );
    }

    // Sort by time to ensure chronological order
    return ohlcData.sort(
      (a: CandlestickData, b: CandlestickData) =>
        (a.time as number) - (b.time as number)
    );
  };

  // Fetch ticker data from Binance
  const fetchTickerData = async () => {
    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
      );
      if (response.ok) {
        const ticker = await response.json();
        setTickerData({
          symbol: ticker.symbol,
          price: ticker.lastPrice,
          priceChange: ticker.priceChange,
          priceChangePercent: (
            parseFloat(ticker.priceChangePercent) / 100
          ).toString(),
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
      <div className="w-full max-w-7xl mx-auto p-2">
        <Card className="h-[calc(100vh-1rem)]">
          <CardContent className="p-2 h-full">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Loading Bitcoin data...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto p-2">
        <Card className="h-[calc(100vh-1rem)]">
          <CardContent className="p-2 h-full">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-2">
      <Card className="h-[calc(100vh-1rem)]">
        <CardContent className="p-2 h-full">
          <div className="flex gap-2 h-full">
            {/* Stats Sidebar */}
            <div className="w-64 space-y-2">
              {/* Title and Controls */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold">Bitcoin Monitor</h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        isWebSocketConnected ? "bg-green-600" : "bg-red-600"
                      }`}
                    ></span>
                  </div>
                </div>
                {hasMoreData && (
                  <button
                    onClick={loadMoreHistoricalData}
                    disabled={isLoadingMore}
                    className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center justify-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      "Load More History"
                    )}
                  </button>
                )}
              </div>

              {/* Price Info */}
              {tickerData && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold">
                      {formatPrice(tickerData.price)}
                    </span>
                    <Badge
                      variant={
                        parseFloat(tickerData.priceChangePercent) >= 0
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {formatPercent(tickerData.priceChangePercent)}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div>High: {formatPrice(tickerData.high24h)}</div>
                    <div>Low: {formatPrice(tickerData.low24h)}</div>
                    <div>
                      Volume:{" "}
                      {parseFloat(tickerData.volume24h).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Data Info */}
              {initialData.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Data Points: {initialData.length}</div>
                    <div>Source: {currentDataSource}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative">
              {/* Chart Legend Overlay */}
              <div className="absolute top-2 left-2 z-10 flex gap-1 items-center bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-[#3b82f6]"></div>
                    <span>MA7</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-[#4ecdc4]"></div>
                    <span>MA25</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-[#f59e0b]"></div>
                    <span>MA99</span>
                  </div>
                </div>
                {isLoadingMore && (
                  <div className="z-10 bg-background/90 backdrop-blur-sm rounded ml-1 text-xs text-muted-foreground flex items-center">
                    <Loader2 className="size-3 animate-spin" />
                  </div>
                )}
              </div>

              <div
                ref={chartContainerRef}
                className="w-full h-full border border-slate-700 rounded"
              />

              {!hasMoreData && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm rounded px-2 py-1">
                  All available historical data loaded
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BitcoinPriceChart;
