import { Time } from "lightweight-charts";
import { useCallback, useRef, useState } from "react";
import { CandlestickData, TickerData } from "../services/cryptoAPIService";

interface UseWebSocketReturn {
  isConnected: boolean;
  tickerData: TickerData | null;
  connect: (
    symbol: string,
    initialData: CandlestickData[],
    onCandleUpdate: (candle: CandlestickData) => void
  ) => void;
  disconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isDisposedRef = useRef<boolean>(false);

  const connectToBybit = useCallback(
    (
      symbol: string,
      initialData: CandlestickData[],
      onCandleUpdate: (candle: CandlestickData) => void
    ) => {
      try {
        console.log(`Connecting to Bybit WebSocket for ${symbol}...`);
        const ws = new WebSocket("wss://stream.bybit.com/v5/public/spot");

        ws.onopen = () => {
          console.log("Bybit WebSocket connected successfully");
          setIsConnected(true);

          const subscriptions = {
            op: "subscribe",
            args: [`kline.1.${symbol}`, `tickers.${symbol}`],
          };
          ws.send(JSON.stringify(subscriptions));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.topic === `kline.1.${symbol}` && data.data) {
              const kline = data.data[0];
              if (kline && !isDisposedRef.current) {
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
                    onCandleUpdate(candleData);
                  } catch (error) {
                    console.warn(
                      "Failed to update chart with Bybit WebSocket data:",
                      error
                    );
                  }
                }
              }
            } else if (data.topic === `tickers.${symbol}` && data.data) {
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
          setIsConnected(false);
        };

        ws.onclose = (event) => {
          console.log(
            "Bybit WebSocket disconnected:",
            event.code,
            event.reason
          );
          setIsConnected(false);
          setTimeout(() => {
            if (
              !isDisposedRef.current &&
              wsRef.current?.readyState === WebSocket.CLOSED
            ) {
              connectToBybit(symbol, initialData, onCandleUpdate);
            }
          }, 5000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("Error connecting to Bybit WebSocket:", err);
        setIsConnected(false);
      }
    },
    []
  );

  const connectToBinance = useCallback(
    (
      symbol: string,
      initialData: CandlestickData[],
      onCandleUpdate: (candle: CandlestickData) => void
    ) => {
      try {
        console.log(`Connecting to Binance WebSocket for ${symbol}...`);
        const wsSymbol = symbol.toLowerCase();
        const ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${wsSymbol}@kline_1m`
        );

        ws.onopen = () => {
          console.log("Binance WebSocket connected successfully");
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const kline = data.k;

            if (kline && !isDisposedRef.current) {
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
                  onCandleUpdate(candleData);
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
          setIsConnected(false);
          // Try Bybit as fallback
          setTimeout(() => {
            if (!isDisposedRef.current) {
              connectToBybit(symbol, initialData, onCandleUpdate);
            }
          }, 2000);
        };

        ws.onclose = (event) => {
          console.log(
            "Binance WebSocket disconnected:",
            event.code,
            event.reason
          );
          setIsConnected(false);
          setTimeout(() => {
            if (
              !isDisposedRef.current &&
              wsRef.current?.readyState === WebSocket.CLOSED
            ) {
              connectToBinance(symbol, initialData, onCandleUpdate);
            }
          }, 5000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("Error connecting to Binance WebSocket:", err);
        connectToBybit(symbol, initialData, onCandleUpdate);
      }
    },
    [connectToBybit]
  );

  const connect = useCallback(
    (
      symbol: string,
      initialData: CandlestickData[],
      onCandleUpdate: (candle: CandlestickData) => void
    ) => {
      if (isDisposedRef.current || isConnected) {
        console.log(
          "WebSocket connection skipped - component is disposed or already connected"
        );
        return;
      }

      // Start with Binance
      connectToBinance(symbol, initialData, onCandleUpdate);
    },
    [isConnected, connectToBinance]
  );

  const disconnect = useCallback(() => {
    console.log("Disconnecting WebSocket...");
    isDisposedRef.current = true;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setTickerData(null);
  }, []);

  return {
    isConnected,
    tickerData,
    connect,
    disconnect,
  };
};
