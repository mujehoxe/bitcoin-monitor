/**
 * Real-time 5-minute price change calculator
 * Maintains a rolling window of price data to calculate 5-minute percentage changes
 */

interface PriceDataPoint {
  price: number;
  timestamp: number;
}

interface SymbolPriceHistory {
  prices: PriceDataPoint[];
  lastUpdate: number;
}

export class RealTime5MinCalculator {
  private static instance: RealTime5MinCalculator;
  private priceHistory = new Map<string, SymbolPriceHistory>();
  private readonly WINDOW_SIZE = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly MAX_DATA_POINTS = 100; // Keep max 100 data points per symbol

  private constructor() {}

  public static getInstance(): RealTime5MinCalculator {
    if (!RealTime5MinCalculator.instance) {
      RealTime5MinCalculator.instance = new RealTime5MinCalculator();
    }
    return RealTime5MinCalculator.instance;
  }

  /**
   * Add a new price data point for a symbol
   */
  public addPriceData(symbol: string, price: number, timestamp?: number): void {
    const now = timestamp || Date.now();
    const symbolUpper = symbol.toUpperCase();

    if (!this.priceHistory.has(symbolUpper)) {
      this.priceHistory.set(symbolUpper, {
        prices: [],
        lastUpdate: now
      });
    }

    const history = this.priceHistory.get(symbolUpper)!;
    
    // Add new data point
    history.prices.push({ price, timestamp: now });
    history.lastUpdate = now;

    // Clean up old data points
    this.cleanupOldData(symbolUpper);
  }

  /**
   * Calculate 5-minute price change percentage for a symbol
   */
  public get5MinuteChange(symbol: string): number | null {
    const symbolUpper = symbol.toUpperCase();
    const history = this.priceHistory.get(symbolUpper);

    if (!history || history.prices.length < 2) {
      return null;
    }

    const now = Date.now();
    const fiveMinutesAgo = now - this.WINDOW_SIZE;

    // Get current price (most recent)
    const currentPrice = history.prices[history.prices.length - 1].price;

    // Find the price closest to 5 minutes ago
    let basePrice = null;
    let closestTimeDiff = Infinity;

    for (const dataPoint of history.prices) {
      const timeDiff = Math.abs(dataPoint.timestamp - fiveMinutesAgo);
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        basePrice = dataPoint.price;
      }
    }

    if (basePrice === null || basePrice === 0) {
      return null;
    }

    // Calculate percentage change
    const priceChange = ((currentPrice - basePrice) / basePrice) * 100;
    return Math.round(priceChange * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get all symbols with their current 5-minute changes
   */
  public getAllChanges(): Map<string, number> {
    const changes = new Map<string, number>();
    
    for (const [symbol] of this.priceHistory) {
      const change = this.get5MinuteChange(symbol);
      if (change !== null) {
        changes.set(symbol, change);
      }
    }

    return changes;
  }

  /**
   * Clean up old data points for a symbol
   */
  private cleanupOldData(symbol: string): void {
    const history = this.priceHistory.get(symbol);
    if (!history) return;

    const now = Date.now();
    const cutoffTime = now - (this.WINDOW_SIZE * 2); // Keep 10 minutes of data

    // Remove data points older than cutoff time
    history.prices = history.prices.filter(point => point.timestamp > cutoffTime);

    // Limit number of data points
    if (history.prices.length > this.MAX_DATA_POINTS) {
      history.prices = history.prices.slice(-this.MAX_DATA_POINTS);
    }
  }

  /**
   * Clear all data for a symbol
   */
  public clearSymbolData(symbol: string): void {
    const symbolUpper = symbol.toUpperCase();
    this.priceHistory.delete(symbolUpper);
  }

  /**
   * Clear all data
   */
  public clearAllData(): void {
    this.priceHistory.clear();
  }

  /**
   * Get debugging information
   */
  public getDebugInfo(): { [symbol: string]: { dataPoints: number; oldestTimestamp: number; newestTimestamp: number; change5min: number | null } } {
    const info: { [symbol: string]: { dataPoints: number; oldestTimestamp: number; newestTimestamp: number; change5min: number | null } } = {};

    for (const [symbol, history] of this.priceHistory) {
      const prices = history.prices;
      info[symbol] = {
        dataPoints: prices.length,
        oldestTimestamp: prices.length > 0 ? prices[0].timestamp : 0,
        newestTimestamp: prices.length > 0 ? prices[prices.length - 1].timestamp : 0,
        change5min: this.get5MinuteChange(symbol)
      };
    }

    return info;
  }
}
