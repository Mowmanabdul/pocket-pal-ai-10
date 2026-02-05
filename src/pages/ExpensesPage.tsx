import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { DateRangePicker } from "@/components/DateRangePicker";
import { CSVImportDialog } from "@/components/CSVImportDialog";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { DateRange } from "react-day-picker";
import { isWithinInterval, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Expense } from "@/lib/types";

export function ExpensesPage() {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { currency } = useCurrency();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

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
        case "date-asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc": return Number(b.amount) - Number(a.amount);
        case "amount-asc": return Number(a.amount) - Number(b.amount);
        default: return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [expenses, search, category, sortBy, dateRange]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Group expenses by date period
  const groupedExpenses = useMemo(() => {
    const groups: { label: string; expenses: Expense[]; total: number }[] = [];
    const today: Expense[] = [];
    const yesterday: Expense[] = [];
    const thisWeek: Expense[] = [];
    const thisMonth: Expense[] = [];
    const older: Expense[] = [];

    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      if (isToday(date)) today.push(expense);
      else if (isYesterday(date)) yesterday.push(expense);
      else if (isThisWeek(date)) thisWeek.push(expense);
      else if (isThisMonth(date)) thisMonth.push(expense);
      else older.push(expense);
    });

    if (today.length > 0) groups.push({ label: "Today", expenses: today, total: today.reduce((s, e) => s + Number(e.amount), 0) });
    if (yesterday.length > 0) groups.push({ label: "Yesterday", expenses: yesterday, total: yesterday.reduce((s, e) => s + Number(e.amount), 0) });
    if (thisWeek.length > 0) groups.push({ label: "This Week", expenses: thisWeek, total: thisWeek.reduce((s, e) => s + Number(e.amount), 0) });
    if (thisMonth.length > 0) groups.push({ label: "This Month", expenses: thisMonth, total: thisMonth.reduce((s, e) => s + Number(e.amount), 0) });
    if (older.length > 0) groups.push({ label: "Older", expenses: older, total: older.reduce((s, e) => s + Number(e.amount), 0) });

    return groups;
  }, [filteredExpenses]);

  const handleSubmit = (expense: Parameters<typeof addExpense.mutate>[0]) => {
    addExpense.mutate(expense);
    setIsOpen(false);
  };

  const formContent = (
    <ExpenseForm onSubmit={handleSubmit} isLoading={addExpense.isPending} />
  );

  return (
    <PageContainer maxWidth="md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            {filteredExpenses.length} items · <span className="font-medium text-foreground">{formatCurrency(totalAmount, currency)}</span>
          </p>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-xl text-xs h-8" onClick={() => setIsImportOpen(true)}>
            <Upload className="w-3.5 h-3.5 mr-1.5" />Import
          </Button>
          <Dialog open={!isMobile && isOpen} onOpenChange={(open) => !isMobile && setIsOpen(open)}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl text-xs h-8" onClick={() => setIsOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">New Expense</DialogTitle>
              </DialogHeader>
              {formContent}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <CSVImportDialog open={isImportOpen} onOpenChange={setIsImportOpen} />

      {/* Filters */}
      <div className="glass-card-elevated rounded-xl p-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
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

        {/* Expense List */}
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg shimmer" />)}
          </div>
        ) : groupedExpenses.length > 0 ? (
          <div className="space-y-4">
            {groupedExpenses.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</h3>
                  <span className="text-xs font-medium text-foreground">{formatCurrency(group.total, currency)}</span>
                </div>
                <ExpenseList
                  expenses={group.expenses}
                  onDelete={(id) => deleteExpense.mutate(id)}
                  onEdit={(expense) => updateExpense.mutate(expense)}
                  onDuplicate={(expense) => addExpense.mutate(expense)}
                  isDeleting={deleteExpense.isPending}
                  isUpdating={updateExpense.isPending}
                  isAdding={addExpense.isPending}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No expenses found</p>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      <Drawer open={isMobile && isOpen} onOpenChange={(open) => isMobile && setIsOpen(open)}>
        <DrawerTrigger asChild>
          <button className="fab-button md:hidden" onClick={() => setIsOpen(true)}>
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">New Expense</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">{formContent}</div>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
}
