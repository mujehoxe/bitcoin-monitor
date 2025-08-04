#!/usr/bin/env node

// Simple test script for the dynamic coin service
import { DynamicCoinService } from '../src/services/dynamicCoinService.js';

async function testDynamicCoinService() {
  console.log('🚀 Testing Dynamic Coin Service...\n');
  
  const service = DynamicCoinService.getInstance();
  
  try {
    console.log('1. Testing getAllTradingSymbols...');
    const symbols = await service.getAllTradingSymbols();
    console.log(`✅ Found ${symbols.length} trading symbols`);
    console.log(`First 10 symbols:`, symbols.slice(0, 10));
    
    console.log('\n2. Testing getHotCoins...');
    const hotCoins = await service.getHotCoins(5);
    console.log(`✅ Found ${hotCoins.length} hot coins`);
    hotCoins.forEach(coin => {
      console.log(`   ${coin.symbol}: ${coin.price}$ (${coin.priceChangePercent24h.toFixed(2)}% 24h, ${coin.priceChangePercent5m?.toFixed(2) || 'N/A'}% 5m)`);
    });
    
    console.log('\n3. Testing getStableCoins...');
    const stableCoins = await service.getStableCoins(5);
    console.log(`✅ Found ${stableCoins.length} stable coins`);
    stableCoins.forEach(coin => {
      console.log(`   ${coin.symbol}: ${coin.price}$ (${coin.priceChangePercent24h.toFixed(2)}% 24h)`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testDynamicCoinService();
