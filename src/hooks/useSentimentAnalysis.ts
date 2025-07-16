"use client";

import { NewsService } from "@/services/newsService";
import { SentimentAnalysisService } from "@/services/sentimentAnalysisService";
import {
  MarketPrediction,
  NewsArticle,
  SentimentAnalysis,
  SentimentTrend,
  TradingSignal,
} from "@/types/sentiment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseSentimentAnalysisResult {
  news: (NewsArticle & { sentiment?: SentimentAnalysis })[];
  sentimentTrend: SentimentTrend | null;
  prediction: MarketPrediction | null;
  tradingSignal: TradingSignal | null;
  isLoading: boolean;
  error: string | null;
  refreshSentiment: () => void;
}

export const useSentimentAnalysis = (
  currentPrice: number,
  priceHistory: number[]
): UseSentimentAnalysisResult => {
  const [news, setNews] = useState<
    (NewsArticle & { sentiment?: SentimentAnalysis })[]
  >([]);
  const [sentimentTrend, setSentimentTrend] = useState<SentimentTrend | null>(
    null
  );
  const [prediction, setPrediction] = useState<MarketPrediction | null>(null);
  const [tradingSignal, setTradingSignal] = useState<TradingSignal | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize services to prevent recreation on every render
  const newsService = useMemo(() => NewsService.getInstance(), []);
  const sentimentService = useMemo(
    () => SentimentAnalysisService.getInstance(),
    []
  );

  // Stabilize priceHistory to prevent infinite loops
  const stablePriceHistory = useMemo(() => {
    return [...priceHistory];
  }, [priceHistory]);

  // Use ref to track if analysis is running to prevent multiple simultaneous calls
  const isAnalyzing = useRef(false);
  const analyzeSentimentRef = useRef<(() => Promise<void>) | null>(null);
  const currentPriceRef = useRef(currentPrice);
  const priceHistoryRef = useRef(stablePriceHistory);

  // Update refs when values change
  useEffect(() => {
    currentPriceRef.current = currentPrice;
    priceHistoryRef.current = stablePriceHistory;
  }, [currentPrice, stablePriceHistory]);

  const analyzeSentiment = useCallback(async () => {
    if (isAnalyzing.current) {
      return; // Prevent multiple simultaneous calls
    }

    try {
      isAnalyzing.current = true;
      setIsLoading(true);
      setError(null);

      // Fetch news
      let newsArticles: NewsArticle[] = [];

      try {
        newsArticles = await newsService.fetchBitcoinNews(20);
      } catch (newsError) {
        console.warn("Failed to fetch real news, using fallback:", newsError);
        newsArticles = await newsService.getFallbackNews();
      }

      if (newsArticles.length === 0) {
        setError("No news articles available");
        setIsLoading(false);
        return;
      }

      // Analyze sentiment
      const sentimentAnalyses = await sentimentService.analyzeNews(
        newsArticles
      );

      // Combine news with sentiment
      const newsWithSentiment = newsArticles.map((article) => {
        const sentiment = sentimentAnalyses.find(
          (s) => s.articleId === article.id
        );
        return { ...article, sentiment };
      });

      // Calculate overall sentiment trend
      const trend =
        sentimentService.calculateOverallSentiment(sentimentAnalyses);

      // Generate prediction using current price and price history
      const marketPrediction = await sentimentService.generatePrediction(
        trend,
        currentPriceRef.current,
        priceHistoryRef.current
      );

      // Generate trading signal
      const signal = await sentimentService.generateTradingSignal(
        marketPrediction,
        currentPriceRef.current,
        trend
      );

      // Update state
      setNews(newsWithSentiment);
      setSentimentTrend(trend);
      setPrediction(marketPrediction);
      setTradingSignal(signal);
    } catch (err) {
      console.error("Error in sentiment analysis:", err);
      setError(
        err instanceof Error ? err.message : "Failed to analyze sentiment"
      );
    } finally {
      setIsLoading(false);
      isAnalyzing.current = false;
    }
  }, [newsService, sentimentService]); // Remove currentPrice and stablePriceHistory from dependencies

  // Update ref when function changes
  useEffect(() => {
    analyzeSentimentRef.current = analyzeSentiment;
  }, [analyzeSentiment]);

  const refreshSentiment = useCallback(() => {
    if (analyzeSentimentRef.current) {
      analyzeSentimentRef.current();
    }
  }, []); // No dependencies needed since we use ref

  // Initial analysis - only run once when currentPrice becomes available
  useEffect(() => {
    if (
      currentPrice > 0 &&
      !isAnalyzing.current &&
      analyzeSentimentRef.current
    ) {
      analyzeSentimentRef.current();
    }
  }, [currentPrice]); // Safe to exclude analyzeSentiment since we use ref

  // Periodic refresh every 10 minutes (instead of 5)
  useEffect(() => {
    if (currentPrice <= 0) return;

    const interval = setInterval(() => {
      if (
        currentPrice > 0 &&
        !isAnalyzing.current &&
        analyzeSentimentRef.current
      ) {
        analyzeSentimentRef.current();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [currentPrice]); // Safe to exclude analyzeSentiment since we use ref

  return {
    news,
    sentimentTrend,
    prediction,
    tradingSignal,
    isLoading,
    error,
    refreshSentiment,
  };
};
