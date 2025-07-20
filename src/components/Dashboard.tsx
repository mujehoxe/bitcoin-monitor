"use client";

import { CoinSelector } from "@/components/CoinSelector";
import NewsSidebar from "@/components/NewsSidebar";
import PriceChart from "@/components/PriceChart";
import StatsSidebar from "@/components/StatsSidebar";
import { useEnhancedCryptoData } from "@/hooks/useEnhancedCryptoData";
import { useEnhancedRealTimePrice } from "@/hooks/useEnhancedRealTimePrice";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";

interface TickerData {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high24h: string;
  low24h: string;
  volume24h: string;
}

interface ChartData {
  isWebSocketConnected: boolean;
  hasMoreData: boolean;
  isLoadingMore: boolean;
  tickerData: TickerData | null;
  dataPointsCount: number;
  currentDataSource: string;
  sentimentError: string | null;
}

const Dashboard: React.FC = () => {
  const [isStatsSidebarCollapsed, setIsStatsSidebarCollapsed] = useState(false);

  // State for chart data that will be shared with StatsSidebar
  const [chartData, setChartData] = useState<ChartData>({
    isWebSocketConnected: false,
    hasMoreData: false,
    isLoadingMore: false,
    tickerData: null,
    dataPointsCount: 0,
    currentDataSource: "Unknown",
    sentimentError: null,
  });

  // Use the enhanced crypto data hook for coin selection
  const { selectedSymbol, trendingData, isLoadingTrending, setSelectedSymbol } =
    useEnhancedCryptoData();

  // Use enhanced real-time price updates
  const {
    setWatchedSymbols,
    updateCoinsWithRealTimeData,
    subscribedCount,
    maxSubscriptions,
    isConnected: isPriceConnected,
  } = useEnhancedRealTimePrice();

  // Memoize the symbols we want to watch to prevent infinite re-renders
  const symbolsToWatch = useMemo(() => {
    const visibleCoins = [
      ...trendingData.hot.slice(0, 8), // Top 8 hot coins
      ...trendingData.stable.slice(0, 4), // Top 4 stable coins
    ];

    const symbols = visibleCoins.map((coin) => coin.symbol);

    // Add selected symbol if not already included
    if (selectedSymbol && !symbols.includes(selectedSymbol)) {
      symbols.unshift(selectedSymbol); // Put selected symbol first
    }

    return symbols;
  }, [trendingData.hot, trendingData.stable, selectedSymbol]);

  // Update watched symbols when they change (but with stable reference)
  useEffect(() => {
    if (symbolsToWatch.length > 0) {
      setWatchedSymbols(symbolsToWatch, selectedSymbol);
      console.log(
        `Dashboard: Watching ${symbolsToWatch.length} symbols with priority: ${selectedSymbol}`
      );
    }
  }, [symbolsToWatch, selectedSymbol, setWatchedSymbols]);

  // Update trending data with real-time prices
  const realTimeHotCoins = updateCoinsWithRealTimeData(trendingData.hot);
  const realTimeStableCoins = updateCoinsWithRealTimeData(trendingData.stable);

  const handleLoadMore = useCallback(() => {
    // This would be connected to the PriceChart's load more functionality
    console.log("Load more data");
  }, []);

  const handleChartDataUpdate = useCallback(
    (data: ChartData) => {
      setChartData({
        ...data,
        isWebSocketConnected: isPriceConnected, // Update with real-time price connection status
      });
    },
    [isPriceConnected]
  );

  return (
    <div className="min-h-screen bg-background flex">
      <NewsSidebar />
      <main className="ml-6 flex-1 min-w-0 flex">
        {/* Stats Sidebar */}
        <StatsSidebar
          isCollapsed={isStatsSidebarCollapsed}
          onToggleCollapse={() =>
            setIsStatsSidebarCollapsed(!isStatsSidebarCollapsed)
          }
          {...chartData}
          onLoadMore={handleLoadMore}
          subscribedCount={subscribedCount}
          maxSubscriptions={maxSubscriptions}
        />

        <div className="w-full mx-auto p-2">
          <Card className="h-[calc(100vh-1rem)]">
            <CardContent className="flex p-2 h-full">
              {/* Price Chart */}
              <div className="flex-1">
                <PriceChart
                  selectedSymbol={selectedSymbol}
                  onChartDataUpdate={handleChartDataUpdate}
                />
              </div>

              {/* Coin Selector */}
              <div className="min-w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
                <CoinSelector
                  hotCoins={realTimeHotCoins}
                  stableCoins={realTimeStableCoins}
                  selectedSymbol={selectedSymbol}
                  isLoading={isLoadingTrending}
                  onCoinSelect={setSelectedSymbol}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
