import { Time } from "lightweight-charts";
import { CandlestickData } from "../services/cryptoAPIService";

export interface MovingAverageData {
  time: Time;
  value: number;
}

export class ChartUtils {
  // Calculate moving average
  static calculateMovingAverage(
    data: CandlestickData[],
    period: number
  ): MovingAverageData[] {
    if (data.length < period) return [];

    const result: MovingAverageData[] = [];

    for (let i = period - 1; i < data.length; i++) {
      const sum = data
        .slice(i - period + 1, i + 1)
        .reduce((acc, candle) => acc + candle.close, 0);
      const average = sum / period;

      result.push({
        time: data[i].time,
        value: average,
      });
    }

    return result;
  }

  // Sort and deduplicate candlestick data
  static sortAndDeduplicateData(data: CandlestickData[]): CandlestickData[] {
    const uniqueData = new Map<number, CandlestickData>();
    
    data.forEach(item => {
      const timestamp = item.time as number;
      uniqueData.set(timestamp, item);
    });

    return Array.from(uniqueData.values()).sort(
      (a, b) => (a.time as number) - (b.time as number)
    );
  }

  // Merge new data with existing data
  static mergeHistoricalData(
    newData: CandlestickData[],
    existingData: CandlestickData[]
  ): CandlestickData[] {
    const existingTimestamps = new Set(
      existingData.map((item) => item.time)
    );
    
    const filteredNewData = newData.filter(
      (item) => !existingTimestamps.has(item.time)
    );

    const combined = [...filteredNewData, ...existingData];
    return this.sortAndDeduplicateData(combined);
  }

  // Validate data integrity
  static validateData(data: CandlestickData[]): boolean {
    if (data.length === 0) return true;

    const timestamps = data.map((item) => item.time as number);
    const uniqueTimestamps = new Set(timestamps);
    const isSorted = data.every(
      (item, index) =>
        index === 0 ||
        (item.time as number) > (data[index - 1].time as number)
    );

    return isSorted && timestamps.length === uniqueTimestamps.size;
  }
}

export const CHART_CONFIG = {
  layout: {
    textColor: "#d1d5db",
    background: { type: "Solid" as const, color: "#1f2937" },
  },
  grid: {
    vertLines: { color: "#374151" },
    horzLines: { color: "#374151" },
  },
  rightPriceScale: {
    borderColor: "#6b7280",
  },
  timeScale: {
    borderColor: "#6b7280",
    timeVisible: true,
    secondsVisible: false,
  },
  candlestickSeries: {
    upColor: "#4caf50",
    downColor: "#f44336",
    borderDownColor: "#f44336",
    borderUpColor: "#4caf50",
    wickDownColor: "#f44336",
    wickUpColor: "#4caf50",
  },
  movingAverages: {
    ma7: { color: "#3b82f6", lineWidth: 2, title: "MA (7)" },
    ma25: { color: "#4ecdc4", lineWidth: 2, title: "MA (25)" },
    ma99: { color: "#f59e0b", lineWidth: 2, title: "MA (99)" },
  },
} as const;
