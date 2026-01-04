import { Expense, ExpenseCategory } from "@/lib/types";
import { TrendingUp, TrendingDown, Wallet, Target, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";

interface StatsCardsProps {
  expenses: Expense[];
}

export function StatsCards({ expenses }: StatsCardsProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const thisMonthExpenses = expenses.filter((e) =>
      isWithinInterval(new Date(e.date), { start: thisMonthStart, end: thisMonthEnd })
    );
    const lastMonthExpenses = expenses.filter((e) =>
      isWithinInterval(new Date(e.date), { start: lastMonthStart, end: lastMonthEnd })
    );

    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const percentChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    const categoryTotals = thisMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];

    const daysInMonth = new Date().getDate();
    const avgDaily = daysInMonth > 0 ? thisMonthTotal / daysInMonth : 0;

    return {
      thisMonthTotal,
      lastMonthTotal,
      percentChange,
      transactionCount: thisMonthExpenses.length,
      topCategory: topCategory ? {
        category: topCategory[0] as ExpenseCategory,
        amount: topCategory[1],
      } : null,
      avgDaily,
    };
  }, [expenses]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 min-w-0">
      {/* Total Spending */}
      <div className="glass-card-elevated p-3 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="text-base md:text-xl font-bold text-foreground mt-0.5 truncate">
              {formatCurrency(stats.thisMonthTotal, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Total spending</p>
          </div>
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="glass-card-elevated p-3 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">vs Last Month</p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className={`text-base md:text-xl font-bold ${stats.percentChange <= 0 ? "text-success" : "text-warning"}`}>
                {stats.percentChange >= 0 ? "+" : ""}{stats.percentChange.toFixed(0)}%
              </p>
              {stats.percentChange <= 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-success shrink-0" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-warning shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {stats.percentChange <= 0 ? "You're saving!" : "Spending more"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Average */}
      <div className="glass-card-elevated p-3 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Daily Avg</p>
            <p className="text-base md:text-xl font-bold text-foreground mt-0.5 truncate">
              {formatCurrency(stats.avgDaily, currency)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Per day</p>
          </div>
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
            <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-chart-2" />
          </div>
        </div>
      </div>

      {/* Top Category */}
      <div className="glass-card-elevated p-3 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Top Category</p>
            {stats.topCategory ? (
              <>
                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryConfig(stats.topCategory.category).color }}
                  />
                  <span className="text-sm font-semibold text-foreground truncate">
                    {getCategoryConfig(stats.topCategory.category).label}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {formatCurrency(stats.topCategory.amount, currency)}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-muted-foreground mt-0.5">No data</p>
            )}
          </div>
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-chart-3/10 flex items-center justify-center shrink-0">
            <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-chart-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
