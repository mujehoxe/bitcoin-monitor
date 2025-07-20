// Test script for the enhanced crypto chart functionality
import { CryptoAPIService } from "../src/services/cryptoAPIService";

async function testCryptoAPI() {
  console.log("🧪 Testing Enhanced Crypto Chart API");
  console.log("=====================================\n");

  try {
    // Test 1: Fetch multiple tickers
    console.log("📊 Testing multiple tickers fetch...");
    const coins = await CryptoAPIService.fetchMultipleTickers([
      "BTCUSDT",
      "ETHUSDT",
      "BNBUSDT",
    ]);
    console.log(`✅ Found ${coins.length} coins`);
    coins.slice(0, 3).forEach((coin) => {
      console.log(
        `   ${coin.name} (${coin.symbol}): $${coin.price.toFixed(
          2
        )} (${coin.priceChangePercent24h.toFixed(2)}%)`
      );
    });

    // Test 2: Fetch hot coins
    console.log("\n🔥 Testing hot coins...");
    const hotCoins = await CryptoAPIService.fetchHotCoins();
    console.log(`✅ Found ${hotCoins.length} hot coins`);
    hotCoins.slice(0, 3).forEach((coin) => {
      console.log(
        `   ${coin.name}: +${coin.priceChangePercent24h.toFixed(
          2
        )}% (5min rate: ${coin.growthRate5min?.toFixed(4)}%)`
      );
    });

    // Test 3: Fetch stable coins
    console.log("\n📈 Testing stable coins...");
    const stableCoins = await CryptoAPIService.fetchStableCoins();
    console.log(`✅ Found ${stableCoins.length} stable coins`);
    stableCoins.slice(0, 3).forEach((coin) => {
      console.log(
        `   ${coin.name}: +${coin.priceChangePercent24h.toFixed(
          2
        )}% (volatility: ${coin.volatility?.toFixed(2)}%)`
      );
    });

    // Test 4: Fetch trending coins (combined)
    console.log("\n🌟 Testing trending coins (combined)...");
    const trending = await CryptoAPIService.fetchTrendingCoins();
    console.log(
      `✅ Hot: ${trending.hot.length}, Stable: ${trending.stable.length}, All: ${trending.all.length}`
    );

    // Test 5: Fetch historical data for different symbols
    console.log("\n📈 Testing historical data for ETH...");
    const ethData = await CryptoAPIService.fetchHistoricalData("ETHUSDT");
    console.log(
      `✅ ETH data: ${ethData.data.length} candles from ${ethData.source}`
    );

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run tests if this file is executed directly
if (typeof require !== "undefined" && require.main === module) {
  testCryptoAPI();
}

export { testCryptoAPI };
