import { Expense, categoryConfig } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ExpenseList({ expenses, onDelete, isDeleting }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No expenses yet</p>
        <p className="text-sm mt-1">Add your first expense to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide pr-2">
      {expenses.map((expense, index) => {
        const config = categoryConfig[expense.category];
        return (
          <div
            key={expense.id}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-all group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: `${config.color}20` }}
              >
                {config.icon}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {expense.description || config.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(expense.date), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">
                ${expense.amount.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(expense.id)}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
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
