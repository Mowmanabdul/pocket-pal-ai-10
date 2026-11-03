CREATE TABLE public.income_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT income_transactions_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.income_transactions TO authenticated;
GRANT ALL ON public.income_transactions TO service_role;

ALTER TABLE public.income_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own income transactions"
  ON public.income_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income transactions"
  ON public.income_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income transactions"
  ON public.income_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income transactions"
  ON public.income_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER set_income_transactions_updated_at
  BEFORE UPDATE ON public.income_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();