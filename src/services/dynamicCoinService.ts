import { TrendingCoin } from "./cryptoAPIService";

export interface BinanceSymbolInfo {
  symbol: string;
  status: string;
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
}

export interface BinanceTicker24hr {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

export interface CoinAnalytics {
  symbol: string;
  price: number;
  priceChangePercent24h: number;
  priceChangePercent5m?: number;
  volume24h: number;
  quoteVolume24h: number;
  volatility?: number;
  momentum?: number;
  isHot: boolean;
  isStable: boolean;
  lastUpdated: number;
}

export class DynamicCoinService {
  private static instance: DynamicCoinService;
  private allSymbols: string[] = [];
  private coinCache = new Map<string, CoinAnalytics>();
  private lastSymbolsUpdate = 0;
  private lastHotCoinsUpdate = 0;
  private lastStableCoinsUpdate = 0;
  
  // Cache durations
  private static readonly SYMBOLS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly HOT_COINS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static readonly STABLE_COINS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  
  private constructor() {}

  public static getInstance(): DynamicCoinService {
    if (!DynamicCoinService.instance) {
      DynamicCoinService.instance = new DynamicCoinService();
    }
    return DynamicCoinService.instance;
  }

  /**
   * Clear all caches and force refresh on next request
   */
  public clearCache(): void {
    console.log("Clearing DynamicCoinService cache...");
    this.allSymbols = [];
    this.coinCache.clear();
    this.lastSymbolsUpdate = 0;
    this.lastHotCoinsUpdate = 0;
    this.lastStableCoinsUpdate = 0;
  }

  /**
   * Fetch all available trading symbols from Binance
   */
  public async getAllTradingSymbols(): Promise<string[]> {
    const now = Date.now();
    
    // Return cached symbols if still valid
    if (this.allSymbols.length > 0 && (now - this.lastSymbolsUpdate) < DynamicCoinService.SYMBOLS_CACHE_DURATION) {
      return this.allSymbols;
    }

    try {
      console.log("Fetching all trading symbols from Binance...");
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch("/api/binance/exchangeInfo", {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange info: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.symbols || !Array.isArray(data.symbols)) {
        throw new Error("Invalid exchange info response format");
      }
      
      // Filter for active USDT pairs only with strict validation
      const usdtPairs = data.symbols
        .filter((symbol: BinanceSymbolInfo) => {
          if (!symbol || !symbol.symbol || typeof symbol.symbol !== 'string') {
            return false;
          }
          
          const symbolName = symbol.symbol.toUpperCase();
          
          // Must be active trading pair
          if (symbol.status !== "TRADING" || !symbol.isSpotTradingAllowed) {
            return false;
          }
          
          // Must be USDT quote asset (not USDC, BUSD, etc.)
          if (symbol.quoteAsset !== "USDT") {
            return false;
          }
          
          // Must end with USDT exactly
          if (!symbolName.endsWith('USDT')) {
            return false;
          }
          
          // Exclude other stablecoins embedded in symbol name
          if (symbolName.includes('USDC') || 
              symbolName.includes('BUSD') || 
              symbolName.includes('DAI') || 
              symbolName.includes('TUSD') ||
              symbolName.includes('FDUSD')) {
            return false;
          }
          
          // Exclude leveraged tokens and derivatives
          if (symbolName.includes('UP') || 
              symbolName.includes('DOWN') || 
              symbolName.includes('BULL') || 
              symbolName.includes('BEAR') ||
              symbolName.includes('LEVERAGE') ||
              symbolName.includes('3L') ||
              symbolName.includes('3S')) {
            return false;
          }
          
          // Exclude other quote assets that might sneak in
          if (symbolName.endsWith('TRY') || 
              symbolName.endsWith('EUR') || 
              symbolName.endsWith('GBP') ||
              symbolName.endsWith('BRL') ||
              symbolName.endsWith('UAH')) {
            return false;
          }
          
          return true;
        })
        .map((symbol: BinanceSymbolInfo) => symbol.symbol);

      if (usdtPairs.length === 0) {
        throw new Error("No valid USDT trading pairs found");
      }

      this.allSymbols = usdtPairs;
      this.lastSymbolsUpdate = now;
      
      console.log(`Loaded ${this.allSymbols.length} USDT trading pairs`);
      console.log(`Sample symbols:`, this.allSymbols.slice(0, 10));
      
      // Debug: Check for any potentially problematic symbols
      const problematicSymbols = this.allSymbols.filter(s => 
        !s.endsWith('USDT') || 
        s.includes('USDC') || 
        s.includes('TRY') || 
        s.includes('EUR')
      );
      
      if (problematicSymbols.length > 0) {
        console.warn(`Found ${problematicSymbols.length} potentially problematic symbols:`, problematicSymbols);
      }
      
      return this.allSymbols;
    } catch (error) {
      console.error("Failed to fetch trading symbols:", error);
      
      // Return cached symbols if available, otherwise return fallback symbols
      if (this.allSymbols.length > 0) {
        console.log(`Using cached symbols (${this.allSymbols.length} pairs)`);
        return this.allSymbols;
      }
      
      // Fallback to common symbols if no cache available
      const fallbackSymbols = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "XRPUSDT", 
        "SOLUSDT", "DOTUSDT", "DOGEUSDT", "AVAXUSDT", "SHIBUSDT",
        "MATICUSDT", "LTCUSDT", "TRXUSDT", "UNIUSDT", "LINKUSDT"
      ];
      console.log(`Using fallback symbols (${fallbackSymbols.length} pairs)`);
      return fallbackSymbols;
    }
  }

