import { Loader2 } from "lucide-react";

interface ChartLegendProps {
  isLoadingMore: boolean;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ isLoadingMore }) => {
  return (
    <div className="absolute top-2 left-2 z-10 flex gap-1 items-center bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-[#3b82f6]"></div>
          <span>MA7</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-[#4ecdc4]"></div>
          <span>MA25</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-[#f59e0b]"></div>
          <span>MA99</span>
        </div>
      </div>
      {isLoadingMore && (
        <div className="z-10 bg-background/90 backdrop-blur-sm rounded ml-1 text-xs text-muted-foreground flex items-center">
          <Loader2 className="size-3 animate-spin" />
        </div>
      )}
    </div>
  );
};

interface LoadingIndicatorProps {
  hasMoreData: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ hasMoreData }) => {
  if (hasMoreData) return null;

  return (
    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm rounded px-2 py-1">
      All available historical data loaded
    </div>
  );
};
