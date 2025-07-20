import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval') || '1m';
  const limit = searchParams.get('limit') || '1000';
  const endTime = searchParams.get('endTime');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  // Validate symbol format - should end with USDT and not contain invalid patterns
  const symbolUpper = symbol.toUpperCase();
  if (!symbolUpper.endsWith('USDT') || 
      symbolUpper.includes('USDC') || 
      symbolUpper.includes('BUSD') ||
      symbolUpper.includes('DAI') ||
      symbolUpper.includes('UP') ||
      symbolUpper.includes('DOWN') ||
      symbolUpper.includes('BULL') ||
      symbolUpper.includes('BEAR')) {
    console.log(`Invalid symbol rejected: ${symbol}`);
    return NextResponse.json({ 
      error: `Invalid symbol format: ${symbol}. Must be a valid USDT pair.` 
    }, { status: 400 });
  }

  try {
    let url = `https://api.binance.com/api/v3/klines?symbol=${symbolUpper}&interval=${interval}&limit=${limit}`;
    if (endTime) {
      url += `&endTime=${endTime}`;
    }

    console.log(`Fetching klines for ${symbolUpper}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Binance API error for ${symbolUpper}:`, response.status, errorText);
      
      if (response.status === 400) {
        return NextResponse.json({ 
          error: `Invalid symbol: ${symbolUpper} not found on Binance` 
        }, { status: 400 });
      }
      
      throw new Error(`Binance API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Binance klines proxy error:', error);
    return NextResponse.json(
      { 
        error: `Failed to fetch klines data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
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
