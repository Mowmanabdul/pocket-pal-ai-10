import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { DateRange } from "react-day-picker";
import { isWithinInterval } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ExpensesPage() {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { currency } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Date range filter
    if (dateRange?.from) {
      result = result.filter((e) => {
        const expenseDate = new Date(e.date);
        if (dateRange.to) {
          return isWithinInterval(expenseDate, { start: dateRange.from!, end: dateRange.to });
        }
        return expenseDate >= dateRange.from!;
      });
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description?.toLowerCase().includes(searchLower) ||
          e.category.toLowerCase().includes(searchLower)
      );
    }

    if (category !== "all") {
      result = result.filter((e) => e.category === category);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return Number(b.amount) - Number(a.amount);
        case "amount-asc":
          return Number(a.amount) - Number(b.amount);
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [expenses, search, category, sortBy, dateRange]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="p-3 md:p-6 space-y-4 max-w-5xl mx-auto min-w-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Expenses</h1>
              <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                <span className="font-medium text-primary">{filteredExpenses.length}</span>
                <span>items</span>
                <span>•</span>
                <span className="font-medium text-foreground">{formatCurrency(totalAmount, currency)}</span>
              </div>
            </div>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden md:flex bg-primary text-primary-foreground rounded-lg text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add New Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm
              onSubmit={(expense) => {
                addExpense.mutate(expense);
                setIsDialogOpen(false);
              }}
              isLoading={addExpense.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & List */}
      <div className="glass-card-elevated rounded-xl p-3 md:p-4 space-y-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
          <ExpenseFilters
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl shimmer" />
            ))}
          </div>
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            onDelete={(id) => deleteExpense.mutate(id)}
            onEdit={(expense) => updateExpense.mutate(expense)}
            onDuplicate={(expense) => addExpense.mutate(expense)}
            isDeleting={deleteExpense.isPending}
            isUpdating={updateExpense.isPending}
            isAdding={addExpense.isPending}
          />
        )}
      </div>

      {/* Mobile FAB */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <button className="fab-button md:hidden bottom-24 right-4">
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </DialogTrigger>
      </Dialog>
    </div>
  );
}
