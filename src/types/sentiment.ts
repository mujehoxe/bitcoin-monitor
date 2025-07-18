export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  source: string;
  url: string;
  author?: string;
  urlToImage?: string;
  category?: string; // news, blog, magazine, social, analysis, market, tech
  // Social media engagement metrics
  engagementMetrics?: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    quoteCount?: number;
  };
}

export interface SentimentScore {
  score: number; // -1 to 1 (negative to positive)
  confidence: number; // 0 to 1
  label: "negative" | "neutral" | "positive";
}

export interface SentimentAnalysis {
  articleId: string;
  sentiment: SentimentScore;
  keyPoints: string[];
  marketImpact: "bearish" | "neutral" | "bullish";
  impactStrength: number; // 0 to 1
  analyzedAt: string;
}

export interface MarketPrediction {
  timeframe: "1h" | "4h" | "1d" | "1w";
  direction: "up" | "down" | "sideways";
  confidence: number; // 0 to 1
  priceTarget?: number;
  reasoning: string;
  sentimentFactor: number; // How much sentiment influenced this prediction
  technicalFactor: number; // How much technical analysis influenced this prediction
  createdAt: string;
}

export interface SentimentTrend {
  timestamp: string;
  overallSentiment: number; // -1 to 1
  newsCount: number;
  volatilityImpact: number; // 0 to 1
  trendDirection: "improving" | "stable" | "declining";
}

export interface TradingSignal {
  action: "buy" | "sell" | "hold";
  strength: number; // 0 to 1
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
  confidenceLevel: number; // 0 to 1
  suggestedAllocation?: number; // 0 to 1 (percentage of portfolio)
  stopLoss?: number;
  takeProfit?: number;
  createdAt: string;
}
