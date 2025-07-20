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

interface UseRealTimePriceStableReturn {
  setWatchedSymbols: (symbols: string[], prioritySymbol?: string) => void;
  updateCoinsWithRealTimeData: (coins: TrendingCoin[]) => TrendingCoin[];
  subscribedCount: number;
  maxSubscriptions: number;
  isConnected: boolean;
}

// Maximum number of symbols to subscribe to simultaneously (Binance limit consideration)
const MAX_SUBSCRIPTIONS = 5;

export const useRealTimePriceStable = (): UseRealTimePriceStableReturn => {
  const [prices, setPrices] = useState<Record<string, RealTimePriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  // WebSocket connection management
  const connect = useCallback((symbols: string[]) => {
    if (symbols.length === 0 || isConnectingRef.current) {
      return;
    }

    try {
      console.log(
        `Connecting to Binance WebSocket for ${symbols.length} symbols...`
      );
      isConnectingRef.current = true;

      // Create individual streams for subscribed symbols (limited to MAX_SUBSCRIPTIONS)
      const streams = symbols
        .slice(0, MAX_SUBSCRIPTIONS)
        .map((symbol) => `${symbol.toLowerCase()}@ticker`);

      if (streams.length === 0) {
        console.log("No valid streams to subscribe to");
        isConnectingRef.current = false;
        return;
      }

      // Use the combined stream endpoint
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join(
        "/"
      )}`;
      console.log("Connecting to WebSocket URL:", wsUrl);

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected to ${symbols.length} symbols`);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("WebSocket message:", message);

          // Handle combined stream format
          if (message.stream && message.data) {
            const streamName = message.stream;
            const ticker = message.data;

            if (streamName.endsWith("@ticker") && ticker.s) {
              const symbol = ticker.s;
              const price = parseFloat(ticker.c);
              const priceChange24h = parseFloat(ticker.P);
              const volume24h = parseFloat(ticker.v);

              setPrices((prev) => ({
                ...prev,
                [symbol]: {
                  symbol,
                  price,
                  priceChange24h: (price * priceChange24h) / 100,
                  priceChangePercent24h: priceChange24h,
                  volume24h,
                  timestamp: Date.now(),
                },
              }));
            }
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        isConnectingRef.current = false;

        // Reconnect after 3 seconds
        if (!event.wasClean) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect(symbols);
          }, 3000);
        }
      };
    } catch (err) {
      console.error("Failed to connect to WebSocket:", err);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, []);

  // Set watched symbols with priority handling
  const setWatchedSymbols = useCallback(
    (symbols: string[], prioritySymbol?: string) => {
      console.log(
        `Setting watched symbols: ${symbols.length} symbols, priority: ${prioritySymbol}`
      );

      // Limit to MAX_SUBSCRIPTIONS, prioritizing priority symbol first
      const prioritizedSymbols: string[] = [];

      // Add priority symbol first if it exists
      if (prioritySymbol && symbols.includes(prioritySymbol)) {
        prioritizedSymbols.push(prioritySymbol);
      }

      // Add remaining symbols without exceeding limit
      const remainingSlots = MAX_SUBSCRIPTIONS - prioritizedSymbols.length;
      const additionalSymbols = symbols
        .filter((s) => s !== prioritySymbol)
        .slice(0, remainingSlots);

      prioritizedSymbols.push(...additionalSymbols);

      console.log(
        `Subscribing to ${prioritizedSymbols.length}/${symbols.length} symbols:`,
        prioritizedSymbols
      );

      setSubscribedSymbols(prioritizedSymbols);

      // Only connect if we have symbols to watch
      if (prioritizedSymbols.length > 0) {
        connect(prioritizedSymbols);
      } else {
        // If no symbols, close the connection
        if (wsRef.current) {
          wsRef.current.close();
          setIsConnected(false);
        }
      }
    },
    [connect]
  );

  // Update coins with real-time data
  const updateCoinsWithRealTimeData = useCallback(
    (coins: TrendingCoin[]): TrendingCoin[] => {
      return coins.map((coin) => {
        const realTimeData = prices[coin.symbol];
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    setWatchedSymbols,
    updateCoinsWithRealTimeData,
    subscribedCount: subscribedSymbols.length,
    maxSubscriptions: MAX_SUBSCRIPTIONS,
    isConnected,
  };
};
