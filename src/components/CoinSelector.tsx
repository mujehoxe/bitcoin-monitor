import { Card, CardContent } from "@/components/ui/card";
import { TrendingCoin } from "@/services/cryptoAPIService";
import { Loader2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import React, { useState } from "react";

interface CoinSelectorProps {
  hotCoins: TrendingCoin[];
  stableCoins: TrendingCoin[];
  selectedSymbol: string;
  isLoading: boolean;
  onCoinSelect: (symbol: string) => void;
}

const formatPrice = (price: number): string => {
  if (price < 1) {
    return price.toFixed(6);
  } else if (price < 100) {
    return price.toFixed(4);
  } else {
    return price.toFixed(2);
  }
};

const formatPercentage = (percentage: number | null | undefined): string => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return "N/A";
  }
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(2)}%`;
};

const getChangeIcon = (change: number | null | undefined) => {
  if (change === null || change === undefined || isNaN(change)) {
    return <Minus className="w-3 h-3 text-gray-500" />;
  }
  if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
  if (change < 0) return <TrendingDown className="w-3 h-3 text-red-500" />;
  return <Minus className="w-3 h-3 text-gray-500" />;
};

const getChangeColor = (change: number | null | undefined): string => {
  if (change === null || change === undefined || isNaN(change)) {
    return "text-gray-500";
  }
  if (change > 0) return "text-green-500";
  if (change < 0) return "text-red-500";
  return "text-gray-500";
};

const CoinItem: React.FC<{
  coin: TrendingCoin;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ coin, isSelected, onSelect }) => {
  return (
    <div
      className={`p-3 h-full border-0 rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{coin.name}</span>
          <span className="text-xs text-gray-500">{coin.symbol}</span>
        </div>
        {getChangeIcon(coin.priceChangePercent24h)}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Price:
          </span>
          <span className="text-sm font-medium">
            ${formatPrice(coin.price)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">24h:</span>
          <span
            className={`text-sm font-medium ${getChangeColor(
              coin.priceChangePercent24h
            )}`}
          >
            {formatPercentage(coin.priceChangePercent24h)}
          </span>
        </div>

        {coin.growthRate5min !== undefined && coin.growthRate5min !== null && (
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              5m:
            </span>
            <span className={`text-xs ${getChangeColor(coin.growthRate5min)}`}>
              {formatPercentage(coin.growthRate5min)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const CoinSelector: React.FC<CoinSelectorProps> = ({
  hotCoins,
  stableCoins,
  selectedSymbol,
  isLoading,
  onCoinSelect,
}) => {
  const [activeTab, setActiveTab] = useState<"hot" | "stable">("hot");

  // Sort hot coins by 5min acceleration (positive only), then by 24h change
  const sortedHotCoins = [...hotCoins]
    .filter((coin) => (coin.growthRate5min || 0) > 0) // Only positive 5-minute growth
    .sort((a, b) => {
      // Primary sort: 5-minute acceleration (higher is better)
      const aGrowth5m = a.growthRate5min || 0;
      const bGrowth5m = b.growthRate5min || 0;
      if (Math.abs(bGrowth5m - aGrowth5m) > 0.1) {
        return bGrowth5m - aGrowth5m;
      }
      // Secondary sort: 24h change
      return (b.priceChangePercent24h || 0) - (a.priceChangePercent24h || 0);
    })
    .slice(0, 15); // Top 15

  // Sort stable coins by 24h performance (highest growth first)
  const sortedStableCoins = [...stableCoins]
    .sort((a, b) => {
      return (b.priceChangePercent24h || 0) - (a.priceChangePercent24h || 0);
    })
    .slice(0, 15); // Top 15

  // Debug logging
  console.log("CoinSelector Debug:", {
    hotCoins: hotCoins?.length || 0,
    stableCoins: stableCoins?.length || 0,
    selectedSymbol,
    isLoading,
  });

  return (
    <div className="space-y-4 h-full">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("hot")}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                activeTab === "hot"
                  ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Hot
            </button>
            <button
              onClick={() => setActiveTab("stable")}
              className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
                activeTab === "stable"
                  ? "bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Growing
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Hot Coins Tab */}
      {activeTab === "hot" && (
        <Card>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-fit overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading hot coins...
                  </span>
                </div>
              ) : sortedHotCoins.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">
                  No hot coins data available
                </div>
              ) : (
                sortedHotCoins.map((coin) => (
                  <CoinItem
                    key={coin.symbol}
                    coin={coin}
                    isSelected={selectedSymbol === coin.symbol}
                    onSelect={() => onCoinSelect(coin.symbol)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stable Growth Tab */}
      {activeTab === "stable" && (
        <Card>
          <CardContent className="pt-0 border-0">
            <div className="border-0 space-y-2 max-h-full overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">
                    Loading stable coins...
                  </span>
                </div>
              ) : sortedStableCoins.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4">
                  No stable coins data available
                </div>
              ) : (
                sortedStableCoins.map((coin) => (
                  <CoinItem
                    key={coin.symbol}
                    coin={coin}
                    isSelected={selectedSymbol === coin.symbol}
                    onSelect={() => onCoinSelect(coin.symbol)}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
