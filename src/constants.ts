import { Transaction } from './types';

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
  '💰 Savings',
  '🔥 Gas',
  '🏍️ Travel',
  '📶 WiFi',
  '⚡ Electricity',
  '👥 Relatives',
  '💊 Medicine',
  '🏠 Room Rent',
  '🛋️ Room Accessories',
  '🛒 Bajar',
  '👨‍👩‍👧 Family\'s Cost',
  '💑 Mr & Mrs',
  '🌙 Eid',
  '🐦 Pakhi',
  '💻 Official',
  '🍍 Fruits',
  '🏷️ Others',
  '🤝 ধার দিয়েছি',
  '☕ Hangout',
  '💳 ধার শোধ',
  '👤 Personal',
  '🛍️ Shopping',
  '🍽️ Food',
  '🏡 Home',
];

export const DEFAULT_INCOME_CATEGORIES: string[] = [
  '💰 Salary (বেতন)',
  '📈 Arrear (বকেয়া)',
  '🤝 Borrowed Money (ধার নেওয়া)',
  '💼 Business (ব্যবসা)',
  '🎁 Bonus (বোনাস)',
  '🏷️ Other Income (অন্যান্য আয়)',
];

export const EXPENSE_CATEGORIES = DEFAULT_EXPENSE_CATEGORIES;
export const INCOME_CATEGORIES = DEFAULT_INCOME_CATEGORIES;

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwdR3oDJiUFWFopvUeLI-8r92-9uS-jRUdRKFW3CghmmIy84sQZjNEeEkY6yboG8g4z/exec';
