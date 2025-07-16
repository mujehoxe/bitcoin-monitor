"use client";

import { useRealTimeNews } from "@/hooks/useRealTimeNews";
import { ChevronRight, RefreshCw } from "lucide-react";
import React, { useState } from "react";

const NewsSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { news, isLoading, error, refreshNews, getNewsByCategory } =
    useRealTimeNews();

  const categories = [
    { id: "all", name: "All", count: news.length },
    { id: "crypto", name: "Crypto", count: getNewsByCategory("crypto").length },
    {
      id: "political",
      name: "Political",
      count: getNewsByCategory("political").length,
    },
    {
      id: "environmental",
      name: "Env",
      count: getNewsByCategory("environmental").length,
    },
  ];

  const getDisplayNews = () => {
    if (selectedCategory === "all") {
      return news;
    }
    return getNewsByCategory(selectedCategory);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  const getCategoryColor = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (
      lowerSource.includes("crypto") ||
      lowerSource.includes("binance") ||
      lowerSource.includes("panic")
    ) {
      return "border-orange-500/30 bg-orange-500/5";
    }
    if (
      lowerSource.includes("environment") ||
      lowerSource.includes("un") ||
      lowerSource.includes("climate")
    ) {
      return "border-green-500/30 bg-green-500/5";
    }
    if (
      lowerSource.includes("gdelt") ||
      lowerSource.includes("political") ||
      lowerSource.includes("policy")
    ) {
      return "border-blue-500/30 bg-blue-500/5";
    }
    return "border-gray-500/30 bg-gray-500/5";
  };

  return (
    <>
      {/* Vertical Toggle Button - Attached to drawer */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-50 w-4 h-20 bg-gray-700 hover:bg-gray-600 text-white rounded-r-md transition-all duration-300 flex items-center justify-center text-xs shadow-lg`}
        title={isCollapsed ? "Open" : "Close"}
      >
        <ChevronRight
          className={`transform transition-transform duration-300 ${
            isCollapsed ? "" : "rotate-180"
          }`}
        />
      </button>

      {/* Main Sidebar - Compact layout */}
      <div
        className={`fixed left-0 top-0 h-screen transition-all duration-300 ${
          isCollapsed ? "w-0" : "w-96"
        } bg-gray-900/95 backdrop-blur-md border-r border-gray-700/50 z-40 overflow-hidden`}
      >
        {!isCollapsed && (
          <div className="h-full flex flex-col">
            {/* Compact Header */}
            <div className="p-2 border-b border-gray-700/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshNews}
                  disabled={isLoading}
                  className="p-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
                <span className="text-xs font-medium">News</span>
              </div>
              <div className="flex gap-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {category.name}{" "}
                    <span className="text-gray-400">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* News Content - Direct display */}
            <div className="flex-1 overflow-y-auto p-2">
              {error && (
                <div className="mb-2 p-2 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-400">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-800 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : getDisplayNews().length > 0 ? (
                <div className="space-y-2">
                  {getDisplayNews().map((article) => (
                    <div
                      key={article.id}
                      className={`p-2 rounded border ${getCategoryColor(
                        article.source
                      )} hover:border-gray-600 transition-colors cursor-pointer`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-white text-xs leading-tight flex-1">
                          {truncateText(article.title, 60)}
                        </h3>
                      </div>

                      <p className="text-gray-400 text-xs leading-tight mb-1">
                        {truncateText(article.description, 80)}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium">{article.source}</span>
                        <span>{formatTimeAgo(article.publishedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-sm py-8">
                  No news available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NewsSidebar;
