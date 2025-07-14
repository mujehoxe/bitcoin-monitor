/**
 * Test to verify the infinite loop fix in useSentimentAnalysis hook
 */

import { useEffect, useState } from "react";
import { useSentimentAnalysis } from "../hooks/useSentimentAnalysis";

// Mock component to test the hook
function TestComponent() {
  const [currentPrice, setCurrentPrice] = useState(45000);
  const [priceHistory, setPriceHistory] = useState([44000, 44500, 45000]);

  const {
    news,
    sentimentTrend,
    prediction,
    tradingSignal,
    isLoading,
    error,
    refreshSentiment,
  } = useSentimentAnalysis(currentPrice, priceHistory);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice((prev) => prev + Math.random() * 100 - 50);
      setPriceHistory((prev) => [...prev.slice(-99), currentPrice]);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  return (
    <div>
      <h1>Sentiment Analysis Test</h1>
      <div>Current Price: ${currentPrice}</div>
      <div>Loading: {isLoading ? "Yes" : "No"}</div>
      <div>Error: {error || "None"}</div>
      <div>News Count: {news.length}</div>
      <div>
        Sentiment Score: {sentimentTrend?.overallSentiment?.toFixed(2) || "N/A"}
      </div>
      <div>Prediction: {prediction?.direction || "N/A"}</div>
      <div>Trading Signal: {tradingSignal?.action || "N/A"}</div>
      <button onClick={refreshSentiment}>Refresh Sentiment</button>
    </div>
  );
}

export default TestComponent;
