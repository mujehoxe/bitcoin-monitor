import BitcoinPriceChart from '@/components/BitcoinPriceChart';

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Bitcoin Price Monitor
          </h1>
          <p className="text-muted-foreground">
            Real-time Bitcoin price tracking with candlestick charts powered by Bybit
          </p>
        </header>
        
        <main>
          <BitcoinPriceChart />
        </main>
      </div>
    </div>
  );
}
