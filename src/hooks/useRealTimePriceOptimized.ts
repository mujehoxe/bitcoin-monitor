import { TrendingCoin } from "@/services/cryptoAPIService";
import { useCallback, useEffect, useRef, useState } from "react";

interface RealTimePriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  timestamp: number;
  // For 5-minute growth calculation
  priceHistory5m: { price: number; timestamp: number }[];
  fiveMinGrowth?: number;
}

interface UseRealTimePriceReturn {
  prices: Map<string, RealTimePriceData>;
  isConnected: boolean;
  error: string | null;
  subscribe: (symbols: string[], isPriority?: boolean) => void;
  unsubscribe: (symbols: string[]) => void;
  updateCoinsWithRealTimeData: (coins: TrendingCoin[]) => TrendingCoin[];
  subscribedCount: number;
  maxSubscriptions: number;
}

// Binance WebSocket limits
const MAX_SUBSCRIPTIONS = 10; // Conservative limit to avoid issues
const CONNECTION_TIMEOUT = 5000; // 5 seconds
const RECONNECT_DELAY = 3000; // 3 seconds
const MAX_RECONNECT_ATTEMPTS = 5;
const PRICE_HISTORY_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useRealTimePriceOptimized = (): UseRealTimePriceReturn => {
  const [prices, setPrices] = useState<Map<string, RealTimePriceData>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(
    new Set()
  );
  const [prioritySymbols, setPrioritySymbols] = useState<Set<string>>(
    new Set()
  );

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  // Clean up timeouts
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Calculate 5-minute growth
  const calculateFiveMinGrowth = useCallback(
    (history: { price: number; timestamp: number }[]): number => {
      if (history.length < 2) return 0;

      const now = Date.now();
      const fiveMinutesAgo = now - PRICE_HISTORY_DURATION;

      // Find the price closest to 5 minutes ago
      const oldPrice =
        history.find((h) => h.timestamp >= fiveMinutesAgo)?.price ||
        history[0].price;
      const currentPrice = history[history.length - 1].price;

      return ((currentPrice - oldPrice) / oldPrice) * 100;
    },
    []
  );

  // Update price history for 5-minute growth calculation
  const updatePriceHistory = useCallback(
    (symbol: string, price: number) => {
      setPrices((prevPrices) => {
        const current = prevPrices.get(symbol);
        if (!current) return prevPrices;

        const now = Date.now();
        const newHistory = [
          ...current.priceHistory5m,
          { price, timestamp: now },
        ];

        // Keep only last 5 minutes of data
        const fiveMinutesAgo = now - PRICE_HISTORY_DURATION;
        const filteredHistory = newHistory.filter(
          (h) => h.timestamp >= fiveMinutesAgo
        );

        const fiveMinGrowth =
          filteredHistory.length > 1
            ? calculateFiveMinGrowth(filteredHistory)
            : 0;

        const newPrices = new Map(prevPrices);
        newPrices.set(symbol, {
          ...current,
          price,
          priceHistory5m: filteredHistory,
          fiveMinGrowth,
          timestamp: now,
        });

        return newPrices;
      });
    },
    [calculateFiveMinGrowth]
  );

  // WebSocket connection management with proper error handling
  const connect = useCallback(() => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || subscribedSymbols.size === 0) {
      return;
    }

    isConnectingRef.current = true;
    clearTimeouts();

    try {
      console.log(
        `Connecting to Binance WebSocket for ${subscribedSymbols.size} symbols...`
      );

      // Use miniTicker stream for lightweight price updates
      const streams = Array.from(subscribedSymbols)
        .slice(0, MAX_SUBSCRIPTIONS)
        .map((symbol) => `${symbol.toLowerCase()}@miniTicker`)
        .join("/");

      if (!streams) {
        console.log("No valid streams to subscribe to");
        isConnectingRef.current = false;
        return;
      }

      const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
      console.log("Connecting to:", wsUrl);

      const ws = new WebSocket(wsUrl);

      // Connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log("Connection timeout, closing...");
          ws.close();
          isConnectingRef.current = false;
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        console.log(
          `WebSocket connected successfully to ${subscribedSymbols.size} symbols`
        );
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        clearTimeouts();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle miniTicker data
          if (data.e === "24hrMiniTicker") {
            const symbol = data.s; // Symbol (e.g., 'BTCUSDT')
            const price = parseFloat(data.c); // Current price
            const priceChangePercent24h = parseFloat(data.P); // 24h price change percent
            const volume24h = parseFloat(data.v); // 24h volume

            setPrices((prevPrices) => {
              const current = prevPrices.get(symbol);
              const priceHistory5m = current?.priceHistory5m || [];

              const newPrices = new Map(prevPrices);
              newPrices.set(symbol, {
                symbol,
                price,
                priceChange24h: (price * priceChangePercent24h) / 100,
                priceChangePercent24h,
                volume24h,
                timestamp: Date.now(),
                priceHistory5m,
                fiveMinGrowth: current?.fiveMinGrowth || 0,
              });
              return newPrices;
            });

            // Update price history for 5-minute growth
            updatePriceHistory(symbol, price);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (errorEvent) => {
        console.error("WebSocket error:", errorEvent);
        setError("WebSocket connection failed");
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;
        clearTimeouts();

        // Only attempt reconnection if it wasn't a clean close and we haven't exceeded max attempts
        if (
          !event.wasClean &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current++;
          console.log(
            `Attempting reconnection ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS} in ${RECONNECT_DELAY}ms...`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setError("Max reconnection attempts reached");
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to create WebSocket connection:", err);
      setError("Failed to create WebSocket connection");
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [subscribedSymbols, clearTimeouts, updatePriceHistory]);

  // Subscribe to symbols with priority handling (no infinite loops)
  const subscribe = useCallback(
    (symbols: string[], isPriority: boolean = false) => {
      console.log(
        `Subscribe request: ${symbols.length} symbols, priority: ${isPriority}`
      );

      setSubscribedSymbols((prevSubscribed) => {
        // Update priority symbols if specified
        if (isPriority) {
          setPrioritySymbols(new Set(symbols));
        }

        // Get current priority symbols
        const currentPriority = isPriority ? new Set(symbols) : prioritySymbols;

        // Combine priority symbols with regular symbols, prioritizing the important ones
        const allRequestedSymbols = new Set([...currentPriority, ...symbols]);

        // Limit to MAX_SUBSCRIPTIONS, prioritizing priority symbols first
        const prioritizedSymbols = [
          ...Array.from(currentPriority),
          ...Array.from(allRequestedSymbols).filter(
            (s) => !currentPriority.has(s)
          ),
        ].slice(0, MAX_SUBSCRIPTIONS);

        const newSubscribed = new Set(prioritizedSymbols);

        // Only reconnect if symbols actually changed
        if (
          JSON.stringify([...prevSubscribed].sort()) !==
          JSON.stringify([...newSubscribed].sort())
        ) {
          console.log(
            `Updating subscriptions to ${newSubscribed.size}/${allRequestedSymbols.size} symbols:`,
            Array.from(newSubscribed)
          );

          // Close existing connection
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.close();
          }

          return newSubscribed;
        }

        return prevSubscribed;
      });
    },
    [prioritySymbols]
  );

  // Unsubscribe from symbols
  const unsubscribe = useCallback((symbols: string[]) => {
    setSubscribedSymbols((prevSubscribed) => {
      const newSubscribed = new Set(prevSubscribed);
      symbols.forEach((symbol) => newSubscribed.delete(symbol));

      setPrioritySymbols((prevPriority) => {
        const newPriority = new Set(prevPriority);
        symbols.forEach((symbol) => newPriority.delete(symbol));
        return newPriority;
      });

      // Remove prices for unsubscribed symbols
      setPrices((prevPrices) => {
        const newPrices = new Map(prevPrices);
        symbols.forEach((symbol) => newPrices.delete(symbol));
        return newPrices;
      });

      console.log("Unsubscribed from symbols:", symbols);

      // Close connection if no symbols left
      if (newSubscribed.size === 0 && wsRef.current) {
        wsRef.current.close();
      }

      return newSubscribed;
    });
  }, []);

  // Update coins with real-time data including 5-minute growth
  const updateCoinsWithRealTimeData = useCallback(
    (coins: TrendingCoin[]): TrendingCoin[] => {
      return coins.map((coin) => {
        const realTimeData = prices.get(coin.symbol);
        if (realTimeData) {
          return {
            ...coin,
            price: realTimeData.price,
            priceChange24h: realTimeData.priceChange24h,
            priceChangePercent24h: realTimeData.priceChangePercent24h,
            volume24h: realTimeData.volume24h,
            growthRate5min: realTimeData.fiveMinGrowth || 0,
          };
        }
        return coin;
      });
    },
    [prices]
  );

  // Connect when subscribed symbols change
  useEffect(() => {
    if (subscribedSymbols.size > 0 && !isConnectingRef.current) {
      // Small delay to ensure clean state
      const timeout = setTimeout(() => {
        connect();
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [subscribedSymbols, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearTimeouts]);

  return {
    prices,
    isConnected,
    error,
    subscribe,
    unsubscribe,
    updateCoinsWithRealTimeData,
    subscribedCount: subscribedSymbols.size,
    maxSubscriptions: MAX_SUBSCRIPTIONS,
  };
};
