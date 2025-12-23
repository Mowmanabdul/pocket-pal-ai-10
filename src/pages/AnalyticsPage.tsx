import { useExpenses } from "@/hooks/useExpenses";
import { SpendingChart } from "@/components/SpendingChart";
import { SpendingTrends } from "@/components/SpendingTrends";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { ExpenseCategory, categoryConfig } from "@/lib/types";
import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns";
import { TrendingUp, PieChart, BarChart3, Layers } from "lucide-react";
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
  const { getCategoryConfig } = useCategoryLabelsContext();

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
      .map(([category, amount]) => {
        const config = getCategoryConfig(category as ExpenseCategory);
        return {
          category: category as ExpenseCategory,
          amount,
          ...config,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, getCategoryConfig]);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgPerExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Deep dive into your spending</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Spent", value: formatCurrency(totalSpent, currency), icon: Layers },
          { label: "Transactions", value: expenses.length.toString(), icon: BarChart3 },
          { label: "Avg per Expense", value: formatCurrency(avgPerExpense, currency), icon: PieChart },
          { label: "Categories", value: categoryBreakdown.length.toString(), icon: TrendingUp },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card-elevated p-4 md:p-5 animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Monthly Bar Chart */}
        <div className="glass-card-elevated p-5 md:p-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-foreground mb-4">Monthly Spending</h2>
          <div className="h-[280px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${currency.symbol}${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: number) => [formatCurrency(value, currency), "Spent"]}
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="glass-card-elevated p-5 md:p-6 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <h2 className="text-foreground mb-4">By Category</h2>
          <SpendingChart expenses={expenses} />
        </div>
      </div>

      {/* 30-Day Trend */}
      <div className="glass-card-elevated p-5 md:p-6 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <h2 className="text-foreground mb-4">30-Day Trend</h2>
        <SpendingTrends expenses={expenses} />
      </div>

      {/* Category Breakdown */}
      <div className="glass-card-elevated p-5 md:p-6 animate-fade-in" style={{ animationDelay: "350ms" }}>
        <h2 className="text-foreground mb-5">Category Breakdown</h2>
        {categoryBreakdown.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Add expenses to see breakdown</p>
        ) : (
          <div className="space-y-4">
            {categoryBreakdown.map((item, index) => {
              const percentage = totalSpent > 0 ? (item.amount / totalSpent) * 100 : 0;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-foreground">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
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
        )}
      </div>
    </div>
  );
}
