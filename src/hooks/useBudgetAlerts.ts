import { useMemo } from "react";
import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ExpenseCategory, Expense } from "@/lib/types";
import { useBudgets } from "@/hooks/useBudgets";

export interface BudgetAlert {
  category: ExpenseCategory;
  type: "warning" | "exceeded";
  spent: number;
  budget: number;
  percentage: number;
}

export function useBudgetAlerts(expenses: Expense[]) {
  const { budgets } = useBudgets();

  const alerts = useMemo(() => {
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

    const budgetAlerts: BudgetAlert[] = [];

    budgets.forEach(budget => {
      const spent = spending[budget.category] || 0;
      const percentage = (spent / budget.amount) * 100;

      if (percentage >= 100) {
        budgetAlerts.push({
          category: budget.category,
          type: "exceeded",
          spent,
          budget: budget.amount,
          percentage,
        });
      } else if (percentage >= 80) {
        budgetAlerts.push({
          category: budget.category,
          type: "warning",
          spent,
          budget: budget.amount,
          percentage,
        });
      }
    });

    return budgetAlerts.sort((a, b) => b.percentage - a.percentage);
  }, [expenses, budgets]);

  return { alerts };
}
