import { Expense, categoryConfig, ExpenseCategory } from "@/lib/types";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Wallet } from "lucide-react";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";

interface StatsCardsProps {
  expenses: Expense[];
}

export function StatsCards({ expenses }: StatsCardsProps) {
  const { currency } = useCurrency();

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

    // Top category
    const categoryTotals = thisMonthExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0];

    // Average daily spending
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

  const cards = [
    {
      title: "This Month",
      value: formatCurrency(stats.thisMonthTotal, currency),
      icon: Wallet,
      description: "Total spending",
      gradient: "from-primary/20 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "vs Last Month",
      value: `${stats.percentChange >= 0 ? "+" : ""}${stats.percentChange.toFixed(1)}%`,
      icon: stats.percentChange >= 0 ? TrendingUp : TrendingDown,
      description: stats.percentChange >= 0 ? "Spending increased" : "Spending decreased",
      gradient: stats.percentChange >= 0 ? "from-warning/20 to-warning/5" : "from-success/20 to-success/5",
      iconBg: stats.percentChange >= 0 ? "bg-warning/10" : "bg-success/10",
      iconColor: stats.percentChange >= 0 ? "text-warning" : "text-success",
    },
    {
      title: "Daily Average",
      value: formatCurrency(stats.avgDaily, currency),
      icon: Target,
      description: "Per day this month",
      gradient: "from-chart-2/20 to-chart-2/5",
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
    {
      title: "Top Category",
      value: stats.topCategory
        ? categoryConfig[stats.topCategory.category].icon
        : "—",
      icon: () => null,
      description: stats.topCategory
        ? `${categoryConfig[stats.topCategory.category].label}`
        : "No expenses yet",
      gradient: "from-chart-3/20 to-chart-3/5",
      iconBg: "",
      iconColor: "",
      extraValue: stats.topCategory ? formatCurrency(stats.topCategory.amount, currency) : "",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className={`glass-card rounded-xl p-5 animate-fade-in bg-gradient-to-br ${card.gradient}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
              <p className="text-2xl font-display font-bold text-foreground">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
              {card.extraValue && (
                <p className="text-sm font-medium text-foreground">{card.extraValue}</p>
              )}
            </div>
            {card.icon !== (() => null) && card.iconBg && (
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
