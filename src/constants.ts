import { Transaction } from './types';

export const EXPENSE_CATEGORIES: string[] = [
  '🏠 Room Rent (রুম ভাড়া)',
  '🛒 Bajar (বাজার)',
  '🔥 Gas Bill (গ্যাস বিল)',
  '🚗 Travel (যাতায়াত)',
  '📶 WiFi (ওয়াইফাই)',
  '⚡ Electricity (বিদ্যুৎ)',
  '👨‍👩‍👦 Relatives (আত্মীয়-স্বজন)',
  '💊 Medicines (ঔষধ)',
  '🛏️ Room Accessories (রুমের জিনিসপত্র)',
  '🏡 Family Cost (ফ্যামিলি খরচ)',
  '❤ Mr & Mrs (ব্যক্তিগত/দম্পতি)',
  '🌙 Eid Cost (ঈদ খরচ)',
  '🐦 Pakhi (পাখি)',
  '💼 Official (অফিসিয়াল)',
  '🍎 Fruits (ফলমূল)',
  '💸 Loan Given (ধার দেওয়া)',
  '☕ Ghoraghuri/Adda (ঘোরাঘুরি/আড্ডা)',
  '🤝 Loan Repaid (ধার শোধ)',
  '👤 Personal (পার্সোনাল)',
  '🛍️ Shopping (শপিং)',
  '🍲 Food (খাবার)',
  '🏡 Home (বাসার খরচ)',
  '🏷️ Others (অন্যান্য)',
];

export const INCOME_CATEGORIES: string[] = [
  '💰 Salary (বেতন)',
  '📈 Arrear (বকেয়া)',
  '🤝 Borrowed Money (ধার নেওয়া)',
  '💵 Loan Repayment (ঋণ পরিষদ পাওয়া)',
  '📱 Bkash Load (বিকাশ লোড)',
  '🎁 Bonus (বোনাস)',
  '💻 Freelancing (ফ্রিল্যান্সিং)',
  '🏷️ Other Income (অন্যান্য)',
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwdR3oDJiUFWFopvUeLI-8r92-9uS-jRUdRKFW3CghmmIy84sQZjNEeEkY6yboG8g4z/exec';
