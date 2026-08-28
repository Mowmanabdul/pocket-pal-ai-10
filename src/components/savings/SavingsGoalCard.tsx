import { GoalWithProgress } from "@/hooks/useSavings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/lib/currencies";
import { format, differenceInCalendarDays } from "date-fns";
import { Plus, Pencil, Trash2, CheckCircle2, Archive, ArchiveRestore } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface SavingsGoalCardProps {
  goal: GoalWithProgress;
  onAddContribution: (goal: GoalWithProgress) => void;
  onEdit: (goal: GoalWithProgress) => void;
  onDelete: (goal: GoalWithProgress) => void;
  onToggleArchive: (goal: GoalWithProgress) => void;
}

export function SavingsGoalCard({
  goal,
  onAddContribution,
  onEdit,
  onDelete,
  onToggleArchive,
}: SavingsGoalCardProps) {
  const { currency } = useCurrency();
  const isComplete = goal.progress >= 100;
  const daysLeft = goal.target_date
    ? differenceInCalendarDays(new Date(goal.target_date), new Date())
    : null;

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: goal.color }} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: goal.color }} />
              <h3 className="font-semibold text-sm text-foreground truncate">{goal.name}</h3>
              {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(goal.saved, currency)} of {formatCurrency(Number(goal.target_amount), currency)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-lg">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleArchive(goal)}>
                {goal.is_archived ? (
                  <>
                    <ArchiveRestore className="w-3.5 h-3.5 mr-2" /> Restore
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(goal)}>
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          <Progress value={goal.progress} className="h-2" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">{goal.progress.toFixed(0)}%</span>
            <span>
              {isComplete
                ? "Goal reached"
                : `${formatCurrency(goal.remaining, currency)} to go`}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground truncate">
            {goal.target_date
              ? daysLeft !== null && daysLeft >= 0
                ? `${format(new Date(goal.target_date), "d MMM yyyy")} · ${daysLeft} days left`
                : `Due ${format(new Date(goal.target_date), "d MMM yyyy")}`
              : `${goal.contributions.length} contribution${goal.contributions.length === 1 ? "" : "s"}`}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-7 text-xs shrink-0"
            onClick={() => onAddContribution(goal)}
          >
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
