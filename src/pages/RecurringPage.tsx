import { useState } from "react";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { RecurringExpenseForm } from "@/components/RecurringExpenseForm";
import { RecurringExpensesList } from "@/components/RecurringExpensesList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, Play, Loader2 } from "lucide-react";

export function RecurringPage() {
  const {
    recurringExpenses,
    isLoading,
    addRecurringExpense,
    deleteRecurringExpense,
    toggleActive,
    processRecurring,
  } = useRecurringExpenses();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const activeCount = recurringExpenses.filter(e => e.is_active).length;

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-4xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-chart-4 to-chart-5 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground">Recurring</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {activeCount} active · {recurringExpenses.length} total
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => processRecurring.mutate()}
            disabled={processRecurring.isPending}
            className="gap-1.5 h-8 text-xs"
          >
            {processRecurring.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Process
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">New Recurring Expense</DialogTitle>
              </DialogHeader>
              <RecurringExpenseForm
                onSubmit={(data) => {
                  addRecurringExpense.mutate(data);
                  setIsDialogOpen(false);
                }}
                isLoading={addRecurringExpense.isPending}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info Card */}
      <Card className="glass-card border-primary/20 bg-primary/5 animate-fade-in" style={{ animationDelay: "50ms" }}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">How it works</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recurring expenses auto-create entries based on frequency. Click "Process" to trigger pending ones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="glass-card animate-fade-in" style={{ animationDelay: "100ms" }}>
        <CardHeader className="pb-2 pt-3 px-3 md:px-4">
          <CardTitle className="text-sm font-semibold">Your Recurring Expenses</CardTitle>
          <CardDescription className="text-xs">Subscriptions and bills</CardDescription>
        </CardHeader>
        <CardContent className="px-3 pb-3 md:px-4 md:pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg shimmer" />
              ))}
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
        </CardContent>
      </Card>
    </div>
  );
}
