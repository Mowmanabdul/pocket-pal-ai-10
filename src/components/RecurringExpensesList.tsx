import { format } from "date-fns";
import { RecurringExpense } from "@/hooks/useRecurringExpenses";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  RefreshCw, 
  Calendar, 
  Pause, 
  Play,
  Clock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RecurringExpensesListProps {
  expenses: RecurringExpense[];
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

export function RecurringExpensesList({ 
  expenses, 
  onDelete, 
  onToggleActive,
  isDeleting,
  isToggling 
}: RecurringExpensesListProps) {
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
          <RefreshCw className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-0.5">No recurring expenses</h3>
        <p className="text-xs text-muted-foreground">
          Set up recurring expenses for bills
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => {
        const config = getCategoryConfig(expense.category);
        const nextDate = new Date(expense.next_occurrence);
        const isUpcoming = nextDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        return (
          <div
            key={expense.id}
            className={`p-3 rounded-lg border transition-all ${
              expense.is_active 
                ? 'bg-card/50 border-border/50' 
                : 'bg-muted/30 border-border/30 opacity-60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div 
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  expense.is_active ? 'bg-primary/10' : 'bg-muted'
                }`}
              >
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(expense.amount, currency)}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      expense.frequency === 'weekly' 
                        ? 'bg-chart-4/10 text-chart-4' 
                        : 'bg-chart-5/10 text-chart-5'
                    }`}
                  >
                    {expense.frequency === 'weekly' ? 'Weekly' : 'Monthly'}
                  </Badge>
                  {!expense.is_active && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      Paused
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground truncate">
                  {expense.description || config.label}
                </p>
                
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Next: {format(nextDate, "MMM d")}</span>
                  {isUpcoming && expense.is_active && (
                    <span className="text-warning font-medium">(soon)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Switch
                  checked={expense.is_active}
                  onCheckedChange={(checked) => onToggleActive(expense.id, checked)}
                  disabled={isToggling}
                  className="scale-90"
                />
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg">Delete recurring expense?</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        This will permanently delete this recurring expense.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(expense.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
