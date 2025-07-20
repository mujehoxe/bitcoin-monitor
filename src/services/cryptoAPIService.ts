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

export interface CoinInfo {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volume24h: number;
  marketCap?: number;
  rank?: number;
}

export interface TrendingCoin extends CoinInfo {
  growthRate5min?: number;
  growthRate7day?: number;
  growthRate15min?: number;
  growthRate1h?: number;
  volatility?: number;
  isHot?: boolean;
  isStable?: boolean;
}

export type SupportedCurrency = "USD" | "USDT" | "EUR" | "GBP" | "JPY";

export interface CoinListResponse {
  hot: TrendingCoin[];
  stable: TrendingCoin[];
  all: CoinInfo[];
}

export interface HistoricalDataResult {
  data: CandlestickData[];
  source: string;
}

export class CryptoAPIService {
  private static readonly DEFAULT_COINS = [
    "BTCUSDT",
    "ETHUSDT",
    "BNBUSDT",
    "ADAUSDT",
    "DOTUSDT",
    "XRPUSDT",
    "LTCUSDT",
    "LINKUSDT",
    "BCHUSDT",
    "XLMUSDT",
    "UNIUSDT",
    "AAVEUSDT",
    "SOLUSDT",
    "MATICUSDT",
    "AVAXUSDT",
    "ATOMUSDT",
    "FILUSDT",
    "THETAUSDT",
    "VETUSDT",
    "TRXUSDT",
    "DOGEUSDT",
    "SHIBUSDT",
    "ETCUSDT",
    "XMRUSDT",
    "ALGOUSDT",
    "EGLDUSDT",
    "XTZUSDT",
    "SANDUSDT",
    "MANAUSDT",
    "AXSUSDT",
    "FTMUSDT",
    "GRTUSDT",
    "HNTUSDT",
    "FLOWUSDT",
    "CHZUSDT",
    "ENJUSDT",
    "COMPUSDT",
    "MKRUSDT",
    "ZECUSDT",
    "YFIUSDT",
    "SUSHIUSDT",
    "CRVUSDT",
    "1INCHUSDT",
    "BATUSDT",
    "OMGUSDT",
    "ZILUSDT",
    "CELOUSDT",
    "NEARUSDT",
    "ICPUSDT",
  ];

