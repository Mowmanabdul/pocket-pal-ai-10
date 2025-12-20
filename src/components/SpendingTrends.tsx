import { Expense } from "@/lib/types";
import { useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

interface SpendingTrendsProps {
  expenses: Expense[];
}

export function SpendingTrends({ expenses }: SpendingTrendsProps) {
  const { currency } = useCurrency();

  const chartData = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    
    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayTotal = expenses
        .filter((e) => startOfDay(new Date(e.date)).getTime() === dayStart.getTime())
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      return {
        date: format(day, "MMM d"),
        amount: dayTotal,
      };
    });
  }, [expenses]);

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 100);

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${currency.symbol}${value}`}
            domain={[0, maxAmount]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [
              `${currency.symbol}${value.toFixed(2)}`,
              "Spent",
            ]}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
