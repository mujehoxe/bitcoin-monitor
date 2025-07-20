import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache to reduce API calls to CoinGecko
const cache = new Map<string, { data: number[][]; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute cache

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coinId') || 'bitcoin';
  const days = searchParams.get('days') || '1';
  
  const cacheKey = `${coinId}_${days}`;
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  }

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Bitcoin-Monitor/1.0'
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited - try again later');
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, { data, timestamp: now });
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('CoinGecko proxy error:', error);
    
    // Return cached data if available, even if expired
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey)!;
      console.log('Returning expired cache due to error');
      return NextResponse.json(cached.data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch CoinGecko data' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
