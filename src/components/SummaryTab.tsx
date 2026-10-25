import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  PieChart,
  BarChart2,
  CalendarDays,
  SlidersHorizontal,
  Eye,
  Filter,
  ChevronRight as ChevronRightIcon,
  RotateCcw,
  X,
  ShoppingCart,
  Printer
} from 'lucide-react';
import { Transaction, DaySummary } from '../types';
import { normalizeDate, formatNumberLocale, formatDayDisplay, formatDateFull, formatDateShortDemo, formatCleanDateTime } from '../utils/dateUtils';
import { cleanCategoryName } from '../utils/categoryUtils';
import { CategoryDetailsModal } from './Modals';

interface SummaryTabProps {
  transactions: Transaction[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  summaryScope: 'month' | 'all';
  setSummaryScope: (scope: 'month' | 'all') => void;
  onSelectDate: (dateStr: string) => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  isReadOnly?: boolean;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
  transactions,
  selectedMonth,
  setSelectedMonth,
  summaryScope,
  setSummaryScope,
  onSelectDate,
  onEdit,
  onDelete,
  isReadOnly,
  lang,
  t
}) => {
  const [showCalendarGrid, setShowCalendarGrid] = useState<boolean>(true);
  const [dayFilterMode, setDayFilterMode] = useState<'active' | 'all'>('active');
  const [daySortOrder, setDaySortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryBreakdownType, setCategoryBreakdownType] = useState<'Expense' | 'Income'>('Expense');
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);

  // Custom date filter below calendar
  const [filterPreset, setFilterPreset] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Print full statement with dynamic month title
  const handlePrintFullReport = () => {
    const originalTitle = document.title;
    const [y, m] = selectedMonth.split('-');
    const monthDate = new Date(Number(y), Number(m) - 1, 1);
    const mName = isNaN(monthDate.getTime()) ? 'month' : monthDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const docName = `${mName}-${y} hisab_kitab`;

    document.title = docName;
    try {
      window.focus();
      window.print();
    } catch {}
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  // Month shift helper
  const handleShiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${ny}-${nm}`);
  };

  // Month display label
  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
      month: 'long',
      year: 'numeric'
    });
  }, [selectedMonth, lang]);

  // Month dropdown options
  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = -12; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
        month: 'short',
        year: 'numeric'
      });
      opts.push({ val, label });
    }
    return opts;
  }, [lang]);

  // Calculations for Selected Month in Calendar
  const monthStats = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let inc = 0;
    let exp = 0;
    const dailyMap: Record<number, { inc: number; exp: number; count: number }> = {};

    transactions.forEach(tx => {
      const cleanDate = normalizeDate(tx.date);
      const [ty, tm, td] = cleanDate.split('-').map(Number);
      if (ty === y && tm === m) {
        const val = Number(tx.value) || 0;
        if (!dailyMap[td]) dailyMap[td] = { inc: 0, exp: 0, count: 0 };
        dailyMap[td].count += 1;

        if (tx.type === 'Expense') {
          exp += val;
          dailyMap[td].exp += val;
        } else {
          inc += val;
          dailyMap[td].inc += val;
        }
      }
    });

    const net = inc - exp;
    const savingsRate = inc > 0 ? Math.max(0, (net / inc) * 100).toFixed(1) : '0';

    return { inc, exp, net, savingsRate, dailyMap };
  }, [transactions, selectedMonth]);

  // Calculations for All Time
  const allTimeStats = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach(tx => {
      const val = Number(tx.value) || 0;
      if (tx.type === 'Expense') exp += val;
      else inc += val;
    });
    const net = inc - exp;
    const savingsRate = inc > 0 ? Math.max(0, (net / inc) * 100).toFixed(1) : '0';
    return { inc, exp, net, savingsRate };
  }, [transactions]);

  // Active Scope Totals for Hero Card
  const activeTotals = summaryScope === 'all' ? allTimeStats : monthStats;

  // Calendar Days calculation for selected month
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month, 0).getDate();

    const emptySlots = Array.from({ length: firstDayIndex });
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    const todayDate = isCurrentMonth ? now.getDate() : -1;

    return { year, month, emptySlots, days, todayDate, totalDays };
  }, [selectedMonth]);

  // ========================================================
  // CUSTOM DATE FILTER BELOW CALENDAR
  // ========================================================
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStr = normalizeDate(now);

    if (filterPreset === 'today') {
      return { start: todayStr, end: todayStr, label: t('Today', 'আজ') };
    }
    if (filterPreset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      const yStr = normalizeDate(yest);
      return { start: yStr, end: yStr, label: t('Yesterday', 'গতকাল') };
    }
    if (filterPreset === 'this_week') {
      const curr = new Date(now);
      const first = curr.getDate() - curr.getDay();
      const firstDay = new Date(curr.setDate(first));
      return { start: normalizeDate(firstDay), end: todayStr, label: t('This Week', 'এই সপ্তাহ') };
    }
    if (filterPreset === 'last_7_days') {
      const past7 = new Date(now);
      past7.setDate(now.getDate() - 6);
      return { start: normalizeDate(past7), end: todayStr, label: t('Last 7 Days', 'গত ৭ দিন') };
    }
    if (filterPreset === 'this_month') {
      return {
        start: `${selectedMonth}-01`,
        end: `${selectedMonth}-31`,
        label: `${t('Month', 'মাস')}: ${monthLabel}`
      };
    }
    if (filterPreset === 'last_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ym = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      return { start: `${ym}-01`, end: `${ym}-31`, label: t('Last Month', 'গত মাস') };
    }
    if (filterPreset === 'this_year') {
      const y = now.getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31`, label: `${t('Year', 'বছর')} ${y}` };
    }
    if (filterPreset === 'custom') {
      const s = customStartDate || '...';
      const e = customEndDate || '...';
      return { start: customStartDate, end: customEndDate, label: `${s} ~ ${e}` };
    }
    return { start: '', end: '', label: t('All Time', 'সর্বমোট সময়') };
  }, [filterPreset, selectedMonth, monthLabel, customStartDate, customEndDate, t]);

  // Transactions filtered by the custom date filter below calendar
  const filteredRangeTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const clean = normalizeDate(tx.date);
      if (dateRange.start && clean < dateRange.start) return false;
      if (dateRange.end && clean > dateRange.end) return false;
      return true;
    });
  }, [transactions, dateRange]);

  // Statistics for the filtered range
  const filteredRangeStats = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredRangeTransactions.forEach(tx => {
      const val = Number(tx.value) || 0;
      if (tx.type === 'Expense') exp += val;
      else inc += val;
    });
    const net = inc - exp;
    const savingsRate = inc > 0 ? Math.max(0, (net / inc) * 100).toFixed(1) : '0';
    return { inc, exp, net, savingsRate, count: filteredRangeTransactions.length };
  }, [filteredRangeTransactions]);

  // Day-wise list for the filtered range with cumulative balance logic
  const filteredDayWiseList = useMemo(() => {
    // 1. Group ALL transactions by date for cumulative calculation
    const allDateMap: Record<string, { inc: number; exp: number; count: number }> = {};
    transactions.forEach(tx => {
      const clean = normalizeDate(tx.date);
      if (!allDateMap[clean]) allDateMap[clean] = { inc: 0, exp: 0, count: 0 };
      const val = Number(tx.value) || 0;
      allDateMap[clean].count += 1;
      if (tx.type === 'Expense') allDateMap[clean].exp += val;
      else allDateMap[clean].inc += val;
    });

    // 2. Sort all dates and calculate running balance
    const sortedDates = Object.keys(allDateMap).sort();
    let cumulative = 0;
    const allSummaries: DaySummary[] = sortedDates.map(dateStr => {
      const d = allDateMap[dateStr];
      const net = d.inc - d.exp;
      cumulative += net;
      
      const [y, m, dayNum] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, dayNum);
      const dayOfWeek = isNaN(dateObj.getTime())
        ? ''
        : dateObj.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', { weekday: 'short' });

      return {
        day: dayNum,
        dateStr,
        dayOfWeek,
        inc: d.inc,
        exp: d.exp,
        net: cumulative, // Reusing net for cumulative balance as requested in UI
        count: d.count,
        hasActivity: d.inc > 0 || d.exp > 0
      };
    });

    // 3. Filter summaries based on selected date range and activity
    let filtered = allSummaries.filter(item => {
      if (dateRange.start && item.dateStr < dateRange.start) return false;
      if (dateRange.end && item.dateStr > dateRange.end) return false;
      if (dayFilterMode === 'active') return item.hasActivity;
      return true;
    });

    // 4. Apply sort order
    if (daySortOrder === 'desc') {
      return [...filtered].sort((a, b) => b.dateStr.localeCompare(a.dateStr));
    }
    return [...filtered].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [transactions, dateRange, dayFilterMode, daySortOrder, lang]);

  // Top 5 Expense Categories for filtered range
  const filteredTopExpenseCategories = useMemo(() => {
    const catMap: Record<string, { val: number; rawCat: string }> = {};

    filteredRangeTransactions.forEach(tx => {
      if (tx.type !== 'Expense') return;
      const c = cleanCategoryName(tx.category || 'Others', lang);
      if (!catMap[c]) catMap[c] = { val: 0, rawCat: tx.category || c };
      catMap[c].val += Math.abs(Number(tx.value) || 0);
    });

    const totalExp = filteredRangeStats.exp || 1;
    return Object.entries(catMap)
      .map(([cat, info]) => ({
        cat,
        rawCat: info.rawCat,
        val: info.val,
        percent: ((info.val / totalExp) * 100).toFixed(1)
      }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);
  }, [filteredRangeTransactions, filteredRangeStats.exp, lang]);

  // All Categories Breakdown (Expense & Income) for filtered range
  const filteredAllCategoryBreakdown = useMemo(() => {
    const catMap: Record<string, { total: number; count: number; rawCat: string }> = {};

    filteredRangeTransactions.forEach(tx => {
      if (tx.type !== categoryBreakdownType) return;
      const c = cleanCategoryName(tx.category || 'Others', lang);
      if (!catMap[c]) catMap[c] = { total: 0, count: 0, rawCat: tx.category || c };
      catMap[c].total += Math.abs(Number(tx.value) || 0);
      catMap[c].count += 1;
    });

    const targetTotal = categoryBreakdownType === 'Expense' ? filteredRangeStats.exp : filteredRangeStats.inc;
    const baseTotal = targetTotal || 1;

    return Object.entries(catMap)
      .map(([cat, info]) => ({
        cat,
        rawCat: info.rawCat,
        total: info.total,
        count: info.count,
        percent: ((info.total / baseTotal) * 100).toFixed(1)
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRangeTransactions, categoryBreakdownType, filteredRangeStats.exp, filteredRangeStats.inc, lang]);

  // Monthly History Comparison
  const monthlyHistory = useMemo(() => {
    const map: Record<string, { inc: number; exp: number; topCat: string; topCatVal: number }> = {};
    const catByMonth: Record<string, Record<string, number>> = {};

    transactions.forEach(tx => {
      const clean = normalizeDate(tx.date);
      const [y, m] = clean.split('-');
      const monthKey = `${y}-${m}`;
      if (!map[monthKey]) {
        map[monthKey] = { inc: 0, exp: 0, topCat: '', topCatVal: 0 };
        catByMonth[monthKey] = {};
      }
      const val = Number(tx.value) || 0;
      if (tx.type === 'Expense') {
        map[monthKey].exp += val;
        const c = cleanCategoryName(tx.category || 'Others', lang);
        catByMonth[monthKey][c] = (catByMonth[monthKey][c] || 0) + val;
      } else {
        map[monthKey].inc += val;
      }
    });

    return Object.keys(map)
      .sort()
      .reverse()
      .slice(0, 12)
      .map(mk => {
        const data = map[mk];
        const [y, m] = mk.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        const label = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
          month: 'short',
          year: 'numeric'
        });

        const cats = catByMonth[mk] || {};
        let topCat = 'None';
        let topCatVal = 0;
        Object.entries(cats).forEach(([c, v]) => {
          if (v > topCatVal) {
            topCat = c;
            topCatVal = v;
          }
        });

        const net = data.inc - data.exp;
        return {
          monthKey: mk,
          label,
          inc: data.inc,
          exp: data.exp,
          net,
          topCat,
          topCatVal
        };
      });
  }, [transactions, lang]);

  return (
    <div className="space-y-3 sm:space-y-4 animate-fadeIn pb-12">
      {/* ON-SCREEN DASHBOARD VIEW (HIDDEN IN PRINT) */}
      <div className="print:hidden space-y-3 sm:space-y-4">
        {/* 1. Scope Segmented Control */}
        <div className="flex items-center justify-between gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700/50 shadow-md max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={() => setSummaryScope('month')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              summaryScope === 'month'
                ? 'bg-indigo-600 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('Monthly View', 'মাসিক সারাংশ')}</span>
          </button>
          <button
            type="button"
            onClick={() => setSummaryScope('all')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              summaryScope === 'all'
                ? 'bg-indigo-600 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('All-Time', 'সর্বমোট')}</span>
          </button>
        </div>

      {/* 2. HERO FINANCIAL DASHBOARD CARDS */}
      <div className="rounded-2xl bg-slate-800 text-slate-100 p-3 sm:p-5 shadow-xl border border-slate-700/50 relative overflow-hidden">
        {/* Top Header of Hero Card */}
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-3 gap-2 flex-wrap">
          {summaryScope === 'month' ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleShiftMonth(-1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-300 transition-all cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-slate-750 border border-slate-700/50 text-slate-100 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {monthOptions.map(m => (
                  <option key={m.val} value={m.val}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleShiftMonth(1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-300 transition-all cursor-pointer shrink-0"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{t('All-Time Overview', 'লাইফটাইম সর্বমোট')}</span>
            </div>
          )}

          {/* Savings Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              {activeTotals.savingsRate}%
            </span>
          </div>
        </div>

        {/* Big Net Balance Display */}
        <div className="mb-3">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">
            {summaryScope === 'all'
              ? t('All-Time Balance', 'সর্বমোট অবশিষ্ট ব্যালেন্স')
              : t('Monthly Balance', 'এই মাসের অবশিষ্ট')}
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-xl sm:text-2xl font-extrabold tracking-tight tabular-nums ${
                activeTotals.net >= 0 ? 'text-emerald-400' : 'text-slate-100'
              }`}
            >
              {activeTotals.net >= 0 ? '+' : ''}
              {formatNumberLocale(activeTotals.net, lang)}
            </span>
          </div>
        </div>

        {/* 2-Column KPI Cards (Income vs Expense) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-750/50 rounded-xl p-2 border border-slate-700/30 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 font-semibold block truncate">
                {t('Income', 'আয়')}
              </span>
              <span className="text-[11px] font-bold text-emerald-400 tabular-nums truncate block">
                +{formatNumberLocale(activeTotals.inc, lang)}
              </span>
            </div>
          </div>

          <div className="bg-slate-750/50 rounded-xl p-2 border border-slate-700/30 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-100 flex items-center justify-center shrink-0 border border-slate-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 font-semibold block truncate">
                {t('Expense', 'খরচ')}
              </span>
              <span className="text-[11px] font-bold text-slate-100 tabular-nums truncate block">
                -{formatNumberLocale(activeTotals.exp, lang)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MONTHLY CALENDAR */}
      {summaryScope === 'month' && (
        <div className="bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-700/50 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-bold text-slate-100 uppercase tracking-tight">
                {t('Calendar', 'ক্যালেন্ডার')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCalendarGrid(!showCalendarGrid)}
              className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{showCalendarGrid ? t('Hide', 'লুকান') : t('Show', 'দেখুন')}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showCalendarGrid ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showCalendarGrid && (
            <div className="space-y-1.5 animate-fadeIn">
              <div className="grid grid-cols-7 gap-px bg-slate-700/30 text-center text-[9px] font-bold text-slate-500 py-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => <span key={idx}>{d}</span>)}
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-700/30 border border-slate-700/50">
                {calendarDays.emptySlots.map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-14 sm:h-16 bg-slate-800/50" />
                ))}

                {calendarDays.days.map(dayNum => {
                  const isToday = dayNum === calendarDays.todayDate;
                  const dayData = monthStats.dailyMap[dayNum];
                  const hasExp = dayData && dayData.exp > 0;
                  const hasInc = dayData && dayData.inc > 0;
                  const dateStr = `${calendarDays.year}-${String(calendarDays.month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => onSelectDate(dateStr)}
                        className={`h-14 sm:h-16 flex flex-col items-center justify-between p-1 transition-all cursor-pointer bg-slate-800 hover:bg-slate-750 active:bg-slate-700 ${
                          isToday ? 'bg-indigo-600/10' : ''
                        }`}
                      >
                        {/* Row 1: Day */}
                        <div className="w-full flex justify-start">
                           <span className={`text-[10px] font-bold leading-none ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                            {dayNum}
                          </span>
                        </div>

                        <div className="flex flex-col items-center justify-center w-full gap-0.5 mt-auto">
                          {/* Row 2: Expense (Always occupies space) */}
                          <div className="text-[8px] sm:text-[9px] font-bold text-slate-100 leading-none h-[9px] tabular-nums flex items-center justify-center">
                            {hasExp ? `-${formatNumberLocale(dayData!.exp, lang)}` : ' '}
                          </div>

                          {/* Row 3: Income (Always occupies space) */}
                          <div className="text-[8px] sm:text-[9px] font-bold text-emerald-400 leading-none h-[9px] tabular-nums flex items-center justify-center">
                            {hasInc ? `+${formatNumberLocale(dayData!.inc, lang)}` : ' '}
                          </div>
                        </div>
                      </button>
                    );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. CUSTOM DATE FILTER */}
      <div className="bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-700/50 shadow-lg space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/30 pb-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-400" />
            <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-tight">
              {t('Filter', 'ফিল্টার')}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrintFullReport}
              className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 transition-all cursor-pointer"
              title={t('Print', 'প্রিন্ট')}
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterPreset('this_month');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterPreset}
            onChange={e => setFilterPreset(e.target.value)}
            className="col-span-2 h-9 bg-slate-750 border border-slate-700/50 rounded-lg px-2 text-[11px] font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="this_month">{t('This Month', 'এই মাস')}</option>
            <option value="last_month">{t('Last Month', 'গত মাস')}</option>
            <option value="this_week">{t('This Week', 'এই সপ্তাহ')}</option>
            <option value="last_7_days">{t('Last 7 Days', 'গত ৭ দিন')}</option>
            <option value="today">{t('Today', 'আজ')}</option>
            <option value="yesterday">{t('Yesterday', 'গতকাল')}</option>
            <option value="custom">{t('Custom Range', 'কাস্টম রেঞ্জ')}</option>
          </select>
          {filterPreset === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="h-8 bg-slate-750 border border-slate-700/50 rounded-lg px-2 text-[10px] text-slate-100 focus:outline-none"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="h-8 bg-slate-750 border border-slate-700/50 rounded-lg px-2 text-[10px] text-slate-100 focus:outline-none"
              />
            </>
          )}
        </div>
      </div>

      {/* 5. SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-slate-800 rounded-xl p-2 border border-slate-700/50 text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">{t('Inc', 'আয়')}</span>
          <span className="text-[11px] font-bold text-emerald-400 block mt-0.5">
            +{formatNumberLocale(filteredRangeStats.inc, lang)}
          </span>
        </div>
        <div className="bg-slate-800 rounded-xl p-2 border border-slate-700/50 text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">{t('Exp', 'ব্যয়')}</span>
          <span className="text-[11px] font-bold text-slate-100 block mt-0.5">
            -{formatNumberLocale(filteredRangeStats.exp, lang)}
          </span>
        </div>
        <div className="bg-slate-800 rounded-xl p-2 border border-slate-700/50 text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">{t('Bal', 'ব্যালেন্স')}</span>
          <span className={`text-[11px] font-bold block mt-0.5 ${filteredRangeStats.net >= 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
            {formatNumberLocale(filteredRangeStats.net, lang)}
          </span>
        </div>
      </div>

      {/* 6. DAY-WISE BREAKDOWN */}
      <div className="bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-700/50 shadow-lg space-y-2">
        <div className="flex items-center justify-between border-b border-slate-700/30 pb-2">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-tight">
              {t('Day-Wise Breakdown', 'দিনভিত্তিক হিসাব')}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setDaySortOrder(daySortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 rounded bg-slate-700 text-slate-400 hover:text-slate-100"
          >
            <SlidersHorizontal className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1">
          {/* Header Row: Date Balance Expense Balance */}
          <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-1 px-1.5 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-700/30">
            <span>{t('Date', 'তারিখ')}</span>
            <span className="text-right">{t('Income', 'আয়')}</span>
            <span className="text-right">{t('Expense', 'ব্যয়')}</span>
            <span className="text-right">{t('Balance', 'ব্যালেন্স')}</span>
          </div>

          <div className="divide-y divide-slate-700/20">
            {filteredDayWiseList.map(item => (
              <div
                key={item.dateStr}
                onClick={() => onSelectDate(item.dateStr)}
                className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-1 items-center py-2 px-1.5 hover:bg-slate-750/30 rounded-xl transition-all cursor-pointer text-[11px] group tabular-nums"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-300">
                    {formatDateShortDemo(item.dateStr, lang)}
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold opacity-70">
                    ({formatNumberLocale(item.count, lang)} {t('rec', 'টি')})
                  </span>
                </div>
                <div className={`text-right font-bold ${item.inc > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {item.inc > 0 ? `+${formatNumberLocale(item.inc, lang)}` : '—'}
                </div>
                <div className={`text-right font-bold ${item.exp > 0 ? 'text-slate-100' : 'text-slate-600'}`}>
                  {item.exp > 0 ? `-${formatNumberLocale(item.exp, lang)}` : '—'}
                </div>
                <div className={`text-right font-bold ${item.net >= 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {formatNumberLocale(item.net, lang)}
                </div>
              </div>
            ))}
          </div>
          {filteredDayWiseList.length === 0 && (
            <div className="py-6 text-center text-slate-500 text-[10px] italic">
              {t('No activity.', 'কোনো হিসাব নেই।')}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 7. TOP EXPENSE CATEGORIES (ROUND DONUT CHART + RIGHT DETAILS) */}
      {/* "gol cart bar asbe dan side a category ratio amount" */}
      {/* ======================================================== */}
      <div className="bg-slate-800 rounded-2xl p-3.5 sm:p-5 border border-slate-700/50 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600/30 to-amber-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-md">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{t('Top Expense Categories', 'শীর্ষ ব্যয়ের খাতসমূহ')}</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium block">
                {t('Circular chart with category, ratio and amount', 'গোল চার্ট ও ডানপাশে অনুপাত ও খরচ')} ({dateRange.label})
              </span>
            </div>
          </div>
        </div>

        {filteredTopExpenseCategories.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            {t('No expense records found for this period.', 'এই সময়ের জন্য কোনো খরচের রেকর্ড পাওয়া যায়নি।')}
          </div>
        ) : (
          <div className="flex flex-row items-center gap-2 sm:gap-5 p-0.5 sm:p-2">
            {/* Left: Round Donut Chart (Compact size for mobile) */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg viewBox="0 0 160 160" className="w-[82px] h-[82px] sm:w-32 sm:h-32 -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r="52"
                  strokeWidth="20"
                  fill="none"
                  stroke="#1e293b"
                />
                {/* Segment Arcs */}
                {(() => {
                  const palette = ['#f43f5e', '#f97316', '#eab308', '#06b6d4', '#a855f7'];
                  const circumference = 326.72; // 2 * pi * 52
                  let offset = 0;
                  return filteredTopExpenseCategories.map((item, idx) => {
                    const pct = Math.max(0, Math.min(100, Number(item.percent) || 0));
                    const arcLength = (pct / 100) * circumference;
                    const strokeDasharray = `${arcLength} ${circumference}`;
                    const strokeDashoffset = -offset;
                    offset += arcLength;
                    const color = palette[idx % palette.length];

                    return (
                      <circle
                        key={item.cat}
                        cx="80"
                        cy="80"
                        r="52"
                        strokeWidth="20"
                        fill="none"
                        stroke={color}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-700"
                      />
                    );
                  });
                })()}
              </svg>
              {/* Center of Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[7.5px] sm:text-[9px] uppercase font-bold text-slate-400 leading-none">{t('Total', 'মোট')}</span>
                <span className="text-[9.5px] sm:text-xs font-bold text-slate-100 tabular-nums leading-tight mt-0.5">
                  -{formatNumberLocale(filteredRangeStats.exp, lang)}
                </span>
              </div>
            </div>

            {/* Right: Dan side a category, ratio, amount (compact font on mobile) */}
            <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
              {filteredTopExpenseCategories.map((item, idx) => {
                const palette = ['#f43f5e', '#f97316', '#eab308', '#06b6d4', '#a855f7'];
                const color = palette[idx % palette.length];

                return (
                  <button
                    key={item.cat}
                    type="button"
                    onClick={() => setSelectedCategoryModal(item.rawCat || item.cat)}
                    className="w-full px-2 py-1.5 rounded-xl bg-slate-750/20 hover:bg-slate-750/40 border border-slate-700/30 transition-all flex items-center justify-between gap-1 text-[9.5px] cursor-pointer active:scale-98 text-left"
                  >
                    {/* Category name & Dot */}
                    <div className="flex items-center gap-1 min-w-0 pr-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-slate-200 truncate">
                        {item.cat}
                      </span>
                    </div>

                    {/* Dan Side: Ratio & Amount */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[8px] font-bold text-slate-500">
                        {item.percent}%
                      </span>
                      <span className="font-bold text-slate-100/90 tabular-nums text-right">
                        -{formatNumberLocale(item.val, lang)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 8. CATEGORY BREAKDOWN REPORT (DRIVEN BY CUSTOM FILTER) */}
      {/* ======================================================== */}
      <div className="bg-slate-800 rounded-2xl p-3.5 sm:p-5 border border-slate-700/50 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-100">
                {t('Category Breakdown Report', 'ক্যাটাগরিভিত্তিক বিস্তারিত রিপোর্ট')}
              </h3>
              <p className="text-[10px] text-slate-400">
                {t('Tap any category to view individual transaction list', 'যেকোনো ক্যাটাগরিতে ক্লিক করে বিস্তারিত হিসাব দেখুন')}
              </p>
            </div>
          </div>

          {/* Toggle between Expense and Income */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setCategoryBreakdownType('Expense')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryBreakdownType === 'Expense'
                  ? 'bg-rose-600 text-slate-100'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {t('Expenses', 'খরচ')}
            </button>
            <button
              type="button"
              onClick={() => setCategoryBreakdownType('Income')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryBreakdownType === 'Income'
                  ? 'bg-emerald-600 text-slate-100'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {t('Income', 'আয়')}
            </button>
          </div>
        </div>

        {filteredAllCategoryBreakdown.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            {t('No categories found for this period.', 'এই সময়ের জন্য কোনো ক্যাটাগরি রেকর্ড নেই।')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            {filteredAllCategoryBreakdown.map(item => (
              <button
                key={item.cat}
                type="button"
                onClick={() => setSelectedCategoryModal(item.rawCat || item.cat)}
                className="px-2.5 py-2 rounded-xl bg-slate-750/20 hover:bg-slate-750/40 border border-slate-700/30 flex items-center justify-between text-[10px] cursor-pointer active:scale-98 transition-all text-left group"
                title={t('Click to view details', 'বিস্তারিত দেখতে ক্লিক করুন')}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                    {item.cat}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    {item.count} {t('records', 'টি')} · {item.percent}%
                  </div>
                </div>
                <div
                  className={`font-bold text-[10.5px] tabular-nums shrink-0 ${
                    categoryBreakdownType === 'Expense' ? 'text-slate-100/90' : 'text-emerald-400/90'
                  }`}
                >
                  {formatNumberLocale(item.total, lang)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 9. MONTHLY HISTORY */}
      {summaryScope === 'all' && (
        <div className="bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-700/50 shadow-lg space-y-2">
          <div className="flex items-center gap-1.5 border-b border-slate-700/30 pb-2">
            <RotateCcw className="w-4 h-4 text-indigo-400" />
            <h3 className="text-[11px] font-bold text-slate-100 uppercase tracking-tight">
              {t('Monthly History', 'মাসিক ইতিহাস')}
            </h3>
          </div>
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead className="text-[9px] text-slate-500 font-bold uppercase border-b border-slate-700/30">
                <tr>
                  <th className="py-1.5 px-1">{t('Month', 'মাস')}</th>
                  <th className="py-1.5 px-1 text-right">{t('Income', 'আয়')}</th>
                  <th className="py-1.5 px-1 text-right">{t('Expense', 'খরচ')}</th>
                  <th className="py-1.5 px-1 text-right">{t('Net', 'ব্যালেন্স')}</th>
                </tr>
              </thead>
              <tbody className="text-[10px] divide-y divide-slate-700/20">
                {monthlyHistory.map(row => (
                  <tr
                    key={row.monthKey}
                    onClick={() => {
                      setSelectedMonth(row.monthKey);
                      setSummaryScope('month');
                    }}
                    className="hover:bg-slate-700/20 transition-all cursor-pointer"
                  >
                    <td className="py-1.5 px-1  font-bold text-slate-300">{row.label}</td>
                    <td className="py-1.5 px-1 text-right text-emerald-500/80">+{formatNumberLocale(row.inc, lang)}</td>
                    <td className="py-1.5 px-1 text-right text-slate-100/80">-{formatNumberLocale(row.exp, lang)}</td>
                    <td className={`py-1.5 px-1 text-right font-bold ${row.net >= 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {formatNumberLocale(row.net, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* 10. PRINTABLE REPORT VIEW */}
      <div id="printable-report" className="hidden print:block  text-slate-900 bg-white p-4">
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              {(() => {
                const [y, m] = selectedMonth.split('-');
                const d = new Date(Number(y), Number(m) - 1, 1);
                const mName = isNaN(d.getTime()) ? 'month' : d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
                return `${mName}-${y} hisab_kitab`;
              })()}
            </h1>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Statement Period: {dateRange.label} ({dateRange.start} ~ {dateRange.end})
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-semibold">Hisab Kitab Statement</p>
            <p>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="mb-5 print-avoid-break">
          <h2 className="text-sm font-bold uppercase border-b border-slate-400 pb-1 mb-2 text-slate-800">
            1. Financial Summary Overview
          </h2>
          <table className="w-full text-xs border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold bg-slate-100 w-1/4">Total Income</td>
                <td className="p-2 font-bold text-emerald-700">+{formatNumberLocale(filteredRangeStats.inc, lang)}</td>
                <td className="p-2 font-bold bg-slate-100 w-1/4">Total Expense</td>
                <td className="p-2 font-bold text-rose-700">-{formatNumberLocale(filteredRangeStats.exp, lang)}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-slate-100">Net Balance</td>
                <td className="p-2 font-bold text-slate-900">{filteredRangeStats.net >= 0 ? '+' : ''}{formatNumberLocale(filteredRangeStats.net, lang)}</td>
                <td className="p-2 font-bold bg-slate-100">Total Transactions</td>
                <td className="p-2">{filteredRangeStats.count} items</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-5 print-avoid-break">
          <h2 className="text-sm font-bold uppercase border-b border-slate-400 pb-1 mb-2 text-slate-800">
            2. Day-Wise Breakdown
          </h2>
          <table className="w-full text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300">
                <th className="p-1.5 text-left">Date</th>
                <th className="p-1.5 text-right">Income</th>
                <th className="p-1.5 text-right">Expense</th>
                <th className="p-1.5 text-right">Balance</th>
                <th className="p-1.5 text-center">Items</th>
              </tr>
            </thead>
            <tbody>
              {filteredDayWiseList.map(item => (
                <tr key={item.dateStr} className="border-b border-slate-200">
                  <td className="p-1.5 text-left font-medium">{formatDateShortDemo(item.dateStr, lang)}</td>
                  <td className="p-1.5 text-right text-emerald-700">{item.inc > 0 ? `+${formatNumberLocale(item.inc, lang)}` : '—'}</td>
                  <td className="p-1.5 text-right text-rose-700">{item.exp > 0 ? `-${formatNumberLocale(item.exp, lang)}` : '—'}</td>
                  <td className="p-1.5 text-right font-bold">{item.hasActivity ? `${item.net >= 0 ? '+' : ''}${formatNumberLocale(item.net, lang)}` : '0'}</td>
                  <td className="p-1.5 text-center">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Details Popup Modal */}
      <CategoryDetailsModal
        categoryName={selectedCategoryModal}
        transactions={(() => {
          if (!selectedCategoryModal) return [];
          const sNorm = cleanCategoryName(selectedCategoryModal, 'en').toLowerCase();
          const inRange = filteredRangeTransactions.filter(tx => 
            cleanCategoryName(tx.category, 'en').toLowerCase() === sNorm
          );
          return inRange.length > 0 ? inRange : transactions;
        })()}
        onClose={() => setSelectedCategoryModal(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        lang={lang}
        t={t}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};
