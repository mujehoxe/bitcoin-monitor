import { TrendingCoin } from "./cryptoAPIService";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

interface BinanceKlineData {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  trades: number;
}

interface GrowthMetrics {
  price5min: number;
  price15min: number;
  price1h: number;
  price24h: number;
  price7d: number;
  volume5min: number;
  volume15min: number;
  volume1h: number;
  momentum: number;
  volatility: number;
  trend: "BULLISH" | "BEARISH" | "SIDEWAYS";
}

interface CoinAnalysis extends TrendingCoin {
  growthMetrics: GrowthMetrics;
  isHot5min: boolean;
  isHot15min: boolean;
  isHot1h: boolean;
  isStableGrowth: boolean;
  support: number;
  resistance: number;
  lastUpdate: string;
}

interface AnalysisResult {
  hot: CoinAnalysis[];
  stable: CoinAnalysis[];
  all: CoinAnalysis[];
}

interface KlineResponse {
  [key: string]: string[];
}

export class AdvancedBinanceService {
  private static readonly BASE_URL = "https://api.binance.com/api/v3";
  private static readonly WS_URL = "wss://stream.binance.com:9443/ws";

  // Tracking data
  private klineData = new Map<string, BinanceKlineData[]>();
  private tickerData = new Map<string, BinanceTicker>();
  private analysisCache = new Map<string, CoinAnalysis>();

  // Thresholds for hot coin detection
  private readonly hotThresholds = {
    immediate: { priceChange: 1.5, volumeSpike: 150, momentum: 40 },
    short: { priceChange: 3, volumeSpike: 100, momentum: 35 },
    medium: { priceChange: 8, volumeSpike: 75, momentum: 50 },
  };

  private readonly stableThresholds = {
    weeklyGrowth: 10,
    maxDailyVolatility: 15,
    minPositiveDays: 4,
  };

  // Initialize the service
  async initialize(symbols: string[] = []) {
    if (symbols.length === 0) {
      symbols = await this.getTopVolumeSymbols(50);
    }

    await this.loadHistoricalData(symbols);
    this.startRealTimeTracking(symbols);

    // Update analysis every 30 seconds
    setInterval(() => this.updateAllAnalysis(), 30 * 1000);
  }

  // Get top volume symbols
  private async getTopVolumeSymbols(limit: number): Promise<string[]> {
    try {
      const response = await fetch(
        `${AdvancedBinanceService.BASE_URL}/ticker/24hr`
      );
      const data = (await response.json()) as BinanceTicker[];

      return data
        .filter((ticker: BinanceTicker) => ticker.symbol.endsWith("USDT"))
        .sort(
          (a: BinanceTicker, b: BinanceTicker) =>
            parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
        )
        .slice(0, limit)
        .map((ticker: BinanceTicker) => ticker.symbol);
    } catch (error) {
      console.error("Error fetching top symbols:", error);
      return [];
    }
  }

  // Load historical data for analysis
  private async loadHistoricalData(symbols: string[]) {
    const promises = symbols.map(async (symbol) => {
      try {
        // Load 5-minute data for last 24 hours
        const kline5m = await this.fetchKlines(symbol, "5m", 288);
        // Load 1-hour data for last 7 days
        const kline1h = await this.fetchKlines(symbol, "1h", 168);
        // Load daily data for last 30 days
        const kline1d = await this.fetchKlines(symbol, "1d", 30);

        this.klineData.set(symbol, kline5m);
        this.processTickerData(symbol, { kline5m, kline1h, kline1d });
      } catch (error) {
        console.error(`Error loading data for ${symbol}:`, error);
      }
    });

    await Promise.all(promises);
  }