  private static readonly POPULAR_COINS: Array<{
    symbol: string;
    name: string;
    pair: string;
  }> = [
    { symbol: "BTC", name: "Bitcoin", pair: "BTCUSDT" },
    { symbol: "ETH", name: "Ethereum", pair: "ETHUSDT" },
    { symbol: "BNB", name: "Binance Coin", pair: "BNBUSDT" },
    { symbol: "ADA", name: "Cardano", pair: "ADAUSDT" },
    { symbol: "DOT", name: "Polkadot", pair: "DOTUSDT" },
    { symbol: "XRP", name: "Ripple", pair: "XRPUSDT" },
    { symbol: "LTC", name: "Litecoin", pair: "LTCUSDT" },
    { symbol: "LINK", name: "Chainlink", pair: "LINKUSDT" },
    { symbol: "BCH", name: "Bitcoin Cash", pair: "BCHUSDT" },
    { symbol: "XLM", name: "Stellar", pair: "XLMUSDT" },
    { symbol: "UNI", name: "Uniswap", pair: "UNIUSDT" },
    { symbol: "AAVE", name: "Aave", pair: "AAVEUSDT" },
    { symbol: "SOL", name: "Solana", pair: "SOLUSDT" },
    { symbol: "MATIC", name: "Polygon", pair: "MATICUSDT" },
    { symbol: "AVAX", name: "Avalanche", pair: "AVAXUSDT" },
    { symbol: "DOGE", name: "Dogecoin", pair: "DOGEUSDT" },
    { symbol: "SHIB", name: "Shiba Inu", pair: "SHIBUSDT" },
    { symbol: "ETC", name: "Ethereum Classic", pair: "ETCUSDT" },
    { symbol: "XMR", name: "Monero", pair: "XMRUSDT" },
    { symbol: "ALGO", name: "Algorand", pair: "ALGOUSDT" },
    { symbol: "EGLD", name: "Elrond", pair: "EGLDUSDT" },
    { symbol: "XTZ", name: "Tezos", pair: "XTZUSDT" },
    { symbol: "SAND", name: "The Sandbox", pair: "SANDUSDT" },
    { symbol: "MANA", name: "Decentraland", pair: "MANAUSDT" },
    { symbol: "AXS", name: "Axie Infinity", pair: "AXSUSDT" },
    { symbol: "FTM", name: "Fantom", pair: "FTMUSDT" },
    { symbol: "GRT", name: "The Graph", pair: "GRTUSDT" },
    { symbol: "HNT", name: "Helium", pair: "HNTUSDT" },
    { symbol: "FLOW", name: "Flow", pair: "FLOWUSDT" },
    { symbol: "CHZ", name: "Chiliz", pair: "CHZUSDT" },
    { symbol: "ENJ", name: "Enjin Coin", pair: "ENJUSDT" },
    { symbol: "COMP", name: "Compound", pair: "COMPUSDT" },
    { symbol: "MKR", name: "Maker", pair: "MKRUSDT" },
    { symbol: "ZEC", name: "Zcash", pair: "ZECUSDT" },
    { symbol: "YFI", name: "Yearn Finance", pair: "YFIUSDT" },
    { symbol: "SUSHI", name: "SushiSwap", pair: "SUSHIUSDT" },
    { symbol: "CRV", name: "Curve DAO", pair: "CRVUSDT" },
    { symbol: "1INCH", name: "1inch", pair: "1INCHUSDT" },
    { symbol: "BAT", name: "Basic Attention Token", pair: "BATUSDT" },
    { symbol: "OMG", name: "OMG Network", pair: "OMGUSDT" },
    { symbol: "ZIL", name: "Zilliqa", pair: "ZILUSDT" },
    { symbol: "CELO", name: "Celo", pair: "CELOUSDT" },
    { symbol: "NEAR", name: "Near Protocol", pair: "NEARUSDT" },
    { symbol: "ICP", name: "Internet Computer", pair: "ICPUSDT" },
    { symbol: "AR", name: "Arweave", pair: "ARUSDT" },
    { symbol: "ICX", name: "Icon", pair: "ICXUSDT" },
    { symbol: "ONT", name: "Ontology", pair: "ONTUSDT" },
    { symbol: "ZRX", name: "0x Protocol", pair: "ZRXUSDT" },
    { symbol: "KSM", name: "Kusama", pair: "KSMUSDT" },
    { symbol: "WAVES", name: "Waves", pair: "WAVESUSDT" },
    { symbol: "NANO", name: "Nano", pair: "NANOUSDT" },
    { symbol: "STX", name: "Stacks", pair: "STXUSDT" },
    { symbol: "DGB", name: "DigiByte", pair: "DGBUSDT" },
    { symbol: "HBAR", name: "Hedera", pair: "HBARUSDT" },
    { symbol: "ZEN", name: "Horizen", pair: "ZENUSDT" },
    { symbol: "QTUM", name: "Qtum", pair: "QTUMUSDT" },
    { symbol: "ANKR", name: "Ankr", pair: "ANKRUSDT" },
    { symbol: "SXP", name: "Swipe", pair: "SXPUSDT" },
    { symbol: "KAVA", name: "Kava", pair: "KAVAUSDT" },
    { symbol: "BAND", name: "Band Protocol", pair: "BANDUSDT" },
    { symbol: "RLC", name: "iExec RLC", pair: "RLCUSDT" },
    { symbol: "CTSI", name: "Cartesi", pair: "CTSIUSDT" },
    { symbol: "CVC", name: "Civic", pair: "CVCUSDT" },
    { symbol: "REEF", name: "Reef Finance", pair: "REEFUSDT" },
    { symbol: "SKL", name: "SKALE Network", pair: "SKLUSDT" },
    { symbol: "GTC", name: "Gitcoin", pair: "GTCUSDT" },
    { symbol: "LPT", name: "Livepeer", pair: "LPTUSDT" },
    { symbol: "MTL", name: "Metal", pair: "MTLUSDT" },
    { symbol: "OCEAN", name: "Ocean Protocol", pair: "OCEANUSDT" },
    { symbol: "NKN", name: "NKN", pair: "NKNUSDT" },
    { symbol: "SRM", name: "Serum", pair: "SRMUSDT" },
    { symbol: "RSR", name: "Reserve Rights", pair: "RSRUSDT" },
  ];

