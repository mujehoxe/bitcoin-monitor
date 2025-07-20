import { NextResponse } from 'next/server';
import { DynamicCoinService } from '@/services/dynamicCoinService';

export async function POST() {
  try {
    const coinService = DynamicCoinService.getInstance();
    
    // Clear cache to force fresh data
    coinService.clearCache();
    
    // Get fresh symbols
    const symbols = await coinService.getAllTradingSymbols();
    
    // Analyze symbols for validation
    const analysis = {
      total: symbols.length,
      validUSDT: symbols.filter(s => s.endsWith('USDT')).length,
      containsUSDC: symbols.filter(s => s.includes('USDC')).length,
      containsOtherQuotes: symbols.filter(s => s.includes('TRY') || s.includes('EUR') || s.includes('GBP')).length,
      sample: symbols.slice(0, 20),
      problematic: symbols.filter(s => 
        !s.endsWith('USDT') || 
        s.includes('USDC') || 
        s.includes('TRY') || 
        s.includes('EUR') ||
        s.includes('GBP')
      ).slice(0, 10)
    };
    
    return NextResponse.json({
      status: 'OK',
      message: 'Cache cleared and symbols refreshed',
      timestamp: new Date().toISOString(),
      analysis
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const coinService = DynamicCoinService.getInstance();
    
    // Get current symbols without clearing cache
    const symbols = await coinService.getAllTradingSymbols();
    
    const analysis = {
      total: symbols.length,
      validUSDT: symbols.filter(s => s.endsWith('USDT')).length,
      sample: symbols.slice(0, 20),
      problematic: symbols.filter(s => 
        !s.endsWith('USDT') || 
        s.includes('USDC') || 
        s.includes('TRY') || 
        s.includes('EUR')
      ).slice(0, 10)
    };
    
    return NextResponse.json({
      status: 'OK',
      message: 'Current symbols analysis',
      timestamp: new Date().toISOString(),
      analysis
    });
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
