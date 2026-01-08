import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { Expense } from "@/lib/types";
import { AlertTriangle, AlertCircle, X, Shield, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface BudgetAlertsProps {
  expenses: Expense[];
}

export function BudgetAlerts({ expenses }: BudgetAlertsProps) {
  const { alerts } = useBudgetAlerts(expenses);
  const { getCategoryConfig } = useCategoryLabelsContext();
  const { currency } = useCurrency();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // Reset dismissed alerts when month changes
  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const storedMonth = localStorage.getItem("budgetAlertsMonth");
    
    if (storedMonth !== currentMonth) {
      localStorage.setItem("budgetAlertsMonth", currentMonth);
      localStorage.removeItem("dismissedBudgetAlerts");
      setDismissedAlerts(new Set());
    } else {
      const stored = localStorage.getItem("dismissedBudgetAlerts");
      if (stored) {
        setDismissedAlerts(new Set(JSON.parse(stored)));
      }
    }
  }, []);

  const dismissAlert = (category: string) => {
    const newDismissed = new Set(dismissedAlerts);
    newDismissed.add(category);
    setDismissedAlerts(newDismissed);
    localStorage.setItem("dismissedBudgetAlerts", JSON.stringify([...newDismissed]));
  };

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.category));
  const exceededCount = visibleAlerts.filter(a => a.type === "exceeded").length;
  const warningCount = visibleAlerts.filter(a => a.type === "warning").length;

  const format = (amount: number) => formatCurrency(amount, currency);

  // Show summary badge when there are no visible alerts but there were dismissed ones
  if (visibleAlerts.length === 0 && alerts.length > 0) {
    return (
      <div 
        className="flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/20 cursor-pointer hover:bg-success/15 transition-colors"
        onClick={() => {
          setDismissedAlerts(new Set());
          localStorage.removeItem("dismissedBudgetAlerts");
        }}
      >
        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
        <span className="text-xs text-success">All budget alerts dismissed</span>
        <span className="text-[10px] text-muted-foreground">(click to show)</span>
      </div>
    );
  }

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Summary Header */}
      {visibleAlerts.length > 1 && (
        <div 
          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Budget Alerts</span>
            <div className="flex items-center gap-1">
              {exceededCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium">
                  {exceededCount} exceeded
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-warning/10 text-warning text-[10px] font-medium">
                  {warningCount} warning
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {isExpanded ? "tap to collapse" : "tap to expand"}
          </span>
        </div>
      )}

      {/* Alerts List */}
      {(isExpanded || visibleAlerts.length === 1) && (
        <div className="space-y-2">
          {visibleAlerts.map((alert) => {
            const config = getCategoryConfig(alert.category);
            const isExceeded = alert.type === "exceeded";
            
            return (
              <Alert
                key={alert.category}
                variant={isExceeded ? "destructive" : "default"}
                className={`relative py-2.5 ${
                  isExceeded 
                    ? "border-destructive/50 bg-destructive/5" 
                    : "border-warning/50 bg-warning/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  {isExceeded ? (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <AlertDescription className="text-xs">
                        <span 
                          className="font-semibold"
                          style={{ color: config.color }}
                        >
                          {config.label}
                        </span>
                        <span className="text-muted-foreground">
                          {isExceeded ? " exceeded" : " near limit"}
                        </span>
                      </AlertDescription>
                      <span className="text-[10px] font-medium shrink-0">
                        {format(alert.spent)} / {format(alert.budget)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(alert.percentage, 100)}
                      className={`h-1 ${
                        isExceeded 
                          ? '[&>div]:bg-destructive' 
                          : '[&>div]:bg-warning'
                      }`}
                    />
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{Math.round(alert.percentage)}% used</span>
                      <span>
                        {isExceeded 
                          ? `${format(alert.spent - alert.budget)} over`
                          : `${format(alert.budget - alert.spent)} left`
                        }
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 shrink-0 hover:bg-transparent"
                    onClick={() => dismissAlert(alert.category)}
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="sr-only">Dismiss</span>
                  </Button>
                </div>
              </Alert>
            );
          })}
        </div>
      )}
    </div>
  );
}
