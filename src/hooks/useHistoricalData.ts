import { useCallback, useState } from "react";
import { CandlestickData, CryptoAPIService } from "../services/cryptoAPIService";
import { ChartUtils } from "../utils/chartUtils";

interface UseHistoricalDataReturn {
  data: CandlestickData[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  earliestTimestamp: number | null;
  hasMoreData: boolean;
  currentDataSource: string;
  fetchInitialData: () => Promise<void>;
  loadMoreHistoricalData: () => Promise<void>;
  reset: () => void;
}

export const useHistoricalData = (): UseHistoricalDataReturn => {
  const [data, setData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earliestTimestamp, setEarliestTimestamp] = useState<number | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentDataSource, setCurrentDataSource] = useState<string>("Unknown");

  const fetchHistoricalData = useCallback(
    async (endTime?: number, isLoadingMore = false) => {
      try {
        if (isLoadingMore) {
          setIsLoadingMore(true);
        } else {
          setError(null);
        }

        console.log(
          "Fetching historical data...",
          endTime ? `before ${endTime}` : "latest"
        );

        const { data: klines, source } = await CryptoAPIService.fetchHistoricalData(endTime);
        setCurrentDataSource(source);

        if (klines.length > 0) {
          const firstTimestamp = klines[0].time as number;

          if (isLoadingMore && endTime) {
            // Merge with existing data
            setData((prevData) => {
              const combined = ChartUtils.mergeHistoricalData(klines, prevData);
              console.log(
                `Combined data: ${klines.length} new + ${prevData.length} existing = ${combined.length} total`
              );
              return combined;
            });

            setEarliestTimestamp(firstTimestamp);

            // Check if we got fewer results than requested
            if (klines.length < 100) {
              setHasMoreData(false);
            }
          } else {
            // Initial load - replace all data
            const sortedData = ChartUtils.sortAndDeduplicateData(klines);
            setData(sortedData);
            setEarliestTimestamp(firstTimestamp);
            setIsLoading(false);
          }
        } else {
          if (!isLoadingMore) {
            setIsLoading(false);
          }
          setHasMoreData(false);
        }

        if (isLoadingMore) {
          setIsLoadingMore(false);
        }
      } catch (err) {
        console.error("Error fetching historical data:", err);
        setError(
          `Failed to fetch historical data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  const fetchInitialData = useCallback(async () => {
    await fetchHistoricalData();
  }, [fetchHistoricalData]);

  const loadMoreHistoricalData = useCallback(async () => {
    if (isLoadingMore || !earliestTimestamp || !hasMoreData) {
      console.log("Skip loading more data:", {
        isLoadingMore,
        earliestTimestamp,
        hasMoreData,
      });
      return;
    }

    try {
      console.log(
        "Loading more historical data before timestamp:",
        earliestTimestamp
      );
      await fetchHistoricalData(earliestTimestamp, true);
    } catch (error) {
      console.error("Error in loadMoreHistoricalData:", error);
      setError("Failed to load more historical data");
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, earliestTimestamp, hasMoreData, fetchHistoricalData]);

  const reset = useCallback(() => {
    setData([]);
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    setEarliestTimestamp(null);
    setHasMoreData(true);
    setCurrentDataSource("Unknown");
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    error,
    earliestTimestamp,
    hasMoreData,
    currentDataSource,
    fetchInitialData,
    loadMoreHistoricalData,
    reset,
  };
};
