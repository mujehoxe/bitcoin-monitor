/**
 * Demo script to test the sentiment analysis functionality
 * Run with: node demo-sentiment.js
 */

import { NewsService } from "./src/services/newsService.js";
import { SentimentAnalysisService } from "./src/services/sentimentAnalysisService.js";

async function runSentimentDemo() {
  console.log("🚀 Bitcoin Sentiment Analysis Demo\n");

  try {
    // Initialize services
    const newsService = NewsService.getInstance();
    const sentimentService = SentimentAnalysisService.getInstance();

    console.log("📰 Fetching Bitcoin news...");

    // Fetch news (using fallback data for demo)
    const news = await newsService.getFallbackNews();
    console.log(`✅ Found ${news.length} news articles\n`);

    // Analyze sentiment
    console.log("🤖 Analyzing sentiment...");
    const sentimentAnalyses = await sentimentService.analyzeNews(news);

    // Display results
    console.log("📊 Sentiment Analysis Results:\n");

    sentimentAnalyses.forEach((analysis, index) => {
      const article = news[index];
      console.log(`Article ${index + 1}: ${article.title}`);
      console.log(
        `  Sentiment: ${analysis.sentiment.label.toUpperCase()} (${(
          analysis.sentiment.score * 100
        ).toFixed(1)}%)`
      );
      console.log(
        `  Confidence: ${(analysis.sentiment.confidence * 100).toFixed(1)}%`
      );
      console.log(`  Market Impact: ${analysis.marketImpact.toUpperCase()}`);
      console.log(`  Key Points: ${analysis.keyPoints.join(", ")}\n`);
    });

    // Calculate overall sentiment
    const overallSentiment =
      sentimentService.calculateOverallSentiment(sentimentAnalyses);
    console.log("🎯 Overall Market Sentiment:");
    console.log(
      `  Score: ${(overallSentiment.overallSentiment * 100).toFixed(1)}%`
    );
    console.log(`  Trend: ${overallSentiment.trendDirection.toUpperCase()}`);
    console.log(
      `  Volatility Impact: ${(overallSentiment.volatilityImpact * 100).toFixed(
        1
      )}%`
    );
    console.log(`  News Count: ${overallSentiment.newsCount}\n`);

    // Generate prediction
    const currentPrice = 45000; // Example price
    const priceHistory = [44000, 44500, 45000]; // Example history

    console.log("🔮 Generating Market Prediction...");
    const prediction = await sentimentService.generatePrediction(
      overallSentiment,
      currentPrice,
      priceHistory
    );

    console.log(`  Direction: ${prediction.direction.toUpperCase()}`);
    console.log(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(
      `  Price Target: $${prediction.priceTarget?.toFixed(2) || "N/A"}`
    );
    console.log(`  Reasoning: ${prediction.reasoning}\n`);

    // Generate trading signal
    console.log("📈 Generating Trading Signal...");
    const tradingSignal = await sentimentService.generateTradingSignal(
      prediction,
      currentPrice,
      overallSentiment
    );

    console.log(`  Action: ${tradingSignal.action.toUpperCase()}`);
    console.log(`  Strength: ${(tradingSignal.strength * 100).toFixed(1)}%`);
    console.log(`  Risk Level: ${tradingSignal.riskLevel.toUpperCase()}`);
    console.log(
      `  Confidence: ${(tradingSignal.confidenceLevel * 100).toFixed(1)}%`
    );
    console.log(
      `  Suggested Allocation: ${
        tradingSignal.suggestedAllocation
          ? (tradingSignal.suggestedAllocation * 100).toFixed(1) + "%"
          : "N/A"
      }`
    );
    console.log(`  Reasoning: ${tradingSignal.reasoning}\n`);

    console.log("✅ Demo completed successfully!");
  } catch (error) {
    console.error("❌ Demo failed:", error);
  }
}

// Run the demo
runSentimentDemo();
