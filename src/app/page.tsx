import BitcoinPriceChart from "@/components/BitcoinPriceChart";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <main>
          <BitcoinPriceChart />
        </main>
      </div>
    </div>
  );
}
