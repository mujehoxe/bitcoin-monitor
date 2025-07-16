import {
  NewsArticle,
  SentimentAnalysis,
  SentimentScore,
} from "@/types/sentiment";

interface SentimentKeywords {
  positive: string[];
  negative: string[];
  neutral: string[];
  bullish: string[];
  bearish: string[];
  volatile: string[];
}

export class EnhancedSentimentService {
  private static instance: EnhancedSentimentService;

  static getInstance(): EnhancedSentimentService {
    if (!EnhancedSentimentService.instance) {
      EnhancedSentimentService.instance = new EnhancedSentimentService();
    }
    return EnhancedSentimentService.instance;
  }

  private keywords: SentimentKeywords = {
    positive: [
      "bullish",
      "gain",
      "surge",
      "rally",
      "breakthrough",
      "milestone",
      "adoption",
      "institutional",
      "mainstream",
      "record",
      "high",
      "success",
      "growth",
      "innovation",
      "breakout",
      "support",
      "resistance",
      "pump",
      "moon",
    ],
    negative: [
      "bearish",
      "drop",
      "crash",
      "decline",
      "loss",
      "fud",
      "regulation",
      "ban",
      "restriction",
      "hack",
      "scam",
      "dump",
      "panic",
      "fear",
      "uncertainty",
      "doubt",
      "rejection",
      "resistance",
      "correction",
    ],
    neutral: [
      "market",
      "price",
      "analysis",
      "report",
      "data",
      "trend",
      "volume",
      "trading",
      "exchange",
      "platform",
      "network",
      "blockchain",
      "update",
    ],
    bullish: [
      "buy",
      "hold",
      "accumulate",
      "bull run",
      "uptrend",
      "breakout",
      "support",
      "momentum",
      "strength",
      "recovery",
      "rebound",
      "surge",
    ],
    bearish: [
      "sell",
      "short",
      "correction",
      "downtrend",
      "breakdown",
      "resistance",
      "weakness",
      "decline",
      "rejection",
      "dump",
      "panic",
      "crash",
    ],
    volatile: [
      "volatile",
      "uncertainty",
      "fluctuation",
      "swing",
      "choppy",
      "unstable",
      "erratic",
      "wild",
      "turbulent",
      "chaotic",
      "unpredictable",
    ],
  };

  async analyzeArticle(article: NewsArticle): Promise<SentimentAnalysis> {
    const text =
      `${article.title} ${article.description} ${article.content}`.toLowerCase();

    const sentimentScore = this.calculateSentimentScore(text);
    const marketImpact = this.determineMarketImpact(text, sentimentScore);
    const keyPoints = this.extractKeyPoints(text);

    return {
      articleId: article.id,
      sentiment: sentimentScore,
      keyPoints,
      marketImpact: marketImpact.impact,
      impactStrength: marketImpact.strength,
      analyzedAt: new Date().toISOString(),
    };
  }

  private calculateSentimentScore(text: string): SentimentScore {
    let positiveCount = 0;
    let negativeCount = 0;
    let totalKeywords = 0;

    // Count keyword occurrences
    this.keywords.positive.forEach((keyword) => {
      const count = (text.match(new RegExp(keyword, "gi")) || []).length;
      positiveCount += count;
      totalKeywords += count;
    });

    this.keywords.negative.forEach((keyword) => {
      const count = (text.match(new RegExp(keyword, "gi")) || []).length;
      negativeCount += count;
      totalKeywords += count;
    });

    // Calculate base sentiment score
    let score = 0;
    let confidence = 0.5;

    if (totalKeywords > 0) {
      score = (positiveCount - negativeCount) / totalKeywords;
      confidence = Math.min(totalKeywords / 10, 1);
    }

    // Adjust for crypto-specific terms
    const bullishCount = this.countKeywords(text, this.keywords.bullish);
    const bearishCount = this.countKeywords(text, this.keywords.bearish);

    if (bullishCount > bearishCount) {
      score = Math.min(score + 0.2, 1);
    } else if (bearishCount > bullishCount) {
      score = Math.max(score - 0.2, -1);
    }

    // Determine label
    let label: "negative" | "neutral" | "positive";
    if (score > 0.1) label = "positive";
    else if (score < -0.1) label = "negative";
    else label = "neutral";

    return {
      score: Math.max(-1, Math.min(1, score)),
      confidence: Math.max(0, Math.min(1, confidence)),
      label,
    };
  }

