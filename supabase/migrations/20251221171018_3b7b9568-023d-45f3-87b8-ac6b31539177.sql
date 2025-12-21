-- Create recurring expenses table
CREATE TABLE public.recurring_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category expense_category NOT NULL DEFAULT 'other',
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_occurrence DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own recurring expenses" 
ON public.recurring_expenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring expenses" 
ON public.recurring_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring expenses" 
ON public.recurring_expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring expenses" 
ON public.recurring_expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recurring_expenses_updated_at
BEFORE UPDATE ON public.recurring_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();