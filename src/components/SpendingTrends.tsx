import { Expense } from "@/lib/types";
import { useMemo } from "react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SpendingTrendsProps {
  expenses: Expense[];
}

export function SpendingTrends({ expenses }: SpendingTrendsProps) {
  const { currency } = useCurrency();

  const { chartData, stats } = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const sixtyDaysAgo = subDays(today, 60);
    
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    
    // Calculate daily totals and running average
    let runningTotal = 0;
    const data = days.map((day, index) => {
      const dayStart = startOfDay(day);
      const dayTotal = expenses
        .filter((e) => startOfDay(new Date(e.date)).getTime() === dayStart.getTime())
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      runningTotal += dayTotal;
      const average = runningTotal / (index + 1);
      
      return {
        date: format(day, "MMM d"),
        shortDate: format(day, "d"),
        amount: dayTotal,
        average: Math.round(average * 100) / 100,
      };
    });

    // Calculate this period vs last period
    const thisMonthTotal = expenses
      .filter((e) => new Date(e.date) >= thirtyDaysAgo)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const lastMonthTotal = expenses
      .filter((e) => {
        const date = new Date(e.date);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const percentChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    const avgDaily = thisMonthTotal / 30;
    const peakDay = data.reduce((max, d) => d.amount > max.amount ? d : max, data[0]);

    return {
      chartData: data,
      stats: {
        thisMonthTotal,
        lastMonthTotal,
        percentChange,
        avgDaily,
        peakDay,
      },
    };
  }, [expenses]);

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 100);

  if (expenses.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <p className="text-muted-foreground">Add expenses to see trends</p>
      </div>
    );
  }

  const TrendIcon = stats.percentChange === 0 
    ? Minus 
    : stats.percentChange > 0 
      ? TrendingUp 
      : TrendingDown;
  
  const trendColor = stats.percentChange === 0 
    ? "text-muted-foreground" 
    : stats.percentChange > 0 
      ? "text-warning" 
      : "text-success";

  return (
    <div className="space-y-3">
      {/* Mini Stats */}
      <div className="flex items-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <TrendIcon className={`w-3 h-3 ${trendColor}`} />
          <span className={`font-medium ${trendColor}`}>
            {stats.percentChange >= 0 ? "+" : ""}{stats.percentChange.toFixed(0)}%
          </span>
          <span className="text-muted-foreground">vs prev</span>
        </div>
        <span className="text-muted-foreground">•</span>
        <div>
          <span className="text-muted-foreground">Avg: </span>
          <span className="font-medium text-foreground">{formatCurrency(stats.avgDaily, currency)}/day</span>
        </div>
        {stats.peakDay && stats.peakDay.amount > 0 && (
          <>
            <span className="text-muted-foreground">•</span>
            <div>
              <span className="text-muted-foreground">Peak: </span>
              <span className="font-medium text-foreground">{stats.peakDay.date}</span>
            </div>
          </>
        )}
      </div>

      <div className="h-[240px] -mx-2">
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
              formatter={(value: number, name: string) => [
                `${currency.symbol}${value.toFixed(2)}`,
                name === "amount" ? "Spent" : "Avg",
              ]}
            />
            <ReferenceLine
              y={stats.avgDaily}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
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
    </div>
  );
}
