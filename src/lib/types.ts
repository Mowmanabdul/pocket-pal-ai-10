export type ExpenseCategory = 
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'shopping'
  | 'utilities'
  | 'health'
  | 'education'
  | 'other';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string | null;
  date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export const categoryConfig: Record<ExpenseCategory, { label: string; color: string }> = {
  food: { label: 'Food & Dining', color: 'hsl(38, 92%, 50%)' },
  transport: { label: 'Transport', color: 'hsl(200, 70%, 50%)' },
  entertainment: { label: 'Entertainment', color: 'hsl(280, 65%, 60%)' },
  shopping: { label: 'Shopping', color: 'hsl(340, 75%, 55%)' },
  utilities: { label: 'Utilities', color: 'hsl(180, 60%, 45%)' },
  health: { label: 'Health', color: 'hsl(160, 84%, 39%)' },
  education: { label: 'Education', color: 'hsl(220, 70%, 55%)' },
  other: { label: 'Other', color: 'hsl(0, 0%, 50%)' },
};
