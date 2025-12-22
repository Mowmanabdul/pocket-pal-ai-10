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
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-foreground mb-1">No recurring expenses</h3>
        <p className="text-sm text-muted-foreground">
          Set up recurring expenses for bills and subscriptions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const config = getCategoryConfig(expense.category);
        const nextDate = new Date(expense.next_occurrence);
        const isUpcoming = nextDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        return (
          <div
            key={expense.id}
            className={`p-4 rounded-xl border transition-all ${
              expense.is_active 
                ? 'bg-card/50 border-border/50 hover:shadow-md' 
                : 'bg-muted/30 border-border/30 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                expense.is_active ? 'bg-primary/10' : 'bg-muted'
              }`}>
                {config.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(expense.amount, currency)}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      expense.frequency === 'weekly' 
                        ? 'bg-chart-4/10 text-chart-4' 
                        : 'bg-chart-5/10 text-chart-5'
                    }`}
                  >
                    {expense.frequency === 'weekly' ? (
                      <><RefreshCw className="w-3 h-3 mr-1" /> Weekly</>
                    ) : (
                      <><Calendar className="w-3 h-3 mr-1" /> Monthly</>
                    )}
                  </Badge>
                  {!expense.is_active && (
                    <Badge variant="outline" className="text-xs">
                      <Pause className="w-3 h-3 mr-1" /> Paused
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground truncate">
                  {expense.description || config.label}
                </p>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Next: {format(nextDate, "MMM d, yyyy")}
                    {isUpcoming && expense.is_active && (
                      <span className="text-warning font-medium">(soon)</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={expense.is_active}
                  onCheckedChange={(checked) => onToggleActive(expense.id, checked)}
                  disabled={isToggling}
                />
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete recurring expense?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this recurring expense. Past expenses created from it will remain.
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
