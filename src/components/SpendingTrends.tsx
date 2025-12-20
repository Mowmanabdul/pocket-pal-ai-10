import { Expense } from "@/lib/types";
import { useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
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
        shortDate: format(day, "d"),
        amount: dayTotal,
      };
    });
  }, [expenses]);

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 100);

  if (expenses.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <p className="text-muted-foreground">Add expenses to see trends</p>
      </div>
    );
  }

  return (
    <div className="h-[280px] -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="shortDate"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickMargin={8}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value === 0 ? "0" : `${currency.symbol}${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
            domain={[0, maxAmount]}
            width={45}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ""}
            formatter={(value: number) => [
              `${currency.symbol}${value.toFixed(2)}`,
              "Spent",
            ]}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorAmount)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
