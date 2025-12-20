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
  created_at: string;
  updated_at: string;
}

export const categoryConfig: Record<ExpenseCategory, { label: string; color: string; icon: string }> = {
  food: { label: 'Food & Dining', color: 'hsl(38, 92%, 50%)', icon: '🍕' },
  transport: { label: 'Transport', color: 'hsl(200, 70%, 50%)', icon: '🚗' },
  entertainment: { label: 'Entertainment', color: 'hsl(280, 65%, 60%)', icon: '🎬' },
  shopping: { label: 'Shopping', color: 'hsl(340, 75%, 55%)', icon: '🛍️' },
  utilities: { label: 'Utilities', color: 'hsl(180, 60%, 45%)', icon: '💡' },
  health: { label: 'Health', color: 'hsl(160, 84%, 39%)', icon: '💊' },
  education: { label: 'Education', color: 'hsl(220, 70%, 55%)', icon: '📚' },
  other: { label: 'Other', color: 'hsl(0, 0%, 50%)', icon: '📦' },
};
