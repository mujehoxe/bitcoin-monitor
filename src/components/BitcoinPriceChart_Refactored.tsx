"use client";

import { ChartLegend, LoadingIndicator } from "@/components/ui/ChartOverlays";
import { ErrorState, LoadingState } from "@/components/ui/ChartStates";
import { useChart } from "@/hooks/useChart";
import { useHistoricalData } from "@/hooks/useHistoricalData";
import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis";
import { useWebSocket } from "@/hooks/useWebSocket";
import { CryptoAPIService, TickerData } from "@/services/cryptoAPIService";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface BitcoinPriceChartProps {
  onDataUpdate?: (currentPrice: number, priceHistory: number[]) => void;
}

const BitcoinPriceChart: React.FC<BitcoinPriceChartProps> = ({
  onDataUpdate,
}) => {
  const [tickerData, setTickerData] = useState<TickerData | null>(null);

  // Custom hooks
  const {
    data: historicalData,
    isLoading,
    isLoadingMore,
    error,
    hasMoreData,
    fetchInitialData,
    loadMoreHistoricalData,
    reset,
  } = useHistoricalData();

  const {
    chartContainerRef,
    isInitialized: isChartInitialized,
    initializeChart,
    updateChartData,
    updateCandle,
    setVisibleTimeRangeChangeCallback,
  } = useChart();

  const {
    isConnected: isWebSocketConnected,
    tickerData: wsTickerData,
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
  } = useWebSocket();

  // Memoized values for sentiment analysis
  const currentPrice = useMemo(() => {
    const ticker = wsTickerData || tickerData;
    return ticker
      ? parseFloat(ticker.price)
      : historicalData.length > 0
      ? historicalData[historicalData.length - 1].close
      : 0;
  }, [wsTickerData, tickerData, historicalData]);

  const priceHistory = useMemo(() => {
    return historicalData.slice(-100).map((d) => d.close);
  }, [historicalData]);

  // Reference for onDataUpdate callback
  const onDataUpdateRef = useRef(onDataUpdate);
  onDataUpdateRef.current = onDataUpdate;

  // Sentiment analysis hook
  useSentimentAnalysis(currentPrice, priceHistory);

  // Call onDataUpdate when data changes
  useEffect(() => {
    if (onDataUpdateRef.current) {
      onDataUpdateRef.current(currentPrice, priceHistory);
    }
  }, [currentPrice, priceHistory]);

  // Fetch ticker data
  const fetchTickerData = useCallback(async () => {
    const ticker = await CryptoAPIService.fetchTickerData();
    if (ticker) {
      setTickerData(ticker);
    }
  }, []);

  // Handle chart time range changes for loading more data
  const handleTimeRangeChange = useCallback(() => {
    if (!hasMoreData || isLoadingMore) return;

    // Simplified check - in real implementation, you'd use the chart's timeScale API
    // For now, we'll trigger loading when scrolling back
    loadMoreHistoricalData();
  }, [hasMoreData, isLoadingMore, loadMoreHistoricalData]);

  // Handle retry functionality
  const handleRetry = useCallback(() => {
    reset();
    setTickerData(null);
    fetchInitialData();
    fetchTickerData();
  }, [reset, fetchInitialData, fetchTickerData]);

  // Initialize chart when data is available
  useEffect(() => {
    if (historicalData.length > 0 && !isChartInitialized) {
      initializeChart();
    }
  }, [historicalData, isChartInitialized, initializeChart]);

  // Update chart data when historical data changes
  useEffect(() => {
    if (historicalData.length > 0 && isChartInitialized) {
      updateChartData(historicalData);
    }
  }, [historicalData, isChartInitialized, updateChartData]);

  // Set up time range change listener for loading more data
  useEffect(() => {
    if (isChartInitialized) {
      setVisibleTimeRangeChangeCallback(handleTimeRangeChange);
    }
  }, [
    isChartInitialized,
    setVisibleTimeRangeChangeCallback,
    handleTimeRangeChange,
  ]);

  // Connect WebSocket when chart is ready
  useEffect(() => {
    if (
      historicalData.length > 0 &&
      !isWebSocketConnected &&
      isChartInitialized
    ) {
      connectWebSocket(historicalData, updateCandle);
    }
  }, [
    historicalData,
    isWebSocketConnected,
    isChartInitialized,
    connectWebSocket,
    updateCandle,
  ]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialData();
    fetchTickerData();
  }, [fetchInitialData, fetchTickerData]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket();
    };
  }, [disconnectWebSocket]);

  // Render loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Render error state
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // Render main chart
  return (
    <div className="w-full h-screen flex items-center p-2">
      <div className="flex gap-4 h-[calc(100vh-2rem)] w-full">
        {/* Price Chart - Takes up most of the space */}
        <div className="flex-1">
          {/* Chart Area */}
          <div className="flex-1 relative">
            {/* Chart Legend Overlay */}
            <ChartLegend isLoadingMore={isLoadingMore} />

            {/* Chart Container */}
            <div
              ref={chartContainerRef}
              className="w-full h-full border border-slate-700 rounded"
            />

            {/* Loading Indicator */}
            <LoadingIndicator hasMoreData={hasMoreData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinPriceChart;
