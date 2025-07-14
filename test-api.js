// Simple test to verify API endpoints
async function testBinanceAPI() {
  try {
    console.log("Testing Binance API...");
    const response = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=5");
    const data = await response.json();
    console.log("Binance API working! Got", data.length, "candles");
    return true;
  } catch (error) {
    console.error("Binance API failed:", error);
    return false;
  }
}

async function testBybitAPI() {
  try {
    console.log("Testing Bybit API...");
    const response = await fetch("https://api.bybit.com/v5/market/kline?category=spot&symbol=BTCUSDT&interval=1&limit=5");
    const data = await response.json();
    console.log("Bybit API working! RetCode:", data.retCode, "Got", data.result?.list?.length || 0, "candles");
    return data.retCode === 0;
  } catch (error) {
    console.error("Bybit API failed:", error);
    return false;
  }
}

async function testCoinGeckoAPI() {
  try {
    console.log("Testing CoinGecko API...");
    const response = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=1");
    const data = await response.json();
    console.log("CoinGecko API working! Got", data.length, "OHLC points");
    return true;
  } catch (error) {
    console.error("CoinGecko API failed:", error);
    return false;
  }
}

async function runTests() {
  console.log("Testing all APIs...\n");
  
  const binanceWorking = await testBinanceAPI();
  const bybitWorking = await testBybitAPI();
  const coinGeckoWorking = await testCoinGeckoAPI();
  
  console.log("\n=== Results ===");
  console.log("Binance:", binanceWorking ? "✅ Working" : "❌ Failed");
  console.log("Bybit:", bybitWorking ? "✅ Working" : "❌ Failed");
  console.log("CoinGecko:", coinGeckoWorking ? "✅ Working" : "❌ Failed");
  
  if (binanceWorking || bybitWorking || coinGeckoWorking) {
    console.log("\n✅ At least one data source is working!");
  } else {
    console.log("\n❌ All data sources failed!");
  }
}

runTests();
