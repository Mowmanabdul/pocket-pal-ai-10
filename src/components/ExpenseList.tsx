import { useState } from "react";
import { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical, Pencil, Copy, Receipt } from "lucide-react";
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
    receipt_url?: string | null;
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
  compact?: boolean;
}

export function ExpenseList({ expenses, onDelete, onEdit, onDuplicate, isDeleting, isUpdating, isAdding, compact }: ExpenseListProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

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
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-primary/10">
          <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-sm font-bold text-foreground">No expenses yet</h3>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-[200px] mx-auto">
          Add your first expense to start tracking your spending
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
        {expenses.map((expense) => {
          const config = getCategoryConfig(expense.category);
          return (
            <div
              key={expense.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 border border-transparent hover:border-border/50 transition-all duration-200 group"
            >
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${config.color}15` }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {expense.description || config.label}
                  </p>
                  {expense.receipt_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
                      onClick={() => setViewingReceipt(expense.receipt_url)}
                    >
                      <Receipt className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(expense.date), "MMM d, yyyy")} · {config.label}
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
                onEdit(data as { id: string; amount: number; category: Expense["category"]; description?: string; date: string; receipt_url?: string | null });
              }
              setEditingExpense(null);
            }}
            isLoading={isUpdating}
          />
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer Dialog */}
      <Dialog open={!!viewingReceipt} onOpenChange={(open) => !open && setViewingReceipt(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-2">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-bold">Receipt</DialogTitle>
          </DialogHeader>
          {viewingReceipt && (
            <img
              src={viewingReceipt}
              alt="Receipt"
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
