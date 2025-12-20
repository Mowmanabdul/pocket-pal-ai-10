import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseFilters } from "@/components/ExpenseFilters";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpenseCategory } from "@/lib/types";

export function ExpensesPage() {
  const { expenses, isLoading, addExpense, deleteExpense } = useExpenses();
  const { currency } = useCurrency();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description?.toLowerCase().includes(searchLower) ||
          e.category.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (category !== "all") {
      result = result.filter((e) => e.category === category);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return Number(b.amount) - Number(a.amount);
        case "amount-asc":
          return Number(a.amount) - Number(b.amount);
        default: // date-desc
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [expenses, search, category, sortBy]);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground">
            {filteredExpenses.length} expenses • Total: {formatCurrency(totalAmount, currency)}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Add New Expense</DialogTitle>
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

      <div className="glass-card rounded-2xl p-6 space-y-6">
        <ExpenseFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading expenses...</div>
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            onDelete={(id) => deleteExpense.mutate(id)}
            isDeleting={deleteExpense.isPending}
          />
        )}
      </div>
    </div>
  );
}
