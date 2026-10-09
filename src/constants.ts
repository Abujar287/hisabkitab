import { Transaction } from './types';

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  '🏠 Room Rent (রুম ভাড়া)',
  '💊 Medicines (ঔষধ)',
  '🛒 Bajar (বাজার)',
  '📶 WiFi (ওয়াইফাই)',
  '⚡ Electricity (বিদ্যুৎ)',
  '🛍️ Shopping (শপিং)',
  '🏷️ Others (অন্যান্য)',
];

export const DEFAULT_INCOME_CATEGORIES: string[] = [
  '💰 Salary (বেতন)',
  '🤝 Loan (ধার/ঋণ)',
  '📈 Previous Month Arrear (বকেয়া)',
];

export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;
export const INCOME_CATEGORIES = DEFAULT_INCOME_CATEGORIES;

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwdR3oDJiUFWFopvUeLI-8r92-9uS-jRUdRKFW3CghmmIy84sQZjNEeEkY6yboG8g4z/exec';
