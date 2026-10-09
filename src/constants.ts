import { Transaction } from './types';

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  '🐦 Pakhi (পাখি)',
  '👤 Personal (পার্সোনাল)',
  '🛒 Bajar (বাজার)',
  '🍲 Food (খাবার)',
  '🏠 Room Rent (রুম ভাড়া)',
  '📶 WiFi (ওয়াইফাই)',
  '⚡ Electricity (বিদ্যুৎ)',
  '💊 Medicines (ঔষধ)',
  '🚗 Transport (যাতায়াত)',
  '🛍️ Shopping (কেনাকাটা)',
  '🏷️ Others (অন্যান্য)',
];

export const DEFAULT_INCOME_CATEGORIES: string[] = [
  '💰 Salary (বেতন)',
  '📈 Arrear (বকেয়া)',
  '🤝 Borrowed Money (ধার নেওয়া)',
  '🤝 Loan (ঋণ)',
  '🏷️ Other Income (অন্যান্য আয়)',
];

export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;
export const INCOME_CATEGORIES = DEFAULT_INCOME_CATEGORIES;

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwdR3oDJiUFWFopvUeLI-8r92-9uS-jRUdRKFW3CghmmIy84sQZjNEeEkY6yboG8g4z/exec';
