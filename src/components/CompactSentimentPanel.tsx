"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MarketPrediction,
  SentimentTrend,
  TradingSignal,
} from "@/types/sentiment";
import { Minus, Shield, Target, TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

interface CompactSentimentPanelProps {
  sentimentTrend: SentimentTrend | null;
  tradingSignal: TradingSignal | null;
  prediction: MarketPrediction | null;
  isLoading: boolean;
}

const CompactSentimentPanel: React.FC<CompactSentimentPanelProps> = ({
  sentimentTrend,
  tradingSignal,
  prediction,
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
    if (score > 0.05) return <TrendingUp className="w-3 h-3" />;
    if (score < -0.05) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
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

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(price));
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="h-24">
            <CardContent className="p-3">
              <div className="h-4 bg-gray-600 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-600 rounded animate-pulse w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Market Sentiment */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm flex items-center gap-1">
              {sentimentTrend &&
                getSentimentIcon(sentimentTrend.overallSentiment)}
              Market Sentiment
            </h3>
            {sentimentTrend && (
              <span
                className={`text-xs font-bold ${getSentimentColor(
                  sentimentTrend.overallSentiment
                )}`}
              >
                {(sentimentTrend.overallSentiment * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {sentimentTrend && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">News:</span>
                <span>{sentimentTrend.newsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volatility:</span>
                <span>
                  {(sentimentTrend.volatilityImpact * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    sentimentTrend.overallSentiment > 0
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${
                      Math.abs(sentimentTrend.overallSentiment) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Prediction */}
      {prediction && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-1">
                <Target className="w-3 h-3" />
                Market Prediction
              </h3>
              <Badge
                className={`text-xs ${
                  prediction.direction === "up"
                    ? "bg-green-500"
                    : prediction.direction === "down"
                    ? "bg-red-500"
                    : "bg-gray-500"
                } text-white`}
              >
                {prediction.direction.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span>{(prediction.confidence * 100).toFixed(0)}%</span>
              </div>
              {prediction.priceTarget && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Target:</span>
                  <span>{formatPrice(prediction.priceTarget.toString())}</span>
                </div>
              )}
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    prediction.direction === "up"
                      ? "bg-green-500"
                      : prediction.direction === "down"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                  style={{ width: `${prediction.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Trading Signal */}
      {tradingSignal && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-1">
                <Shield className="w-3 h-3" />
                AI Trading Signal
              </h3>
              <Badge
                className={`text-xs ${getSignalColor(
                  tradingSignal.action
                )} text-white`}
              >
                {tradingSignal.action.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Strength:</span>
                <span>{(tradingSignal.strength * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Risk:</span>
                <span
                  className={`capitalize ${getRiskColor(
                    tradingSignal.riskLevel
                  )}`}
                >
                  {tradingSignal.riskLevel}
                </span>
              </div>
              {tradingSignal.suggestedAllocation && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Allocation:</span>
                  <span>
                    {(tradingSignal.suggestedAllocation * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${getSignalColor(
                    tradingSignal.action
                  )}`}
                  style={{ width: `${tradingSignal.strength * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompactSentimentPanel;
