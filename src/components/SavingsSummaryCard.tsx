import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useSavings } from "@/hooks/useSavings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";

export function SavingsSummaryCard() {
  const { goalsWithProgress, totalSaved, totalTarget, isLoading } = useSavings();
  const { currency } = useCurrency();

  const active = goalsWithProgress.filter((g) => !g.is_archived);
  const overall = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const top = [...active].sort((a, b) => b.progress - a.progress).slice(0, 3);

  return (
    <Card className="border-border/50 shadow-sm h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
            <PiggyBank className="w-3.5 h-3.5 text-primary" />
          </div>
          Savings
        </CardTitle>
        <Link to="/savings">
          <Button variant="ghost" size="sm" className="text-primary text-xs h-7 px-2 -mr-2">
            View
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {isLoading ? (
          <div className="h-24 rounded-lg shimmer" />
        ) : active.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-muted-foreground">No savings goals yet.</p>
            <Link to="/savings">
              <Button size="sm" variant="outline" className="rounded-xl text-xs">Set a goal</Button>
            </Link>
          </div>
        ) : (
          <>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalSaved, currency)}</p>
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(totalTarget, currency)} · {overall.toFixed(0)}% saved
              </p>
            </div>
            <div className="space-y-2">
              {top.map((goal) => (
                <div key={goal.id} className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
                      <span className="truncate text-foreground font-medium">{goal.name}</span>
                    </span>
                    <span className="text-muted-foreground shrink-0">{goal.progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
