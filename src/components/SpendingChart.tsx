import { Expense, ExpenseCategory } from "@/lib/types";
import { useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SpendingChartProps {
  expenses: Expense[];
}

export function SpendingChart({ expenses }: SpendingChartProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  const chartData = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => {
        const config = getCategoryConfig(category as ExpenseCategory);
        return {
          name: config.label,
          value: amount,
          color: config.color,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses, getCategoryConfig]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-16 h-16 mb-4 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-3xl">📈</span>
        </div>
        <p className="font-medium">No data yet</p>
        <p className="text-sm">Add expenses to see your spending breakdown</p>
      </div>
    );
  }

  return (
    <div className="h-[300px] flex">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                `${currency.symbol}${value.toFixed(2)}`,
                "Amount",
              ]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-[140px] flex flex-col justify-center space-y-2">
        {chartData.slice(0, 5).map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground truncate">
              {item.name}
            </span>
          </div>
        ))}
        {chartData.length > 5 && (
          <span className="text-xs text-muted-foreground">
            +{chartData.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}
