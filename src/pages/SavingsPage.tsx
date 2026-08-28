import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ResponsiveSheet } from "@/components/layout/ResponsiveSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, Target, TrendingUp } from "lucide-react";
import { useSavings, GoalWithProgress } from "@/hooks/useSavings";
import { SavingsGoalCard } from "@/components/savings/SavingsGoalCard";
import { SavingsGoalForm, SavingsGoalFormValues } from "@/components/savings/SavingsGoalForm";
import { ContributionForm } from "@/components/savings/ContributionForm";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { format } from "date-fns";

export function SavingsPage() {
  const {
    goalsWithProgress,
    contributions,
    totalSaved,
    totalTarget,
    isLoading,
    addGoal,
    updateGoal,
    deleteGoal,
    addContribution,
  } = useSavings();
  const { currency } = useCurrency();

  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<GoalWithProgress | null>(null);
  const [contributeGoal, setContributeGoal] = useState<GoalWithProgress | null>(null);

  const activeGoals = useMemo(() => goalsWithProgress.filter((g) => !g.is_archived), [goalsWithProgress]);
  const archivedGoals = useMemo(() => goalsWithProgress.filter((g) => g.is_archived), [goalsWithProgress]);
  const overallProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const recent = useMemo(() => contributions.slice(0, 6), [contributions]);
  const goalName = (id: string) => goalsWithProgress.find((g) => g.id === id)?.name ?? "Goal";

  const handleCreate = (values: SavingsGoalFormValues) => {
    addGoal.mutate(values, { onSuccess: () => setCreateOpen(false) });
  };

  const handleEdit = (values: SavingsGoalFormValues) => {
    if (!editGoal) return;
    updateGoal.mutate({ id: editGoal.id, ...values }, { onSuccess: () => setEditGoal(null) });
  };

  const handleContribute = (values: { amount: number; date: string; note: string | null }) => {
    if (!contributeGoal) return;
    addContribution.mutate(
      { goal_id: contributeGoal.id, ...values },
      { onSuccess: () => setContributeGoal(null) }
    );
  };

  if (isLoading) {
    return (
      <PageContainer maxWidth="xl">
        <div className="h-12 rounded-xl shimmer" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
        </div>
        <div className="h-40 rounded-xl shimmer" />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <PiggyBank className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">Savings</h1>
        </div>
        <Button
          size="sm"
          className="hidden md:flex rounded-xl h-9 px-4 text-sm font-medium shadow-sm"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Goal
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Saved</span>
              <PiggyBank className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-lg md:text-2xl font-bold text-foreground">{formatCurrency(totalSaved, currency)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Target</span>
              <Target className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-lg md:text-2xl font-bold text-foreground">{formatCurrency(totalTarget, currency)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wide">Progress</span>
              <TrendingUp className="w-3.5 h-3.5 text-success" />
            </div>
            <p className="text-lg md:text-2xl font-bold text-success">{overallProgress.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      {activeGoals.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No savings goals yet</p>
              <p className="text-sm text-muted-foreground">Set a target and track every contribution towards it.</p>
            </div>
            <Button size="sm" className="rounded-xl" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Create your first goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {activeGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onAddContribution={setContributeGoal}
              onEdit={setEditGoal}
              onDelete={(g) => deleteGoal.mutate(g.id)}
              onToggleArchive={(g) => updateGoal.mutate({ id: g.id, is_archived: !g.is_archived })}
            />
          ))}
        </div>
      )}

      {/* Recent contributions */}
      {recent.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Contributions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {recent.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{goalName(c.goal_id)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {format(new Date(c.date), "d MMM yyyy")}{c.note ? ` · ${c.note}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-success shrink-0">
                  +{formatCurrency(Number(c.amount), currency)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Archived */}
      {archivedGoals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Archived</h2>
          <div className="grid gap-3 md:grid-cols-2 opacity-70">
            {archivedGoals.map((goal) => (
              <SavingsGoalCard
                key={goal.id}
                goal={goal}
                onAddContribution={setContributeGoal}
                onEdit={setEditGoal}
                onDelete={(g) => deleteGoal.mutate(g.id)}
                onToggleArchive={(g) => updateGoal.mutate({ id: g.id, is_archived: !g.is_archived })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <button className="fab-button md:hidden" onClick={() => setCreateOpen(true)} aria-label="New savings goal">
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      <ResponsiveSheet open={createOpen} onOpenChange={setCreateOpen} title="New Savings Goal">
        <SavingsGoalForm onSubmit={handleCreate} isLoading={addGoal.isPending} />
      </ResponsiveSheet>

      <ResponsiveSheet
        open={!!editGoal}
        onOpenChange={(open) => !open && setEditGoal(null)}
        title="Edit Savings Goal"
      >
        {editGoal && (
          <SavingsGoalForm
            key={editGoal.id}
            onSubmit={handleEdit}
            isLoading={updateGoal.isPending}
            initialData={{
              name: editGoal.name,
              target_amount: Number(editGoal.target_amount),
              target_date: editGoal.target_date,
              color: editGoal.color,
            }}
          />
        )}
      </ResponsiveSheet>

      <ResponsiveSheet
        open={!!contributeGoal}
        onOpenChange={(open) => !open && setContributeGoal(null)}
        title={contributeGoal ? `Add to ${contributeGoal.name}` : "Add contribution"}
      >
        <ContributionForm onSubmit={handleContribute} isLoading={addContribution.isPending} />
      </ResponsiveSheet>
    </PageContainer>
  );
}
