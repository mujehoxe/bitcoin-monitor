"use client";

import { useRealTimeNews } from "@/hooks/useRealTimeNews";
import { ChevronRight, RefreshCw } from "lucide-react";
import React, { useState } from "react";

const NewsSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
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

  const formatEngagementCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count.toString();
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
            : "left-full rounded-none lg:left-[calc(50%+theme(spacing.4))] lg:rounded-r-md"
        } top-1/2 z-50 w-4 h-screen lg:h-24 lg:rounded-r-md bg-gray-700 hover:bg-gray-600 text-white transition-all duration-300 flex items-center justify-center text-xs shadow-lg`}
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
          isCollapsed ? "w-0" : "w-[calc(100%-theme(spacing.4))] lg:w-[50%]"
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

                      {/* Engagement Metrics for Social Media Posts */}
                      {article.engagementMetrics && (
                        <div className="flex items-center gap-3 mb-2 text-xs text-gray-500">
                          {(article.engagementMetrics.viewCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path
                                  fillRule="evenodd"
                                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                {formatEngagementCount(
                                  article.engagementMetrics.viewCount ?? 0
                                )}
                              </span>
                            </div>
                          )}
                          {(article.engagementMetrics.likeCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                              <span>
                                {formatEngagementCount(
                                  article.engagementMetrics.likeCount ?? 0
                                )}
                              </span>
                            </div>
                          )}
                          {(article.engagementMetrics.commentCount ?? 0) >
                            0 && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                {formatEngagementCount(
                                  article.engagementMetrics.commentCount ?? 0
                                )}
                              </span>
                            </div>
                          )}
                          {(article.engagementMetrics.shareCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                              </svg>
                              <span>
                                {formatEngagementCount(
                                  article.engagementMetrics.shareCount ?? 0
                                )}
                              </span>
                            </div>
                          )}
                          {(article.engagementMetrics.quoteCount ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span>
                                {formatEngagementCount(
                                  article.engagementMetrics.quoteCount ?? 0
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

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
