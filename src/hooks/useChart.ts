import {
  CandlestickSeries,
  ColorType,
  createChart,
  IChartApi,
  ISeriesApi,
  LineSeries,
} from "lightweight-charts";
import { useCallback, useEffect, useRef, useState } from "react";
import { CandlestickData } from "../services/cryptoAPIService";
import { CHART_CONFIG, ChartUtils } from "../utils/chartUtils";

interface UseChartReturn {
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
  isInitialized: boolean;
  initializeChart: () => void;
  updateChartData: (data: CandlestickData[]) => void;
  updateCandle: (candle: CandlestickData) => void;
  dispose: () => void;
  setVisibleTimeRangeChangeCallback: (callback: () => void) => void;
}

export const useChart = (): UseChartReturn => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ma7SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma25SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma99SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const isDisposedRef = useRef<boolean>(false);
  const resizeCleanupRef = useRef<(() => void) | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeChart = useCallback(() => {
    if (
      !chartContainerRef.current ||
      isDisposedRef.current ||
      chartRef.current
    ) {
      console.log(
        "Chart initialization skipped - container not ready or already exists"
      );
      return;
    }

    try {
      // Ensure container has dimensions
      const container = chartContainerRef.current;
      if (
        !container ||
        container.clientWidth === 0 ||
        container.clientHeight === 0
      ) {
        console.warn("Chart container has zero dimensions, waiting...");
        setTimeout(() => initializeChart(), 100);
        return;
      }

      console.log("Initializing chart...");

      // Create chart
      const chart = createChart(container, {
        layout: {
          textColor: CHART_CONFIG.layout.textColor,
          background: {
            type: ColorType.Solid,
            color: CHART_CONFIG.layout.background.color,
          },
        },
        width: container.clientWidth,
        height: container.clientHeight,
        grid: CHART_CONFIG.grid,
        rightPriceScale: CHART_CONFIG.rightPriceScale,
        timeScale: CHART_CONFIG.timeScale,
      });

      // Add candlestick series
      const candlestickSeries = chart.addSeries(
        CandlestickSeries,
        CHART_CONFIG.candlestickSeries
      );

      // Add moving average series
      const ma7Series = chart.addSeries(
        LineSeries,
        CHART_CONFIG.movingAverages.ma7
      );
      const ma25Series = chart.addSeries(
        LineSeries,
        CHART_CONFIG.movingAverages.ma25
      );
      const ma99Series = chart.addSeries(
        LineSeries,
        CHART_CONFIG.movingAverages.ma99
      );

      // Store references
      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      ma7SeriesRef.current = ma7Series;
      ma25SeriesRef.current = ma25Series;
      ma99SeriesRef.current = ma99Series;
      setIsInitialized(true);

      // Handle resize
      const handleResize = () => {
        if (
          isDisposedRef.current ||
          !chartRef.current ||
          !chartContainerRef.current
        )
          return;

        try {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        } catch (error) {
          console.error("Error resizing chart:", error);
        }
      };

      window.addEventListener("resize", handleResize);

      console.log("Chart initialized successfully");

      // Store cleanup function
      resizeCleanupRef.current = () => {
        window.removeEventListener("resize", handleResize);
      };
    } catch (err) {
      console.error("Error initializing chart:", err);
    }
  }, []);

  const updateChartData = useCallback((data: CandlestickData[]) => {
    if (
      !chartRef.current ||
      !candlestickSeriesRef.current ||
      isDisposedRef.current
    ) {
      return;
    }

    try {
      // Validate data
      if (!ChartUtils.validateData(data)) {
        console.error("Invalid data provided to chart update");
        return;
      }

      console.log("Updating chart with", data.length, "data points");

      // Update candlestick data
      candlestickSeriesRef.current.setData(data);

      // Update moving averages
      if (ma7SeriesRef.current) {
        const ma7Data = ChartUtils.calculateMovingAverage(data, 7);
        ma7SeriesRef.current.setData(ma7Data);
      }
      if (ma25SeriesRef.current) {
        const ma25Data = ChartUtils.calculateMovingAverage(data, 25);
        ma25SeriesRef.current.setData(ma25Data);
      }
      if (ma99SeriesRef.current) {
        const ma99Data = ChartUtils.calculateMovingAverage(data, 99);
        ma99SeriesRef.current.setData(ma99Data);
      }
    } catch (error) {
      console.error("Failed to update chart data:", error);
    }
  }, []);

  const updateCandle = useCallback((candle: CandlestickData) => {
    if (!candlestickSeriesRef.current || isDisposedRef.current) {
      return;
    }

    try {
      candlestickSeriesRef.current.update(candle);
    } catch (error) {
      console.warn("Failed to update chart with new candle:", error);
    }
  }, []);

  const setVisibleTimeRangeChangeCallback = useCallback(
    (callback: () => void) => {
      if (!chartRef.current || isDisposedRef.current) {
        return;
      }

      chartRef.current.timeScale().subscribeVisibleTimeRangeChange(callback);
    },
    []
  );

  const dispose = useCallback(() => {
    console.log("Disposing chart...");
    isDisposedRef.current = true;

    // Clear series references first
    candlestickSeriesRef.current = null;
    ma7SeriesRef.current = null;
    ma25SeriesRef.current = null;
    ma99SeriesRef.current = null;

    if (chartRef.current) {
      try {
        // Call resize cleanup if it exists
        if (resizeCleanupRef.current) {
          resizeCleanupRef.current();
          resizeCleanupRef.current = null;
        }
        chartRef.current.remove();
        chartRef.current = null;
      } catch (error) {
        console.error("Error disposing chart:", error);
      }
    }

    setIsInitialized(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    chartContainerRef,
    isInitialized,
    initializeChart,
    updateChartData,
    updateCandle,
    dispose,
    setVisibleTimeRangeChangeCallback,
  };
};
