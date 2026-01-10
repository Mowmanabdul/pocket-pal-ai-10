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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 min-w-0">
      {/* Total Spending */}
      <div className="stat-card min-w-0">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">This Month</p>
            <p className="text-lg md:text-2xl font-bold text-foreground mt-1 truncate tracking-tight">
              {formatCurrency(stats.thisMonthTotal, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Total spending</p>
          </div>
          <div className="icon-container w-9 h-9 md:w-10 md:h-10 shrink-0">
            <Wallet className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="stat-card min-w-0">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">vs Last Month</p>
            <div className="flex items-center gap-1.5 mt-1">
              <p className={`text-lg md:text-2xl font-bold tracking-tight ${stats.percentChange <= 0 ? "text-success" : "text-warning"}`}>
                {stats.percentChange >= 0 ? "+" : ""}{stats.percentChange.toFixed(0)}%
              </p>
              {stats.percentChange <= 0 ? (
                <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5 text-success shrink-0" />
              ) : (
                <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-warning shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">
              {stats.percentChange <= 0 ? "You're saving!" : "Spending more"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Average */}
      <div className="stat-card min-w-0">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Daily Avg</p>
            <p className="text-lg md:text-2xl font-bold text-foreground mt-1 truncate tracking-tight">
              {formatCurrency(stats.avgDaily, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 font-medium">Per day</p>
          </div>
          <div className="icon-container w-9 h-9 md:w-10 md:h-10 shrink-0" style={{ background: `linear-gradient(135deg, hsl(var(--chart-2) / 0.1), hsl(var(--chart-2) / 0.05))` }}>
            <Target className="w-4 h-4 md:w-5 md:h-5 text-chart-2" />
          </div>
        </div>
      </div>

      {/* Top Category */}
      <div className="stat-card min-w-0">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Top Category</p>
            {stats.topCategory ? (
              <>
                <div className="flex items-center gap-2 mt-1 min-w-0">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card"
                    style={{ backgroundColor: getCategoryConfig(stats.topCategory.category).color, boxShadow: `0 0 8px ${getCategoryConfig(stats.topCategory.category).color}40` }}
                  />
                  <span className="text-sm font-bold text-foreground truncate">
                    {getCategoryConfig(stats.topCategory.category).label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 truncate font-medium">
                  {formatCurrency(stats.topCategory.amount, currency)}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-muted-foreground mt-1">No data</p>
            )}
          </div>
          <div className="icon-container w-9 h-9 md:w-10 md:h-10 shrink-0" style={{ background: `linear-gradient(135deg, hsl(var(--chart-3) / 0.1), hsl(var(--chart-3) / 0.05))` }}>
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-chart-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
