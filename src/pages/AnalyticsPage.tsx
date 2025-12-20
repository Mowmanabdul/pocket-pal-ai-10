import { useExpenses } from "@/hooks/useExpenses";
import { SpendingChart } from "@/components/SpendingChart";
import { SpendingTrends } from "@/components/SpendingTrends";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { categoryConfig, ExpenseCategory } from "@/lib/types";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function AnalyticsPage() {
  const { expenses } = useExpenses();
  const { currency } = useCurrency();

  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthExpenses = expenses.filter((e) =>
        isWithinInterval(new Date(e.date), { start, end })
      );

      const total = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      months.push({
        month: format(date, "MMM"),
        amount: total,
      });
    }
    return months;
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<ExpenseCategory, number> = {} as any;
    expenses.forEach((e) => {
      breakdown[e.category] = (breakdown[e.category] || 0) + Number(e.amount);
    });

    return Object.entries(breakdown)
      .map(([category, amount]) => ({
        category: category as ExpenseCategory,
        amount,
        ...categoryConfig[category as ExpenseCategory],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgPerExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your spending patterns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">
            {formatCurrency(totalSpent, currency)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">
            {expenses.length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Avg per Expense</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">
            {formatCurrency(avgPerExpense, currency)}
          </p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Categories Used</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">
            {categoryBreakdown.length}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Monthly Spending (Last 6 Months)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${currency.symbol}${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value, currency), "Spent"]}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Category Distribution
          </h2>
          <SpendingChart expenses={expenses} />
        </div>
      </div>

      {/* 30-Day Trend */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-semibold text-foreground mb-4">
          30-Day Spending Trend
        </h2>
        <SpendingTrends expenses={expenses} />
      </div>

      {/* Category Breakdown Table */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-semibold text-foreground mb-4">
          Category Breakdown
        </h2>
        <div className="space-y-3">
          {categoryBreakdown.map((item, index) => {
            const percentage = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
            return (
              <div key={item.category} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(item.amount, currency)}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
