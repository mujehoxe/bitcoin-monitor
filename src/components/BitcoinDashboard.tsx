"use client";

import BitcoinPriceChart from "@/components/BitcoinPriceChart";
import NewsSidebar from "@/components/NewsSidebar";
import React from "react";

const BitcoinDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <NewsSidebar />
      <main className="flex-1 min-w-0">
        <BitcoinPriceChart />
      </main>
    </div>
  );
};

export default BitcoinDashboard;
