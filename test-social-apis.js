#!/usr/bin/env node

// Test script for social API service
const path = require('path');
const fs = require('fs');

// Simple test to check if Binance endpoints are working
async function testBinanceEndpoints() {
  console.log('🔄 Testing Binance API endpoints...');
  
  // Test Binance Square
  try {
    const response = await fetch('https://www.binance.com/bapi/composite/v8/friendly/pgc/feed/feed-recommend/list', {
      method: 'POST',
      headers: {
        'clienttype': 'web',
        'content-type': 'application/json',
        'versioncode': 'web',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      body: JSON.stringify({
        pageIndex: 1,
        pageSize: 20,
        scene: "web-homepage"
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Binance Square API working:', data?.data?.feeds?.length || 0, 'posts');
    } else {
      console.log('❌ Binance Square API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Binance Square API error:', error.message);
  }
  
  // Test Binance News
  try {
    const response = await fetch('https://www.binance.com/bapi/composite/v4/friendly/pgc/feed/news/list?pageIndex=1&pageSize=20&strategy=6&tagId=0&featured=false', {
      method: 'GET',
      headers: {
        'clienttype': 'web',
        'content-type': 'application/json',
        'versioncode': 'web',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Binance News API working:', data?.data?.catalogs?.length || 0, 'catalogs');
    } else {
      console.log('❌ Binance News API failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Binance News API error:', error.message);
  }
}

testBinanceEndpoints().catch(console.error);