  private determineMarketImpact(
    text: string,
    sentiment: SentimentScore
  ): { impact: "bearish" | "neutral" | "bullish"; strength: number } {
    const bullishCount = this.countKeywords(text, this.keywords.bullish);
    const bearishCount = this.countKeywords(text, this.keywords.bearish);
    const volatileCount = this.countKeywords(text, this.keywords.volatile);

    let impact: "bearish" | "neutral" | "bullish";
    let strength = Math.abs(sentiment.score) * sentiment.confidence;

    // Adjust based on keyword counts
    if (bullishCount > bearishCount) {
      impact = "bullish";
      strength = Math.min(strength + 0.3, 1);
    } else if (bearishCount > bullishCount) {
      impact = "bearish";
      strength = Math.min(strength + 0.3, 1);
    } else {
      impact = "neutral";
      strength = Math.max(strength - 0.2, 0);
    }

    // Increase strength for volatile content
    if (volatileCount > 0) {
      strength = Math.min(strength + 0.2, 1);
    }

    return { impact, strength: Math.max(0, Math.min(1, strength)) };
  }

  private extractKeyPoints(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const keyPoints: string[] = [];

    // Extract sentences with high keyword density
    sentences.forEach((sentence) => {
      const keywords = [
        ...this.keywords.positive,
        ...this.keywords.negative,
        ...this.keywords.bullish,
        ...this.keywords.bearish,
      ];

      const keywordCount = keywords.reduce((count, keyword) => {
        return count + (sentence.toLowerCase().includes(keyword) ? 1 : 0);
      }, 0);

      if (keywordCount >= 2) {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 200) {
          keyPoints.push(trimmed);
        }
      }
    });

    return keyPoints.slice(0, 3);
  }

  private countKeywords(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => {
      return count + (text.match(new RegExp(keyword, "gi")) || []).length;
    }, 0);
  }

  async analyzeBatch(articles: NewsArticle[]): Promise<SentimentAnalysis[]> {
    const analyses = await Promise.all(
      articles.map((article) => this.analyzeArticle(article))
    );
    return analyses;
  }

  getSentimentTrend(analyses: SentimentAnalysis[]): {
    averageScore: number;
    bullishCount: number;
    bearishCount: number;
    neutralCount: number;
    strongestImpact: SentimentAnalysis | null;
  } {
    if (analyses.length === 0) {
      return {
        averageScore: 0,
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        strongestImpact: null,
      };
    }

    const scores = analyses.map((a) => a.sentiment.score);
    const averageScore =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;

    const bullishCount = analyses.filter(
      (a) => a.marketImpact === "bullish"
    ).length;
    const bearishCount = analyses.filter(
      (a) => a.marketImpact === "bearish"
    ).length;
    const neutralCount = analyses.filter(
      (a) => a.marketImpact === "neutral"
    ).length;

    const strongestImpact = analyses.reduce((strongest, current) => {
      if (!strongest || current.impactStrength > strongest.impactStrength) {
        return current;
      }
      return strongest;
    }, null as SentimentAnalysis | null);

    return {
      averageScore,
      bullishCount,
      bearishCount,
      neutralCount,
      strongestImpact,
    };
  }

  generateTradingSignal(analyses: SentimentAnalysis[]): {
    signal: "buy" | "sell" | "hold";
    confidence: number;
    reasoning: string;
  } {
    const trend = this.getSentimentTrend(analyses);

    if (
      trend.bullishCount > trend.bearishCount * 1.5 &&
      trend.averageScore > 0.2
    ) {
      return {
        signal: "buy",
        confidence: Math.min(
          (trend.averageScore * trend.bullishCount) / analyses.length,
          1
        ),
        reasoning: `Strong bullish sentiment with ${trend.bullishCount} bullish vs ${trend.bearishCount} bearish articles`,
      };
    } else if (
      trend.bearishCount > trend.bullishCount * 1.5 &&
      trend.averageScore < -0.2
    ) {
      return {
        signal: "sell",
        confidence: Math.min(
          (Math.abs(trend.averageScore) * trend.bearishCount) / analyses.length,
          1
        ),
        reasoning: `Strong bearish sentiment with ${trend.bearishCount} bearish vs ${trend.bullishCount} bullish articles`,
      };
    } else {
      return {
        signal: "hold",
        confidence: 0.5,
        reasoning: "Mixed sentiment, no clear directional bias",
      };
    }
  }
}
