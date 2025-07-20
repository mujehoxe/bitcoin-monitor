import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading Bitcoin data...",
}) => {
  return (
    <div className="w-full mx-auto p-2">
      <Card className="h-[calc(100vh-1rem)]">
        <CardContent className="p-2 h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="w-full mx-auto p-2">
      <Card className="h-[calc(100vh-1rem)]">
        <CardContent className="p-2 h-full">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
