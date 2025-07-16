"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EnhancedSentimentService } from "@/services/enhancedSentimentService";
import { NewsArticle } from "@/types/sentiment";
import {
  Clock,
  ExternalLink,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface EnhancedNewsManagerProps {
  news: NewsArticle[];
  isLoading: boolean;
  showSentiment?: boolean;
  sourceStatus: Record<string, { connected: boolean; articleCount: number }>;
}

interface NewsWithSentiment extends NewsArticle {
  sentiment?: {
    score: number;
    label: string;
    impact: string;
    strength: number;
  };
}

const EnhancedNewsManager: React.FC<EnhancedNewsManagerProps> = ({
  news,
  isLoading,
  showSentiment = true,
  sourceStatus,
}) => {
  const [newsWithSentiment, setNewsWithSentiment] = useState<
    NewsWithSentiment[]
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      lowerSource.includes("panic") ||
      lowerSource.includes("bitcoin")
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
    if (
      lowerSource.includes("environment") ||
      lowerSource.includes("un") ||
      lowerSource.includes("climate") ||
      lowerSource.includes("green")
    ) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-green-500/20 text-green-400 border-green-500/50"
        >
          Environmental
        </Badge>
      );
    }
    if (
      lowerSource.includes("gdelt") ||
      lowerSource.includes("political") ||
      lowerSource.includes("government") ||
      lowerSource.includes("policy")
    ) {
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

  const getSentimentIcon = (impact: string) => {
    switch (impact) {
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSentimentColor = (impact: string) => {
    switch (impact) {
      case "bullish":
        return "border-green-500/50 bg-green-500/10";
      case "bearish":
        return "border-red-500/50 bg-red-500/10";
      default:
        return "border-gray-500/50 bg-gray-500/10";
    }
  };

  const analyzeSentiment = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const sentimentService = EnhancedSentimentService.getInstance();

      const newsWithSentimentData = await Promise.all(
        news.slice(0, 10).map(async (article) => {
          try {
            const analysis = await sentimentService.analyzeArticle(article);
            return {
              ...article,
              sentiment: {
                score: analysis.sentiment.score,
                label: analysis.sentiment.label,
                impact: analysis.marketImpact,
                strength: analysis.impactStrength,
              },
            };
          } catch (error) {
            console.error("Error analyzing sentiment:", error);
            return { ...article, sentiment: undefined };
          }
        })
      );

      setNewsWithSentiment(newsWithSentimentData);
    } catch (error) {
      console.error("Error in sentiment analysis:", error);
      setNewsWithSentiment(news);
    } finally {
      setIsAnalyzing(false);
    }
  }, [news]);

  useEffect(() => {
    if (showSentiment && news.length > 0) {
      analyzeSentiment();
    } else {
      setNewsWithSentiment(news);
    }
  }, [news, showSentiment, analyzeSentiment]);

  if (isLoading || isAnalyzing) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 animate-spin" />
            {isAnalyzing ? "Analyzing Sentiment..." : "Loading News..."}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    );
  }

  const getSourceStatusSummary = () => {
    const connectedSources = Object.values(sourceStatus).filter(
      (s) => s.connected
    ).length;
    const totalSources = Object.keys(sourceStatus).length;
    const totalArticles = Object.values(sourceStatus).reduce(
      (sum, s) => sum + s.articleCount,
      0
    );

    return {
      connected: connectedSources,
      total: totalSources,
      articles: totalArticles,
    };
  };

  const statusSummary = getSourceStatusSummary();

  return (
    <Card className="h-[calc(100vh-16rem)] overflow-y-auto bg-gray-900/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          📊 News Feed
        </CardTitle>
        <CardDescription className="flex items-center justify-between text-xs">
          <span>
            Sources: {statusSummary.connected}/{statusSummary.total} connected
          </span>
          <span>Articles: {statusSummary.articles}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {newsWithSentiment.length > 0 ? (
          <div className="space-y-4 overflow-y-auto">
            {newsWithSentiment.map((article) => (
              <div
                key={article.id}
                className={`p-4 rounded border transition-all duration-200 ${
                  article.sentiment
                    ? getSentimentColor(article.sentiment.impact)
                    : "bg-gray-800 border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white text-sm leading-5 flex-1">
                    {truncateText(article.title, 100)}
                  </h3>
                  <div className="flex items-center gap-2 ml-2">
                    {getCategoryBadge(article.source)}
                    {article.sentiment && (
                      <div className="flex items-center gap-1">
                        {getSentimentIcon(article.sentiment.impact)}
                        <span className="text-xs text-gray-400">
                          {(article.sentiment.strength * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-xs mb-3 leading-4">
                  {truncateText(article.description, 150)}
                </p>

                {article.sentiment && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-medium ${
                          article.sentiment.impact === "bullish"
                            ? "text-green-400"
                            : article.sentiment.impact === "bearish"
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {article.sentiment.impact.toUpperCase()}
                      </span>
                      <span className="text-gray-500">
                        {article.sentiment.label}
                      </span>
                    </div>
                  </div>
                )}

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
            <p className="text-xs mt-2">
              Check your data sources and connection
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedNewsManager;
