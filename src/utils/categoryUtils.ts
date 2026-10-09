export function cleanCategoryName(cat: string, targetLang: 'en' | 'bn' = 'en'): string {
  if (!cat) return '';
  if (targetLang === 'en') {
    let cleaned = cat.replace(/\s*\([^)]*[\u0980-\u09FF]+[^)]*\)/g, '').trim();
    cleaned = cleaned
      .replace(/অন্যান্য আয়/g, 'Other Income')
      .replace(/অন্যান্য খরচ/g, 'Other Expense')
      .replace(/রুম ভাড়া/g, 'Room Rent')
      .replace(/বাজার/g, 'Bajar')
      .replace(/খাবার/g, 'Food')
      .replace(/পার্সোনাল/g, 'Personal')
      .replace(/ওয়াইফাই/g, 'WiFi')
      .replace(/বিদ্যুৎ/g, 'Electricity')
      .replace(/ঔষধ/g, 'Medicines')
      .replace(/পাখি/g, 'Pakhi')
      .replace(/শপিং/g, 'Shopping')
      .replace(/অন্যান্য/g, 'Others')
      .replace(/বেতন/g, 'Salary')
      .replace(/বকেয়া/g, 'Arrear')
      .replace(/ধার নেওয়া/g, 'Borrowed Money')
      .replace(/ধার\/ঋণ/g, 'Loan');
    return cleaned.trim();
  }

  // targetLang === 'bn'
  let cleaned = cat;
  cleaned = cleaned
    .replace(/Room Rent/gi, 'রুম ভাড়া')
    .replace(/Bajar/gi, 'বাজার')
    .replace(/Food/gi, 'খাবার')
    .replace(/Personal/gi, 'ব্যক্তিগত')
    .replace(/WiFi/gi, 'ওয়াইফাই')
    .replace(/Electricity/gi, 'বিদ্যুৎ')
    .replace(/Medicines?/gi, 'ঔষধ')
    .replace(/Transport/gi, 'যাতায়াত')
    .replace(/Shopping/gi, 'শপিং')
    .replace(/Other Expense/gi, 'অন্যান্য খরচ')
    .replace(/Other Income/gi, 'অন্যান্য আয়')
    .replace(/Others?/gi, 'অন্যান্য')
    .replace(/Salary/gi, 'বেতন')
    .replace(/Arrear/gi, 'বকেয়া')
    .replace(/Borrowed Money/gi, 'ধার নেওয়া')
    .replace(/Loan/gi, 'ধার/ঋণ');
  return cleaned.trim();
}

export function getCategoryEmoji(catName: string): string {
  const match = catName.match(/^(\p{Extended_Pictographic}|\p{Emoji})/u);
  if (match) return match[0];
  
  const lower = catName.toLowerCase();
  if (lower.includes('rent') || lower.includes('রুম')) return '🏠';
  if (lower.includes('bajar') || lower.includes('বাজার')) return '🛒';
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
