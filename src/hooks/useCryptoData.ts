import { useCallback, useEffect, useState } from "react";
import {
  CoinListResponse,
  CryptoAPIService,
  SupportedCurrency,
} from "../services/cryptoAPIService";

interface UseCryptoDataReturn {
  selectedSymbol: string;
  selectedCurrency: SupportedCurrency;
  trendingData: CoinListResponse;
  isLoadingTrending: boolean;
  error: string | null;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  refreshTrendingData: () => Promise<void>;
}

export const useCryptoData = (
  initialSymbol: string = "BTCUSDT"
): UseCryptoDataReturn => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol);
  const [selectedCurrency, setSelectedCurrency] =
    useState<SupportedCurrency>("USDT");
  const [trendingData, setTrendingData] = useState<CoinListResponse>({
    hot: [],
    stable: [],
    all: [],
  });
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trending coins data
  const refreshTrendingData = useCallback(async () => {
    try {
      console.log("useCryptoData: Starting refreshTrendingData...");
      setIsLoadingTrending(true);
      setError(null);

      const data = await CryptoAPIService.fetchTrendingCoins();
      console.log("useCryptoData: Received trending data:", {
        hot: data.hot.length,
        stable: data.stable.length,
        all: data.all.length,
      });

      setTrendingData(data);
    } catch (err) {
      console.error("useCryptoData: Failed to fetch trending data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch trending data"
      );
    } finally {
      setIsLoadingTrending(false);
    }
  }, []);

  // Convert symbol to include selected currency
  const getSymbolWithCurrency = useCallback(
    (baseSymbol: string) => {
      // Remove existing currency suffix if present
      const cleanSymbol = baseSymbol.replace(/(USDT|USD|EUR|GBP|JPY)$/, "");
      return `${cleanSymbol}${selectedCurrency}`;
    },
    [selectedCurrency]
  );

  // Handle symbol selection with currency conversion
  const handleSetSelectedSymbol = useCallback(
    (symbol: string) => {
      const symbolWithCurrency = getSymbolWithCurrency(symbol);
      setSelectedSymbol(symbolWithCurrency);
    },
    [getSymbolWithCurrency]
  );

  // Handle currency change - update current symbol
  const handleSetSelectedCurrency = useCallback(
    (currency: SupportedCurrency) => {
      setSelectedCurrency(currency);
      // Update current symbol with new currency
      const currentBase = selectedSymbol.replace(/(USDT|USD|EUR|GBP|JPY)$/, "");
      setSelectedSymbol(`${currentBase}${currency}`);
    },
    [selectedSymbol]
  );

  // Initial load and periodic refresh
  useEffect(() => {
    refreshTrendingData();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      refreshTrendingData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshTrendingData]);

  return {
    selectedSymbol,
    selectedCurrency,
    trendingData,
    isLoadingTrending,
    error,
    setSelectedSymbol: handleSetSelectedSymbol,
    setSelectedCurrency: handleSetSelectedCurrency,
    refreshTrendingData,
  };
};
