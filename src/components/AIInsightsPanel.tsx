import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Expense } from "@/lib/types";
import { useAIInsights } from "@/hooks/useAIInsights";
import ReactMarkdown from "react-markdown";

interface AIInsightsPanelProps {
  expenses: Expense[];
}

export function AIInsightsPanel({ expenses }: AIInsightsPanelProps) {
  const { insights, isLoading, getInsights } = useAIInsights();

  useEffect(() => {
    if (expenses.length > 0 && !insights) {
      getInsights(expenses);
    }
  }, [expenses.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Personalized analysis</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => getInsights(expenses)}
          disabled={isLoading}
          className="rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="min-h-[250px] p-5 rounded-xl bg-secondary/50">
        {isLoading && !insights ? (
          <div className="flex flex-col items-center justify-center h-[200px] gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm">Analyzing your spending patterns...</p>
          </div>
        ) : insights ? (
          <div className="ai-markdown">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[200px] gap-3">
            <p className="text-muted-foreground">Click refresh to generate insights</p>
          </div>
        )}
      </div>
    </div>
  );
}
