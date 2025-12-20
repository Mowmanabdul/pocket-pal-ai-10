import { Expense, categoryConfig, ExpenseCategory } from "@/lib/types";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";

interface StatsCardsProps {
  expenses: Expense[];
}

export function StatsCards({ expenses }: StatsCardsProps) {
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

    return {
      thisMonthTotal,
      lastMonthTotal,
      percentChange,
      transactionCount: thisMonthExpenses.length,
      topCategory: topCategory ? {
        category: topCategory[0] as ExpenseCategory,
        amount: topCategory[1],
      } : null,
    };
  }, [expenses]);

  const cards = [
    {
      title: "This Month",
      value: `$${stats.thisMonthTotal.toFixed(2)}`,
      icon: DollarSign,
      description: "Total spending",
      color: "primary",
    },
    {
      title: "vs Last Month",
      value: `${stats.percentChange >= 0 ? "+" : ""}${stats.percentChange.toFixed(1)}%`,
      icon: stats.percentChange >= 0 ? TrendingUp : TrendingDown,
      description: stats.percentChange >= 0 ? "Spending increased" : "Spending decreased",
      color: stats.percentChange >= 0 ? "warning" : "success",
    },
    {
      title: "Transactions",
      value: stats.transactionCount.toString(),
      icon: Calendar,
      description: "This month",
      color: "chart-2",
    },
    {
      title: "Top Category",
      value: stats.topCategory
        ? categoryConfig[stats.topCategory.category].icon
        : "—",
      icon: () => null,
      description: stats.topCategory
        ? `${categoryConfig[stats.topCategory.category].label}: $${stats.topCategory.amount.toFixed(2)}`
        : "No expenses yet",
      color: "chart-3",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
          className="glass-card rounded-xl p-5 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-2xl font-display font-bold text-foreground mt-1">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </div>
            {card.icon !== (() => null) && (
              <div className="p-2 rounded-lg bg-primary/10">
                <card.icon className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
