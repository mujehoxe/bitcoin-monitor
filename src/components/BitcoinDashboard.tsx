"use client";

import BitcoinPriceChart from "@/components/BitcoinPriceChart";
import NewsSidebar from "@/components/NewsSidebar";
import React, { useState } from "react";

interface BitcoinData {
  currentPrice: number;
  priceHistory: number[];
}

const BitcoinDashboard: React.FC = () => {
  const [bitcoinData, setBitcoinData] = useState<BitcoinData>({
    currentPrice: 0,
    priceHistory: [],
  });

  const handleDataUpdate = (currentPrice: number, priceHistory: number[]) => {
    setBitcoinData({ currentPrice, priceHistory });
  };

  return (
    <div className="min-h-screen bg-background">
      <NewsSidebar
        currentPrice={bitcoinData.currentPrice}
        priceHistory={bitcoinData.priceHistory}
      />
      <div className="w-full">
        <main>
          <BitcoinPriceChart onDataUpdate={handleDataUpdate} />
        </main>
      </div>
    </div>
  );
};

export default BitcoinDashboard;
