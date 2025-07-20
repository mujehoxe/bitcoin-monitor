// Test script to debug trending data fetching
const fetch = require("node-fetch");

// Simulate the CryptoAPIService methods
class TestCryptoAPIService {
  static DEFAULT_COINS = [
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
  ];

  static POPULAR_COINS = [
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
  ];

  static getSymbolName(symbol) {
    const coin = this.POPULAR_COINS.find((c) => c.pair === symbol);
    return coin ? coin.name : symbol.replace("USDT", "");
  }

  static async fetchMultipleTickers(symbols) {
    try {
      const targetSymbols = symbols || this.DEFAULT_COINS;
      console.log("Fetching data for symbols:", targetSymbols);

      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr"
      );

      if (!response.ok) {
        throw new Error(`Binance API error! status: ${response.status}`);
      }

      const allTickers = await response.json();
      console.log("Total tickers received:", allTickers.length);

      const filteredTickers = allTickers
        .filter((ticker) => targetSymbols.includes(ticker.symbol))
        .map((ticker) => ({
          symbol: ticker.symbol,
          name: this.getSymbolName(ticker.symbol),
          price: parseFloat(ticker.lastPrice),
          priceChange24h: parseFloat(ticker.priceChange),
          priceChangePercent24h: parseFloat(ticker.priceChangePercent),
          volume24h: parseFloat(ticker.volume),
        }))
        .sort((a, b) => b.volume24h - a.volume24h);

      console.log("Filtered tickers:", filteredTickers.length);
      return filteredTickers;
    } catch (error) {
      console.error("Failed to fetch multiple tickers:", error);
      return [];
    }
  }

  static async fetchHotCoins() {
    try {
      const coins = await this.fetchMultipleTickers();
      console.log("Coins for hot filtering:", coins.length);

      const hotCoins = coins
        .filter((coin) => coin.priceChangePercent24h > 0)
        .sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
        .slice(0, 10)
        .map((coin) => ({
          ...coin,
          growthRate5min: coin.priceChangePercent24h / 24 / 12,
          isHot: true,
        }));

      console.log("Hot coins result:", hotCoins.length);
      return hotCoins;
    } catch (error) {
      console.error("Failed to fetch hot coins:", error);
      return [];
    }
  }

  static async fetchStableCoins() {
    try {
      const coins = await this.fetchMultipleTickers();
      console.log("Coins for stable filtering:", coins.length);

      const stableCoins = coins
        .filter(
          (coin) =>
            coin.priceChangePercent24h > 0 &&
            coin.priceChangePercent24h < 20 &&
            coin.volume24h > 1000000
        )
        .sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h)
        .slice(0, 10)
        .map((coin) => ({
          ...coin,
          volatility: Math.abs(coin.priceChangePercent24h),
          isStable: true,
        }));

      console.log("Stable coins result:", stableCoins.length);
      return stableCoins;
    } catch (error) {
      console.error("Failed to fetch stable coins:", error);
      return [];
    }
  }

  static async fetchTrendingCoins() {
    try {
      console.log("Starting fetchTrendingCoins...");
      const [hot, stable, all] = await Promise.all([
        this.fetchHotCoins(),
        this.fetchStableCoins(),
        this.fetchMultipleTickers(),
      ]);

      const result = { hot, stable, all };
      console.log("Final trending result:", {
        hot: result.hot.length,
        stable: result.stable.length,
        all: result.all.length,
      });

      return result;
    } catch (error) {
      console.error("Failed to fetch trending coins:", error);
      return { hot: [], stable: [], all: [] };
    }
  }
}

// Run the test
async function testTrendingData() {
  console.log("Testing trending data fetching...");

  try {
    const result = await TestCryptoAPIService.fetchTrendingCoins();

    console.log("\n=== FINAL RESULTS ===");
    console.log("Hot coins:", result.hot.length);
    if (result.hot.length > 0) {
      console.log("Sample hot coin:", result.hot[0]);
    }

    console.log("Stable coins:", result.stable.length);
    if (result.stable.length > 0) {
      console.log("Sample stable coin:", result.stable[0]);
    }

    console.log("All coins:", result.all.length);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testTrendingData();
