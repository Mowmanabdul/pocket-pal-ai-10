import { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function ExpenseList({ expenses, onDelete, isDeleting }: ExpenseListProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center animate-bounce-in">
          <span className="text-4xl">💸</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground">No expenses yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Start tracking your spending by adding your first expense
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-hide">
      {expenses.map((expense, index) => {
        const config = getCategoryConfig(expense.category);
        return (
          <div
            key={expense.id}
            className="flex items-center gap-3 p-3 md:p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-all group animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div
              className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-soft"
              style={{ backgroundColor: `${config.color}15` }}
            >
              {config.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {expense.description || config.label}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{format(new Date(expense.date), "MMM d")}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                <span
                  className="px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${config.color}15`,
                    color: config.color,
                  }}
                >
                  {config.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground whitespace-nowrap">
                {formatCurrency(Number(expense.amount), currency)}
              </span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onDelete(expense.id)}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
