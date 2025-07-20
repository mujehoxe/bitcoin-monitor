import { useCallback, useEffect, useState } from "react";
import { TrendingCoin, SupportedCurrency } from "../services/cryptoAPIService";
import { DynamicCoinService } from "../services/dynamicCoinService";

interface EnhancedCoinListResponse {
  hot: TrendingCoin[];
  stable: TrendingCoin[];
  all: TrendingCoin[];
}

interface UseEnhancedCryptoDataReturn {
  selectedSymbol: string;
  selectedCurrency: SupportedCurrency;
  trendingData: EnhancedCoinListResponse;
  isLoadingTrending: boolean;
  isLoadingHot: boolean;
  isLoadingStable: boolean;
  error: string | null;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedCurrency: (currency: SupportedCurrency) => void;
  refreshTrendingData: () => Promise<void>;
  refreshHotCoins: () => Promise<void>;
  refreshStableCoins: () => Promise<void>;
  getAllAvailableSymbols: () => Promise<string[]>;
  clearCache: () => void;
}

export const useEnhancedCryptoData = (
  initialSymbol: string = "BTCUSDT"
): UseEnhancedCryptoDataReturn => {
  // Validate and sanitize the initial symbol
  const validateSymbol = (symbol: string): string => {
    const symbolUpper = symbol.toUpperCase();
    
    // Check if symbol is valid format
    if (!symbolUpper.endsWith('USDT') || 
        symbolUpper.includes('USDC') || 
        symbolUpper.includes('BUSD') ||
        symbolUpper.includes('DAI') ||
        symbolUpper.includes('UP') ||
        symbolUpper.includes('DOWN') ||
        symbolUpper.includes('BULL') ||
        symbolUpper.includes('BEAR')) {
      console.warn(`Invalid symbol ${symbol}, using BTCUSDT instead`);
      return "BTCUSDT";
    }
    
    return symbolUpper;
  };
  
  const [selectedSymbol, setSelectedSymbolState] = useState<string>(validateSymbol(initialSymbol));
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>("USDT");
  
  // Wrapper to validate symbols when setting
  const setSelectedSymbol = useCallback((symbol: string) => {
    const validSymbol = validateSymbol(symbol);
    console.log(`Setting selected symbol: ${symbol} -> ${validSymbol}`);
    setSelectedSymbolState(validSymbol);
  }, []);
  const [trendingData, setTrendingData] = useState<EnhancedCoinListResponse>({
    hot: [],
    stable: [],
    all: [],
  });
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  const [isLoadingHot, setIsLoadingHot] = useState(false);
  const [isLoadingStable, setIsLoadingStable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get instance of dynamic coin service
  const coinService = DynamicCoinService.getInstance();

  // Refresh hot coins with 5-minute acceleration data
  const refreshHotCoins = useCallback(async () => {
    try {
      console.log("Refreshing hot coins...");
      setIsLoadingHot(true);
      setError(null);

      const hotCoins = await coinService.getHotCoins(15);
      console.log(`Loaded ${hotCoins.length} hot coins`);

      setTrendingData(prev => ({
        ...prev,
        hot: hotCoins,
      }));
    } catch (err) {
      console.error("Failed to refresh hot coins:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch hot coins");
    } finally {
      setIsLoadingHot(false);
    }
  }, [coinService]);

  // Refresh stable coins with 24hr performance data
  const refreshStableCoins = useCallback(async () => {
    try {
      console.log("Refreshing stable coins...");
      setIsLoadingStable(true);
      setError(null);

      const stableCoins = await coinService.getStableCoins(15);
      console.log(`Loaded ${stableCoins.length} stable coins`);

      setTrendingData(prev => ({
        ...prev,
        stable: stableCoins,
      }));
    } catch (err) {
      console.error("Failed to refresh stable coins:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stable coins");
    } finally {
      setIsLoadingStable(false);
    }
  }, [coinService]);

  // Refresh both hot and stable coins
  const refreshTrendingData = useCallback(async () => {
    try {
      console.log("Enhanced refreshTrendingData: Starting parallel fetch...");
      setIsLoadingTrending(true);
      setError(null);

      // Fetch hot and stable coins in parallel
      const [hotCoins, stableCoins] = await Promise.all([
        coinService.getHotCoins(15),
        coinService.getStableCoins(15),
      ]);

      // Combine all tracked coins
      const allCoins = coinService.getAllTrackedCoins();

      console.log("Enhanced data loaded:", {
        hot: hotCoins.length,
        stable: stableCoins.length,
        all: allCoins.length,
      });

      setTrendingData({
        hot: hotCoins,
        stable: stableCoins,
        all: allCoins,
      });
    } catch (err) {
      console.error("Enhanced refreshTrendingData failed:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch trending data");
    } finally {
      setIsLoadingTrending(false);
    }
  }, [coinService]);

  // Get all available trading symbols
  const getAllAvailableSymbols = useCallback(async (): Promise<string[]> => {
    return await coinService.getAllTradingSymbols();
  }, [coinService]);

  // Clear cache for manual refresh
  const clearCache = useCallback(() => {
    coinService.clearCache();
  }, [coinService]);

  // Handle currency change - update current symbol
  const handleSetSelectedCurrency = useCallback(
    (currency: SupportedCurrency) => {
      setSelectedCurrency(currency);
      // Update current symbol with new currency
      const currentBase = selectedSymbol.replace(/(USDT|USD|EUR|GBP|JPY)$/, "");
      const newSymbol = `${currentBase}${currency}`;
      setSelectedSymbol(newSymbol);
    },
    [selectedSymbol, setSelectedSymbol]
  );

  // Set up polling for hot coins (every 5 minutes)
  useEffect(() => {
    refreshHotCoins(); // Initial load

    const hotCoinsInterval = setInterval(() => {
      console.log("Auto-refreshing hot coins (5min interval)");
      refreshHotCoins();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(hotCoinsInterval);
  }, [refreshHotCoins]);

  // Set up polling for stable coins (every 15 minutes)
  useEffect(() => {
    refreshStableCoins(); // Initial load

    const stableCoinsInterval = setInterval(() => {
      console.log("Auto-refreshing stable coins (15min interval)");
      refreshStableCoins();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(stableCoinsInterval);
  }, [refreshStableCoins]);

  // Initial load of all data
  useEffect(() => {
    refreshTrendingData();
  }, [refreshTrendingData]);

  return {
    selectedSymbol,
    selectedCurrency,
    trendingData,
    isLoadingTrending,
    isLoadingHot,
    isLoadingStable,
    error,
    setSelectedSymbol: setSelectedSymbol,
    setSelectedCurrency: handleSetSelectedCurrency,
    refreshTrendingData,
    refreshHotCoins,
    refreshStableCoins,
    getAllAvailableSymbols,
    clearCache,
  };
};
