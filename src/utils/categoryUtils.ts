export function cleanCategoryName(cat: string, targetLang: 'en' | 'bn' = 'en'): string {
  if (!cat) return '';

  let cleaned = String(cat).trim();

  // 1. Strip leading emojis and symbols (e.g. 👤, 🛒, 🍲, 🏠, etc.)
  cleaned = cleaned.replace(/^[\p{Extended_Pictographic}\p{Emoji}\s]+/u, '').trim();

  // 2. Remove redundant 'expense', 'expanse' (spelling variants), 'income', 'খরচ', 'ব্যয়', 'আয়'
  // along with surrounding parens, colons, or dashes
  cleaned = cleaned
    .replace(/\s*[-:(]?\s*(?:expense|expanse|income|খরচ|ব্যয়|আয়)\s*\)?/gi, '')
    .trim();

  // 3. Remove bilingual parentheses e.g. (পাখি), (Personal), (বাজার), (খাবার), etc.
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '').trim();

  if (targetLang === 'en') {
    // English mapping
    if (/^(?:অন্যান্য\s*আয়|other\s*income)$/i.test(cleaned)) return 'Other Income';
    if (/^(?:অন্যান্য(?:\s*খরচ)?|others?)$/i.test(cleaned)) return 'Others';
    if (/^(?:রুম\s*ভাড়া|room\s*rent|rent)$/i.test(cleaned)) return 'Room Rent';
    if (/^(?:বাজার|bajar|bazar|grocery)$/i.test(cleaned)) return 'Bajar';
    if (/^(?:খাবার|food|meal)$/i.test(cleaned)) return 'Food';
    if (/^(?:পার্সোনাল|personal)$/i.test(cleaned)) return 'Personal';
    if (/^(?:ওয়াইফাই|wifi)$/i.test(cleaned)) return 'WiFi';
    if (/^(?:বিদ্যুৎ|electricity|electric)$/i.test(cleaned)) return 'Electricity';
    if (/^(?:ঔষধ|medicines?|medicine|meds?)$/i.test(cleaned)) return 'Medicines';
    if (/^(?:পাখি|pakhi|bird)$/i.test(cleaned)) return 'Pakhi';
    if (/^(?:শপিং|কেনাকাটা|shopping)$/i.test(cleaned)) return 'Shopping';
    if (/^(?:যাতায়াত|পরিবহন|transport)$/i.test(cleaned)) return 'Transport';
    if (/^(?:বেতন|salary)$/i.test(cleaned)) return 'Salary';
    if (/^(?:বকেয়া|arrear)$/i.test(cleaned)) return 'Arrear';
    if (/^(?:ধার\s*নেওয়া|borrowed\s*money|borrowed)$/i.test(cleaned)) return 'Borrowed Money';
    if (/^(?:ধার\/ঋণ|ঋণ|loan)$/i.test(cleaned)) return 'Loan';

    // Fallback: capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // targetLang === 'bn'
  if (/^(?:other\s*income|অন্যান্য\s*আয়)$/i.test(cleaned)) return 'অন্যান্য আয়';
  if (/^(?:others?|অন্যান্য(?:\s*খরচ)?)$/i.test(cleaned)) return 'অন্যান্য';
  if (/^(?:room\s*rent|rent|রুম\s*ভাড়া)$/i.test(cleaned)) return 'রুম ভাড়া';
  if (/^(?:bajar|bazar|grocery|বাজার)$/i.test(cleaned)) return 'বাজার';
  if (/^(?:food|meal|খাবার)$/i.test(cleaned)) return 'খাবার';
  if (/^(?:personal|পার্সোনাল)$/i.test(cleaned)) return 'পার্সোনাল';
  if (/^(?:wifi|ওয়াইফাই)$/i.test(cleaned)) return 'ওয়াইফাই';
  if (/^(?:electricity|electric|বিদ্যুৎ)$/i.test(cleaned)) return 'বিদ্যুৎ';
  if (/^(?:medicines?|medicine|meds?|ঔষধ)$/i.test(cleaned)) return 'ঔষধ';
  if (/^(?:pakhi|bird|পাখি)$/i.test(cleaned)) return 'পাখি';
  if (/^(?:shopping|কেনাকাটা|শপিং)$/i.test(cleaned)) return 'শপিং';
  if (/^(?:transport|পরিবহন|যাতায়াত)$/i.test(cleaned)) return 'যাতায়াত';
  if (/^(?:salary|বেতন)$/i.test(cleaned)) return 'বেতন';
  if (/^(?:arrear|বকেয়া)$/i.test(cleaned)) return 'বকেয়া';
  if (/^(?:borrowed\s*money|borrowed|ধার\s*নেওয়া)$/i.test(cleaned)) return 'ধার নেওয়া';
  if (/^(?:loan|ঋণ|ধার\/ঋণ)$/i.test(cleaned)) return 'ধার/ঋণ';

  return cleaned || 'অন্যান্য';
}

export function getCategoryEmoji(catName: string): string {
  const match = catName.match(/^(\p{Extended_Pictographic}|\p{Emoji})/u);
  if (match) return match[0];

  const lower = catName.toLowerCase();
  if (lower.includes('rent') || lower.includes('রুম')) return '🏠';
  if (lower.includes('bajar') || lower.includes('bazar') || lower.includes('বাজার') || lower.includes('grocery')) return '🛒';
  if (lower.includes('food') || lower.includes('খাবার')) return '🍲';
  if (lower.includes('personal') || lower.includes('পার্সোনাল')) return '👤';
  if (lower.includes('wifi') || lower.includes('ওয়াইফাই')) return '📶';
  if (lower.includes('electricity') || lower.includes('বিদ্যুৎ')) return '⚡';
  if (lower.includes('medicine') || lower.includes('ঔষধ')) return '💊';
  if (lower.includes('pakhi') || lower.includes('পাখি')) return '🐦';
  if (lower.includes('transport') || lower.includes('যাতায়াত')) return '🚗';
  if (lower.includes('shopping') || lower.includes('শপিং')) return '🛍️';
  if (lower.includes('salary') || lower.includes('বেতন')) return '💰';
  if (lower.includes('loan') || lower.includes('ধার')) return '🤝';
  return '🏷️';
}
