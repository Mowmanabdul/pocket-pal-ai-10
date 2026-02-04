import { useExpenses } from "@/hooks/useExpenses";
import { SpendingChart } from "@/components/SpendingChart";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { useMemo, useState } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  subMonths, 
  format,
} from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, Download, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToCSV } from "@/lib/pdfExport";
import { useAIInsights } from "@/hooks/useAIInsights";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { MonthComparison } from "@/components/MonthComparison";
import { SpendingVelocity } from "@/components/analytics/SpendingVelocity";
import { TopExpenses } from "@/components/analytics/TopExpenses";
import { SavingsSuggestions } from "@/components/analytics/SavingsSuggestions";
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
  const { expenses: allExpenses, isLoading } = useExpenses();
  const { currency } = useCurrency();
  const { insights: aiInsights } = useAIInsights();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"analytics" | "compare">("analytics");

  // Filter expenses by date range
  const expenses = useMemo(() => {
    if (!dateRange?.from) return allExpenses;

    return allExpenses.filter((e) => {
      const expenseDate = new Date(e.date);
      if (dateRange.to) {
        return isWithinInterval(expenseDate, { start: dateRange.from!, end: dateRange.to });
      }
      return expenseDate >= dateRange.from!;
    });
  }, [allExpenses, dateRange]);

  const handleExportPDF = () => {
    exportToPDF({ expenses, currency, getCategoryConfig: (cat) => ({ label: cat, color: '#888' }), aiInsights });
  };

  const handleExportCSV = () => {
    exportToCSV({ expenses, currency, getCategoryConfig: (cat) => ({ label: cat, color: '#888' }) });
  };

  // 6-month trend data
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthExpenses = allExpenses.filter((e) =>
        isWithinInterval(new Date(e.date), { start, end })
      );

      months.push({
        month: format(date, "MMM"),
        amount: monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
      });
    }
    return months;
  }, [allExpenses]);

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const avgPerExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;

  // Month over month change
  const monthChange = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const current = monthlyData[monthlyData.length - 1].amount;
    const previous = monthlyData[monthlyData.length - 2].amount;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, [monthlyData]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
        <div className="h-12 rounded-xl shimmer" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
        </div>
        <div className="h-64 rounded-xl shimmer" />
      </div>
    );
  }

  return (
    <div className="px-3 py-4 md:px-6 md:py-6 space-y-5 w-full max-w-6xl md:mx-auto min-w-0 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Analytics</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setViewMode(viewMode === "analytics" ? "compare" : "analytics")}
            variant={viewMode === "compare" ? "default" : "outline"}
            size="sm"
            className="rounded-xl gap-1.5 h-8 text-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Compare
          </Button>
          {viewMode === "analytics" && (
            <>
              <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="rounded-xl h-8 text-xs" disabled={expenses.length === 0}>
                <Download className="w-3.5 h-3.5 mr-1" />CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="rounded-xl h-8 text-xs" disabled={expenses.length === 0}>
                <Download className="w-3.5 h-3.5 mr-1" />PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {viewMode === "compare" ? (
        <div className="glass-card-elevated p-4">
          <MonthComparison expenses={allExpenses} />
        </div>
      ) : (
        <>
          {/* Key Metrics - Simplified */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card-elevated p-3 md:p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Total</span>
                <DollarSign className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{formatCurrency(totalSpent, currency)}</p>
            </div>

            <div className="glass-card-elevated p-3 md:p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Trend</span>
                {monthChange <= 0 ? <TrendingDown className="w-3.5 h-3.5 text-success" /> : <TrendingUp className="w-3.5 h-3.5 text-warning" />}
              </div>
              <p className={`text-lg md:text-2xl font-bold ${monthChange <= 0 ? 'text-success' : 'text-warning'}`}>
                {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(0)}%
              </p>
            </div>

            <div className="glass-card-elevated p-3 md:p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Average</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-foreground">{formatCurrency(avgPerExpense, currency)}</p>
            </div>
          </div>

          {/* Charts - 2 Column Layout */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            <div className="glass-card-elevated p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">By Category</h2>
              <SpendingChart expenses={expenses} />
            </div>

            {/* Monthly Trend */}
            <div className="glass-card-elevated p-4">
              <h2 className="text-sm font-semibold text-foreground mb-3">6-Month Trend</h2>
              <div className="h-[200px] -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v === 0 ? "0" : `${currency.symbol}${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} width={40} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }}
                      formatter={(value: number) => [formatCurrency(value, currency), "Spent"]}
                    />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Insights Row */}
          <div className="grid lg:grid-cols-3 gap-4">
            <SpendingVelocity expenses={expenses} selectedMonth="all" />
            <TopExpenses expenses={expenses} />
            <SavingsSuggestions expenses={expenses} />
          </div>
        </>
      )}
    </div>
  );
}
