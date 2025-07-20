import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import React from "react";

interface TickerData {
  symbol: string;
  price: string;
  priceChange: string;
  priceChangePercent: string;
  high24h: string;
  low24h: string;
  volume24h: string;
}

interface StatsSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isWebSocketConnected: boolean;
  hasMoreData: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  tickerData: TickerData | null;
  dataPointsCount: number;
  currentDataSource: string;
  sentimentError: string | null;
  subscribedCount?: number;
  maxSubscriptions?: number;
}

const StatsSidebar: React.FC<StatsSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isWebSocketConnected,
  hasMoreData,
  isLoadingMore,
  onLoadMore,
  tickerData,
  dataPointsCount,
  currentDataSource,
  sentimentError,
  subscribedCount = 0,
  maxSubscriptions = 0,
}) => {
  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(typeof price === "string" ? parseFloat(price) : price);
  };

  const formatPercent = (percent: string | number) => {
    const value = typeof percent === "string" ? parseFloat(percent) : percent;
    return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "w-8" : "w-64"
      } space-y-2 h-screen`}
    >
      {/* Collapse/Expand Button */}
      <div className="flex justify-end">
        <button
          onClick={onToggleCollapse}
          className="p-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Title and Controls */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Price Monitor</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${
                    isWebSocketConnected ? "bg-green-600" : "bg-red-600"
                  }`}
                ></span>
                {maxSubscriptions > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {subscribedCount}/{maxSubscriptions}
                  </span>
                )}
              </div>
            </div>
            {hasMoreData && (
              <button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <div className="flex items-center justify-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  "Load More History"
                )}
              </button>
            )}
          </div>

          {/* Price Info */}
          {tickerData && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">
                  {formatPrice(tickerData.price)}
                </span>
                <Badge
                  variant={
                    parseFloat(tickerData.priceChangePercent) >= 0
                      ? "default"
                      : "destructive"
                  }
                  className="text-xs"
                >
                  {formatPercent(tickerData.priceChangePercent)}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>High: {formatPrice(tickerData.high24h)}</div>
                <div>Low: {formatPrice(tickerData.low24h)}</div>
                <div>
                  Volume: {parseFloat(tickerData.volume24h).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Data Info */}
          {dataPointsCount > 0 && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Data Points: {dataPointsCount}</div>
                <div>Source: {currentDataSource}</div>
              </div>
            </div>
          )}

          {/* Sentiment Error Display */}
          {sentimentError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
              <div className="text-xs text-red-400">
                Sentiment Error: {sentimentError}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StatsSidebar;
