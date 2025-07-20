import { CoinInfo, TrendingCoin } from "./cryptoAPIService";

interface EnhancedCoinData extends TrendingCoin {
  growth5min: number;
  growth15min: number;
  growth1h: number;
  growth24h: number;
  growth7d: number;
  volume5min: number;
  volume15min: number;
  volume1h: number;
  momentum: number;
  volatility: number;
  isHot5min: boolean;
  isHot15min: boolean;
  isHot1h: boolean;
  isStableGrowth: boolean;
  lastUpdate: string;
}

interface EnhancedCoinListResponse {
  hot: EnhancedCoinData[];
  stable: EnhancedCoinData[];
  all: EnhancedCoinData[];
}

export class EnhancedCryptoService {
  private static readonly BASE_URL = "https://api.binance.com/api/v3";
  private cache = new Map<string, EnhancedCoinData>();

  // Enhanced analysis with multiple timeframes
  async getEnhancedTrendingCoins(): Promise<EnhancedCoinListResponse> {
    try {
      // Get basic coin data
      const basicResponse = await fetch(
        `${EnhancedCryptoService.BASE_URL}/ticker/24hr`
      );
      const allTickers = await basicResponse.json();

      const usdtPairs = allTickers.filter(
        (t: any) =>
          t.symbol.endsWith("USDT") && parseFloat(t.quoteVolume) > 100000
      );

      // Get enhanced data for each symbol
      const enhancedCoins = await Promise.all(
        usdtPairs.slice(0, 50).map(async (ticker: any) => {
          const symbol = ticker.symbol;
          const enhancedData = await this.enhanceCoinData(symbol, ticker);
          return enhancedData;
        })
      );

      // Filter and categorize
      const hot = enhancedCoins
        .filter(
          (coin) =>
            coin.isHot5min ||
            coin.isHot15min ||
            coin.isHot1h ||
            coin.growth5min > 2
        )
        .sort((a, b) => Math.abs(b.growth5min) - Math.abs(a.growth5min));

      const stable = enhancedCoins
        .filter((coin) => coin.isStableGrowth && coin.growth7d > 5)
        .sort((a, b) => b.growth7d - a.growth7d);

      return { hot, stable, all: enhancedCoins };
    } catch (error) {
      console.error("Error getting enhanced trending coins:", error);
      return { hot: [], stable: [], all: [] };
    }
  }

  // Enhance basic coin data with advanced metrics
  private async enhanceCoinData(
    symbol: string,
    ticker: any
  ): Promise<EnhancedCoinData> {
    const baseCoin: CoinInfo = {
      symbol,
      name: this.getSymbolName(symbol),
      price: parseFloat(ticker.lastPrice),
      priceChange24h: parseFloat(ticker.priceChange),
      priceChangePercent24h: parseFloat(ticker.priceChangePercent),
      volume24h: parseFloat(ticker.quoteVolume),
    };

    // Get historical data for analysis
    const metrics = await this.calculateGrowthMetrics(symbol);

    const enhanced: EnhancedCoinData = {
      ...baseCoin,
      ...(baseCoin as TrendingCoin),
      growth5min: metrics.growth5min,
      growth15min: metrics.growth15min,
      growth1h: metrics.growth1h,
      growth24h: parseFloat(ticker.priceChangePercent),
      growth7d: await this.calculate7DayGrowth(symbol),
      volume5min: 0, // Placeholder - would need 5min volume data
      volume15min: 0,
      volume1h: 0,
      momentum: metrics.momentum,
      volatility: metrics.volatility,
      isHot5min: Math.abs(metrics.growth5min) > 1.5,
      isHot15min: Math.abs(metrics.growth15min) > 3,
      isHot1h: Math.abs(metrics.growth1h) > 5,
      isStableGrowth: await this.isStableGrowth(symbol),
      lastUpdate: new Date().toISOString(),
    };

    this.cache.set(symbol, enhanced);
    return enhanced;
  }

  // Calculate growth metrics for different timeframes
  private async calculateGrowthMetrics(symbol: string) {
    try {
      // Get 5-minute data for detailed analysis
      const kline5m = await this.fetchKlines(symbol, "5m", 12);
      const kline15m = await this.fetchKlines(symbol, "15m", 4);
      const kline1h = await this.fetchKlines(symbol, "1h", 24);

      const current = parseFloat(kline5m[kline5m.length - 1]?.close || "0");
      const fiveMinAgo = parseFloat(kline5m[0]?.close || "0");
      const fifteenMinAgo = parseFloat(kline15m[0]?.close || "0");
      const oneHourAgo = parseFloat(kline1h[0]?.close || "0");

      return {
        growth5min:
          fiveMinAgo > 0 ? ((current - fiveMinAgo) / fiveMinAgo) * 100 : 0,
        growth15min:
          fifteenMinAgo > 0
            ? ((current - fifteenMinAgo) / fifteenMinAgo) * 100
            : 0,
        growth1h:
          oneHourAgo > 0 ? ((current - oneHourAgo) / oneHourAgo) * 100 : 0,
        momentum: this.calculateMomentum(kline5m),
        volatility: this.calculateVolatility(kline5m),
      };
    } catch (error) {
      console.error(`Error calculating metrics for ${symbol}:`, error);
      return {
        growth5min: 0,
        growth15min: 0,
        growth1h: 0,
        momentum: 0,
        volatility: 0,
      };
    }
  }

