import { useMemo } from "react";
import { Expense, ExpenseCategory } from "@/lib/types";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { Lightbulb, TrendingDown, Repeat, ShoppingBag, Utensils, Gamepad2 } from "lucide-react";
import { subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface SavingsSuggestionsProps {
  expenses: Expense[];
}

interface Suggestion {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  potential: number;
  priority: "high" | "medium" | "low";
}

export function SavingsSuggestions({ expenses }: SavingsSuggestionsProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  const suggestions = useMemo(() => {
    if (expenses.length === 0) return [];

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthExpenses = expenses.filter(e => 
      isWithinInterval(new Date(e.date), { start: thisMonthStart, end: thisMonthEnd })
    );
    const lastMonthExpenses = expenses.filter(e => 
      isWithinInterval(new Date(e.date), { start: lastMonthStart, end: lastMonthEnd })
    );

    const results: Suggestion[] = [];

    // Category totals
    const getCategoryTotal = (exps: Expense[], cat: ExpenseCategory) => 
      exps.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0);

    // Check entertainment spending
    const entertainmentThis = getCategoryTotal(thisMonthExpenses, "entertainment");
    const entertainmentLast = getCategoryTotal(lastMonthExpenses, "entertainment");
    if (entertainmentThis > entertainmentLast * 1.2 && entertainmentThis > 50) {
      results.push({
        icon: Gamepad2,
        title: "Entertainment spike detected",
        description: `Consider free alternatives for entertainment this week`,
        potential: entertainmentThis * 0.3,
        priority: "medium",
      });
    }

    // Check food spending pattern
    const foodThis = getCategoryTotal(thisMonthExpenses, "food");
    if (foodThis > 300) {
      const avgPerMeal = foodThis / Math.max(thisMonthExpenses.filter(e => e.category === "food").length, 1);
      if (avgPerMeal > 20) {
        results.push({
          icon: Utensils,
          title: "High dining average",
          description: `Your avg meal costs ${formatCurrency(avgPerMeal, currency)}. Cooking at home could save money`,
          potential: foodThis * 0.25,
          priority: "high",
        });
      }
    }

    // Check shopping frequency
    const shoppingExpenses = thisMonthExpenses.filter(e => e.category === "shopping");
    if (shoppingExpenses.length > 8) {
      const shoppingTotal = shoppingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      results.push({
        icon: ShoppingBag,
        title: "Frequent shopping trips",
        description: `${shoppingExpenses.length} shopping trips this month. Try consolidating purchases`,
        potential: shoppingTotal * 0.15,
        priority: "medium",
      });
    }

    // Check for small recurring expenses
    const smallExpenses = thisMonthExpenses.filter(e => Number(e.amount) < 15 && Number(e.amount) > 0);
    if (smallExpenses.length > 10) {
      const smallTotal = smallExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      results.push({
        icon: Repeat,
        title: "Small purchases add up",
        description: `${smallExpenses.length} purchases under ${formatCurrency(15, currency)} totaling ${formatCurrency(smallTotal, currency)}`,
        potential: smallTotal * 0.4,
        priority: "low",
      });
    }

    // General saving tip if spending increased
    const thisTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const lastTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    if (thisTotal > lastTotal * 1.15 && lastTotal > 0) {
      results.push({
        icon: TrendingDown,
        title: "Spending up this month",
        description: `You're spending ${((thisTotal / lastTotal - 1) * 100).toFixed(0)}% more than last month`,
        potential: thisTotal - lastTotal,
        priority: "high",
      });
    }

    return results.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }).slice(0, 3);
  }, [expenses, currency]);

  if (suggestions.length === 0) {
    return null;
  }

  const priorityColors = {
    high: "border-l-orange-500 bg-orange-500/5",
    medium: "border-l-yellow-500 bg-yellow-500/5",
    low: "border-l-blue-500 bg-blue-500/5",
  };

  return (
    <div className="glass-card-elevated p-3 md:p-4 space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        Smart Savings Tips
      </h3>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <div 
              key={index}
              className={`p-2.5 rounded-lg border-l-2 ${priorityColors[suggestion.priority]}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-secondary/50 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-foreground">{suggestion.title}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                  <p className="text-[10px] text-success font-medium mt-1">
                    Potential savings: {formatCurrency(suggestion.potential, currency)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
