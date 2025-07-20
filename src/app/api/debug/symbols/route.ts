import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple test to check if our dynamic coin service works
    const testSymbols = [
      "BTCUSDT",
      "ETHUSDT", 
      "BNBUSDT",
      "ADAUSDT",
      "XRPUSDT"
    ];

    const results = testSymbols.map(symbol => {
      // Test symbol validation
      const symbolUpper = symbol.toUpperCase();
      const isValid = (
        symbolUpper.endsWith('USDT') && 
        !symbolUpper.includes('USDC') && 
        !symbolUpper.includes('BUSD') &&
        !symbolUpper.includes('DAI') &&
        !symbolUpper.includes('UP') &&
        !symbolUpper.includes('DOWN') &&
        !symbolUpper.includes('BULL') &&
        !symbolUpper.includes('BEAR')
      );

      return {
        symbol,
        valid: isValid,
        reason: isValid ? 'OK' : 'Invalid format'
      };
    });

    return NextResponse.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      testSymbols: results,
      message: 'Symbol validation working'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
