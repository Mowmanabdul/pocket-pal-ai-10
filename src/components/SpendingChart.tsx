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
      <div className="h-[180px] md:h-[300px] flex flex-col items-center justify-center text-muted-foreground">
        <div className="w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center border border-border/50">
          <span className="text-2xl">📊</span>
        </div>
        <p className="font-semibold text-sm text-foreground">No data yet</p>
        <p className="text-xs mt-1">Add expenses to see breakdown</p>
      </div>
    );
  }

  return (
    <div className="h-[220px] md:h-[300px] flex flex-col md:flex-row">
      <div className="flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
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
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap md:flex-col justify-center gap-2 md:gap-2.5 md:w-[130px] px-2 md:px-0">
        {chartData.slice(0, 5).map((item) => (
          <div key={item.name} className="flex items-center gap-2 px-2 py-1 rounded-lg bg-secondary/30">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] md:text-xs font-medium text-foreground truncate max-w-[70px] md:max-w-[90px]">
              {item.name}
            </span>
          </div>
        ))}
        {chartData.length > 5 && (
          <span className="text-[10px] md:text-xs text-muted-foreground px-2">
            +{chartData.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}
