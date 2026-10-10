import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Globe,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
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

  // Day-wise list for the filtered range
  const filteredDayWiseList = useMemo(() => {
    const map: Record<string, { inc: number; exp: number; count: number }> = {};

    filteredRangeTransactions.forEach(tx => {
      const clean = normalizeDate(tx.date);
      if (!map[clean]) map[clean] = { inc: 0, exp: 0, count: 0 };
      const val = Number(tx.value) || 0;
      map[clean].count += 1;
      if (tx.type === 'Expense') map[clean].exp += val;
      else map[clean].inc += val;
    });

    const list: DaySummary[] = Object.entries(map).map(([dateStr, d]) => {
      const [y, m, dayNum] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, dayNum);
      const dayOfWeek = isNaN(dateObj.getTime())
        ? ''
        : dateObj.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', { weekday: 'short' });
      const net = d.inc - d.exp;
      return {
        day: dayNum,
        dateStr,
        dayOfWeek,
        inc: d.inc,
        exp: d.exp,
        net,
        count: d.count,
        hasActivity: d.inc > 0 || d.exp > 0
      };
    });

    const filtered = dayFilterMode === 'active' ? list.filter(item => item.hasActivity) : list;

    if (daySortOrder === 'desc') {
      return [...filtered].sort((a, b) => b.dateStr.localeCompare(a.dateStr));
    }
    return [...filtered].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [filteredRangeTransactions, dayFilterMode, daySortOrder, lang]);

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
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-12">
      {/* ON-SCREEN DASHBOARD VIEW (HIDDEN IN PRINT) */}
      <div className="print:hidden space-y-4 sm:space-y-6">
        {/* 1. Scope Segmented Control */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-md max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={() => setSummaryScope('month')}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              summaryScope === 'month'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('Monthly View', 'মাসিক সারাংশ')}</span>
          </button>
          <button
            type="button"
            onClick={() => setSummaryScope('all')}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              summaryScope === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('All-Time Summary', 'সর্বমোট হিসাব')}</span>
          </button>
        </div>

      {/* 2. HERO FINANCIAL DASHBOARD CARDS (Total Balance, Income, Expense, Savings) */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-3.5 sm:p-6 shadow-2xl border border-slate-800/80 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header of Hero Card */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2 flex-wrap">
          {summaryScope === 'month' ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleShiftMonth(-1)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all cursor-pointer shrink-0"
                title={t('Previous Month', 'আগের মাস')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[130px] sm:max-w-none truncate"
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
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all cursor-pointer shrink-0"
                title={t('Next Month', 'পরের মাস')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{t('All-Time Lifetime Overview', 'লাইফটাইম সর্বমোট পরিসংখ্যান')}</span>
            </div>
          )}

          {/* Savings Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 whitespace-nowrap">
              {t('Savings Rate', 'সঞ্চয়')}: {activeTotals.savingsRate}%
            </span>
          </div>
        </div>

        {/* Big Net Balance Display */}
        <div className="mb-4 sm:mb-6">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider block">
            {summaryScope === 'all'
              ? t('All-Time Net Balance', 'সর্বমোট অবশিষ্ট ব্যালেন্স')
              : t('Monthly Remaining Balance', 'এই মাসের অবশিষ্ট ব্যালেন্স')}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono">
            <span
              className={`text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight tabular-nums ${
                activeTotals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeTotals.net >= 0 ? '+' : ''}
              {formatNumberLocale(activeTotals.net, lang)}
            </span>
          </div>
        </div>

        {/* 2-Column KPI Cards (Income vs Expense) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div className="bg-slate-800/70 rounded-2xl p-2.5 sm:p-4 border border-slate-700/60 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold block truncate">
                {summaryScope === 'all' ? t('Total Income', 'সর্বমোট আয়') : t('Month Income', 'এই মাসের মোট আয়')}
              </span>
              <span className="text-xs sm:text-lg font-bold font-mono text-emerald-300 tabular-nums truncate block">
                +{formatNumberLocale(activeTotals.inc, lang)}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-2xl p-2.5 sm:p-4 border border-slate-700/60 flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold block truncate">
                {summaryScope === 'all' ? t('Total Expense', 'সর্বমোট খরচ') : t('Month Expense', 'এই মাসের মোট খরচ')}
              </span>
              <span className="text-xs sm:text-lg font-bold font-mono text-rose-300 tabular-nums truncate block">
                -{formatNumberLocale(activeTotals.exp, lang)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MONTHLY CALENDAR (SHOWING: DAY, EXPENSE, INCOME IN EACH CELL) */}
      {/* ======================================================== */}
      {summaryScope === 'month' && (
        <div className="bg-slate-900 rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-xl space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block">
                  {t('Monthly Calendar', 'মাসিক ক্যালেন্ডার')}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
                  {monthLabel} · {t('Tap day for details', 'দিনের ওপর ট্যাপ করুন')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCalendarGrid(!showCalendarGrid)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer py-1 px-1.5"
            >
              <span>{showCalendarGrid ? t('Hide Grid', 'গ্রিড লুকান') : t('Show Grid', 'গ্রিড দেখুন')}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCalendarGrid ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showCalendarGrid && (
            <div className="space-y-1.5 animate-fadeIn">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-[11px] font-bold text-slate-400 py-1">
                <span>{t('Sun', 'রবি')}</span>
                <span>{t('Mon', 'সোম')}</span>
                <span>{t('Tue', 'মঙ্গল')}</span>
                <span>{t('Wed', 'বুধ')}</span>
                <span>{t('Thu', 'বৃহঃ')}</span>
                <span>{t('Fri', 'শুক্র')}</span>
                <span>{t('Sat', 'শনি')}</span>
              </div>

              {/* Day cells matrix: Each cell explicitly shows Day, Expense, Income in compact size */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.emptySlots.map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-[52px] sm:h-[58px] rounded-lg sm:rounded-xl bg-transparent pointer-events-none" />
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
                      className={`h-[52px] sm:h-[58px] rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-0.5 sm:p-1 transition-all cursor-pointer relative border active:scale-95 text-center ${
                        isToday
                          ? 'bg-indigo-950/80 text-white font-bold shadow-md shadow-indigo-600/30 border-indigo-400'
                          : hasExp || hasInc
                          ? 'bg-slate-800/95 hover:bg-slate-750 text-slate-100 border-slate-700/80 hover:border-indigo-500/50'
                          : 'bg-slate-850/50 hover:bg-slate-800 text-slate-400 border-slate-800/60'
                      }`}
                      title={`${dateStr}: Exp: -${dayData?.exp || 0}, Inc: +${dayData?.inc || 0}`}
                    >
                      {/* Day number centered */}
                      <div className="flex items-center justify-center w-full">
                        <span
                          className={`text-[10px] sm:text-xs font-mono font-bold leading-none px-1.5 py-0.5 rounded text-center ${
                            isToday ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-200'
                          }`}
                        >
                          {formatDayDisplay(dayNum, lang)}
                        </span>
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse absolute right-1 top-1" />
                        )}
                      </div>

                      {/* Middle & Bottom: Expense & Income centered */}
                      {(hasExp || hasInc) ? (
                        <div className="w-full flex flex-col items-center justify-center text-center gap-0.5 font-mono overflow-hidden mt-0.5">
                          {hasExp && (
                            <span className="text-[8px] sm:text-[9.5px] font-bold text-rose-400 leading-none truncate block w-full text-center">
                              -{formatNumberLocale(dayData!.exp, lang)}
                            </span>
                          )}

                          {hasInc && (
                            <span className="text-[8px] sm:text-[9.5px] font-bold text-emerald-400 leading-none truncate block w-full text-center">
                              +{formatNumberLocale(dayData!.inc, lang)}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-[9.5px] sm:text-[10px] text-slate-400 pt-2 border-t border-slate-800/70">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>{t('Expense (-)', 'খরচ (-)')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{t('Income (+)', 'আয় (+)')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>{t('Today', 'আজ')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. 🎯 CUSTOM DATE FILTER (DROPDOWN & DATE RANGE OPTION) */}
      {/* ======================================================== */}
      <div className="bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                {t('Custom Date Filter', 'কাস্টম তারিখ ফিল্টার')}
              </h3>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block">
                {t('Select period dropdown or set custom date range', 'ড্রপডাউন বা তারিখ রেঞ্জ দিয়ে নিচের হিসাব ফিল্টার করুন')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] sm:text-[11px] font-mono font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-xl">
              {dateRange.label}
            </span>
            <button
              type="button"
              onClick={() => {
                setFilterPreset('this_month');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 text-[10.5px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title={t('Clear Filter', 'ফিল্টার মুছুন')}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('Clear Filter', 'ফিল্টার মুছুন')}</span>
            </button>
            <button
              type="button"
              onClick={handlePrintFullReport}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md active:scale-95"
              title={t('Print Full Monthly Statement as PDF', 'সম্পূর্ণ মাসিক হিসাব প্রিন্ট বা PDF করুন')}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('Print Statement', 'প্রিন্ট স্টেটমেন্ট')}</span>
            </button>
          </div>
        </div>

        {/* Dropdown & Date Range Row */}
        <div className="space-y-3">
          <div>
            <label className="text-[10.5px] sm:text-[11px] text-slate-400 font-semibold block mb-1.5">
              {t('Filter Period Dropdown', 'তারিখ ফিল্টার ড্রপডাউন')}
            </label>
            <select
              value={filterPreset}
              onChange={e => setFilterPreset(e.target.value)}
              className="w-full min-h-[42px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
            >
              <option value="this_month">📅 {t('This Month', 'এই মাস')} ({monthLabel})</option>
              <option value="last_month">📅 {t('Last Month', 'গত মাস')}</option>
              <option value="this_week">📆 {t('This Week', 'এই সপ্তাহ')}</option>
              <option value="last_7_days">⏱️ {t('Last 7 Days', 'গত ৭ দিন')}</option>
              <option value="today">☀️ {t('Today', 'আজ')}</option>
              <option value="yesterday">🌙 {t('Yesterday', 'গতকাল')}</option>
              <option value="this_year">🗓️ {t('This Year', 'এই বছর')}</option>
              <option value="all">🌐 {t('All Time', 'সব সময়')}</option>
              <option value="custom">✏️ {t('Custom Date Range (দিন নির্বাচন)', 'কাস্টম তারিখ রেঞ্জ (দিন নির্বাচন)')}</option>
            </select>
          </div>

          {/* Date Range Option (From Date & To Date pickers) */}
          <div className="bg-slate-850/60 p-2.5 sm:p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] sm:text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('Date Range Selection', 'তারিখ রেঞ্জ (শুরু ও শেষ)')}</span>
              </span>
              {filterPreset !== 'custom' && (
                <button
                  type="button"
                  onClick={() => setFilterPreset('custom')}
                  className="text-[10.5px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                >
                  {t('Edit Dates', 'তারিখ পরিবর্তন')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9.5px] sm:text-[10px] text-slate-400 block mb-1">
                  {t('From Date', 'শুরুর তারিখ')}
                </label>
                <input
                  type="date"
                  value={filterPreset === 'custom' ? customStartDate : dateRange.start}
                  onChange={e => {
                    setFilterPreset('custom');
                    setCustomStartDate(e.target.value);
                  }}
                  className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="text-[9.5px] sm:text-[10px] text-slate-400 block mb-1">
                  {t('To Date', 'শেষের তারিখ')}
                </label>
                <input
                  type="date"
                  value={filterPreset === 'custom' ? customEndDate : dateRange.end}
                  onChange={e => {
                    setFilterPreset('custom');
                    setCustomEndDate(e.target.value);
                  }}
                  className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. SUMMARY CARDS: Income, Expense, Balance */}
      {/* "Filtered Income na just Income, Expense, Balance, Tranaction eita lagbena" */}
      {/* ======================================================== */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Income */}
        <div className="bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-md text-center">
          <span className="text-[10.5px] sm:text-xs text-slate-400 font-semibold block truncate uppercase tracking-wider">
            {t('Income', 'আয়')}
          </span>
          <span className="text-xs sm:text-base font-bold font-mono text-emerald-400 tabular-nums block mt-1">
            +{formatNumberLocale(filteredRangeStats.inc, lang)}
          </span>
        </div>

        {/* Expense */}
        <div className="bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-md text-center">
          <span className="text-[10.5px] sm:text-xs text-slate-400 font-semibold block truncate uppercase tracking-wider">
            {t('Expense', 'খরচ')}
          </span>
          <span className="text-xs sm:text-base font-bold font-mono text-rose-400 tabular-nums block mt-1">
            -{formatNumberLocale(filteredRangeStats.exp, lang)}
          </span>
        </div>

        {/* Balance */}
        <div className="bg-slate-900 rounded-2xl p-2.5 sm:p-4 border border-slate-800 shadow-md text-center">
          <span className="text-[10.5px] sm:text-xs text-slate-400 font-semibold block truncate uppercase tracking-wider">
            {t('Balance', 'ব্যালেন্স')}
          </span>
          <span
            className={`text-xs sm:text-base font-bold font-mono tabular-nums block mt-1 ${
              filteredRangeStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {filteredRangeStats.net >= 0 ? '+' : ''}
            {formatNumberLocale(filteredRangeStats.net, lang)}
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. DAY-WISE BREAKDOWN */}
      {/* "Day-Wise Breakdown eikhane just Date Income Expense balace Items | 01-Oct-26 +3422 -535 +2887 3" */}
      {/* ======================================================== */}
      <div className="bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                {t('Day-Wise Breakdown', 'দিনভিত্তিক আয় ও ব্যয়')}
              </h3>
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium block">
                {dateRange.label}
              </span>
            </div>
          </div>

          {/* Filter & Sort controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setDayFilterMode('active')}
                className={`px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                  dayFilterMode === 'active'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('Active', 'সক্রিয়')}
              </button>
              <button
                type="button"
                onClick={() => setDayFilterMode('all')}
                className={`px-2 py-1 rounded-md text-[10.5px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
                  dayFilterMode === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('All', 'সব')}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setDaySortOrder(daySortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold border border-slate-700 cursor-pointer flex items-center gap-1 text-[10.5px] sm:text-[11px]"
              title={t('Toggle Sort Order', 'তারিখ ক্রমানুসারে সাজান')}
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{daySortOrder === 'asc' ? 'A➔Z' : 'Z➔A'}</span>
            </button>
          </div>
        </div>

        {/* Content state */}
        {filteredDayWiseList.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            {t('No transactions recorded for the selected filter.', 'নির্বাচিত ফিল্টারের জন্য কোনো লেনদেন রেকর্ড নেই।')}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDayWiseList.map(item => {
              const isToday = item.dateStr === normalizeDate(new Date());
              return (
                <div
                  key={item.dateStr}
                  onClick={() => onSelectDate(item.dateStr)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isToday
                      ? 'bg-indigo-950/40 border-indigo-500/50'
                      : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-bold text-white text-xs sm:text-sm block">
                      {formatDateShortDemo(item.dateStr, lang)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.count} {item.count === 1 ? t('item', 'আইটেম') : t('items', 'আইটেম')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm shrink-0">
                    {item.inc > 0 && (
                      <span className="text-emerald-400 font-bold">
                        +{formatNumberLocale(item.inc, lang)}
                      </span>
                    )}
                    {item.exp > 0 && (
                      <span className="text-rose-400 font-bold">
                        -{formatNumberLocale(item.exp, lang)}
                      </span>
                    )}
                    <span className={`font-extrabold ${item.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {item.net >= 0 ? '+' : ''}{formatNumberLocale(item.net, lang)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 7. TOP EXPENSE CATEGORIES (ROUND DONUT CHART + RIGHT DETAILS) */}
      {/* "gol cart bar asbe dan side a category ratio amount" */}
      {/* ======================================================== */}
      <div className="bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600/30 to-amber-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-md">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none font-mono">
                <span className="text-[7.5px] sm:text-[9px] uppercase font-bold text-slate-400 font-sans leading-none">{t('Total', 'মোট')}</span>
                <span className="text-[9.5px] sm:text-xs font-bold text-rose-400 tabular-nums leading-tight mt-0.5">
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
                    className="w-full px-2 py-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/70 transition-all flex items-center justify-between gap-1 sm:gap-2 text-[10px] sm:text-xs cursor-pointer active:scale-98 text-left"
                  >
                    {/* Category name & Dot */}
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-bold text-slate-100 truncate text-[10px] sm:text-xs">
                        {item.cat}
                      </span>
                    </div>

                    {/* Dan Side: Ratio & Amount */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 font-mono">
                      <span className="text-[8.5px] sm:text-[10px] font-bold text-slate-300 bg-slate-700/80 px-1 py-0.2 rounded border border-slate-600/50">
                        {item.percent}%
                      </span>
                      <span className="font-bold text-rose-300 text-[9.5px] sm:text-xs tabular-nums min-w-[44px] sm:min-w-[60px] text-right">
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
      <div className="bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
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
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('Expenses', 'খরচ')}
            </button>
            <button
              type="button"
              onClick={() => setCategoryBreakdownType('Income')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryBreakdownType === 'Income'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
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
                className="p-2.5 sm:p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/60 hover:border-indigo-500/50 flex items-center justify-between text-xs cursor-pointer active:scale-98 transition-all text-left group"
                title={t('Click to view details', 'বিস্তারিত দেখতে ক্লিক করুন')}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-white group-hover:text-indigo-200 transition-colors truncate">
                    {item.cat}
                  </div>
                  <div className="text-[10px] sm:text-[10.5px] text-slate-400 mt-0.5">
                    {item.count} {t('records', 'টি লেনদেন')} · {item.percent}%
                  </div>
                </div>
                <div
                  className={`font-bold font-mono text-xs sm:text-sm tabular-nums shrink-0 ${
                    categoryBreakdownType === 'Expense' ? 'text-rose-300' : 'text-emerald-300'
                  }`}
                >
                  {formatNumberLocale(item.total, lang)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 9. MONTHLY HISTORICAL COMPARISON */}
      {/* ======================================================== */}
      {monthlyHistory.length > 0 && (
        <div className="bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {t('Historical Months Overview', 'মাসওয়ারী তুলনামূলক ইতিহাস')}
                </h3>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                  {t('Tap any month to switch view', 'যেকোনো মাসে ট্যাপ করে হিসাব দেখুন')}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Cards for History */}
          <div className="block sm:hidden space-y-2">
            {monthlyHistory.map(row => {
              const isSelected = row.monthKey === selectedMonth && summaryScope === 'month';
              return (
                <div
                  key={row.monthKey}
                  onClick={() => {
                    setSelectedMonth(row.monthKey);
                    setSummaryScope('month');
                    setFilterPreset('this_month');
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-98 flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                      : 'bg-slate-800/70 hover:bg-slate-750 border-slate-700/60'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{row.label}</span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                          {t('ACTIVE', 'চলতি')}
                        </span>
                      )}
                    </div>
                    {row.topCat && row.topCat !== 'None' && (
                      <span className="text-[10.5px] text-slate-400 truncate block mt-0.5">
                        {t('Top: ', 'শীর্ষ: ')}{row.topCat} {row.topCatVal > 0 ? `(${formatNumberLocale(row.topCatVal, lang)})` : ''}
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className="flex items-center justify-end gap-2 text-[11px]">
                      <span className="text-emerald-400 font-bold tabular-nums">+{formatNumberLocale(row.inc, lang)}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-rose-400 font-bold tabular-nums">-{formatNumberLocale(row.exp, lang)}</span>
                    </div>
                    <span
                      className={`text-[10.5px] font-bold block mt-0.5 tabular-nums ${
                        row.net >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {t('Net: ', 'ব্যালেন্স: ')}{row.net >= 0 ? '+' : ''}{formatNumberLocale(row.net, lang)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tablet & Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">{t('Month', 'মাস')}</th>
                  <th className="py-2.5 px-3 text-right text-emerald-400">{t('Income', 'আয়')}</th>
                  <th className="py-2.5 px-3 text-right text-rose-400">{t('Expense', 'খরচ')}</th>
                  <th className="py-2.5 px-3 text-right">{t('Net', 'ব্যালেন্স')}</th>
                  <th className="py-2.5 px-3">{t('Top Expense Category', 'শীর্ষ খরচ')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {monthlyHistory.map(row => (
                  <tr
                    key={row.monthKey}
                    onClick={() => {
                      setSelectedMonth(row.monthKey);
                      setSummaryScope('month');
                      setFilterPreset('this_month');
                    }}
                    className={`hover:bg-slate-800/70 transition-colors cursor-pointer ${
                      row.monthKey === selectedMonth && summaryScope === 'month'
                        ? 'bg-indigo-950/40 text-indigo-200'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans font-bold text-slate-200">
                      {row.label}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-emerald-400 tabular-nums">
                      +{formatNumberLocale(row.inc, lang)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-rose-400 tabular-nums">
                      -{formatNumberLocale(row.exp, lang)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right whitespace-nowrap font-bold tabular-nums ${
                        row.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {row.net >= 0 ? '+' : ''}
                      {formatNumberLocale(row.net, lang)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans text-slate-300">
                      {row.topCat} {row.topCatVal > 0 ? `(${formatNumberLocale(row.topCatVal, lang)})` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* ======================================================== */}
      {/* 10. PRINTABLE REPORT VIEW (PDF & BROWSER PRINT) */}
      {/* "as like month filter kore print debo oi maser name soho prinet hobe october-2026 hisab_kitab" */}
      {/* ======================================================== */}
      <div id="printable-report" className="hidden print:block font-sans text-slate-900 bg-white p-4">
        {/* Header with Month Title */}
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

        {/* 1st: Financial Summary Overview */}
        <div className="mb-5 print-avoid-break">
          <h2 className="text-sm font-bold uppercase border-b border-slate-400 pb-1 mb-2 text-slate-800">
            1. Financial Summary Overview
          </h2>
          <table className="w-full text-xs border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold bg-slate-100 w-1/4">Total Income</td>
                <td className="p-2 font-mono font-bold text-emerald-700">+{formatNumberLocale(filteredRangeStats.inc, lang)}</td>
                <td className="p-2 font-bold bg-slate-100 w-1/4">Total Expense</td>
                <td className="p-2 font-mono font-bold text-rose-700">-{formatNumberLocale(filteredRangeStats.exp, lang)}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-slate-100">Net Balance</td>
                <td className="p-2 font-mono font-bold text-slate-900">{filteredRangeStats.net >= 0 ? '+' : ''}{formatNumberLocale(filteredRangeStats.net, lang)}</td>
                <td className="p-2 font-bold bg-slate-100">Total Transactions</td>
                <td className="p-2 font-mono">{filteredRangeStats.count} items</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2nd: Day-Wise Breakdown */}
        <div className="mb-5 print-avoid-break">
          <h2 className="text-sm font-bold uppercase border-b border-slate-400 pb-1 mb-2 text-slate-800">
            2. Day-Wise Breakdown
          </h2>
          <table className="w-full text-xs border border-slate-300 font-mono">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300 font-sans">
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
                  <td className="p-1.5 text-left font-sans font-medium">{formatDateShortDemo(item.dateStr, lang)}</td>
                  <td className="p-1.5 text-right text-emerald-700">{item.inc > 0 ? `+${formatNumberLocale(item.inc, lang)}` : '—'}</td>
                  <td className="p-1.5 text-right text-rose-700">{item.exp > 0 ? `-${formatNumberLocale(item.exp, lang)}` : '—'}</td>
                  <td className="p-1.5 text-right font-bold">{item.hasActivity ? `${item.net >= 0 ? '+' : ''}${formatNumberLocale(item.net, lang)}` : '0'}</td>
                  <td className="p-1.5 text-center font-sans">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3rd: Category-Wise Breakdown */}
        <div className="mb-5 print-avoid-break">
          <h2 className="text-sm font-bold uppercase border-b border-slate-400 pb-1 mb-2 text-slate-800">
            3. Category-Wise Breakdown
          </h2>
          <table className="w-full text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300">
                <th className="p-1.5 text-left">Category</th>
                <th className="p-1.5 text-center">Type</th>
                <th className="p-1.5 text-center">Records</th>
                <th className="p-1.5 text-right">Amount</th>
                <th className="p-1.5 text-right">Ratio</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllCategoryBreakdown.map(item => (
                <tr key={item.cat} className="border-b border-slate-200">
                  <td className="p-1.5 font-semibold text-slate-900">{item.cat}</td>
                  <td className="p-1.5 text-center font-medium">{categoryBreakdownType}</td>
                  <td className="p-1.5 text-center font-mono">{item.count}</td>
                  <td className="p-1.5 text-right font-mono font-bold">
                    {formatNumberLocale(item.total, lang)}
                  </td>
                  <td className="p-1.5 text-right font-mono">{item.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4th: Complete Transactions Ledger */}
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase border-b border-slate-400 pb-1 mb-2 text-slate-800">
            4. Complete Transaction Details ({filteredRangeTransactions.length} records)
          </h2>
          <table className="w-full text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300">
                <th className="p-1.5 text-left">Date / Time</th>
                <th className="p-1.5 text-center">Type</th>
                <th className="p-1.5 text-left">Category</th>
                <th className="p-1.5 text-left">Note</th>
                <th className="p-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredRangeTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-slate-200">
                  <td className="p-1.5 font-mono text-[10.5px]">{formatCleanDateTime(tx.datetime || tx.date, lang)}</td>
                  <td className="p-1.5 text-center font-semibold">{tx.type}</td>
                  <td className="p-1.5 font-semibold">{cleanCategoryName(tx.category, lang)}</td>
                  <td className="p-1.5 text-slate-700">{tx.note || '—'}</td>
                  <td className={`p-1.5 text-right font-mono font-bold ${tx.type === 'Expense' ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {tx.type === 'Expense' ? '-' : '+'}{formatNumberLocale(tx.value, lang)}
                  </td>
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
          return inRange.length > 0 ? filteredRangeTransactions : transactions;
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
