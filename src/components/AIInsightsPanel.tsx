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
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">AI Insights</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => getInsights(expenses)}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="min-h-[200px] p-4 rounded-lg bg-secondary/50">
        {isLoading && !insights ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft" />
            <span>Analyzing your spending patterns...</span>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
            <ReactMarkdown>{insights || "Click refresh to get AI insights about your spending."}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