  // Calculate 7-day growth
  private async calculate7DayGrowth(symbol: string): Promise<number> {
    try {
      const klineDaily = await this.fetchKlines(symbol, "1d", 7);
      const current = parseFloat(
        klineDaily[klineDaily.length - 1]?.close || "0"
      );
      const sevenDaysAgo = parseFloat(klineDaily[0]?.close || "0");

      return sevenDaysAgo > 0
        ? ((current - sevenDaysAgo) / sevenDaysAgo) * 100
        : 0;
    } catch (error) {
      console.error(`Error calculating 7-day growth for ${symbol}:`, error);
      return 0;
    }
  }

  // Check if coin has stable growth
  private async isStableGrowth(symbol: string): Promise<boolean> {
    try {
      const klineDaily = await this.fetchKlines(symbol, "1d", 7);
      if (klineDaily.length < 7) return false;

      const weekly = klineDaily;
      const first = parseFloat(weekly[0].close);
      const last = parseFloat(weekly[weekly.length - 1].close);
      const weeklyGrowth = ((last - first) / first) * 100;

      // Must have at least 10% weekly growth
      if (weeklyGrowth < 10) return false;

      // Check for consistent growth (at least 4 positive days)
      let positiveDays = 0;
      for (let i = 1; i < weekly.length; i++) {
        const prev = parseFloat(weekly[i - 1].close);
        const curr = parseFloat(weekly[i].close);
        if (curr > prev) positiveDays++;
      }

      return positiveDays >= 4;
    } catch (error) {
      console.error(`Error checking stable growth for ${symbol}:`, error);
      return false;
    }
  }

  // Fetch kline data
  private async fetchKlines(symbol: string, interval: string, limit: number) {
    const url = `${EnhancedCryptoService.BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.map((k: string[]) => ({
      openTime: k[0],
      closeTime: k[6],
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: k[5],
      quoteVolume: k[7],
      trades: k[8],
    }));
  }

  // Calculate momentum
  private calculateMomentum(klines: any[]): number {
    if (klines.length < 5) return 0;

    const recent = klines.slice(-3);
    const past = klines.slice(-5, -2);

    const recentAvg =
      recent.reduce((sum: number, k: any) => sum + parseFloat(k.close), 0) /
      recent.length;
    const pastAvg =
      past.reduce((sum: number, k: any) => sum + parseFloat(k.close), 0) /
      past.length;

    return pastAvg > 0 ? ((recentAvg - pastAvg) / pastAvg) * 100 : 0;
  }

  // Calculate volatility
  private calculateVolatility(klines: any[]): number {
    if (klines.length < 5) return 0;

    const returns = [];
    for (let i = 1; i < Math.min(klines.length, 10); i++) {
      const ret =
        (parseFloat(klines[i].close) - parseFloat(klines[i - 1].close)) /
        parseFloat(klines[i - 1].close);
      returns.push(ret);
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance) * 100;
  }

  // Get symbol name
  private getSymbolName(symbol: string): string {
    const nameMap: Record<string, string> = {
      BTCUSDT: "Bitcoin",
      ETHUSDT: "Ethereum",
      BNBUSDT: "Binance Coin",
      ADAUSDT: "Cardano",
      SOLUSDT: "Solana",
      DOTUSDT: "Polkadot",
      XRPUSDT: "Ripple",
      LTCUSDT: "Litecoin",
      LINKUSDT: "Chainlink",
      BCHUSDT: "Bitcoin Cash",
      DOGEUSDT: "Dogecoin",
      SHIBUSDT: "Shiba Inu",
      MATICUSDT: "Polygon",
      AVAXUSDT: "Avalanche",
      UNIUSDT: "Uniswap",
      AAVEUSDT: "Aave",
      SANDUSDT: "The Sandbox",
      MANAUSDT: "Decentraland",
    };

    return nameMap[symbol] || symbol.replace("USDT", "");
  }

  // Get enhanced analysis
  async getEnhancedAnalysis(): Promise<EnhancedCoinListResponse> {
    return await this.getEnhancedTrendingCoins();
  }
}

// Export singleton
export const enhancedCryptoService = new EnhancedCryptoService();
