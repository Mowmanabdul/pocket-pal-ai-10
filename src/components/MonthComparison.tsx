import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { TrendingUp, TrendingDown, ArrowRight, Minus, Wallet, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { Expense, ExpenseCategory } from "@/lib/types";

interface MonthComparisonProps {
  expenses: Expense[];
}

export function MonthComparison({ expenses }: MonthComparisonProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  // Generate last 12 months for selection
  const monthOptions = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      months.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy"),
        shortLabel: format(date, "MMM yyyy"),
      });
    }
    return months;
  }, []);

  const [month1, setMonth1] = useState(monthOptions[1]?.value || "");
  const [month2, setMonth2] = useState(monthOptions[0]?.value || "");

  // Filter expenses for each month
  const getMonthExpenses = (monthValue: string) => {
    if (!monthValue) return [];
    const [year, month] = monthValue.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));
    return expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return isWithinInterval(expenseDate, { start: monthStart, end: monthEnd });
    });
  };

  const month1Expenses = useMemo(() => getMonthExpenses(month1), [expenses, month1]);
  const month2Expenses = useMemo(() => getMonthExpenses(month2), [expenses, month2]);

  // Calculate totals
  const month1Total = month1Expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const month2Total = month2Expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Calculate percentage change
  const percentChange = month1Total > 0 
    ? ((month2Total - month1Total) / month1Total) * 100 
    : month2Total > 0 ? 100 : 0;

  // Get category breakdown for both months
  const getCategoryBreakdown = (monthExpenses: Expense[]) => {
    const breakdown: Record<ExpenseCategory, number> = {} as any;
    monthExpenses.forEach((e) => {
      breakdown[e.category] = (breakdown[e.category] || 0) + Number(e.amount);
    });
    return breakdown;
  };

  const month1Categories = useMemo(() => getCategoryBreakdown(month1Expenses), [month1Expenses]);
  const month2Categories = useMemo(() => getCategoryBreakdown(month2Expenses), [month2Expenses]);

  // Get all unique categories
  const allCategories = useMemo(() => {
    const categories = new Set<ExpenseCategory>();
    Object.keys(month1Categories).forEach((c) => categories.add(c as ExpenseCategory));
    Object.keys(month2Categories).forEach((c) => categories.add(c as ExpenseCategory));
    return Array.from(categories).sort((a, b) => {
      const totalA = (month1Categories[a] || 0) + (month2Categories[a] || 0);
      const totalB = (month1Categories[b] || 0) + (month2Categories[b] || 0);
      return totalB - totalA;
    });
  }, [month1Categories, month2Categories]);

  const getMonthLabel = (value: string) => {
    return monthOptions.find((m) => m.value === value)?.shortLabel || value;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Month Selectors */}
      <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
        <div className="flex-1 w-full">
          <label className="text-xs text-muted-foreground mb-1.5 block">First Month</label>
          <Select value={month1} onValueChange={setMonth1}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block mt-5" />
        <div className="text-muted-foreground text-sm sm:hidden">vs</div>

        <div className="flex-1 w-full">
          <label className="text-xs text-muted-foreground mb-1.5 block">Second Month</label>
          <Select value={month2} onValueChange={setMonth2}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards - Enhanced */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="glass-card-elevated p-3 md:p-4 text-center">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">{getMonthLabel(month1)}</p>
          <p className="text-sm md:text-xl font-bold text-foreground truncate">
            {formatCurrency(month1Total, currency)}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            {month1Expenses.length} transactions
          </p>
        </div>

        <div className="glass-card-elevated p-3 md:p-4 text-center flex flex-col items-center justify-center">
          <div className={`flex items-center gap-1 ${
            percentChange < 0 ? 'text-success' : percentChange > 0 ? 'text-warning' : 'text-muted-foreground'
          }`}>
            {percentChange < 0 ? (
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
            ) : percentChange > 0 ? (
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Minus className="w-4 h-4 md:w-5 md:h-5" />
            )}
            <span className="text-lg md:text-2xl font-bold">
              {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(0)}%
            </span>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">Change</p>
        </div>

        <div className="glass-card-elevated p-3 md:p-4 text-center">
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">{getMonthLabel(month2)}</p>
          <p className="text-sm md:text-xl font-bold text-foreground truncate">
            {formatCurrency(month2Total, currency)}
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">
            {month2Expenses.length} transactions
          </p>
        </div>
      </div>

      {/* Savings/Overspend Indicator */}
      {month1Total > 0 && (
        <div className={`p-3 md:p-4 rounded-xl ${
          month2Total < month1Total 
            ? 'bg-success/10 border border-success/20' 
            : month2Total > month1Total 
              ? 'bg-warning/10 border border-warning/20'
              : 'bg-secondary/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {month2Total < month1Total ? (
                <Wallet className="w-5 h-5 text-success" />
              ) : month2Total > month1Total ? (
                <AlertCircle className="w-5 h-5 text-warning" />
              ) : (
                <Minus className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  month2Total < month1Total ? 'text-success' : month2Total > month1Total ? 'text-warning' : 'text-foreground'
                }`}>
                  {month2Total < month1Total ? 'You saved money!' : month2Total > month1Total ? 'Overspent' : 'Same spending'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {month2Total !== month1Total 
                    ? `${formatCurrency(Math.abs(month2Total - month1Total), currency)} ${month2Total < month1Total ? 'less' : 'more'} than ${getMonthLabel(month1)}`
                    : 'Identical spending between months'
                  }
                </p>
              </div>
            </div>
            <p className={`text-lg md:text-xl font-bold ${
              month2Total < month1Total ? 'text-success' : month2Total > month1Total ? 'text-warning' : 'text-foreground'
            }`}>
              {month2Total < month1Total ? '-' : month2Total > month1Total ? '+' : ''}{formatCurrency(Math.abs(month2Total - month1Total), currency)}
            </p>
          </div>
        </div>
      )}

      {/* Category Comparison */}
      <div className="space-y-3">
        <h3 className="text-sm md:text-base font-medium text-foreground">Category Comparison</h3>
        
        {allCategories.length === 0 ? (
          <p className="text-muted-foreground text-center py-6 text-sm">No expenses to compare</p>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {allCategories.map((category) => {
              const config = getCategoryConfig(category);
              const amount1 = month1Categories[category] || 0;
              const amount2 = month2Categories[category] || 0;
              const catChange = amount1 > 0 
                ? ((amount2 - amount1) / amount1) * 100 
                : amount2 > 0 ? 100 : 0;
              const maxAmount = Math.max(amount1, amount2, 1);

              return (
                <div key={category} className="p-2.5 md:p-4 rounded-xl bg-secondary/30">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-xs md:text-sm font-medium text-foreground">{config.label}</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs md:text-sm ${
                      catChange < 0 ? 'text-success' : catChange > 0 ? 'text-warning' : 'text-muted-foreground'
                    }`}>
                      {catChange < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : catChange > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : null}
                      <span>{catChange >= 0 ? '+' : ''}{catChange.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Side by side bars */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] md:text-xs text-muted-foreground w-16 md:w-20 shrink-0">
                        {getMonthLabel(month1)}
                      </span>
                      <div className="flex-1 h-2 md:h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(amount1 / maxAmount) * 100}%`,
                            backgroundColor: config.color,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                      <span className="text-[10px] md:text-xs font-medium text-foreground w-16 md:w-20 text-right truncate">
                        {formatCurrency(amount1, currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] md:text-xs text-muted-foreground w-16 md:w-20 shrink-0">
                        {getMonthLabel(month2)}
                      </span>
                      <div className="flex-1 h-2 md:h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(amount2 / maxAmount) * 100}%`,
                            backgroundColor: config.color,
                          }}
                        />
                      </div>
                      <span className="text-[10px] md:text-xs font-medium text-foreground w-16 md:w-20 text-right truncate">
                        {formatCurrency(amount2, currency)}
                      </span>
                    </div>
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