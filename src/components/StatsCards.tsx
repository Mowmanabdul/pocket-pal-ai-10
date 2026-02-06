import { Expense, ExpenseCategory } from "@/lib/types";
import { ArrowUpRight, ArrowDownRight, Wallet, Target, Zap } from "lucide-react";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { Card, CardContent } from "@/components/ui/card";

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

  const cards = [
    {
      label: "This Month",
      value: formatCurrency(stats.thisMonthTotal, currency),
      subtitle: "Total spending",
      icon: Wallet,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      label: "vs Last Month",
      value: `${stats.percentChange >= 0 ? "+" : ""}${stats.percentChange.toFixed(0)}%`,
      subtitle: stats.percentChange <= 0 ? "You're saving!" : "Spending more",
      valueColor: stats.percentChange <= 0 ? "text-success" : "text-warning",
      badge: stats.percentChange <= 0 ? (
        <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
          <ArrowDownRight className="w-3 h-3 text-success" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-warning/10 flex items-center justify-center">
          <ArrowUpRight className="w-3 h-3 text-warning" />
        </div>
      ),
    },
    {
      label: "Daily Avg",
      value: formatCurrency(stats.avgDaily, currency),
      subtitle: "Per day this month",
      icon: Target,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
    {
      label: "Top Category",
      value: stats.topCategory ? getCategoryConfig(stats.topCategory.category).label : "—",
      subtitle: stats.topCategory ? `${formatCurrency(stats.topCategory.amount, currency)} spent` : "No data yet",
      icon: Zap,
      iconBg: "bg-chart-3/10",
      iconColor: "text-chart-3",
      categoryDot: stats.topCategory ? getCategoryConfig(stats.topCategory.category).color : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => (
        <Card key={index} className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </p>
                <div className="flex items-center gap-1.5">
                  {card.categoryDot && (
                    <span 
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: card.categoryDot }}
                    />
                  )}
                  <p className={`text-lg md:text-xl font-bold truncate tracking-tight ${card.valueColor || 'text-foreground'}`}>
                    {card.value}
                  </p>
                  {card.badge}
                </div>
                <p className="text-[10px] text-muted-foreground font-medium truncate">
                  {card.subtitle}
                </p>
              </div>
              {card.icon && (
                <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
