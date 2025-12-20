import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ExpensesPage() {
  const { expenses, isLoading, addExpense, deleteExpense } = useExpenses();
  const { currency } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

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
  }, [expenses, search, category, sortBy]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Receipt className="w-7 h-7 text-primary" />
            Expenses
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              {filteredExpenses.length} items
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground font-medium">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hidden md:flex bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-glow hover:shadow-lg transition-all rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Expense</DialogTitle>
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
      <div className="glass-card-elevated rounded-2xl p-4 md:p-6 space-y-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <ExpenseFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

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
            isDeleting={deleteExpense.isPending}
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
