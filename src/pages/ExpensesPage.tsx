import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { DateRangePicker } from "@/components/DateRangePicker";
import { CSVImportDialog } from "@/components/CSVImportDialog";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, Receipt, Download } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCategoryLabelsContext } from "@/contexts/CategoryLabelsContext";
import { formatCurrency } from "@/lib/currencies";
import { DateRange } from "react-day-picker";
import { isWithinInterval, isToday, isYesterday, isThisWeek, isThisMonth, startOfWeek, startOfMonth, endOfDay } from "date-fns";
import { exportToCSV } from "@/lib/pdfExport";
import { cn } from "@/lib/utils";
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

type QuickRange = "all" | "today" | "week" | "month";

export function ExpensesPage() {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { currency } = useCurrency();
  const { getCategoryConfig } = useCategoryLabelsContext();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [quickRange, setQuickRange] = useState<QuickRange>("all");

  // Apply quick range to dateRange
  const applyQuickRange = (range: QuickRange) => {
    setQuickRange(range);
    const now = new Date();
    if (range === "all") setDateRange(undefined);
    else if (range === "today") setDateRange({ from: now, to: endOfDay(now) });
    else if (range === "week") setDateRange({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) });
    else if (range === "month") setDateRange({ from: startOfMonth(now), to: endOfDay(now) });
  };

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
    <PageContainer maxWidth="lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Expenses</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredExpenses.length} items · <span className="font-semibold text-foreground">{formatCurrency(totalAmount, currency)}</span>
          </p>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs h-8"
            onClick={() => exportToCSV({ expenses: filteredExpenses, currency, getCategoryConfig })}
            disabled={filteredExpenses.length === 0}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />Export
          </Button>
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

      {/* Quick date range chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {([
          { key: "all", label: "All time" },
          { key: "today", label: "Today" },
          { key: "week", label: "This week" },
          { key: "month", label: "This month" },
        ] as const).map((chip) => (
          <button
            key={chip.key}
            onClick={() => applyQuickRange(chip.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
              quickRange === chip.key
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-secondary/60 text-muted-foreground border-transparent hover:bg-secondary"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Filters Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4">
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
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {/* Expense List */}
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg shimmer" />)}
            </div>
          ) : groupedExpenses.length > 0 ? (
            <div className="space-y-5">
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
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No expenses found</p>
              <p className="text-muted-foreground text-xs mt-1">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

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
