import { useSentimentAnalysis } from "@/hooks/useSentimentAnalysis";

interface AnalysisProps {
  currentPrice?: number;
  priceHistory?: number[];
}

export const Analysis = ({ currentPrice = 0, priceHistory = [] }: AnalysisProps) => {
  const { sentimentTrend, isLoading } = useSentimentAnalysis(currentPrice, priceHistory);

  if (isLoading) {
    return <div>Loading sentiment analysis...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Market Sentiment Analysis</h2>
      {sentimentTrend && (
        <div>
          <p>Overall Sentiment: {sentimentTrend.overallSentiment?.toFixed(2) || "N/A"}</p>
          {/* Add more sentiment display logic here */}
        </div>
      )}
    </div>
  );
};
