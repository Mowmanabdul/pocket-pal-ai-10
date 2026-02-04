import { useState, useMemo } from "react";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { RecurringExpenseForm } from "@/components/RecurringExpenseForm";
import { RecurringExpensesList } from "@/components/RecurringExpensesList";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Play, Loader2 } from "lucide-react";

export function RecurringPage() {
  const {
    recurringExpenses: allRecurringExpenses,
    isLoading,
    addRecurringExpense,
    deleteRecurringExpense,
    toggleActive,
    processRecurring,
  } = useRecurringExpenses();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const recurringExpenses = useMemo(() => {
    if (!dateRange?.from) return allRecurringExpenses;
    
    return allRecurringExpenses.filter((e) => {
      const nextDate = new Date(e.next_occurrence);
      if (dateRange.to) {
        return isWithinInterval(nextDate, { start: dateRange.from!, end: dateRange.to });
      }
      return nextDate >= dateRange.from!;
    });
  }, [allRecurringExpenses, dateRange]);

  const activeCount = recurringExpenses.filter(e => e.is_active).length;

  return (
    <div className="px-3 py-4 md:px-6 md:py-6 space-y-4 w-full max-w-3xl md:mx-auto min-w-0 box-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Recurring</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} active · {recurringExpenses.length} total
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => processRecurring.mutate()}
            disabled={processRecurring.isPending}
            className="gap-1.5 h-8 text-xs rounded-xl"
          >
            {processRecurring.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Process
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs rounded-xl">
                <Plus className="w-3.5 h-3.5" />Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">New Recurring Expense</DialogTitle>
              </DialogHeader>
              <RecurringExpenseForm
                onSubmit={(data) => { addRecurringExpense.mutate(data); setIsDialogOpen(false); }}
                isLoading={addRecurringExpense.isPending}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* List */}
      <div className="glass-card-elevated rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Subscriptions & Bills</h2>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg shimmer" />)}
          </div>
        ) : (
          <RecurringExpensesList
            expenses={recurringExpenses}
            onDelete={(id) => deleteRecurringExpense.mutate(id)}
            onToggleActive={(id, isActive) => toggleActive.mutate({ id, is_active: isActive })}
            isDeleting={deleteRecurringExpense.isPending}
            isToggling={toggleActive.isPending}
          />
        )}
      </div>
    </div>
  );
}
