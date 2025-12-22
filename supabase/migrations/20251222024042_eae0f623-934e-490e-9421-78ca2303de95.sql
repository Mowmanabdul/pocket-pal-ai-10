-- Create table for custom category labels
CREATE TABLE public.category_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category public.expense_category NOT NULL,
  custom_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Enable Row Level Security
ALTER TABLE public.category_labels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own category labels"
ON public.category_labels
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own category labels"
ON public.category_labels
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category labels"
ON public.category_labels
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category labels"
ON public.category_labels
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_category_labels_updated_at
BEFORE UPDATE ON public.category_labels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();