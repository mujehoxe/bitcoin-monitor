import { DynamicCoinService } from "@/services/dynamicCoinService";
import { TrendingCoin } from "@/services/cryptoAPIService";
import React, { useEffect, useState } from "react";

export const CoinServiceDebug: React.FC = () => {
  const [symbolCount, setSymbolCount] = useState<number>(0);
  const [hotCoins, setHotCoins] = useState<TrendingCoin[]>([]);
  const [stableCoins, setStableCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const testDynamicCoinService = async () => {
      try {
        const service = DynamicCoinService.getInstance();
        
        // Test symbol discovery
        const symbols = await service.getAllTradingSymbols();
        setSymbolCount(symbols.length);
        
        // Test hot coins
        const hot = await service.getHotCoins(5);
        setHotCoins(hot);
        
        // Test stable coins
        const stable = await service.getStableCoins(5);
        setStableCoins(stable);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };

    testDynamicCoinService();
  }, []);

  if (loading) {
    return (
      <div className="p-4 border rounded bg-gray-50">
        <h3 className="font-bold mb-2">Dynamic Coin Service Test</h3>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border rounded bg-red-50">
        <h3 className="font-bold mb-2 text-red-700">Dynamic Coin Service Test - Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded bg-green-50">
      <h3 className="font-bold mb-2 text-green-700">Dynamic Coin Service Test - Success</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Total Symbols:</strong> {symbolCount}</p>
        
        <div>
          <strong>Hot Coins ({hotCoins.length}):</strong>
          <ul className="ml-4 list-disc">
            {hotCoins.map((coin, idx) => (
              <li key={idx}>
                {coin.symbol}: ${coin.price?.toFixed(4)} ({coin.priceChangePercent24h?.toFixed(2)}% 24h)
              </li>
            ))}
          </ul>
        </div>

        <div>
          <strong>Stable Coins ({stableCoins.length}):</strong>
          <ul className="ml-4 list-disc">
            {stableCoins.map((coin, idx) => (
              <li key={idx}>
                {coin.symbol}: ${coin.price?.toFixed(4)} ({coin.priceChangePercent24h?.toFixed(2)}% 24h)
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