  // Fetch kline data from Binance
  private async fetchKlines(
    symbol: string,
    interval: string,
    limit: number
  ): Promise<BinanceKlineData[]> {
    const url = `${AdvancedBinanceService.BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    const data = (await response.json()) as KlineResponse[keyof KlineResponse];

    return data.map(
      (k: any[]): BinanceKlineData => ({
        openTime: k[0],
        closeTime: k[6],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        quoteVolume: parseFloat(k[7]),
        trades: parseInt(k[8]),
      })
    );
  }

  // Start real-time tracking
  private startRealTimeTracking(symbols: string[]) {
    const streams = symbols.map((s) => `${s.toLowerCase()}@ticker`);
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join(
      "/"
    )}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.stream && message.data) {
          const symbol = message.data.s;
          this.tickerData.set(symbol, message.data);
        }
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    };
  }

  // Process ticker data for analysis
  private processTickerData(symbol: string, data: any) {
    const { kline5m, kline1h, kline1d } = data as {
      kline5m: BinanceKlineData[];
      kline1h: BinanceKlineData[];
      kline1d: BinanceKlineData[];
    };

    const currentPrice = kline5m[kline5m.length - 1]?.close || 0;

    // Calculate growth metrics
    const metrics = this.calculateGrowthMetrics(
      symbol,
      kline5m,
      kline1h,
      kline1d
    );

    // Check if it's a hot coin or stable growth
    const isHot5min = this.isHotCoin(metrics, "immediate");
    const isHot15min = this.isHotCoin(metrics, "short");
    const isHot1h = this.isHotCoin(metrics, "medium");
    const isStableGrowth = this.isStableGrowthCoin(symbol, kline1d);

    // Calculate support/resistance
    const { support, resistance } = this.calculateSupportResistance(kline5m);

    const analysis: CoinAnalysis = {
      symbol,
      name: this.getSymbolName(symbol),
      price: currentPrice,
      priceChange24h: metrics.price24h,
      priceChangePercent24h: metrics.price24h,
      volume24h: 0,
      growthMetrics: metrics,
      isHot5min,
      isHot15min,
      isHot1h,
      isStableGrowth,
      support,
      resistance,
      lastUpdate: new Date().toISOString(),
    };

    this.analysisCache.set(symbol, analysis);
  }

  // Calculate comprehensive growth metrics
  private calculateGrowthMetrics(
    symbol: string,
    kline5m: BinanceKlineData[],
    kline1h: BinanceKlineData[],
    kline1d: BinanceKlineData[]
  ): GrowthMetrics {
    // 5-minute growth
    const price5min = this.calculatePriceChange(kline5m, 1);
    const volume5min = this.calculateVolumeChange(kline5m, 1);

    // 15-minute growth
    const price15min = this.calculatePriceChange(kline5m, 3);
    const volume15min = this.calculateVolumeChange(kline5m, 3);

    // 1-hour growth
    const price1h = this.calculatePriceChange(kline5m, 12);
    const volume1h = this.calculateVolumeChange(kline5m, 12);

    // 24-hour growth
    const price24h = this.calculatePriceChange(kline1h, 24);

    // 7-day growth
    const price7d = this.calculatePriceChange(kline1d, 7);

    // Momentum and volatility
    const momentum = this.calculateMomentum(kline5m);
    const volatility = this.calculateVolatility(kline5m);
    const trend = this.calculateTrend(kline5m);

    return {
      price5min,
      price15min,
      price1h,
      price24h,
      price7d,
      volume5min,
      volume15min,
      volume1h,
      momentum,
      volatility,
      trend,
    };
  }

  // Calculate price change over intervals
  private calculatePriceChange(
    data: BinanceKlineData[],
    intervals: number
  ): number {
    if (data.length < intervals + 1) return 0;

    const current = data[data.length - 1].close;
    const past = data[data.length - 1 - intervals].close;

    return ((current - past) / past) * 100;
  }

  // Calculate volume change over intervals
  private calculateVolumeChange(
    data: BinanceKlineData[],
    intervals: number
  ): number {
    if (data.length < intervals * 2) return 0;

    const recent = data
      .slice(-intervals)
      .reduce((sum, d) => sum + d.quoteVolume, 0);
    const past = data
      .slice(-(intervals * 2), -intervals)
      .reduce((sum, d) => sum + d.quoteVolume, 0);

    return past > 0 ? ((recent - past) / past) * 100 : 0;
  }

  // Calculate momentum
  private calculateMomentum(data: BinanceKlineData[]): number {
    if (data.length < 10) return 0;

    const recent = data.slice(-5);
    const past = data.slice(-10, -5);

    const recentAvg =
      recent.reduce((sum, d) => sum + d.close, 0) / recent.length;
    const pastAvg = past.reduce((sum, d) => sum + d.close, 0) / past.length;

    return ((recentAvg - pastAvg) / pastAvg) * 100;
  }

  // Calculate volatility
  private calculateVolatility(data: BinanceKlineData[]): number {
    if (data.length < 10) return 0;

    const returns = [];
    for (let i = 1; i < Math.min(data.length, 20); i++) {
      const ret = (data[i].close - data[i - 1].close) / data[i - 1].close;
      returns.push(ret);
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance) * 100;
  }

  // Calculate trend
  private calculateTrend(
    data: BinanceKlineData[]
  ): "BULLISH" | "BEARISH" | "SIDEWAYS" {
    if (data.length < 10) return "SIDEWAYS";

    const prices = data.slice(-10).map((d) => d.close);
    let upMoves = 0;
    let downMoves = 0;

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) upMoves++;
      else if (prices[i] < prices[i - 1]) downMoves++;
    }

    const ratio = upMoves / (upMoves + downMoves);

    if (ratio > 0.6) return "BULLISH";
    if (ratio < 0.4) return "BEARISH";
    return "SIDEWAYS";
  }

  // Check if coin is hot based on thresholds
  private isHotCoin(
    metrics: GrowthMetrics,
    timeframe: "immediate" | "short" | "medium"
  ): boolean {
    const threshold = this.hotThresholds[timeframe];

    let priceKey: keyof GrowthMetrics;
    let volumeKey: keyof GrowthMetrics;

    switch (timeframe) {
      case "immediate":
        priceKey = "price5min";
        volumeKey = "volume5min";
        break;
      case "short":
        priceKey = "price15min";
        volumeKey = "volume15min";
        break;
      case "medium":
        priceKey = "price1h";
        volumeKey = "volume1h";
        break;
    }

    return (
      Math.abs(metrics[priceKey]) >= threshold.priceChange &&
      metrics[volumeKey] >= threshold.volumeSpike &&
      Math.abs(metrics.momentum) >= threshold.momentum
    );
  }

  // Check if coin has stable growth
  private isStableGrowthCoin(
    symbol: string,
    kline1d: BinanceKlineData[]
  ): boolean {
    if (kline1d.length < 7) return false;

    const weekly = kline1d.slice(-7);
    const first = weekly[0].open;
    const last = weekly[weekly.length - 1].close;
    const weeklyGrowth = ((last - first) / first) * 100;

    if (weeklyGrowth < this.stableThresholds.weeklyGrowth) return false;

    // Check volatility
    const dailyReturns = weekly.map((d, i) => {
      if (i === 0) return 0;
      return ((d.close - weekly[i - 1].close) / weekly[i - 1].close) * 100;
    });

    const maxDailyVol = Math.max(...dailyReturns.map(Math.abs));
    if (maxDailyVol > this.stableThresholds.maxDailyVolatility) return false;

    // Check positive days
    const positiveDays = dailyReturns.filter((r) => r > 0).length;
    return positiveDays >= this.stableThresholds.minPositiveDays;
  }

  // Calculate support and resistance levels
  private calculateSupportResistance(kline5m: BinanceKlineData[]): {
    support: number;
    resistance: number;
  } {
    if (kline5m.length < 10) return { support: 0, resistance: 0 };

    const recent = kline5m.slice(-10);
    const highs = recent.map((d) => d.high);
    const lows = recent.map((d) => d.low);

    const resistance = Math.max(...highs);
    const support = Math.min(...lows);

    return { support, resistance };
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

  // Update all analysis
  private updateAllAnalysis() {
    this.analysisCache.forEach((analysis, symbol) => {
      this.updateAnalysis(symbol);
    });
  }

  // Update individual coin analysis
  private updateAnalysis(symbol: string) {
    // This would be called when new data arrives
    // For now, we'll use cached data
  }

  // Get current analysis
  async getCurrentAnalysis(): Promise<AnalysisResult> {
    const allCoins = Array.from(this.analysisCache.values());

    const hot = allCoins
      .filter((coin) => coin.isHot5min || coin.isHot15min || coin.isHot1h)
      .sort(
        (a, b) =>
          Math.abs(b.growthMetrics.price5min) -
          Math.abs(a.growthMetrics.price5min)
      );

    const stable = allCoins
      .filter((coin) => coin.isStableGrowth)
      .sort((a, b) => b.growthMetrics.price7d - a.growthMetrics.price7d);

    return { hot, stable, all: allCoins };
  }

  // Get specific symbol analysis
  getSymbolAnalysis(symbol: string): CoinAnalysis | undefined {
    return this.analysisCache.get(symbol);
  }

  // Start streaming service
  async startStreaming(symbols: string[]) {
    await this.initialize(symbols);
    return this.getCurrentAnalysis();
  }
}

// Export singleton instance
export const advancedBinanceService = new AdvancedBinanceService();
