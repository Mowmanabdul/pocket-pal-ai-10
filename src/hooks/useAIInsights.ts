import { useState } from "react";
import { Expense, ExpenseCategory } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-insights`;

const categories: ExpenseCategory[] = [
  'food', 'transport', 'entertainment', 'shopping', 
  'utilities', 'health', 'education', 'other'
];

export function useAIInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const { toast } = useToast();
  const { currency } = useCurrency();
  const { getCategoryLabel } = useCategoryLabelsContext();

  const getInsights = async (expenses: Expense[]) => {
    if (expenses.length === 0) {
      setInsights("Add some expenses to get personalized AI insights about your spending habits!");
      return;
    }

    // Build category label mapping
    const categoryLabels: Record<string, string> = {};
    categories.forEach(cat => {
      categoryLabels[cat] = getCategoryLabel(cat);
    });

    setIsLoading(true);
    setInsights("");

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          expenses: expenses.slice(0, 50).map((e) => ({
            amount: e.amount,
            category: e.category,
            categoryLabel: getCategoryLabel(e.category),
            description: e.description,
            date: e.date,
          })),
          type: "insights",
          currency: {
            code: currency.code,
            symbol: currency.symbol,
            name: currency.name,
          },
          categoryLabels,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Rate limited",
            description: "Too many requests. Please try again later.",
            variant: "destructive",
          });
          return;
        }
        if (response.status === 402) {
          toast({
            title: "Credits exhausted",
            description: "AI credits have been used up. Please add more credits.",
            variant: "destructive",
          });
          return;
        }
        throw new Error("Failed to get insights");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let textBuffer = "";
      let insightsSoFar = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              insightsSoFar += content;
              setInsights(insightsSoFar);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error getting insights:", error);
      toast({
        title: "Error",
        description: "Failed to get AI insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { insights, isLoading, getInsights };
}
