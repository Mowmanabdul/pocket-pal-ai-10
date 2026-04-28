import { useExpenses } from "@/hooks/useExpenses";
import { StatsCards } from "@/components/StatsCards";
import { SpendingChart } from "@/components/SpendingChart";
import { BudgetProgress } from "@/components/BudgetProgress";
import { BudgetAlerts } from "@/components/BudgetAlerts";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseForm } from "@/components/ExpenseForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { WeeklySummary } from "@/components/WeeklySummary";
import { useState } from "react";
import { Link } from "react-router-dom";
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
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardPage() {
  const { expenses, isLoading, addExpense, updateExpense, deleteExpense } = useExpenses();
  const [isOpen, setIsOpen] = useState(false);
  const { currency } = useCurrency();
  const isMobile = useIsMobile();

  const overallTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleSubmit = (expense: Parameters<typeof addExpense.mutate>[0]) => {
    addExpense.mutate(expense);
    setIsOpen(false);
  };

  const formContent = (
    <ExpenseForm
      onSubmit={handleSubmit}
      isLoading={addExpense.isPending}
    />
  );

  return (
    <PageContainer maxWidth="xl">
      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {getGreeting()}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Total tracked · <span className="font-semibold text-foreground">{formatCurrency(overallTotal, currency)}</span>
          </p>
        </div>
        
        {/* Desktop Add Button */}
        <Dialog open={!isMobile && isOpen} onOpenChange={(open) => !isMobile && setIsOpen(open)}>
          <DialogTrigger asChild>
            <Button 
              size="sm"
              className="hidden md:flex rounded-xl h-9 px-4 text-sm font-medium shadow-sm"
              onClick={() => setIsOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Expense
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

      {/* Budget Alerts */}
      <BudgetAlerts expenses={expenses} />

      {/* Stats Cards */}
      <StatsCards expenses={expenses} />

      {/* Main Grid - Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Spending Chart */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
              </div>
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SpendingChart expenses={expenses} />
          </CardContent>
        </Card>

        {/* Budget Progress */}
        <div className="lg:col-span-1">
          <BudgetProgress expenses={expenses} />
        </div>
      </div>

      {/* Weekly Summary + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <WeeklySummary expenses={expenses} />
        </div>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
            {expenses.length > 5 && (
              <Link to="/expenses">
                <Button variant="ghost" size="sm" className="text-primary text-xs h-7 px-2 -mr-2">
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg shimmer" />
                ))}
              </div>
            ) : (
              <ExpenseList
                expenses={expenses.slice(0, 5)}
                onDelete={(id) => deleteExpense.mutate(id)}
                onEdit={(expense) => updateExpense.mutate(expense)}
                onDuplicate={(expense) => addExpense.mutate(expense)}
                isDeleting={deleteExpense.isPending}
                isUpdating={updateExpense.isPending}
                isAdding={addExpense.isPending}
                compact
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mobile FAB */}
      <Drawer open={isMobile && isOpen} onOpenChange={(open) => isMobile && setIsOpen(open)}>
        <DrawerTrigger asChild>
          <button 
            className="fab-button md:hidden"
            onClick={() => setIsOpen(true)}
          >
            <Plus className="w-6 h-6 text-primary-foreground" />
          </button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-lg font-bold">New Expense</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    </PageContainer>
  );
}
