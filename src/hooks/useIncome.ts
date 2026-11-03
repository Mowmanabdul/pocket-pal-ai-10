import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IncomeTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
}

export function useIncome() {
  const queryClient = useQueryClient();

  const { data: income = [], isLoading, error } = useQuery({
    queryKey: ["income"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_transactions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as IncomeTransaction[];
    },
  });

  const insertIncome = async (
    rows: { amount: number; description?: string; date: string }[]
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    if (rows.length === 0) return;

    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200).map((r) => ({ ...r, user_id: user.id }));
      const { error } = await supabase.from("income_transactions").insert(chunk);
      if (error) throw error;
    }
    queryClient.invalidateQueries({ queryKey: ["income"] });
  };

  return { income, isLoading, error, insertIncome };
}
