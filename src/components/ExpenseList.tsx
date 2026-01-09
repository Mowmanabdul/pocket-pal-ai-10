import { useState } from "react";
import { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical, Pencil, Copy } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  onDuplicate?: (expense: {
    amount: number;
    category: Expense["category"];
    description?: string;
    date: string;
  }) => void;
  isDeleting?: boolean;
  isUpdating?: boolean;
  isAdding?: boolean;
}

export function ExpenseList({ expenses, onDelete, onEdit, onDuplicate, isDeleting, isUpdating, isAdding }: ExpenseListProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleDuplicate = (expense: Expense) => {
    if (onDuplicate) {
      onDuplicate({
        amount: Number(expense.amount),
        category: expense.category,
        description: expense.description || undefined,
        date: new Date().toISOString().split('T')[0], // Today's date
      });
    }
  };

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
              className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {expense.description || config.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(expense.date), "MMM d")} · {config.label}
                </p>
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
                    {onDuplicate && (
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(expense)}
                        disabled={isAdding}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
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
