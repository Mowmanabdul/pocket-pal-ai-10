import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

const GOAL_COLORS = [
  "hsl(160, 84%, 39%)",
  "hsl(199, 89%, 48%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
  "hsl(35, 92%, 52%)",
  "hsl(0, 84%, 60%)",
];

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Keep it under 60 characters"),
  target_amount: z
    .string()
    .min(1, "Target is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Target must be positive"),
  target_date: z.string().optional(),
  color: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export interface SavingsGoalFormValues {
  name: string;
  target_amount: number;
  target_date: string | null;
  color: string;
}

interface SavingsGoalFormProps {
  onSubmit: (values: SavingsGoalFormValues) => void;
  isLoading?: boolean;
  initialData?: {
    name: string;
    target_amount: number;
    target_date: string | null;
    color: string;
  };
}

export function SavingsGoalForm({ onSubmit, isLoading, initialData }: SavingsGoalFormProps) {
  const { currency } = useCurrency();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      target_amount: initialData ? String(initialData.target_amount) : "",
      target_date: initialData?.target_date ?? "",
      color: initialData?.color ?? GOAL_COLORS[0],
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({
      name: data.name.trim(),
      target_amount: parseFloat(data.target_amount),
      target_date: data.target_date ? data.target_date : null,
      color: data.color,
    });
    if (!initialData) form.reset({ name: "", target_amount: "", target_date: "", color: GOAL_COLORS[0] });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">Goal name</FormLabel>
              <FormControl>
                <Input placeholder="Emergency fund" className="rounded-xl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="target_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Target ({currency.symbol})
                </FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" className="rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">Target date</FormLabel>
                <FormControl>
                  <Input type="date" className="rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">Colour</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  {GOAL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Select colour ${color}`}
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-transform",
                        field.value === color && "ring-2 ring-offset-2 ring-offset-background ring-foreground/40 scale-110"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <PiggyBank className="w-4 h-4 mr-2" />
          )}
          {initialData ? "Save changes" : "Create goal"}
        </Button>
      </form>
    </Form>
  );
}