  /**
   * Get 24hr ticker statistics for multiple symbols
   */
  public async getTickerStats(symbols?: string[]): Promise<BinanceTicker24hr[]> {
    try {
      const params = new URLSearchParams();
      
      if (symbols && symbols.length > 0) {
        // For specific symbols, use the symbols parameter (limit to prevent URL length issues)
        const limitedSymbols = symbols.slice(0, 100); // Limit to 100 symbols
        const symbolsParam = JSON.stringify(limitedSymbols);
        params.append('symbols', symbolsParam);
      }

      const url = `/api/binance/ticker?${params.toString()}`;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ticker stats: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid ticker stats response format");
      }

      return data;
    } catch (error) {
      console.error("Failed to fetch ticker stats:", error);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error("Ticker stats request timed out");
      }
      return [];
    }
  }

  /**
   * Get 5-minute klines for calculating short-term price changes
   */
  public async getShortTermPriceChanges(symbols: string[]): Promise<Map<string, number>> {
    const priceChanges = new Map<string, number>();

    // Convert all symbols to USDT pairs instead of filtering them out
    const usdtSymbols = symbols.map(symbol => {
      const symbolUpper = symbol.toUpperCase();
      
      // If already ends with USDT, use as-is
      if (symbolUpper.endsWith('USDT')) {
        return symbolUpper;
      }
      
      // Remove any existing quote asset and add USDT
      const baseAsset = symbolUpper
        .replace(/USDT$/, '')
        .replace(/USDC$/, '')
        .replace(/BUSD$/, '')
        .replace(/DAI$/, '')
        .replace(/TRY$/, '')
        .replace(/EUR$/, '')
        .replace(/GBP$/, '')
        .replace(/BRL$/, '')
        .replace(/UAH$/, '')
        .replace(/JPY$/, '')
        .replace(/AUD$/, '')
        .replace(/CAD$/, '');
      
      const usdtSymbol = `${baseAsset}USDT`;
      
      if (symbol !== usdtSymbol) {
        console.log(`Converting symbol: ${symbol} -> ${usdtSymbol}`);
      }
      
      return usdtSymbol;
    });

    // Remove duplicates and filter out obviously invalid symbols
    const validUsdtSymbols = [...new Set(usdtSymbols)].filter(symbol => {
      const isValid = (
        symbol.length > 4 && // Minimum length for valid symbol
        symbol.endsWith('USDT') &&
        !symbol.includes('UP') &&
        !symbol.includes('DOWN') &&
        !symbol.includes('BULL') &&
        !symbol.includes('BEAR') &&
        !symbol.includes('3L') &&
        !symbol.includes('3S') &&
        !/^\d/.test(symbol) // Don't start with numbers
      );
      
      if (!isValid) {
        console.warn(`Filtering out invalid USDT symbol: ${symbol}`);
      }
      
      return isValid;
    });

    if (validUsdtSymbols.length === 0) {
      console.warn("No valid USDT symbols after conversion");
      return priceChanges;
    }

    console.log(`Processing 5-minute data for ${validUsdtSymbols.length} USDT symbols (converted from ${symbols.length} input symbols)`);

    // Process symbols in smaller batches to avoid rate limits
    const batchSize = 5; // Reduced batch size
    const maxSymbols = Math.min(validUsdtSymbols.length, 20); // Limit total symbols to process
    
    for (let i = 0; i < maxSymbols; i += batchSize) {
      const batch = validUsdtSymbols.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (symbol) => {
          try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const params = new URLSearchParams({
              symbol: symbol,
              interval: '1m',
              limit: '5'
            });
            
            const response = await fetch(
              `/api/binance/klines?${params.toString()}`,
              { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const klines: [number, string, string, string, string, string][] = await response.json();
              
              if (Array.isArray(klines) && klines.length >= 2) {
                const currentPrice = parseFloat(klines[klines.length - 1][4]); // Latest close
                const priceStart = parseFloat(klines[0][1]); // First open
                
                if (!isNaN(currentPrice) && !isNaN(priceStart) && priceStart > 0) {
                  const priceChange = ((currentPrice - priceStart) / priceStart) * 100;
                  priceChanges.set(symbol, priceChange);
                }
              }
            } else {
              console.warn(`HTTP ${response.status} for ${symbol} klines`);
            }
          } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
              console.warn(`Failed to get 5m data for ${symbol}:`, error.message);
            }
          }
        })
      );

      // Increased delay between batches to respect rate limits
      if (i + batchSize < maxSymbols) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`Fetched 5-minute data for ${priceChanges.size}/${validUsdtSymbols.length} USDT symbols (converted from ${symbols.length} total)`);
    return priceChanges;
  }

  /**
   * Calculate volatility and momentum indicators
   */
  private calculateAnalytics(ticker: BinanceTicker24hr, priceChange5m?: number): CoinAnalytics {
    const price = parseFloat(ticker.lastPrice);
    const priceChangePercent24h = parseFloat(ticker.priceChangePercent);
    const volume24h = parseFloat(ticker.volume);
    const quoteVolume24h = parseFloat(ticker.quoteVolume);

    // Calculate volatility based on high/low spread
    const high = parseFloat(ticker.highPrice);
    const low = parseFloat(ticker.lowPrice);
    const volatility = ((high - low) / price) * 100;

    // Calculate momentum score (prioritize positive 5min changes)
    const momentum = priceChangePercent24h + (Math.max(priceChange5m || 0, 0) * 3); // Only positive 5min contributes

    // Hot coin criteria: more relaxed to ensure we get results
    const isHot = (
      (priceChange5m || 0) > 0.8 || // Reduced threshold from 1.5% to 0.8%
      ((priceChange5m || 0) > 0.3 && priceChangePercent24h > 5) || // Moderate 5min + decent 24h
      (priceChangePercent24h > 10 && volume24h > 1000000 && (priceChange5m || 0) >= -0.5) // Strong 24h with slight negative 5min acceptable
    );

    // Stable coin criteria: positive 24h growth with controlled volatility
    const isStable = (
      priceChangePercent24h > 2 &&
      priceChangePercent24h < 20 &&
      volatility < 10 &&
      volume24h > 500000
    );

    return {
      symbol: ticker.symbol,
      price,
      priceChangePercent24h,
      priceChangePercent5m: priceChange5m,
      volume24h,
      quoteVolume24h,
      volatility,
      momentum,
      isHot,
      isStable,
      lastUpdated: Date.now()
    };
  }

  /**
   * Get hot coins (most accelerating in last 5 minutes)
   */
  public async getHotCoins(limit = 15): Promise<TrendingCoin[]> {
    const now = Date.now();
    
      // Check if we need to refresh hot coins
      if ((now - this.lastHotCoinsUpdate) < DynamicCoinService.HOT_COINS_CACHE_DURATION) {
        const cachedHotCoins = Array.from(this.coinCache.values())
          .filter(coin => coin.isHot && (coin.priceChangePercent5m || 0) > -1) // Allow slightly negative 5min
          .sort((a, b) => {
            // Primary sort: 5-minute acceleration
            const aGrowth5m = a.priceChangePercent5m || 0;
            const bGrowth5m = b.priceChangePercent5m || 0;
            if (Math.abs(bGrowth5m - aGrowth5m) > 0.1) {
              return bGrowth5m - aGrowth5m;
            }
            // Secondary sort: momentum
            return (b.momentum || 0) - (a.momentum || 0);
          })
          .slice(0, limit);
        
        if (cachedHotCoins.length > 0) {
          console.log(`Using cached hot coins: ${cachedHotCoins.length} found`);
          return this.convertToTrendingCoins(cachedHotCoins);
        }
      }    try {
      console.log("Fetching hot coins with 5-minute acceleration data...");
      
      // Get 24hr ticker data for all symbols
      const tickers = await this.getTickerStats();
      
      // Filter for high-volume coins first to reduce API calls
      const highVolumeTickers = tickers
        .filter(ticker => parseFloat(ticker.quoteVolume) > 100000) // $100k+ volume
        .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 100); // Top 100 by volume

      // Get 5-minute price changes for high-volume coins
      const symbols = highVolumeTickers.map(ticker => ticker.symbol);
      const priceChanges5m = await this.getShortTermPriceChanges(symbols);

      // Calculate analytics for all coins
      const analytics = highVolumeTickers.map(ticker => {
        const priceChange5m = priceChanges5m.get(ticker.symbol);
        return this.calculateAnalytics(ticker, priceChange5m);
      });

      // Update cache
      analytics.forEach(coin => {
        this.coinCache.set(coin.symbol, coin);
      });

      // Filter and sort hot coins by 5-minute acceleration first
      const hotCoins = analytics
        .filter(coin => coin.isHot && (coin.priceChangePercent5m || 0) > -1) // Allow slightly negative 5min changes
        .sort((a, b) => {
          // Primary sort: 5-minute acceleration (higher is better)
          const aGrowth5m = a.priceChangePercent5m || 0;
          const bGrowth5m = b.priceChangePercent5m || 0;
          if (Math.abs(bGrowth5m - aGrowth5m) > 0.1) {
            return bGrowth5m - aGrowth5m;
          }
          // Secondary sort: momentum score
          return (b.momentum || 0) - (a.momentum || 0);
        })
        .slice(0, limit);

      this.lastHotCoinsUpdate = now;
      
      console.log(`Found ${hotCoins.length} hot coins from ${analytics.length} analyzed coins`);
      console.log(`Hot coins criteria matched:`, hotCoins.slice(0, 3).map(c => ({
        symbol: c.symbol,
        price5m: c.priceChangePercent5m,
        price24h: c.priceChangePercent24h,
        isHot: c.isHot
      })));
      
      return this.convertToTrendingCoins(hotCoins);
    } catch (error) {
      console.error("Failed to fetch hot coins:", error);
      return [];
    }
  }

  /**
   * Get stable coins (best 24hr performers with controlled volatility)
   */
  public async getStableCoins(limit = 15): Promise<TrendingCoin[]> {
    const now = Date.now();
    
    // Check if we need to refresh stable coins
    if ((now - this.lastStableCoinsUpdate) < DynamicCoinService.STABLE_COINS_CACHE_DURATION) {
      const cachedStableCoins = Array.from(this.coinCache.values())
        .filter(coin => coin.isStable)
        .sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
        .slice(0, limit);
      
      if (cachedStableCoins.length > 0) {
        return this.convertToTrendingCoins(cachedStableCoins);
      }
    }

    try {
      console.log("Fetching stable coins with 24hr performance data...");
      
      // Get 24hr ticker data for all symbols
      const tickers = await this.getTickerStats();
      
      // Filter for minimum volume and positive performance
      const qualifyingTickers = tickers
        .filter(ticker => 
          parseFloat(ticker.quoteVolume) > 50000 && // $50k+ volume
          parseFloat(ticker.priceChangePercent) > 0 // Positive 24h change
        );

      // Get 5-minute price changes for qualifying coins too
      const symbols = qualifyingTickers.map(ticker => ticker.symbol);
      const priceChanges5m = await this.getShortTermPriceChanges(symbols.slice(0, 50)); // Limit to top 50

      // Calculate analytics for qualifying coins
      const analytics = qualifyingTickers.map(ticker => {
        const priceChange5m = priceChanges5m.get(ticker.symbol);
        return this.calculateAnalytics(ticker, priceChange5m);
      });

      // Update cache
      analytics.forEach(coin => {
        this.coinCache.set(coin.symbol, coin);
      });

      // Filter and sort stable coins
      const stableCoins = analytics
        .filter(coin => coin.isStable)
        .sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
        .slice(0, limit);

      this.lastStableCoinsUpdate = now;
      
      console.log(`Found ${stableCoins.length} stable coins`);
      return this.convertToTrendingCoins(stableCoins);
    } catch (error) {
      console.error("Failed to fetch stable coins:", error);
      return [];
    }
  }

  /**
   * Convert CoinAnalytics to TrendingCoin format
   */
  private convertToTrendingCoins(analytics: CoinAnalytics[]): TrendingCoin[] {
    return analytics.map(coin => ({
      symbol: coin.symbol,
      name: this.getSymbolName(coin.symbol),
      price: coin.price,
      priceChange24h: (coin.price * coin.priceChangePercent24h) / 100,
      priceChangePercent24h: coin.priceChangePercent24h,
      volume24h: coin.volume24h,
      growthRate5min: coin.priceChangePercent5m,
      volatility: coin.volatility,
      isHot: coin.isHot,
      isStable: coin.isStable
    }));
  }

  /**
   * Get user-friendly name for a symbol
   */
  private getSymbolName(symbol: string): string {
    // Remove USDT suffix and format the base asset name
    const baseAsset = symbol.replace('USDT', '');
    
    // Common name mappings
    const nameMap: { [key: string]: string } = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'ADA': 'Cardano',
      'SOL': 'Solana',
      'DOT': 'Polkadot',
      'AVAX': 'Avalanche',
      'MATIC': 'Polygon',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'LTC': 'Litecoin',
      'XRP': 'Ripple',
      'DOGE': 'Dogecoin',
      'SHIB': 'Shiba Inu'
    };

    return nameMap[baseAsset] || baseAsset;
  }

  /**
   * Get all coins currently tracked in cache
   */
  public getAllTrackedCoins(): TrendingCoin[] {
    return this.convertToTrendingCoins(Array.from(this.coinCache.values()));
  }
}
