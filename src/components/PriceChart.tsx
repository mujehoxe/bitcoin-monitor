"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis";
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
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

interface PriceChartProps {
  selectedSymbol?: string; // Add selectedSymbol prop
  onDataUpdate?: (currentPrice: number, priceHistory: number[]) => void;
  onChartDataUpdate?: (data: {
    isWebSocketConnected: boolean;
    hasMoreData: boolean;
    isLoadingMore: boolean;
    tickerData: TickerData | null;
    dataPointsCount: number;
    currentDataSource: string;
    sentimentError: string | null;
  }) => void;
}

const PriceChart: React.FC<PriceChartProps> = ({
  selectedSymbol = "BTCUSDT", // Default to BTCUSDT
  onDataUpdate,
  onChartDataUpdate,
}) => {
  // Validate and sanitize the selected symbol
  const validateSymbol = (symbol: string): string => {
    const symbolUpper = symbol.toUpperCase();
    
    // Check if symbol is valid format
    if (!symbolUpper.endsWith('USDT') || 
        symbolUpper.includes('USDC') || 
        symbolUpper.includes('BUSD') ||
        symbolUpper.includes('DAI') ||
        symbolUpper.includes('UP') ||
        symbolUpper.includes('DOWN') ||
        symbolUpper.includes('BULL') ||
        symbolUpper.includes('BEAR')) {
      console.warn(`PriceChart: Invalid symbol ${symbol}, using BTCUSDT instead`);
      return "BTCUSDT";
    }
    
    return symbolUpper;
  };
  
  const validatedSymbol = validateSymbol(selectedSymbol);
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

  // Get current price and price history for sentiment analysis
  const currentPrice = useMemo(() => {
    return tickerData
      ? parseFloat(tickerData.price)
      : initialData.length > 0
      ? initialData[initialData.length - 1].close
      : 0;
  }, [tickerData, initialData]);

  const priceHistory = useMemo(() => {
    return initialData.slice(-100).map((d) => d.close); // Last 100 prices
  }, [initialData]);

  const onDataUpdateRef = useRef(onDataUpdate);
  onDataUpdateRef.current = onDataUpdate;

  // Call onDataUpdate when data changes
  React.useEffect(() => {
    if (onDataUpdateRef.current) {
      onDataUpdateRef.current(currentPrice, priceHistory);
    }
  }, [currentPrice, priceHistory]);

  // Sentiment analysis hook - only need error state for display
  const { error: sentimentError } = useSentimentAnalysis(
    currentPrice,
    priceHistory
  );

  // Update chart data for parent component
  React.useEffect(() => {
    if (onChartDataUpdate) {
      onChartDataUpdate({
        isWebSocketConnected,
        hasMoreData,
        isLoadingMore,
        tickerData,
        dataPointsCount: initialData.length,
        currentDataSource,
        sentimentError,
      });
    }
  }, [
    onChartDataUpdate,
    isWebSocketConnected,
    hasMoreData,
    isLoadingMore,
    tickerData,
    initialData.length,
    currentDataSource,
    sentimentError,
  ]);

  // Fetch from Binance API
  const fetchFromBinance = useCallback(
    async (endTime?: number): Promise<CandlestickData[]> => {
      const params = new URLSearchParams({
        symbol: validatedSymbol,
        interval: '1m',
        limit: '1000'
      });
      
      if (endTime) {
        params.append('endTime', (endTime * 1000).toString());
      }

      const url = `/api/binance/klines?${params.toString()}`;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Binance API error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format from Binance API");
        }
        
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
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Binance API timeout for ${validatedSymbol}`);
        }
        throw error;
      }
    },
    [validatedSymbol]
  );

  const fetchFromBybit = useCallback(
    async (endTime?: number): Promise<CandlestickData[]> => {
      let url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${validatedSymbol}&interval=1&limit=200`;
      if (endTime) {
        url += `&end=${endTime * 1000}`;
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Bybit API error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.retCode !== 0) {
          throw new Error(`Bybit API error: ${data.retMsg || 'Unknown error'}`);
        }

        if (!data.result || !Array.isArray(data.result.list)) {
          throw new Error("Invalid data format from Bybit API");
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
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Bybit API timeout for ${validatedSymbol}`);
        }
        throw error;
      }
    },
    [validatedSymbol]
  );

  // Fetch from CoinGecko API (for extended historical data)
  const fetchFromCoinGecko = useCallback(
    async (endTime?: number): Promise<CandlestickData[]> => {
      const symbolMap: { [key: string]: string } = {
        BTCUSDT: "bitcoin",
        ETHUSDT: "ethereum",
        BNBUSDT: "binancecoin",
        ADAUSDT: "cardano",
        DOTUSDT: "polkadot",
        XRPUSDT: "ripple",
        LTCUSDT: "litecoin",
        LINKUSDT: "chainlink",
        BCHUSDT: "bitcoin-cash",
        XLMUSDT: "stellar",
        UNIUSDT: "uniswap",
        AAVEUSDT: "aave",
        SOLUSDT: "solana",
        MATICUSDT: "polygon",
        AVAXUSDT: "avalanche-2",
        ATOMUSDT: "cosmos",
        FILUSDT: "filecoin",
        THETAUSDT: "theta-token",
        VETUSDT: "vechain",
        TRXUSDT: "tron",
        DOGEUSDT: "dogecoin",
        SHIBUSDT: "shiba-inu",
        ETCUSDT: "ethereum-classic",
        XMRUSDT: "monero",
        ALGOUSDT: "algorand",
        EGLDUSDT: "elrond",
        XTZUSDT: "tezos",
        SANDUSDT: "the-sandbox",
        MANAUSDT: "decentraland",
        AXSUSDT: "axie-infinity",
        FTMUSDT: "fantom",
        GRTUSDT: "the-graph",
        HNTUSDT: "helium",
        FLOWUSDT: "flow",
        CHZUSDT: "chiliz",
        ENJUSDT: "enjincoin",
        COMPUSDT: "compound-coin",
        MKRUSDT: "maker",
        ZECUSDT: "zcash",
        YFIUSDT: "yearn-finance",
        SUSHIUSDT: "sushi",
        CRVUSDT: "curve-dao-token",
        "1INCHUSDT": "1inch",
        BATUSDT: "basic-attention-token",
        OMGUSDT: "omisego",
        ZILUSDT: "zilliqa",
        CELOUSDT: "celo",
        NEARUSDT: "near",
        ICPUSDT: "internet-computer",
      };

      const coinId = symbolMap[validatedSymbol] || "bitcoin";
      const days = endTime
        ? Math.min(90, Math.floor((Date.now() / 1000 - endTime) / 86400) + 1)
        : 1;
      
      const params = new URLSearchParams({
        coinId: coinId,
        days: days.toString()
      });
      
      const url = `/api/coingecko/ohlc?${params.toString()}`;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for CoinGecko

      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`CoinGecko API error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error("Invalid data format from CoinGecko API");
        }

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
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`CoinGecko API timeout for ${validatedSymbol}`);
        }
        throw error;
      }
    },
    [validatedSymbol]
  );

  // Fetch historical data with multiple data sources as fallback
  const fetchHistoricalData = useCallback(
    async (endTime?: number, isLoadingMore = false) => {
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
          klines = await fetchFromBinance(endTime);
          setCurrentDataSource("Binance");
        } catch (binanceError) {
          console.warn("Binance failed, trying Bybit:", binanceError);

          try {
            // Fallback to Bybit
            klines = await fetchFromBybit(endTime);
            setCurrentDataSource("Bybit");
          } catch (bybitError) {
            console.warn("Bybit failed, trying CoinGecko:", bybitError);

            // Fallback to CoinGecko (limited but more historical data)
            klines = await fetchFromCoinGecko(endTime);
            setCurrentDataSource("CoinGecko");
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
    },
    [fetchFromBinance, fetchFromBybit, fetchFromCoinGecko]
  ); // Empty dependency array since it only uses stable setState functions

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
  }, [isLoadingMore, earliestTimestamp, hasMoreData, fetchHistoricalData]);

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
            console.warn(
              "Failed to update chart with existing instance:",
              error
            );
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

      // Ensure container has dimensions
      const container = chartContainerRef.current;
      if (
        !container ||
        container.clientWidth === 0 ||
        container.clientHeight === 0
      ) {
        console.warn("Chart container has zero dimensions, waiting...");
        setTimeout(() => initializeChart(), 100);
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

  // Fetch historical data when selectedSymbol changes
  useEffect(() => {
    console.log(`PriceChart: Symbol changed to ${selectedSymbol}, fetching new data...`);
    setError(null);
    setIsLoading(true);
    setInitialData([]);
    setIsChartInitialized(false);
    setHasMoreData(true);
    setEarliestTimestamp(null);
    
    // Reset chart references
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (error) {
        console.error("Error removing chart on symbol change:", error);
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      ma7SeriesRef.current = null;
      ma25SeriesRef.current = null;
      ma99SeriesRef.current = null;
    }
    
    fetchHistoricalData();
  }, [selectedSymbol, fetchHistoricalData]);

  // Initialize chart when data is available
  useEffect(() => {
    if (initialData.length > 0 && !isLoading) {
      initializeChart();
    }
  }, [initialData, isLoading, initializeChart]);

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

  if (isLoading) {
    return (
      <div className="w-full mx-auto p-2">
        <Card className="h-[calc(100vh-1rem)]">
          <CardContent className="p-2 h-full">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Loading {selectedSymbol.replace("USDT", "")} data...
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
    );
  }

  return (
    <div className="w-full h-screen flex items-center p-2">
      <div className="flex gap-4 h-[calc(100vh-2rem)] w-full">
        {/* Price Chart - Takes up the full space */}
        <div className="flex-1">
          <Card className="h-full">
            <CardContent className="p-2 h-full">
              {/* Chart Area */}
              <div className="w-full h-full relative">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
