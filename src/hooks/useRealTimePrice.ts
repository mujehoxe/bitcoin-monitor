import { TrendingCoin } from "@/services/cryptoAPIService";
import { useCallback, useEffect, useRef, useState } from "react";

interface RealTimePriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  timestamp: number;
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

// Maximum number of symbols to subscribe to simultaneously (Binance limit consideration)
const MAX_SUBSCRIPTIONS = 5;

export const useRealTimePrice = (): UseRealTimePriceReturn => {
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
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection management
  const connect = useCallback(() => {
    if (subscribedSymbols.size === 0) {
      console.log("No symbols to subscribe to, skipping WebSocket connection");
      return;
    }

    try {
      console.log(
        `Connecting to Binance WebSocket for ${subscribedSymbols.size} symbols...`
      );

      // Create individual streams for subscribed symbols (limited to MAX_SUBSCRIPTIONS)
      const streams = Array.from(subscribedSymbols)
        .slice(0, MAX_SUBSCRIPTIONS) // Limit to prevent "Insufficient resources" error
        .map((symbol) => `${symbol.toLowerCase()}@ticker`)
        .join("/");

      if (!streams) {
        console.log("No valid streams to subscribe to");
        return;
      }

      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streams}`);

      ws.onopen = () => {
        console.log(
          `Real-time price WebSocket connected to ${subscribedSymbols.size} symbols (limited to ${MAX_SUBSCRIPTIONS})`
        );
        setIsConnected(true);
        setError(null);

        // Send heartbeat every 30 seconds (skip ping for browser WebSocket)
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // Browser WebSocket doesn't have ping method, connection stays alive automatically
            console.log("WebSocket heartbeat - connection alive");
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle individual ticker data
          if (data.e === "24hrTicker") {
            const symbol = data.s; // Symbol (e.g., 'BTCUSDT')
            const price = parseFloat(data.c); // Current price
            const priceChange24h = parseFloat(data.P); // 24h price change percent
            const volume24h = parseFloat(data.v); // 24h volume

            setPrices((prevPrices) => {
              const newPrices = new Map(prevPrices);
              newPrices.set(symbol, {
                symbol,
                price,
                priceChange24h: (price * priceChange24h) / 100,
                priceChangePercent24h: priceChange24h,
                volume24h,
                timestamp: Date.now(),
              });
              return newPrices;
            });
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("WebSocket connection failed");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);

        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Reconnect after 3 seconds
        if (!event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect to WebSocket:", err);
      setError("Failed to connect to WebSocket");
      setIsConnected(false);
    }
  }, [subscribedSymbols]);

  // Subscribe to symbols with priority handling
  const subscribe = useCallback(
    (symbols: string[], isPriority: boolean = false) => {
      console.log(
        `Subscribe request: ${symbols.length} symbols, priority: ${isPriority}`
      );

      // Update priority symbols if specified
      if (isPriority) {
        setPrioritySymbols(new Set(symbols));
      }

      // Get current priority symbols (selected coin, etc.)
      const currentPrioritySymbols = isPriority
        ? new Set(symbols)
        : prioritySymbols;

      // Combine priority symbols with regular symbols, prioritizing the important ones
      const allRequestedSymbols = new Set([
        ...currentPrioritySymbols,
        ...symbols,
      ]);

      // Limit to MAX_SUBSCRIPTIONS, prioritizing priority symbols first
      const prioritizedSymbols = [
        ...Array.from(currentPrioritySymbols),
        ...Array.from(allRequestedSymbols).filter(
          (s) => !currentPrioritySymbols.has(s)
        ),
      ].slice(0, MAX_SUBSCRIPTIONS);

      const newSubscribed = new Set(prioritizedSymbols);

      console.log(
        `Subscribing to ${newSubscribed.size}/${allRequestedSymbols.size} symbols:`,
        Array.from(newSubscribed)
      );

      setSubscribedSymbols(newSubscribed);

      // Reconnect with new symbols
      if (wsRef.current) {
        wsRef.current.close();
      }
    },
    [prioritySymbols]
  );

  // Unsubscribe from symbols
  const unsubscribe = useCallback(
    (symbols: string[]) => {
      const newSubscribed = new Set(subscribedSymbols);
      symbols.forEach((symbol) => newSubscribed.delete(symbol));
      setSubscribedSymbols(newSubscribed);

      // Remove prices for unsubscribed symbols
      const newPrices = new Map(prices);
      symbols.forEach((symbol) => newPrices.delete(symbol));
      setPrices(newPrices);

      console.log("Unsubscribed from symbols:", symbols);

      // Reconnect with remaining symbols
      if (wsRef.current) {
        wsRef.current.close();
      }
    },
    [subscribedSymbols, prices]
  );

  // Update coins with real-time data
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
          };
        }
        return coin;
      });
    },
    [prices]
  );

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Reconnect when subscribed symbols change
  useEffect(() => {
    if (subscribedSymbols.size > 0) {
      // Close existing connection and reconnect with new symbols
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Small delay to ensure clean disconnection
      setTimeout(() => {
        connect();
      }, 100);
    }
  }, [subscribedSymbols, connect]);

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
