import { Time } from "lightweight-charts";

export interface CandlestickData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TickerData {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high24h: string;
  low24h: string;
  volume24h: string;
}

export class CryptoAPIService {
  // Fetch from Binance API
  static async fetchFromBinance(endTime?: number): Promise<CandlestickData[]> {
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
  }

  // Fetch from Bybit API
  static async fetchFromBybit(endTime?: number): Promise<CandlestickData[]> {
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
  }

  // Fetch from CoinGecko API (for extended historical data)
  static async fetchFromCoinGecko(endTime?: number): Promise<CandlestickData[]> {
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
  }

  // Fetch ticker data from Binance
  static async fetchTickerData(): Promise<TickerData | null> {
    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
      );
      if (response.ok) {
        const ticker = await response.json();
        return {
          symbol: ticker.symbol,
          price: ticker.lastPrice,
          priceChange: ticker.priceChange,
          priceChangePercent: (
            parseFloat(ticker.priceChangePercent) / 100
          ).toString(),
          high24h: ticker.highPrice,
          low24h: ticker.lowPrice,
          volume24h: ticker.volume,
        };
      }
      return null;
    } catch (error) {
      console.warn("Failed to fetch ticker data from Binance:", error);
      return null;
    }
  }

  // Fetch historical data with fallback strategy
  static async fetchHistoricalData(endTime?: number): Promise<{
    data: CandlestickData[];
    source: string;
  }> {
    // Try multiple data sources in order of preference
    const sources = [
      { name: "Binance", fetch: () => this.fetchFromBinance(endTime) },
      { name: "Bybit", fetch: () => this.fetchFromBybit(endTime) },
      { name: "CoinGecko", fetch: () => this.fetchFromCoinGecko(endTime) },
    ];

    for (const source of sources) {
      try {
        console.log(`Attempting to fetch from ${source.name}...`);
        const data = await source.fetch();
        console.log(
          `Successfully fetched from ${source.name}:`,
          data.length,
          "candles"
        );
        return { data, source: source.name };
      } catch (error) {
        console.warn(`${source.name} failed:`, error);
        continue;
      }
    }

    throw new Error("All data sources failed");
  }
}
