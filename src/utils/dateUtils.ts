export function normalizeDate(rawDate: any): string {
  if (!rawDate) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const s = String(rawDate).trim();

  // 1. Standard ISO format: YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(Number(isoMatch[2])).padStart(2, '0');
    const d = String(Number(isoMatch[3])).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Full Date / ISO string like "2026-10-09T14:30:00.000Z"
  if (s.includes('T')) {
    const parts = s.split('T')[0].split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }

  // 3. Formats with slashes or dashes like DD/MM/YYYY or MM/DD/YYYY
  const slashMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (slashMatch) {
    const p1 = Number(slashMatch[1]);
    const p2 = Number(slashMatch[2]);
    const y = slashMatch[3];

    // If p1 > 12, p1 must be Day and p2 is Month (DD/MM/YYYY)
    if (p1 > 12) {
      return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    // If p2 > 12, p2 must be Day and p1 is Month (MM/DD/YYYY)
    if (p2 > 12) {
      return `${y}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
    }
    // Default standard for DD/MM/YYYY
    return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
  }

  // 4. Try JS Date parser
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Fallback: today's date
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function formatSyncDateTime(date: Date, lang: 'en' | 'bn'): string {
  if (!date || isNaN(date.getTime())) return lang === 'en' ? 'Just now' : 'এইমাত্র';
  
  if (lang === 'en') {
    const d = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const y = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${d} ${month} ${y}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }

  // Bengali numbers & month names
  const toBnDigits = (n: number | string) => {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(n).replace(/\d/g, d => bnDigits[Number(d)]);
  };

  const bnMonths = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const d = toBnDigits(String(date.getDate()).padStart(2, '0'));
  const month = bnMonths[date.getMonth()];
  const y = toBnDigits(date.getFullYear());
  let hours = date.getHours();
  const minutes = toBnDigits(String(date.getMinutes()).padStart(2, '0'));
  const period = hours >= 12 ? 'অপরাহ্ন' : 'পূর্বাহ্ন';
  hours = hours % 12 || 12;
  const hoursBn = toBnDigits(String(hours).padStart(2, '0'));

  return `${d} ${month} ${y}, ${hoursBn}:${minutes} ${period}`;
}

export function formatNumberLocale(num: number, lang: 'en' | 'bn'): string {
  if (isNaN(num)) return '0';
  const formatted = num.toLocaleString('en-US');
  if (lang === 'en') return formatted;
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return formatted.replace(/\d/g, d => bnDigits[Number(d)]);
}

export function formatDayDisplay(dayNum: number, lang: 'en' | 'bn'): string {
  if (lang === 'en') return String(dayNum).padStart(2, '0');
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(dayNum).padStart(2, '0').replace(/\d/g, d => bnDigits[Number(d)]);
}
