import { useState } from "react";
import { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical, Pencil } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseForm } from "./ExpenseForm";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit?: (expense: {
    id: string;
    amount: number;
    category: Expense["category"];
    description?: string;
    date: string;
  }) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
}

export function ExpenseList({ expenses, onDelete, onEdit, isDeleting, isUpdating }: ExpenseListProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  if (expenses.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">No expenses yet</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add your first expense to start tracking
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1.5 max-h-[400px] overflow-y-auto scrollbar-hide">
        {expenses.map((expense) => {
          const config = getCategoryConfig(expense.category);
          return (
            <div
              key={expense.id}
              className="flex items-center gap-2.5 p-2.5 md:p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <div
                className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${config.color}20` }}
              >
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {expense.description || config.label}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
                  <span>{format(new Date(expense.date), "MMM d")}</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span
                    className="px-1.5 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: `${config.color}15`,
                      color: config.color,
                    }}
                  >
                    {config.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
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
                    {onEdit && (
                      <DropdownMenuItem
                        onClick={() => setEditingExpense(expense)}
                        disabled={isUpdating}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Expense</DialogTitle>
          </DialogHeader>
          <ExpenseForm
            expense={editingExpense}
            mode="edit"
            onSubmit={(data) => {
              if (onEdit && data.id) {
                onEdit(data as { id: string; amount: number; category: Expense["category"]; description?: string; date: string });
              }
              setEditingExpense(null);
            }}
            isLoading={isUpdating}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
