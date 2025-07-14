import {
  MarketPrediction,
  NewsArticle,
  SentimentAnalysis,
  SentimentScore,
  SentimentTrend,
  TradingSignal,
} from "@/types/sentiment";

export class SentimentAnalysisService {
  private static instance: SentimentAnalysisService;
  private sentimentHistory: SentimentTrend[] = [];
  private lastAnalysisTime = 0;
  private analysisInterval = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SentimentAnalysisService {
    if (!SentimentAnalysisService.instance) {
      SentimentAnalysisService.instance = new SentimentAnalysisService();
    }
    return SentimentAnalysisService.instance;
  }

  async analyzeNews(articles: NewsArticle[]): Promise<SentimentAnalysis[]> {
    const analyses: SentimentAnalysis[] = [];

    for (const article of articles) {
      try {
        const sentiment = await this.analyzeSentiment(article);
        const analysis: SentimentAnalysis = {
          articleId: article.id,
          sentiment,
          keyPoints: this.extractKeyPoints(article),
          marketImpact: this.determineMarketImpact(sentiment),
          impactStrength: this.calculateImpactStrength(article, sentiment),
          analyzedAt: new Date().toISOString(),
        };
        analyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing article ${article.id}:`, error);
      }
    }

    return analyses;
  }

  private async analyzeSentiment(
    article: NewsArticle
  ): Promise<SentimentScore> {
    // For production, you'd use OpenAI, Claude, or other AI services
    // For now, implementing a simple keyword-based sentiment analysis

    const text =
      `${article.title} ${article.description} ${article.content}`.toLowerCase();

    // Positive indicators
    const positiveKeywords = [
      "surge",
      "bull",
      "bullish",
      "rise",
      "rising",
      "up",
      "growth",
      "adoption",
      "institutional",
      "investment",
      "breakthrough",
      "rally",
      "gains",
      "soar",
      "milestone",
      "partnership",
      "innovation",
      "upgrade",
      "positive",
      "optimistic",
      "breakthrough",
      "success",
      "achievement",
      "record",
      "high",
      "support",
    ];

    // Negative indicators
    const negativeKeywords = [
      "crash",
      "bear",
      "bearish",
      "fall",
      "falling",
      "down",
      "decline",
      "drop",
      "sell-off",
      "selloff",
      "dump",
      "fear",
      "panic",
      "regulation",
      "ban",
      "hack",
      "security",
      "risk",
      "loss",
      "negative",
      "concern",
      "worry",
      "uncertainty",
      "volatility",
      "correction",
      "low",
      "resistance",
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveKeywords.forEach((keyword) => {
      const matches = (text.match(new RegExp(keyword, "g")) || []).length;
      positiveScore += matches;
    });

    negativeKeywords.forEach((keyword) => {
      const matches = (text.match(new RegExp(keyword, "g")) || []).length;
      negativeScore += matches;
    });

    const totalScore = positiveScore + negativeScore;
    const normalizedScore =
      totalScore === 0 ? 0 : (positiveScore - negativeScore) / totalScore;

    // Calculate confidence based on keyword density
    const wordCount = text.split(" ").length;
    const keywordDensity = totalScore / wordCount;
    const confidence = Math.min(keywordDensity * 10, 1); // Cap at 1

    let label: "negative" | "neutral" | "positive" = "neutral";
    if (normalizedScore > 0.1) label = "positive";
    else if (normalizedScore < -0.1) label = "negative";

    return {
      score: normalizedScore,
      confidence: Math.max(confidence, 0.1), // Minimum confidence
      label,
    };
  }

  // For production, this would use GPT/Claude to extract key insights
  private extractKeyPoints(article: NewsArticle): string[] {
    const text = `${article.title} ${article.description}`.toLowerCase();
    const keyPoints: string[] = [];

    // Simple keyword extraction
    const importantTopics = [
      "regulatory",
      "institutional",
      "adoption",
      "price",
      "market",
      "trading",
      "mining",
      "network",
      "security",
      "technology",
      "government",
      "policy",
    ];

    importantTopics.forEach((topic) => {
      if (text.includes(topic)) {
        keyPoints.push(
          `${topic.charAt(0).toUpperCase() + topic.slice(1)} mentioned`
        );
      }
    });

    if (keyPoints.length === 0) {
      keyPoints.push("General Bitcoin market discussion");
    }

    return keyPoints.slice(0, 3); // Max 3 key points
  }

  private determineMarketImpact(
    sentiment: SentimentScore
  ): "bearish" | "neutral" | "bullish" {
    if (sentiment.score > 0.2 && sentiment.confidence > 0.3) return "bullish";
    if (sentiment.score < -0.2 && sentiment.confidence > 0.3) return "bearish";
    return "neutral";
  }

  private calculateImpactStrength(
    article: NewsArticle,
    sentiment: SentimentScore
  ): number {
    let strength = sentiment.confidence;

    // Boost for authoritative sources
    const authoritativeSources = [
      "reuters",
      "bloomberg",
      "coindesk",
      "cointelegraph",
    ];
    if (
      authoritativeSources.some((source) =>
        article.source.toLowerCase().includes(source)
      )
    ) {
      strength *= 1.3;
    }

    // Boost for recent articles
    const hoursOld =
      (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 1) strength *= 1.2;
    else if (hoursOld < 6) strength *= 1.1;

    return Math.min(strength, 1);
  }

  calculateOverallSentiment(analyses: SentimentAnalysis[]): SentimentTrend {
    if (analyses.length === 0) {
      return {
        timestamp: new Date().toISOString(),
        overallSentiment: 0,
        newsCount: 0,
        volatilityImpact: 0,
        trendDirection: "stable",
      };
    }

    // Weight sentiments by impact strength
    let weightedSum = 0;
    let totalWeight = 0;

    analyses.forEach((analysis) => {
      const weight = analysis.impactStrength;
      weightedSum += analysis.sentiment.score * weight;
      totalWeight += weight;
    });

    const overallSentiment = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Calculate volatility impact
    const sentimentVariance =
      analyses.reduce((sum, analysis) => {
        const diff = analysis.sentiment.score - overallSentiment;
        return sum + diff * diff;
      }, 0) / analyses.length;

    const volatilityImpact = Math.min(sentimentVariance, 1);

    // Determine trend direction
    const recentSentiment = this.sentimentHistory.slice(-3);
    let trendDirection: "improving" | "stable" | "declining" = "stable";

    if (recentSentiment.length >= 2) {
      const trend =
        recentSentiment[recentSentiment.length - 1].overallSentiment -
        recentSentiment[0].overallSentiment;
      if (trend > 0.1) trendDirection = "improving";
      else if (trend < -0.1) trendDirection = "declining";
    }

    const sentimentTrend: SentimentTrend = {
      timestamp: new Date().toISOString(),
      overallSentiment,
      newsCount: analyses.length,
      volatilityImpact,
      trendDirection,
    };

    // Update history
    this.sentimentHistory.push(sentimentTrend);
    if (this.sentimentHistory.length > 100) {
      this.sentimentHistory = this.sentimentHistory.slice(-100);
    }

    return sentimentTrend;
  }

  async generatePrediction(
    sentimentTrend: SentimentTrend,
    currentPrice: number,
    priceHistory: number[]
  ): Promise<MarketPrediction> {
    // Simple prediction algorithm - in production, use more sophisticated ML
    const sentiment = sentimentTrend.overallSentiment;
    const volatility = sentimentTrend.volatilityImpact;

    // Calculate technical indicators
    const priceChange =
      priceHistory.length > 1
        ? (currentPrice - priceHistory[priceHistory.length - 2]) /
          priceHistory[priceHistory.length - 2]
        : 0;

    let direction: "up" | "down" | "sideways" = "sideways";
    let confidence = 0.5;

    // Combine sentiment and technical factors
    const sentimentWeight = 0.6;
    const technicalWeight = 0.4;

    const combinedSignal =
      sentiment * sentimentWeight + priceChange * technicalWeight;

    if (combinedSignal > 0.05) {
      direction = "up";
      confidence = Math.min(0.3 + Math.abs(combinedSignal) * 2, 0.9);
    } else if (combinedSignal < -0.05) {
      direction = "down";
      confidence = Math.min(0.3 + Math.abs(combinedSignal) * 2, 0.9);
    } else {
      direction = "sideways";
      confidence = 0.4;
    }

    // Adjust confidence based on volatility
    if (volatility > 0.5) confidence *= 0.8;

    const priceTarget =
      direction === "up"
        ? currentPrice * 1.02
        : direction === "down"
        ? currentPrice * 0.98
        : currentPrice;

    return {
      timeframe: "1h",
      direction,
      confidence,
      priceTarget,
      reasoning: this.generateReasoning(
        sentiment,
        priceChange,
        volatility,
        direction
      ),
      sentimentFactor: Math.abs(sentiment),
      technicalFactor: Math.abs(priceChange),
      createdAt: new Date().toISOString(),
    };
  }

  private generateReasoning(
    sentiment: number,
    priceChange: number,
    volatility: number,
    direction: "up" | "down" | "sideways"
  ): string {
    const sentimentDesc =
      sentiment > 0.2
        ? "very positive"
        : sentiment > 0.05
        ? "positive"
        : sentiment < -0.2
        ? "very negative"
        : sentiment < -0.05
        ? "negative"
        : "neutral";

    const priceDesc =
      priceChange > 0.01
        ? "rising"
        : priceChange < -0.01
        ? "falling"
        : "stable";

    const volatilityDesc =
      volatility > 0.5 ? "high" : volatility > 0.3 ? "moderate" : "low";

    return (
      `Market sentiment is ${sentimentDesc}, price is ${priceDesc}, and volatility is ${volatilityDesc}. ` +
      `Based on these factors, expecting ${
        direction === "up"
          ? "upward"
          : direction === "down"
          ? "downward"
          : "sideways"
      } movement.`
    );
  }

  async generateTradingSignal(
    prediction: MarketPrediction,
    currentPrice: number,
    sentimentTrend: SentimentTrend
  ): Promise<TradingSignal> {
    let action: "buy" | "sell" | "hold" = "hold";
    let strength = 0.5;
    let riskLevel: "low" | "medium" | "high" = "medium";

    // Determine action based on prediction
    if (prediction.direction === "up" && prediction.confidence > 0.6) {
      action = "buy";
      strength = prediction.confidence;
      riskLevel = sentimentTrend.volatilityImpact > 0.6 ? "high" : "medium";
    } else if (prediction.direction === "down" && prediction.confidence > 0.6) {
      action = "sell";
      strength = prediction.confidence;
      riskLevel = sentimentTrend.volatilityImpact > 0.6 ? "high" : "medium";
    } else {
      action = "hold";
      strength = 0.5;
      riskLevel = "low";
    }

    // Calculate suggested allocation
    const suggestedAllocation =
      action === "buy"
        ? Math.min(strength * 0.3, 0.25)
        : action === "sell"
        ? 0
        : 0.1; // Small holding for 'hold'

    // Calculate stop loss and take profit
    const stopLoss =
      action === "buy"
        ? currentPrice * 0.95
        : action === "sell"
        ? currentPrice * 1.05
        : undefined;

    const takeProfit =
      action === "buy"
        ? currentPrice * 1.1
        : action === "sell"
        ? currentPrice * 0.9
        : undefined;

    return {
      action,
      strength,
      reasoning: `${action.toUpperCase()} signal generated based on ${
        prediction.reasoning
      }`,
      riskLevel,
      confidenceLevel: prediction.confidence,
      suggestedAllocation,
      stopLoss,
      takeProfit,
      createdAt: new Date().toISOString(),
    };
  }

  getSentimentHistory(): SentimentTrend[] {
    return [...this.sentimentHistory];
  }
}
