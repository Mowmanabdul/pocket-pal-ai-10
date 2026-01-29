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
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="text-xl md:text-2xl font-extrabold text-foreground mt-1.5 truncate tracking-tight">
              {formatCurrency(stats.thisMonthTotal, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Total spending</p>
          </div>
          <div className="icon-container w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-xl">
            <Wallet className="w-4.5 h-4.5 md:w-5 md:h-5 text-primary" />
          </div>
        </div>
      </div>

      {/* Comparison */}
      <div className="stat-card min-w-0">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">vs Last Month</p>
            <div className="flex items-center gap-2 mt-1.5">
              <p className={`text-xl md:text-2xl font-extrabold tracking-tight ${stats.percentChange <= 0 ? "text-success" : "text-warning"}`}>
                {stats.percentChange >= 0 ? "+" : ""}{stats.percentChange.toFixed(0)}%
              </p>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${stats.percentChange <= 0 ? "bg-success/10" : "bg-warning/10"}`}>
                {stats.percentChange <= 0 ? (
                  <ArrowDownRight className="w-3.5 h-3.5 text-success" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-warning" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
              {stats.percentChange <= 0 ? "You're saving!" : "Spending more"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Average */}
      <div className="stat-card min-w-0">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Daily Avg</p>
            <p className="text-xl md:text-2xl font-extrabold text-foreground mt-1.5 truncate tracking-tight">
              {formatCurrency(stats.avgDaily, currency)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Per day this month</p>
          </div>
          <div className="icon-container w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, hsl(var(--chart-2) / 0.1), hsl(var(--chart-2) / 0.05))` }}>
            <Target className="w-4.5 h-4.5 md:w-5 md:h-5 text-chart-2" />
          </div>
        </div>
      </div>

      {/* Top Category */}
      <div className="stat-card min-w-0">
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Top Category</p>
            {stats.topCategory ? (
              <>
                <div className="flex items-center gap-2 mt-1.5 min-w-0">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${getCategoryConfig(stats.topCategory.category).color}15` }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCategoryConfig(stats.topCategory.category).color }}
                    />
                  </div>
                  <span className="text-sm font-bold text-foreground truncate">
                    {getCategoryConfig(stats.topCategory.category).label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 truncate font-medium">
                  {formatCurrency(stats.topCategory.amount, currency)} spent
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-muted-foreground mt-1.5">No data yet</p>
            )}
          </div>
          <div className="icon-container w-10 h-10 md:w-11 md:h-11 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, hsl(var(--chart-3) / 0.1), hsl(var(--chart-3) / 0.05))` }}>
            <Zap className="w-4.5 h-4.5 md:w-5 md:h-5 text-chart-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
