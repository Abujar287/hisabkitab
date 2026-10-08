export type TransactionType = 'Expense' | 'Income';

export interface Transaction {
  id: string;
  datetime?: string;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  value: number;
  note?: string;
}

export interface DaySummary {
  exp: number;
  inc: number;
  count: number;
}
