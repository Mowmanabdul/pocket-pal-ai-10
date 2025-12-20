import { Expense, categoryConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ExpenseList({ expenses, onDelete, isDeleting }: ExpenseListProps) {
  const { currency } = useCurrency();

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
          <span className="text-3xl">📊</span>
        </div>
        <p className="text-lg font-medium">No expenses yet</p>
        <p className="text-sm mt-1">Add your first expense to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-hide pr-2">
      {expenses.map((expense, index) => {
        const config = categoryConfig[expense.category];
        return (
          <div
            key={expense.id}
            className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-all group animate-fade-in border border-transparent hover:border-border"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: `${config.color}15` }}
              >
                {config.icon}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {expense.description || config.label}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{format(new Date(expense.date), "MMM d, yyyy")}</span>
                  <span>•</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${config.color}15`,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold text-lg text-foreground">
                {formatCurrency(Number(expense.amount), currency)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(expense.id)}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
