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
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      try {
        setIsLoading(true);
        setError(null);

        // Initialize real-time feeds
        await newsService.initialize();

        if (!mounted) return;

        // Get initial news
        const initialNews = await newsService.getAllNews();
        console.log("📰 Initial news loaded:", initialNews.length, "articles");

        if (mounted) {
          setNews(initialNews);
        }

        // Get source status
        const status = newsService.getSourceStatus();
        console.log("📊 Source status:", status);

        if (mounted) {
          setSourceStatus(status);
        }
      } catch (err) {
        console.error("❌ Error initializing news service:", err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize news service"
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      mounted = false;
      newsService.destroy();
    };
  }, [newsService]); // Only depend on memoized newsService

  return {
    news,
    isLoading,
    error,
    refreshNews,
    getNewsByCategory: getNewsForCategory,
    sourceStatus,
  };
};
