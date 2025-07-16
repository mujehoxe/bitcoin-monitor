"use client";

import { NewsArticle } from "@/types/sentiment";
import { useCallback, useEffect, useRef, useState } from "react";

interface WebSocketNewsState {
  news: NewsArticle[];
  status: Record<
    string,
    { connected: boolean; lastUpdate: string; articleCount: number }
  >;
  isConnected: boolean;
  error: string | null;
}

interface UseWebSocketNewsResult extends WebSocketNewsState {
  refreshNews: () => void;
  getNewsByCategory: (category: string) => NewsArticle[];
}

export const useWebSocketNews = (): UseWebSocketNewsResult => {
  const [state, setState] = useState<WebSocketNewsState>({
    news: [],
    status: {},
    isConnected: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 5;

  const connectWebSocket = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const wsUrl = `${
        window.location.protocol === "https:" ? "wss:" : "http:"
      }//${window.location.host}/api/news/websocket`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("🔌 WebSocket connected");
        setState((prev) => ({ ...prev, isConnected: true, error: null }));
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case "initial":
            case "update":
              setState((prev) => ({
                ...prev,
                news: data.news || [],
                status: data.status || {},
              }));
              break;

            case "error":
              setState((prev) => ({ ...prev, error: data.message }));
              break;
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        console.log("🔌 WebSocket disconnected");
        setState((prev) => ({ ...prev, isConnected: false }));

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttemptsRef.current),
            30000
          );
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current})`
            );
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setState((prev) => ({ ...prev, error: "WebSocket connection error" }));
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setState((prev) => ({ ...prev, error: "Failed to create WebSocket" }));
    }
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const refreshNews = useCallback(async () => {
    try {
      const response = await fetch("/api/news/websocket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh" }),
      });

      if (response.ok) {
        const data = await response.json();
        setState((prev) => ({
          ...prev,
          news: data.news || [],
          status: data.status || {},
        }));
      }
    } catch (error) {
      console.error("Error refreshing news:", error);
    }
  }, []);

  const getNewsByCategory = useCallback(
    (category: string): NewsArticle[] => {
      if (category === "all") {
        return state.news;
      }

      return state.news.filter((article) => {
        const lowerTitle = article.title.toLowerCase();
        const lowerContent = article.content.toLowerCase();

        switch (category) {
          case "crypto":
            return (
              lowerTitle.includes("bitcoin") ||
              lowerTitle.includes("crypto") ||
              lowerTitle.includes("btc") ||
              lowerTitle.includes("ethereum") ||
              lowerContent.includes("bitcoin") ||
              lowerContent.includes("cryptocurrency")
            );

          case "political":
            return (
              lowerTitle.includes("government") ||
              lowerTitle.includes("regulation") ||
              lowerTitle.includes("policy") ||
              lowerTitle.includes("political") ||
              lowerTitle.includes("fed") ||
              lowerTitle.includes("central bank")
            );

          case "environmental":
            return (
              lowerTitle.includes("environment") ||
              lowerTitle.includes("climate") ||
              lowerTitle.includes("green") ||
              lowerTitle.includes("sustainable") ||
              lowerTitle.includes("carbon") ||
              lowerContent.includes("environmental")
            );

          default:
            return true;
        }
      });
    },
    [state.news]
  );

  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  return {
    ...state,
    refreshNews,
    getNewsByCategory,
  };
};
