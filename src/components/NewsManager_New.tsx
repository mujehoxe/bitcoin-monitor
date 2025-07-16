"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsArticle } from "@/types/sentiment";
import { Clock, ExternalLink } from "lucide-react";
import React from "react";

interface NewsManagerProps {
  news: NewsArticle[];
  isLoading: boolean;
}

const NewsManager: React.FC<NewsManagerProps> = ({ news, isLoading }) => {
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getCategoryBadge = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (
      lowerSource.includes("crypto") ||
      lowerSource.includes("binance") ||
      lowerSource.includes("panic")
    ) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/50"
        >
          Crypto
        </Badge>
      );
    }
    if (lowerSource.includes("environment") || lowerSource.includes("un")) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-green-500/20 text-green-400 border-green-500/50"
        >
          Environmental
        </Badge>
      );
    }
    if (lowerSource.includes("gdelt") || lowerSource.includes("political")) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/50"
        >
          Political
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-xs bg-gray-500/20 text-gray-400 border-gray-500/50"
      >
        General
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="p-4 bg-gray-800 rounded border border-gray-700 animate-pulse"
          >
            <div className="h-4 bg-gray-600 rounded mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Real-time News Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {news.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {news.map((article) => (
              <div
                key={article.id}
                className="p-4 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white text-sm leading-5">
                    {truncateText(article.title, 100)}
                  </h3>
                  <div className="flex items-center gap-2 ml-2">
                    {getCategoryBadge(article.source)}
                  </div>
                </div>

                <p className="text-gray-400 text-xs mb-3 leading-4">
                  {truncateText(article.description, 150)}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-medium">{article.source}</span>
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                    {article.author && (
                      <span>by {truncateText(article.author, 20)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No news articles available</p>
            <p className="text-xs mt-2">Check your API keys and connection</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsManager;
