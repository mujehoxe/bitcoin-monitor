"use client";

import { RealTimeNewsService } from "@/services/realTimeNewsService";
import { NewsArticle } from "@/types/sentiment";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UseRealTimeNewsResult {
  news: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  refreshNews: () => void;
  getNewsByCategory: (category: string) => NewsArticle[];
  sourceStatus: Record<
    string,
    { connected: boolean; lastUpdate: string; articleCount: number }
  >;
}

export const useRealTimeNews = (): UseRealTimeNewsResult => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceStatus, setSourceStatus] = useState<
    Record<
      string,
      { connected: boolean; lastUpdate: string; articleCount: number }
    >
  >({});

  // Memoize the service instance
  const newsService = useMemo(() => RealTimeNewsService.getInstance(), []);

  // Initialize the service and start fetching news
  const initializeNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔄 Initializing real-time news service...");

      // Initialize real-time feeds
      await newsService.initialize();

      // Get initial news
      const initialNews = await newsService.getAllNews();
      console.log("📰 Initial news loaded:", initialNews.length, "articles");
      setNews(initialNews);

      // Get source status
      const status = newsService.getSourceStatus();
      console.log("📊 Source status:", status);
      setSourceStatus(status);
    } catch (err) {
      console.error("❌ Error initializing news service:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize news service"
      );
    } finally {
      setIsLoading(false);
    }
  }, [newsService]);

  // Refresh news manually
  const refreshNews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await newsService.refreshAllSources();
      const updatedNews = await newsService.getAllNews();
      setNews(updatedNews);

      const status = newsService.getSourceStatus();
      setSourceStatus(status);
    } catch (err) {
      console.error("Error refreshing news:", err);
      setError(err instanceof Error ? err.message : "Failed to refresh news");
    } finally {
      setIsLoading(false);
    }
  }, [newsService]);

  // Memoized function to return current news by category
  const getNewsForCategory = useCallback(
    (category: string): NewsArticle[] => {
      return news.filter((article) => {
        // Simple category mapping based on source or keywords
        const lowerTitle = article.title.toLowerCase();
        const lowerContent = article.content.toLowerCase();

        switch (category) {
          case "crypto":
            return (
              lowerTitle.includes("bitcoin") ||
              lowerTitle.includes("crypto") ||
              lowerTitle.includes("btc") ||
              lowerContent.includes("bitcoin") ||
              lowerContent.includes("cryptocurrency")
            );
          case "political":
            return (
              lowerTitle.includes("government") ||
              lowerTitle.includes("regulation") ||
              lowerTitle.includes("policy") ||
              lowerTitle.includes("political")
            );
          case "environmental":
            return (
              lowerTitle.includes("environment") ||
              lowerTitle.includes("climate") ||
              lowerTitle.includes("green") ||
              lowerTitle.includes("sustainable")
            );
          default:
            return true;
        }
      });
    },
    [news]
  );

  // Set up periodic refresh
  useEffect(() => {
    const performRefresh = async () => {
      try {
        await newsService.refreshAllSources();
        const updatedNews = await newsService.getAllNews();
        setNews(updatedNews);

        const status = newsService.getSourceStatus();
        setSourceStatus(status);
      } catch (err) {
        console.error("Error in periodic refresh:", err);
      }
    };

    const interval = setInterval(performRefresh, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [newsService]); // Only depend on newsService which is memoized

  // Initialize on mount
  useEffect(() => {
    initializeNews();

    // Cleanup on unmount
    return () => {
      newsService.destroy();
    };
  }, [initializeNews, newsService]);

  return {
    news,
    isLoading,
    error,
    refreshNews,
    getNewsByCategory: getNewsForCategory,
    sourceStatus,
  };
};
