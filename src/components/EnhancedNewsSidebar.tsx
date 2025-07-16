"use client";

import EnhancedNewsManager from "@/components/EnhancedNewsManager";
import { useRealTimeNews } from "@/hooks/useRealTimeNews";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import React, { useState } from "react";

const EnhancedNewsSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    news,
    isLoading,
    error,
    refreshNews,
    getNewsByCategory,
    sourceStatus,
  } = useRealTimeNews();

  const categories = [
    { id: "all", name: "All News", icon: "📰", count: news.length },
    {
      id: "crypto",
      name: "Crypto",
      icon: "₿",
      count: getNewsByCategory("crypto").length,
    },
    {
      id: "political",
      name: "Political",
      icon: "🏛️",
      count: getNewsByCategory("political").length,
    },
    {
      id: "environmental",
      name: "Environmental",
      icon: "🌱",
      count: getNewsByCategory("environmental").length,
    },
  ];

  const getDisplayNews = () => {
    if (selectedCategory === "all") {
      return news;
    }
    return getNewsByCategory(selectedCategory);
  };

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
          title={isCollapsed ? "Expand News Panel" : "Collapse News Panel"}
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
        <div className="h-screen overflow-y-auto">
          <div className="p-6">
            {/* Category Filters */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                      selectedCategory === category.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                    <span className="text-xs opacity-75">
                      ({category.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                <div className="text-sm text-red-400">Error: {error}</div>
              </div>
            )}

            {/* News Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  {selectedCategory !== "all" && (
                    <span className="text-sm text-muted-foreground">
                      ({categories.find((c) => c.id === selectedCategory)?.name}
                      )
                    </span>
                  )}
                </h2>
                <button
                  onClick={refreshNews}
                  disabled={isLoading}
                  className="p-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  title="Refresh News"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
              <EnhancedNewsManager
                news={getDisplayNews()}
                isLoading={isLoading}
                showSentiment={true}
                sourceStatus={sourceStatus}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNewsSidebar;
