import { useState, useMemo } from "react";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { RecurringExpenseForm } from "@/components/RecurringExpenseForm";
import { RecurringExpensesList } from "@/components/RecurringExpensesList";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, addDays } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Play, Loader2, RefreshCw } from "lucide-react";

export function RecurringPage() {
  const { currency } = useCurrency();
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

  // Upcoming next 7 days summary
  const upcoming = useMemo(() => {
    const now = new Date();
    const horizon = addDays(now, 7);
    const items = allRecurringExpenses.filter((e) => {
      if (!e.is_active) return false;
      const next = new Date(e.next_occurrence);
      return next >= now && next <= horizon;
    });
    const total = items.reduce((sum, e) => sum + Number(e.amount), 0);
    return { count: items.length, total };
  }, [allRecurringExpenses]);

  // Monthly committed total (active recurring, normalized to monthly)
  const monthlyCommitted = useMemo(() => {
    return allRecurringExpenses
      .filter((e) => e.is_active)
      .reduce((sum, e) => {
        const amt = Number(e.amount);
        return sum + (e.frequency === "weekly" ? amt * 4.33 : amt);
      }, 0);
  }, [allRecurringExpenses]);

  return (
    <PageContainer maxWidth="lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Recurring</h1>
          </div>
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

      {/* List Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Subscriptions & Bills</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg shimmer" />)}
      </div>

      {/* Upcoming summary */}
      {!isLoading && allRecurringExpenses.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Next 7 days</p>
                  <p className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                    {formatCurrency(upcoming.total, currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {upcoming.count} {upcoming.count === 1 ? "payment" : "payments"} due
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-4 h-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Monthly committed</p>
                  <p className="text-lg md:text-xl font-bold text-foreground tracking-tight">
                    {formatCurrency(monthlyCommitted, currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {activeCount} active subscriptions
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
          ) : (
            <RecurringExpensesList
              expenses={recurringExpenses}
              onDelete={(id) => deleteRecurringExpense.mutate(id)}
              onToggleActive={(id, isActive) => toggleActive.mutate({ id, is_active: isActive })}
              isDeleting={deleteRecurringExpense.isPending}
              isToggling={toggleActive.isPending}
            />
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
