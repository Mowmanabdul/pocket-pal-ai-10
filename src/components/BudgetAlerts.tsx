import { useBudgetAlerts, BudgetAlert } from "@/hooks/useBudgetAlerts";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { Expense } from "@/lib/types";
import { AlertTriangle, AlertCircle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface BudgetAlertsProps {
  expenses: Expense[];
}

export function BudgetAlerts({ expenses }: BudgetAlertsProps) {
  const { alerts } = useBudgetAlerts(expenses);
  const { getCategoryConfig } = useCategoryLabelsContext();
  const { currency } = useCurrency();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

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

  if (visibleAlerts.length === 0) {
    return null;
  }

  const format = (amount: number) => formatCurrency(amount, currency);

  return (
    <div className="space-y-3">
      {visibleAlerts.map((alert) => {
        const config = getCategoryConfig(alert.category);
        const isExceeded = alert.type === "exceeded";
        
        return (
          <Alert
            key={alert.category}
            variant={isExceeded ? "destructive" : "default"}
            className={`relative ${
              isExceeded 
                ? "border-destructive/50 bg-destructive/5" 
                : "border-warning/50 bg-warning/5"
            }`}
          >
            <div className="flex items-start gap-3">
              {isExceeded ? (
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <AlertDescription className="text-sm">
                  <span className="font-semibold text-foreground">{config.label}</span>
                  {isExceeded ? (
                    <span className="text-muted-foreground">
                      {" "}budget exceeded — spent {format(alert.spent)} of {format(alert.budget)} ({Math.round(alert.percentage)}%)
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {" "}approaching limit — {format(alert.spent)} of {format(alert.budget)} ({Math.round(alert.percentage)}%)
                    </span>
                  )}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0 hover:bg-transparent"
                onClick={() => dismissAlert(alert.category)}
              >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}
