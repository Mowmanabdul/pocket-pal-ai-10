import { useExpenses } from "@/hooks/useExpenses";
import { SpendingChart } from "@/components/SpendingChart";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { ExpenseCategory } from "@/lib/types";
import { useMemo } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  subMonths, 
  format, 
  eachDayOfInterval, 
  startOfWeek,
  endOfWeek,
  subWeeks,
  getDay,
  getWeek
} from "date-fns";
import { TrendingUp, TrendingDown, Calendar, PieChart, Activity, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";

export function AnalyticsPage() {
  const { expenses, isLoading } = useExpenses();
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  // Weekly comparison data (this week vs last week)
  const weeklyComparison = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map((day, index) => {
      const thisWeekDays = eachDayOfInterval({ start: thisWeekStart, end: thisWeekEnd });
      const lastWeekDays = eachDayOfInterval({ start: lastWeekStart, end: lastWeekEnd });
      
      const thisWeekTotal = expenses
        .filter(e => {
          const date = new Date(e.date);
          return thisWeekDays[index] && 
            format(date, 'yyyy-MM-dd') === format(thisWeekDays[index], 'yyyy-MM-dd');
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const lastWeekTotal = expenses
        .filter(e => {
          const date = new Date(e.date);
          return lastWeekDays[index] && 
            format(date, 'yyyy-MM-dd') === format(lastWeekDays[index], 'yyyy-MM-dd');
        })
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      return {
        day,
        thisWeek: thisWeekTotal,
        lastWeek: lastWeekTotal,
      };
    });
  }, [expenses]);

  // Spending heatmap data (last 12 weeks)
  const heatmapData = useMemo(() => {
    const weeks: { week: number; days: { day: number; amount: number; date: string }[] }[] = [];
    
    for (let w = 11; w >= 0; w--) {
      const weekStart = startOfWeek(subWeeks(new Date(), w), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const days = daysInWeek.map((d, i) => {
        const dayTotal = expenses
          .filter(e => format(new Date(e.date), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'))
          .reduce((sum, e) => sum + Number(e.amount), 0);
        
        return {
          day: i,
          amount: dayTotal,
          date: format(d, 'MMM d'),
        };
      });
      
      weeks.push({ week: getWeek(weekStart), days });
    }
    
    return weeks;
  }, [expenses]);

  // Get max amount for heatmap intensity
  const maxHeatmapAmount = useMemo(() => {
    let max = 0;
    heatmapData.forEach(week => {
      week.days.forEach(day => {
        if (day.amount > max) max = day.amount;
      });
    });
    return max || 1;
  }, [heatmapData]);

  // Monthly data
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
      const count = monthExpenses.length;

      months.push({
        month: format(date, "MMM"),
        fullMonth: format(date, "MMMM yyyy"),
        amount: total,
        count,
      });
    }
    return months;
  }, [expenses]);

  // Category breakdown with percentages
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<ExpenseCategory, number> = {} as any;
    expenses.forEach((e) => {
      breakdown[e.category] = (breakdown[e.category] || 0) + Number(e.amount);
    });

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return Object.entries(breakdown)
      .map(([category, amount]) => {
        const config = getCategoryConfig(category as ExpenseCategory);
        return {
          category: category as ExpenseCategory,
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
          ...config,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, getCategoryConfig]);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgPerExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  // Calculate month over month change
  const monthChange = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const current = monthlyData[monthlyData.length - 1].amount;
    const previous = monthlyData[monthlyData.length - 2].amount;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, [monthlyData]);

  // Insights based on data
  const insights = useMemo(() => {
    const insights: { type: 'positive' | 'warning' | 'info'; message: string }[] = [];
    
    if (monthChange < 0) {
      insights.push({
        type: 'positive',
        message: `Your spending decreased by ${Math.abs(monthChange).toFixed(0)}% compared to last month.`
      });
    } else if (monthChange > 20) {
      insights.push({
        type: 'warning',
        message: `Your spending increased by ${monthChange.toFixed(0)}% compared to last month.`
      });
    }

    if (categoryBreakdown.length > 0 && categoryBreakdown[0].percentage > 40) {
      insights.push({
        type: 'info',
        message: `${categoryBreakdown[0].label} accounts for ${categoryBreakdown[0].percentage.toFixed(0)}% of your total spending.`
      });
    }

    const weekdaySpend = weeklyComparison.slice(0, 5).reduce((sum, d) => sum + d.thisWeek, 0);
    const weekendSpend = weeklyComparison.slice(5, 7).reduce((sum, d) => sum + d.thisWeek, 0);
    if (weekendSpend > weekdaySpend * 0.5) {
      insights.push({
        type: 'info',
        message: 'You tend to spend more on weekends relative to weekdays.'
      });
    }

    return insights;
  }, [monthChange, categoryBreakdown, weeklyComparison]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-20 rounded-2xl shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl shimmer" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl shimmer" />
          <div className="h-80 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chart-2 to-chart-3 flex items-center justify-center shadow-lg">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-foreground">Analytics</h1>
          <p className="text-muted-foreground">Detailed insights into your spending patterns</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="glass-card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Spent</p>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(totalSpent, currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </div>

        <div className="glass-card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Month Trend</p>
            {monthChange <= 0 ? (
              <TrendingDown className="w-4 h-4 text-success" />
            ) : (
              <TrendingUp className="w-4 h-4 text-warning" />
            )}
          </div>
          <p className={`text-2xl md:text-3xl font-bold ${monthChange <= 0 ? 'text-success' : 'text-warning'}`}>
            {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">vs last month</p>
        </div>

        <div className="glass-card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Transactions</p>
            <Calendar className="w-4 h-4 text-chart-2" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{expenses.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total count</p>
        </div>

        <div className="glass-card-elevated p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Transaction</p>
            <PieChart className="w-4 h-4 text-chart-3" />
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{formatCurrency(avgPerExpense, currency)}</p>
          <p className="text-xs text-muted-foreground mt-1">Per expense</p>
        </div>
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="glass-card-elevated p-5">
          <h2 className="text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Quick Insights
          </h2>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div 
                key={i}
                className={`p-3 rounded-xl flex items-start gap-3 ${
                  insight.type === 'positive' ? 'bg-success/10 text-success' :
                  insight.type === 'warning' ? 'bg-warning/10 text-warning' :
                  'bg-primary/10 text-primary'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  insight.type === 'positive' ? 'bg-success' :
                  insight.type === 'warning' ? 'bg-warning' :
                  'bg-primary'
                }`} />
                <p className="text-sm font-medium text-foreground">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spending Heatmap */}
      <div className="glass-card-elevated p-5 md:p-6">
        <h2 className="text-foreground mb-4">Spending Heatmap</h2>
        <p className="text-sm text-muted-foreground mb-4">Last 12 weeks activity</p>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex gap-1 mb-2 text-xs text-muted-foreground ml-8">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="w-8 text-center">{day}</div>
              ))}
            </div>
            <div className="space-y-1">
              {heatmapData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex items-center gap-1">
                  <div className="w-6 text-xs text-muted-foreground text-right">
                    {weekIndex === 0 || weekIndex === 6 || weekIndex === 11 ? `W${week.week}` : ''}
                  </div>
                  {week.days.map((day, dayIndex) => {
                    const intensity = day.amount / maxHeatmapAmount;
                    return (
                      <div
                        key={dayIndex}
                        className="w-8 h-8 rounded-md cursor-pointer transition-transform hover:scale-110"
                        style={{
                          backgroundColor: day.amount > 0 
                            ? `hsl(var(--primary) / ${Math.max(0.15, intensity)})`
                            : 'hsl(var(--secondary))',
                        }}
                        title={`${day.date}: ${formatCurrency(day.amount, currency)}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                {[0.15, 0.3, 0.5, 0.75, 1].map((opacity, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Weekly Comparison */}
        <div className="glass-card-elevated p-5 md:p-6">
          <h2 className="text-foreground mb-4">Weekly Comparison</h2>
          <p className="text-sm text-muted-foreground mb-4">This week vs last week</p>
          <div className="h-[280px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
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
                  formatter={(value: number) => [formatCurrency(value, currency)]}
                />
                <Legend />
                <Bar dataKey="thisWeek" name="This Week" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lastWeek" name="Last Week" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-card-elevated p-5 md:p-6">
          <h2 className="text-foreground mb-4">Category Distribution</h2>
          <SpendingChart expenses={expenses} />
        </div>
      </div>

      {/* Monthly Spending Trend */}
      <div className="glass-card-elevated p-5 md:p-6">
        <h2 className="text-foreground mb-4">6-Month Trend</h2>
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
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullMonth || ""}
                formatter={(value: number) => [formatCurrency(value, currency), "Spent"]}
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === monthlyData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--chart-2))'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-card-elevated p-5 md:p-6">
        <h2 className="text-foreground mb-5">Detailed Breakdown</h2>
        {categoryBreakdown.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Add expenses to see breakdown</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="p-4 rounded-xl bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xl font-bold text-foreground mb-2">
                  {formatCurrency(item.amount, currency)}
                </p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