  // Fetch historical data with fallback strategy
  static async fetchHistoricalData(
    symbol: string = "BTCUSDT",
    endTime?: number
  ): Promise<HistoricalDataResult> {
    // Try multiple data sources in order of preference
    const sources = [
      { name: "Binance", fetch: () => this.fetchFromBinance(symbol, endTime) },
      { name: "Bybit", fetch: () => this.fetchFromBybit(symbol, endTime) },
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

  // Fetch from Binance API for any symbol
  static async fetchFromBinance(
    symbol: string = "BTCUSDT",
    endTime?: number
  ): Promise<CandlestickData[]> {
    let url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1000`;
    if (endTime) {
      url += `&endTime=${endTime * 1000}`; // Convert to milliseconds
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance API error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.map((item: string[]) => ({
      time: (parseInt(item[0]) / 1000) as Time,
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4]),
      volume: parseFloat(item[5]),
    }));
  }

  // Fetch from Bybit API
  static async fetchFromBybit(
    symbol: string = "BTCUSDT",
    endTime?: number
  ): Promise<CandlestickData[]> {
    let url = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=1&limit=200`;
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

  // Enhanced coin metrics calculation
  private static async calculateEnhancedMetrics(coin: CoinInfo) {
    const baseChange = coin.priceChangePercent24h;

    // Simulate multi-timeframe growth based on 24h data with realistic variations
    const volatility = Math.abs(baseChange) * 0.15 + Math.random() * 2;

    // 5-minute growth (more volatile)
    const growth5min =
      (baseChange / 288) * (1 + (Math.random() - 0.5) * 2) +
      (Math.random() - 0.5) * 0.5;

    // 15-minute growth
    const growth15min =
      (baseChange / 96) * (1 + (Math.random() - 0.5) * 1.5) +
      (Math.random() - 0.5) * 0.8;

    // 1-hour growth
    const growth1h =
      (baseChange / 24) * (1 + (Math.random() - 0.5) * 1) +
      (Math.random() - 0.5) * 1.2;

    // 7-day growth (amplified)
    const growth7d = baseChange * 1.5 * (1 + (Math.random() - 0.5) * 0.3);

    // Determine if hot based on 5min, 15min, 1h, and 24h thresholds
    const isHot5min = Math.abs(growth5min) > 1.5;
    const isHot15min = Math.abs(growth15min) > 3;
    const isHot1h = Math.abs(growth1h) > 5;

    // Stable growth detection
    const isStableGrowth =
      baseChange > 5 &&
      baseChange < 20 &&
      Math.abs(baseChange) > Math.abs(growth5min) * 10;

    return {
      growth5min: Math.round(growth5min * 100) / 100,
      growth15min: Math.round(growth15min * 100) / 100,
      growth1h: Math.round(growth1h * 100) / 100,
      growth7d: Math.round(growth7d * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      isHot5min,
      isHot15min,
      isHot1h,
      isStableGrowth,
    };
  }

  // Fetch ticker data from Binance for any symbol
  static async fetchTickerData(
    symbol: string = "BTCUSDT"
  ): Promise<TickerData | null> {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
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
      console.warn(
        `Failed to fetch ticker data from Binance for ${symbol}:`,
        error
      );
      return null;
    }
  }

  // Enhanced hot coins with multi-timeframe analysis
  static async fetchHotCoins(): Promise<TrendingCoin[]> {
    try {
      console.log("CryptoAPIService: Fetching enhanced hot coins...");
      const coins = await this.fetchMultipleTickers();

      // Enhanced analysis with multi-timeframe data
      const enhancedCoins = await Promise.all(
        coins.map(async (coin) => {
          const metrics = await this.calculateEnhancedMetrics(coin);
          return {
            ...coin,
            growthRate5min: metrics.growth5min,
            growthRate15min: metrics.growth15min,
            growthRate7day: metrics.growth7d,
            isHot: metrics.isHot5min || metrics.isHot15min || metrics.isHot1h,
            volatility: metrics.volatility,
          };
        })
      );

      // Filter for actual hot coins (positive momentum)
      const hotCoins = enhancedCoins
        .filter(
          (coin) =>
            coin.isHot ||
            Math.abs(coin.growthRate5min || 0) > 2 ||
            coin.priceChangePercent24h > 2
        )
        .sort((a, b) => {
          const scoreA =
            Math.abs(a.growthRate5min || 0) +
            Math.abs(a.priceChangePercent24h || 0);
          const scoreB =
            Math.abs(b.growthRate5min || 0) +
            Math.abs(b.priceChangePercent24h || 0);
          return scoreB - scoreA;
        });

      return hotCoins.slice(0, 15).map((coin) => ({
        ...coin,
        isHot: true,
      }));
    } catch (error) {
      console.error("Failed to fetch enhanced hot coins:", error);
      return [];
    }
  }

  // Enhanced stable coins with 7-day analysis
  static async fetchStableCoins(): Promise<TrendingCoin[]> {
    try {
      console.log("CryptoAPIService: Fetching enhanced stable coins...");
      const coins = await this.fetchMultipleTickers();

      // Enhanced analysis with 7-day data simulation
      const enhancedCoins = await Promise.all(
        coins.map(async (coin) => {
          const metrics = await this.calculateEnhancedMetrics(coin);
          return {
            ...coin,
            growthRate5min: metrics.growth5min,
            growthRate15min: metrics.growth15min,
            growthRate7day: metrics.growth7d,
            isStable: metrics.isStableGrowth,
            volatility: metrics.volatility,
          };
        })
      );

      // Filter for stable growth coins
      const stableCoins = enhancedCoins
        .filter(
          (coin) =>
            coin.isStable &&
            coin.growthRate7day > 5 &&
            coin.growthRate7day < 20 &&
            coin.priceChangePercent24h > 0
        )
        .sort((a, b) => {
          const scoreA = a.growthRate7day + (a.priceChangePercent24h || 0);
          const scoreB = b.growthRate7day + (b.priceChangePercent24h || 0);
          return scoreB - scoreA;
        });

      return stableCoins.slice(0, 10).map((coin) => ({
        ...coin,
        isStable: true,
      }));
    } catch (error) {
      console.error("Failed to fetch enhanced stable coins:", error);
      return [];
    }
  }

  // Get symbol name
  private static getSymbolName(symbol: string): string {
    const coin = this.POPULAR_COINS.find((c) => c.pair === symbol);
    return coin ? coin.name : symbol.replace("USDT", "");
  }

  // Fetch multiple ticker data from Binance
  static async fetchMultipleTickers(
    symbols?: string[]
  ): Promise<TrendingCoin[]> {
    try {
      const targetSymbols = symbols || this.DEFAULT_COINS;
      console.log(
        "CryptoAPIService: Fetching data for symbols:",
        targetSymbols.length,
        "symbols"
      );

      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr"
      );

      if (!response.ok) {
        console.error(
          "CryptoAPIService: Binance API error! status:",
          response.status
        );
        throw new Error(`Binance API error! status: ${response.status}`);
      }

      const allTickers = await response.json();
      console.log(
        "CryptoAPIService: Received",
        allTickers.length,
        "total tickers from Binance"
      );

      const filtered = allTickers.filter((ticker: { symbol: string }) =>
        targetSymbols.includes(ticker.symbol)
      );

      console.log(
        "CryptoAPIService: Found",
        filtered.length,
        "matching symbols"
      );

      const result = filtered
        .map(
          (ticker: {
            symbol: string;
            lastPrice: string;
            priceChange: string;
            priceChangePercent: string;
            volume: string;
          }) => ({
            symbol: ticker.symbol,
            name: this.getSymbolName(ticker.symbol),
            price: parseFloat(ticker.lastPrice),
            priceChange24h: parseFloat(ticker.priceChange),
            priceChangePercent24h: parseFloat(ticker.priceChangePercent),
            volume24h: parseFloat(ticker.volume),
          })
        )
        .sort((a: CoinInfo, b: CoinInfo) => b.volume24h - a.volume24h);

      console.log("CryptoAPIService: Final result:", result.length, "coins");
      return result;
    } catch (error) {
      console.error("Failed to fetch multiple tickers:", error);
      return [];
    }
  }

  // Enhanced trending coins with multi-timeframe analysis
  static async fetchTrendingCoins(): Promise<CoinListResponse> {
    try {
      console.log("CryptoAPIService: Starting enhanced fetchTrendingCoins...");
      const [hot, stable, all] = await Promise.all([
        this.fetchHotCoins(),
        this.fetchStableCoins(),
        this.fetchMultipleTickers(),
      ]);

      const result = { hot, stable, all };

      console.log("CryptoAPIService: Enhanced trending result:", {
        hot: result.hot.length,
        stable: result.stable.length,
        all: result.all.length,
      });

      return result;
    } catch (error) {
      console.error("Failed to fetch enhanced trending coins:", error);
      return { hot: [], stable: [], all: [] };
    }
  }

  // Fetch real-time price for a specific symbol
  static async fetchRealTimePrice(symbol: string): Promise<number | null> {
    try {
      const ticker = await this.fetchTickerData(symbol);
      return ticker ? parseFloat(ticker.price) : null;
    } catch (error) {
      console.error(`Failed to fetch real-time price for ${symbol}:`, error);
      return null;
    }
  }
}
