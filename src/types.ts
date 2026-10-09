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
  day: number;
  dateStr: string;
  dayOfWeek: string;
  exp: number;
  inc: number;
  net: number;
  count: number;
  hasActivity: boolean;
}

export interface AppUser {
  username: string;
  password: string;
  displayName: string;
  sheetTab: string;
  initialUsername: string;
  createdAt: string;
  needsSetup?: boolean;
  role?: 'admin' | 'member';
  isActive?: boolean;
}
