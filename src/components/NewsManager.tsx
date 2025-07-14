"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NewsArticle, SentimentAnalysis } from "@/types/sentiment";
import {
  Clock,
  ExternalLink,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React from "react";

interface NewsWithSentiment extends NewsArticle {
  sentiment?: SentimentAnalysis;
}

interface NewsManagerProps {
  news: NewsWithSentiment[];
  isLoading: boolean;
}

const NewsManager: React.FC<NewsManagerProps> = ({ news, isLoading }) => {
  const getSentimentColor = (sentiment?: SentimentAnalysis) => {
    if (!sentiment) return "text-gray-400";

    if (sentiment.sentiment.score > 0.2) return "text-green-500";
    if (sentiment.sentiment.score > 0.05) return "text-green-400";
    if (sentiment.sentiment.score < -0.2) return "text-red-500";
    if (sentiment.sentiment.score < -0.05) return "text-red-400";
    return "text-gray-400";
  };

  const getSentimentIcon = (sentiment?: SentimentAnalysis) => {
    if (!sentiment) return <Minus className="w-4 h-4 text-gray-400" />;

    if (sentiment.sentiment.score > 0.05)
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (sentiment.sentiment.score < -0.05)
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getSentimentBadge = (sentiment?: SentimentAnalysis) => {
    if (!sentiment) return null;

    const impact = sentiment.marketImpact;
    const color =
      impact === "bullish"
        ? "bg-green-500"
        : impact === "bearish"
        ? "bg-red-500"
        : "bg-gray-500";

    return (
      <Badge className={`${color} text-white text-xs`}>
        {impact.toUpperCase()}
      </Badge>
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-600 rounded animate-pulse"></div>
            Real-time News & Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="p-4 bg-gray-800 rounded border border-gray-700"
              >
                <div className="h-4 bg-gray-600 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-600 rounded animate-pulse w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded animate-pulse w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Real-time News & Sentiment
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
                    {getSentimentIcon(article.sentiment)}
                    {getSentimentBadge(article.sentiment)}
                  </div>
                </div>

                <p className="text-gray-400 text-xs mb-3 leading-4">
                  {truncateText(article.description, 150)}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{article.source}</span>
                    <span>{formatTimeAgo(article.publishedAt)}</span>
                    {article.author && (
                      <span>by {truncateText(article.author, 20)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {article.sentiment && (
                      <span
                        className={`text-xs ${getSentimentColor(
                          article.sentiment
                        )}`}
                      >
                        {(article.sentiment.sentiment.score * 100).toFixed(0)}%
                      </span>
                    )}
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

                {article.sentiment &&
                  article.sentiment.keyPoints.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {article.sentiment.keyPoints.map((point, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {point}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No news articles available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsManager;
