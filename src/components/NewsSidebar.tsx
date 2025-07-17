"use client";

import { useRealTimeNews } from "@/hooks/useRealTimeNews";
import { ChevronRight, RefreshCw } from "lucide-react";
import React, { useState } from "react";

const NewsSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { news, isLoading, error, refreshNews } = useRealTimeNews();

  const categories = [
    { id: "all", name: "All", count: news.length },
    {
      id: "news",
      name: "News",
      count: news.filter((article) => article.category === "news").length,
    },
    {
      id: "blog",
      name: "Blogs",
      count: news.filter((article) => article.category === "blog").length,
    },
    {
      id: "magazine",
      name: "Magazines",
      count: news.filter((article) => article.category === "magazine").length,
    },
    {
      id: "social",
      name: "Social",
      count: news.filter((article) => article.category === "social").length,
    },
    {
      id: "analysis",
      name: "Analysis",
      count: news.filter((article) => article.category === "analysis").length,
    },
  ];

  const getDisplayNews = () => {
    if (selectedCategory === "all") {
      return news;
    }
    return news.filter((article) => article.category === selectedCategory);
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "news":
        return "border-blue-500/30 bg-blue-500/5";
      case "blog":
        return "border-green-500/30 bg-green-500/5";
      case "magazine":
        return "border-purple-500/30 bg-purple-500/5";
      case "social":
        return "border-pink-500/30 bg-pink-500/5";
      case "analysis":
        return "border-orange-500/30 bg-orange-500/5";
      case "market":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "tech":
        return "border-indigo-500/30 bg-indigo-500/5";
      default:
        return "border-gray-500/30 bg-gray-500/5";
    }
  };

  return (
    <>
      {/* Vertical Toggle Button - Responsive positioning */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`fixed ${
          isCollapsed
            ? "left-0"
            : "left-full md:left-96 lg:left-[calc(50%+1rem)]"
        } top-1/2 -translate-y-1/2 z-50 w-4 h-20 bg-gray-700 hover:bg-gray-600 text-white rounded-r-md transition-all duration-300 flex items-center justify-center text-xs shadow-lg`}
        style={{
          transform: isCollapsed
            ? "translateY(-50%)"
            : "translateY(-50%) translateX(-100%)",
        }}
        title={isCollapsed ? "Open" : "Close"}
      >
        <ChevronRight
          className={`transform transition-transform duration-300 ${
            isCollapsed ? "" : "rotate-180"
          }`}
        />
      </button>

      {/* Main Sidebar - Responsive layout */}
      <div
        className={`fixed left-0 top-0 h-screen transition-all duration-300 ${
          isCollapsed ? "w-0" : "w-full md:w-96 lg:w-[50%]"
        } bg-gray-900/95 backdrop-blur-md border-r border-gray-700/50 z-40 overflow-hidden`}
      >
        {!isCollapsed && (
          <div className="h-full flex flex-col">
            {/* Compact Header - Responsive */}
            <div className="p-2 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
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
                  <span className="text-xs font-medium">Crypto News</span>
                </div>
                <div className="text-xs text-gray-400">
                  {news.length} articles
                </div>
              </div>

              {/* Category filters - Responsive grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-3 gap-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
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
                      className={`p-3 rounded border ${getCategoryColor(
                        article.category || "news"
                      )} hover:border-gray-600 transition-colors cursor-pointer`}
                      onClick={() =>
                        article.url && window.open(article.url, "_blank")
                      }
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-white text-sm leading-tight flex-1 pr-2">
                          {truncateText(article.title, 80)}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTimeAgo(article.publishedAt)}
                        </span>
                      </div>

                      <p className="text-gray-400 text-xs leading-relaxed mb-2">
                        {truncateText(article.description, 120)}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-300">
                            {article.source}
                          </span>
                          {article.category && (
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs capitalize">
                              {article.category}
                            </span>
                          )}
                        </div>
                        {article.author && (
                          <span className="text-gray-500 truncate max-w-24">
                            {article.author}
                          </span>
                        )}
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
