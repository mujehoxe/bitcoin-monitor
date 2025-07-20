import { TrendingCoin } from "@/services/cryptoAPIService";
import { RealTime5MinCalculator } from "@/services/realTime5MinCalculator";
import { useCallback, useEffect, useRef, useState } from "react";

interface RealTimePriceData {
  symbol: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  priceChangePercent5m?: number;
  volume24h: number;
  timestamp: number;
}

interface UseEnhancedRealTimePriceReturn {
  setWatchedSymbols: (symbols: string[], prioritySymbol?: string) => void;
  updateCoinsWithRealTimeData: (coins: TrendingCoin[]) => TrendingCoin[];
  subscribedCount: number;
  maxSubscriptions: number;
  isConnected: boolean;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  getSymbolPrice: (symbol: string) => number | null;
}

// Reduced limit to improve connection stability and reduce API load
const MAX_SUBSCRIPTIONS = 12;

export const useEnhancedRealTimePrice = (): UseEnhancedRealTimePriceReturn => {
  const [prices, setPrices] = useState<Record<string, RealTimePriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const subscriptionQueueRef = useRef<string[]>([]);
  const prioritySymbolRef = useRef<string | undefined>(undefined);

  // Get instance of 5-minute calculator
  const fiveMinCalculator = RealTime5MinCalculator.getInstance();

  // Subscribe to a new symbol
  const subscribeToSymbol = useCallback((symbol: string) => {
    if (!subscribedSymbols.includes(symbol) && subscribedSymbols.length < MAX_SUBSCRIPTIONS) {
      console.log(`Adding subscription for ${symbol}`);
      
      setSubscribedSymbols(prev => {
        const newSymbols = [...prev, symbol];
        subscriptionQueueRef.current = newSymbols;
        return newSymbols;
      });
    }
  }, [subscribedSymbols]);

  // Unsubscribe from a symbol
  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    console.log(`Removing subscription for ${symbol}`);
    
    setSubscribedSymbols(prev => {
      const newSymbols = prev.filter(s => s !== symbol);
      subscriptionQueueRef.current = newSymbols;
      
      // Remove price data for unsubscribed symbol
      setPrices(prevPrices => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [symbol]: _, ...rest } = prevPrices;
        return rest;
      });
      
      return newSymbols;
    });
  }, []);

  // Get current price for a symbol
  const getSymbolPrice = useCallback((symbol: string): number | null => {
    return prices[symbol]?.price ?? null;
  }, [prices]);

  // WebSocket connection management with dynamic subscription support
  const connect = useCallback((symbols: string[]) => {
    if (symbols.length === 0 || isConnectingRef.current) {
      return;
    }

    try {
      console.log(
        `Connecting to Binance WebSocket for ${symbols.length} symbols...`
      );
      isConnectingRef.current = true;

      // Limit symbols to prevent URL length issues and validate symbols
      const validSymbols = symbols
        .slice(0, MAX_SUBSCRIPTIONS)
        .filter(symbol => symbol && typeof symbol === 'string' && symbol.length > 0)
        .map(symbol => symbol.toUpperCase());

      if (validSymbols.length === 0) {
        console.log("No valid symbols to subscribe to");
        isConnectingRef.current = false;
        return;
      }

      // Create individual streams for subscribed symbols
      const streams = validSymbols
        .map((symbol) => `${symbol.toLowerCase()}@ticker`);

      // Use the combined stream endpoint with error handling for URL length
      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join("/")}`;
      
      // Check URL length to prevent WebSocket errors
      if (wsUrl.length > 2000) {
        console.warn("WebSocket URL too long, reducing symbol count");
        const reducedStreams = streams.slice(0, 10); // Reduce to 10 symbols max
        const reducedUrl = `wss://stream.binance.com:9443/stream?streams=${reducedStreams.join("/")}`;
        console.log("Using reduced WebSocket URL:", reducedUrl);
      }
      
      console.log(`Connecting to WebSocket with ${streams.length} streams`);

      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`WebSocket connected to ${symbols.length} symbols`);
        setIsConnected(true);
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          // Handle combined stream format
          if (message.stream && message.data) {
            const streamName = message.stream;
            const ticker = message.data;

            if (streamName.endsWith("@ticker") && ticker.s) {
              const symbol = ticker.s;
              const price = parseFloat(ticker.c);
              const priceChange24h = parseFloat(ticker.P);
              const volume24h = parseFloat(ticker.v);

              // Add price data to the 5-minute calculator
              fiveMinCalculator.addPriceData(symbol, price);

              // Get the 5-minute percentage change from our calculator
              const priceChangePercent5m = fiveMinCalculator.get5MinuteChange(symbol);

              setPrices((prev) => ({
                ...prev,
                [symbol]: {
                  symbol,
                  price,
                  priceChange24h: (price * priceChange24h) / 100,
                  priceChangePercent24h: priceChange24h,
                  priceChangePercent5m,
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
        console.error("WebSocket error details:", {
          error,
          readyState: ws.readyState,
          url: wsUrl,
          symbolCount: validSymbols.length,
          timestamp: new Date().toISOString()
        });
        setIsConnected(false);
        isConnectingRef.current = false;
        
        // Close the WebSocket if it's in a bad state
        try {
          if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
          }
        } catch (closeError) {
          console.warn("Error closing WebSocket:", closeError);
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          symbolCount: subscriptionQueueRef.current.length,
          timestamp: new Date().toISOString()
        });
        setIsConnected(false);
        isConnectingRef.current = false;

        // Clean up reference
        if (wsRef.current === ws) {
          wsRef.current = null;
        }

        // Only reconnect if there are symbols to subscribe to and connection wasn't cleanly closed
        if (!event.wasClean && subscriptionQueueRef.current.length > 0) {
          const delay = event.code === 1006 ? 5000 : 3000; // Longer delay for abnormal closure
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (subscriptionQueueRef.current.length > 0) {
              console.log("Reconnecting with", subscriptionQueueRef.current.length, "symbols");
              connect(subscriptionQueueRef.current);
            }
          }, delay);
        }
      };
    } catch (err) {
      console.error("Failed to connect to WebSocket:", err);
      setIsConnected(false);
      isConnectingRef.current = false;
    }
  }, [fiveMinCalculator]);

  // Handle dynamic subscription changes
  useEffect(() => {
    if (subscribedSymbols.length > 0 && !isConnectingRef.current) {
      // Reconnect with new subscription list
      connect(subscribedSymbols);
    } else if (subscribedSymbols.length === 0 && wsRef.current) {
      // Close connection if no symbols to watch
      wsRef.current.close();
      setIsConnected(false);
    }
  }, [subscribedSymbols, connect]);

  // Set watched symbols with priority handling and smart subscription management
  const setWatchedSymbols = useCallback(
    (symbols: string[], prioritySymbol?: string) => {
      console.log(
        `Setting watched symbols: ${symbols.length} symbols, priority: ${prioritySymbol}`
      );

      prioritySymbolRef.current = prioritySymbol;

      // Create prioritized subscription list
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

      // Update subscriptions efficiently
      const currentSet = new Set(subscribedSymbols);
      const newSet = new Set(prioritizedSymbols);

      // Find symbols to unsubscribe
      const toUnsubscribe = subscribedSymbols.filter(symbol => !newSet.has(symbol));
      // Find symbols to subscribe
      const toSubscribe = prioritizedSymbols.filter(symbol => !currentSet.has(symbol));

      console.log(`To unsubscribe: ${toUnsubscribe.length}, To subscribe: ${toSubscribe.length}`);

      // Apply changes
      if (toUnsubscribe.length > 0 || toSubscribe.length > 0) {
        setSubscribedSymbols(prioritizedSymbols);
        subscriptionQueueRef.current = prioritizedSymbols;

        // Clean up price data for unsubscribed symbols
        if (toUnsubscribe.length > 0) {
          setPrices(prevPrices => {
            const newPrices = { ...prevPrices };
            toUnsubscribe.forEach(symbol => {
              delete newPrices[symbol];
            });
            return newPrices;
          });
        }
      }
    },
    [subscribedSymbols]
  );

  // Update coins with real-time data, preserving original data when WebSocket data is unavailable
  const updateCoinsWithRealTimeData = useCallback(
    (coins: TrendingCoin[]): TrendingCoin[] => {
      return coins.map((coin) => {
        const realTimeData = prices[coin.symbol];
        if (realTimeData && (Date.now() - realTimeData.timestamp) < 120000) { // Use data if less than 2 minutes old
          return {
            ...coin,
            price: realTimeData.price,
            priceChange24h: realTimeData.priceChange24h,
            priceChangePercent24h: realTimeData.priceChangePercent24h,
            volume24h: realTimeData.volume24h,
            // Update 5min data if available
            ...(realTimeData.priceChangePercent5m !== undefined && {
              growthRate5min: realTimeData.priceChangePercent5m
            })
          };
        }
        return coin; // Return original data if no real-time data available
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
    subscribeToSymbol,
    unsubscribeFromSymbol,
    getSymbolPrice,
  };
};
