"use client";

import CompactSentimentPanel from "@/components/CompactSentimentPanel";
import NewsManager from "@/components/NewsManager";
import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import React, { useState } from "react";

interface NewsSidebarProps {
  currentPrice: number;
  priceHistory: number[];
}

const NewsSidebar: React.FC<NewsSidebarProps> = ({
  currentPrice,
  priceHistory,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get news and sentiment data from sentiment analysis hook
  const {
    news,
    sentimentTrend,
    prediction,
    tradingSignal,
    isLoading,
    refreshSentiment,
  } = useSentimentAnalysis(currentPrice, priceHistory);

  return (
    <div
      className={`fixed left-0 top-0 h-screen transition-all duration-300 ${
        isCollapsed ? "w-12" : "w-1/2"
      } bg-background/95 backdrop-blur-md border-r border-border shadow-2xl z-50`}
    >
      {/* Toggle Button */}
      <div className="flex justify-end p-3 border-b border-border bg-gradient-to-r from-muted/30 to-muted/10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-md hover:shadow-lg"
          title={
            isCollapsed
              ? "Expand News & Sentiment Panel"
              : "Collapse News & Sentiment Panel"
          }
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="h-full overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
                📊 Bitcoin Analytics Dashboard
              </h1>
              <div className="text-sm text-muted-foreground">
                Real-time news and sentiment analysis for informed trading decisions
              </div>
            </div>

            {/* Sentiment Analysis Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  🧠 AI Sentiment Analysis
                </h2>
                <button
                  onClick={refreshSentiment}
                  disabled={isLoading}
                  className="p-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Refresh Sentiment Analysis"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              <div className="space-y-3 bg-muted/20 rounded-lg p-4">
                <CompactSentimentPanel
                  sentimentTrend={sentimentTrend}
                  tradingSignal={tradingSignal}
                  prediction={prediction}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* News Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                📰 Bitcoin News Feed
              </h2>
              <div className="h-[calc(100vh-28rem)] overflow-y-auto bg-muted/10 rounded-lg p-4">
                <NewsManager news={news} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsSidebar;
