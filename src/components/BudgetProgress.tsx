import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ExpenseCategory, Expense } from "@/lib/types";
import { useBudgets } from "@/hooks/useBudgets";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface BudgetProgressProps {
  expenses: Expense[];
}

export function BudgetProgress({ expenses }: BudgetProgressProps) {
  const { budgets, isLoading } = useBudgets();
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  const categorySpending = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonthExpenses = expenses.filter(expense =>
      isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
    );

    const spending: Record<ExpenseCategory, number> = {
      food: 0, transport: 0, entertainment: 0, shopping: 0,
      utilities: 0, health: 0, education: 0, other: 0
    };

    thisMonthExpenses.forEach(expense => {
      spending[expense.category] += expense.amount;
    });

    return spending;
  }, [expenses]);

  const budgetItems = useMemo(() => {
    return budgets.map(budget => {
      const spent = categorySpending[budget.category] || 0;
      const percentage = Math.min((spent / budget.amount) * 100, 100);
      const remaining = budget.amount - spent;
      const isOverBudget = spent > budget.amount;
      const isNearLimit = percentage >= 80 && !isOverBudget;

      return {
        ...budget,
        spent,
        percentage,
        remaining,
        isOverBudget,
        isNearLimit,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categorySpending]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-primary/30" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (budgetItems.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-primary" />
            </div>
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center mx-auto mb-3 border border-border/50">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No budgets set
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Set spending limits in Settings
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const format = (amount: number) => formatCurrency(amount, currency);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="border-b border-border/30 pb-4 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-primary" />
            </div>
            Budget Progress
          </CardTitle>
          <div className="text-right">
            <p className="text-sm font-bold">
              {format(totalSpent)} <span className="text-muted-foreground font-normal text-xs">/ {format(totalBudget)}</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{Math.round(overallPercentage)}% used</p>
          </div>
        </div>
        <Progress 
          value={Math.min(overallPercentage, 100)} 
          className="h-2 mt-3"
        />
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        {budgetItems.map((item) => {
          const config = getCategoryConfig(item.category);
          return (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: config.color }}
                />
                <span className="font-medium text-xs">{config.label}</span>
                {item.isOverBudget && (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
                {item.isNearLimit && (
                  <TrendingUp className="h-3 w-3 text-warning" />
                )}
                {item.percentage < 50 && (
                  <CheckCircle className="h-3 w-3 text-primary" />
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-medium">
                  {format(item.spent)}
                  <span className="text-muted-foreground font-normal"> / {format(item.amount)}</span>
                </p>
              </div>
            </div>
            <div className="relative">
              <Progress 
                value={item.percentage} 
                className={`h-1.5 ${
                  item.isOverBudget 
                    ? '[&>div]:bg-destructive' 
                    : item.isNearLimit 
                      ? '[&>div]:bg-warning' 
                      : ''
                }`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{Math.round(item.percentage)}% used</span>
              <span>
                {item.isOverBudget 
                  ? `${format(Math.abs(item.remaining))} over`
                  : `${format(item.remaining)} left`
                }
              </span>
            </div>
          </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
