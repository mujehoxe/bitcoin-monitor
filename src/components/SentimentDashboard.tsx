"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SentimentTrend, TradingSignal } from "@/types/sentiment";
import {
  AlertTriangle,
  Minus,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React from "react";

interface SentimentDashboardProps {
  sentimentTrend: SentimentTrend | null;
  tradingSignal: TradingSignal | null;
  isLoading: boolean;
}

const SentimentDashboard: React.FC<SentimentDashboardProps> = ({
  sentimentTrend,
  tradingSignal,
  isLoading,
}) => {
  const getSentimentColor = (score: number) => {
    if (score > 0.2) return "text-green-500";
    if (score > 0.05) return "text-green-400";
    if (score < -0.2) return "text-red-500";
    if (score < -0.05) return "text-red-400";
    return "text-gray-400";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.05) return <TrendingUp className="w-4 h-4" />;
    if (score < -0.05) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSignalColor = (action: string) => {
    switch (action) {
      case "buy":
        return "bg-green-500";
      case "sell":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-600 rounded animate-pulse"></div>
              Market Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-600 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-600 rounded animate-pulse w-1/2"></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              AI Trading Signal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-600 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-gray-600 rounded animate-pulse w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Sentiment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {sentimentTrend &&
              getSentimentIcon(sentimentTrend.overallSentiment)}
            Market Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sentimentTrend ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Overall Score</span>
                <span
                  className={`font-bold ${getSentimentColor(
                    sentimentTrend.overallSentiment
                  )}`}
                >
                  {(sentimentTrend.overallSentiment * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">News Articles</span>
                <span className="text-white">{sentimentTrend.newsCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Volatility Impact</span>
                <div className="flex items-center gap-2">
                  {sentimentTrend.volatilityImpact > 0.6 && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-white">
                    {(sentimentTrend.volatilityImpact * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Trend</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(sentimentTrend.trendDirection)}
                  <span className="text-white capitalize">
                    {sentimentTrend.trendDirection}
                  </span>
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    sentimentTrend.overallSentiment > 0
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${
                      Math.abs(sentimentTrend.overallSentiment) * 100
                    }%`,
                    marginLeft:
                      sentimentTrend.overallSentiment < 0
                        ? `${50 + sentimentTrend.overallSentiment * 50}%`
                        : "50%",
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>No sentiment data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Signal Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            AI Trading Signal
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tradingSignal ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Action</span>
                <Badge
                  className={`${getSignalColor(
                    tradingSignal.action
                  )} text-white`}
                >
                  {tradingSignal.action.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Strength</span>
                <span className="text-white">
                  {(tradingSignal.strength * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Confidence</span>
                <span className="text-white">
                  {(tradingSignal.confidenceLevel * 100).toFixed(1)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Risk Level</span>
                <div className="flex items-center gap-2">
                  <Shield
                    className={`w-4 h-4 ${getRiskColor(
                      tradingSignal.riskLevel
                    )}`}
                  />
                  <span
                    className={`capitalize ${getRiskColor(
                      tradingSignal.riskLevel
                    )}`}
                  >
                    {tradingSignal.riskLevel}
                  </span>
                </div>
              </div>

              {tradingSignal.suggestedAllocation && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Suggested Allocation
                  </span>
                  <span className="text-white">
                    {(tradingSignal.suggestedAllocation * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-800 rounded">
                <p className="text-sm text-gray-300">
                  {tradingSignal.reasoning}
                </p>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getSignalColor(
                    tradingSignal.action
                  )}`}
                  style={{ width: `${tradingSignal.strength * 100}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>No trading signal available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentDashboard;
