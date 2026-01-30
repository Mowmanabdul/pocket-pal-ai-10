import { useMemo } from "react";
import { Expense } from "@/lib/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { Crown, Medal, Award } from "lucide-react";
import { format } from "date-fns";

interface TopExpensesProps {
  expenses: Expense[];
}

export function TopExpenses({ expenses }: TopExpensesProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  const topExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);
  }, [expenses]);

  if (topExpenses.length === 0) {
    return null;
  }

  const rankIcons = [Crown, Medal, Award];
  const rankColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];

  return (
    <div className="glass-card-elevated p-3 md:p-4 space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Crown className="w-4 h-4 text-yellow-500" />
        Top Expenses
      </h3>

      <div className="space-y-2">
        {topExpenses.map((expense, index) => {
          const config = getCategoryConfig(expense.category);
          const RankIcon = rankIcons[index] || null;
          const rankColor = rankColors[index] || "text-muted-foreground";
          
          return (
            <div 
              key={expense.id} 
              className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {RankIcon ? (
                  <RankIcon className={`w-4 h-4 ${rankColor}`} />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                )}
              </div>
              
              <div 
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: config.color }}
              />
              
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-foreground truncate">
                  {expense.description || config.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(expense.date), "MMM d")} • {config.label}
                </p>
              </div>
              
              <p className="text-sm md:text-base font-bold text-foreground shrink-0">
                {formatCurrency(Number(expense.amount), currency)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
