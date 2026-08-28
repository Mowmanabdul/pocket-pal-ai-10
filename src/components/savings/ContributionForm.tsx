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
import { Loader2, Plus } from "lucide-react";

const formSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  note: z.string().max(120).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContributionFormProps {
  onSubmit: (values: { amount: number; date: string; note: string | null }) => void;
  isLoading?: boolean;
}

export function ContributionForm({ onSubmit, isLoading }: ContributionFormProps) {
  const { currency } = useCurrency();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      date: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({
      amount: parseFloat(data.amount),
      date: data.date,
      note: data.note?.trim() ? data.note.trim() : null,
    });
    form.reset({ amount: "", date: data.date, note: "" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Amount ({currency.symbol})
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
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">Date</FormLabel>
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
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground">Note (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Payday transfer" className="rounded-xl" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full rounded-xl" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Add to goal
        </Button>
      </form>
    </Form>
  );
}
