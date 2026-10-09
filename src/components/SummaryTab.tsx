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
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { Transaction, DaySummary } from '../types';
import { normalizeDate, formatNumberLocale, formatDayDisplay } from '../utils/dateUtils';
import { cleanCategoryName } from '../utils/categoryUtils';

interface SummaryTabProps {
  transactions: Transaction[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  summaryScope: 'month' | 'all';
  setSummaryScope: (scope: 'month' | 'all') => void;
  onSelectDate: (dateStr: string) => void;
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
  lang,
  t
}) => {
  const [showCalendarGrid, setShowCalendarGrid] = useState<boolean>(true);
  const [dayFilterMode, setDayFilterMode] = useState<'active' | 'all'>('active');
  const [daySortOrder, setDaySortOrder] = useState<'asc' | 'desc'>('asc');
  const [categoryBreakdownType, setCategoryBreakdownType] = useState<'Expense' | 'Income'>('Expense');

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

  // Calculations for Selected Month
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

  // Active Scope Totals
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
  // DAY-WISE BREAKDOWN TABLE (USER SPECIFIC REQUEST)
  // Day | Income | Expense | Net Balance | Count
  // ========================================================
  const dayWiseList = useMemo(() => {
    const { year, month, totalDays } = calendarDays;
    const list: DaySummary[] = [];

    for (let d = 1; d <= totalDays; d++) {
      const data = monthStats.dailyMap[d] || { inc: 0, exp: 0, count: 0 };
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeek = dateObj.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
        weekday: 'short'
      });
      const net = data.inc - data.exp;
      const hasActivity = data.inc > 0 || data.exp > 0;

      list.push({
        day: d,
        dateStr,
        dayOfWeek,
        inc: data.inc,
        exp: data.exp,
        net,
        count: data.count,
        hasActivity
      });
    }

    const filtered = dayFilterMode === 'active' ? list.filter(item => item.hasActivity) : list;

    if (daySortOrder === 'desc') {
      return [...filtered].sort((a, b) => b.day - a.day);
    }
    return [...filtered].sort((a, b) => a.day - b.day);
  }, [calendarDays, monthStats.dailyMap, dayFilterMode, daySortOrder, lang]);

  // Top 5 Expense Categories for current scope
  const topExpenseCategories = useMemo(() => {
    const catMap: Record<string, number> = {};
    const [y, m] = selectedMonth.split('-').map(Number);

    transactions.forEach(tx => {
      if (tx.type !== 'Expense') return;
      if (summaryScope === 'month') {
        const [ty, tm] = normalizeDate(tx.date).split('-').map(Number);
        if (ty !== y || tm !== m) return;
      }
      const c = cleanCategoryName(tx.category || 'Others', lang);
      catMap[c] = (catMap[c] || 0) + (Number(tx.value) || 0);
    });

    const totalExp = activeTotals.exp || 1;
    return Object.entries(catMap)
      .map(([cat, val]) => ({
        cat,
        val,
        percent: ((val / totalExp) * 100).toFixed(1)
      }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);
  }, [transactions, selectedMonth, summaryScope, activeTotals.exp, lang]);

  // All Categories Breakdown (Expense & Income)
  const allCategoryBreakdown = useMemo(() => {
    const catMap: Record<string, { total: number; count: number }> = {};
    const [y, m] = selectedMonth.split('-').map(Number);

    transactions.forEach(tx => {
      if (tx.type !== categoryBreakdownType) return;
      if (summaryScope === 'month') {
        const [ty, tm] = normalizeDate(tx.date).split('-').map(Number);
        if (ty !== y || tm !== m) return;
      }
      const c = cleanCategoryName(tx.category || 'Others', lang);
      if (!catMap[c]) catMap[c] = { total: 0, count: 0 };
      catMap[c].total += Number(tx.value) || 0;
      catMap[c].count += 1;
    });

    const targetTotal = categoryBreakdownType === 'Expense' ? activeTotals.exp : activeTotals.inc;
    const baseTotal = targetTotal || 1;

    return Object.entries(catMap)
      .map(([cat, info]) => ({
        cat,
        total: info.total,
        count: info.count,
        percent: ((info.total / baseTotal) * 100).toFixed(1)
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, selectedMonth, summaryScope, categoryBreakdownType, activeTotals.exp, activeTotals.inc, lang]);

  // Month-by-month historical comparison
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

        // Find top category
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
    <div className="space-y-5 sm:space-y-6 animate-fadeIn pb-12">
      {/* Scope Segmented Control */}
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

      {/* HERO FINANCIAL DASHBOARD CARD */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-4 sm:p-6 shadow-2xl border border-slate-800/80 relative overflow-hidden">
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
                className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all cursor-pointer shrink-0"
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
                className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all cursor-pointer shrink-0"
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
        <div className="mb-5 sm:mb-6">
          <span className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider block">
            {summaryScope === 'all'
              ? t('All-Time Net Balance', 'সর্বমোট অবশিষ্ট ব্যালেন্স')
              : t('Monthly Remaining Balance', 'এই মাসের অবশিষ্ট ব্যালেন্স')}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1 font-mono">
            <span
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight tabular-nums ${
                activeTotals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {activeTotals.net >= 0 ? '+' : ''}
              {formatNumberLocale(activeTotals.net, lang)}
            </span>
            <span className="text-lg sm:text-xl font-bold text-slate-400">৳</span>
          </div>
        </div>

        {/* 2-Column KPI Cards (Income vs Expense) */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="bg-slate-800/70 rounded-2xl p-3 sm:p-4 border border-slate-700/60 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold block truncate">
                {summaryScope === 'all' ? t('Total Income', 'সর্বমোট আয়') : t('Month Income', 'এই মাসের মোট আয়')}
              </span>
              <span className="text-sm sm:text-lg font-bold font-mono text-emerald-300 tabular-nums truncate block">
                +{formatNumberLocale(activeTotals.inc, lang)} ৳
              </span>
            </div>
          </div>

          <div className="bg-slate-800/70 rounded-2xl p-3 sm:p-4 border border-slate-700/60 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold block truncate">
                {summaryScope === 'all' ? t('Total Expense', 'সর্বমোট খরচ') : t('Month Expense', 'এই মাসের মোট খরচ')}
              </span>
              <span className="text-sm sm:text-lg font-bold font-mono text-rose-300 tabular-nums truncate block">
                -{formatNumberLocale(activeTotals.exp, lang)} ৳
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MONTHLY CALENDAR WITH INTERACTIVE DAY MATRIX */}
      {/* ======================================================== */}
      {summaryScope === 'month' && (
        <div className="bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-800 shadow-xl space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white">
                {t('Monthly Calendar', 'মাসিক ক্যালেন্ডার')}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">({monthLabel.split(' ')[0]})</span>
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

              {/* Day cells matrix */}
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarDays.emptySlots.map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-9 sm:h-12 rounded-xl bg-transparent pointer-events-none" />
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
                      className={`h-10 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all cursor-pointer relative border active:scale-95 ${
                        isToday
                          ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/40 border-indigo-400'
                          : hasExp || hasInc
                          ? 'bg-slate-800/95 hover:bg-slate-750 text-slate-100 border-slate-700/80 hover:border-indigo-500/50'
                          : 'bg-slate-850/50 hover:bg-slate-800 text-slate-400 border-slate-800/60'
                      }`}
                      title={`${dateStr}: Inc: +৳${dayData?.inc || 0}, Exp: -৳${dayData?.exp || 0}`}
                    >
                      <span className={`text-[11px] sm:text-xs font-mono leading-none ${isToday ? 'text-white font-extrabold' : 'text-slate-200'}`}>
                        {formatDayDisplay(dayNum, lang)}
                      </span>

                      {/* Micro Income & Expense Badges */}
                      <div className="w-full flex items-center justify-center gap-0.5 mt-0.5">
                        {hasInc && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-emerald-200' : 'bg-emerald-400'}`}
                            title={`+${dayData?.inc}৳`}
                          />
                        )}
                        {hasExp && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-rose-200' : 'bg-rose-400'}`}
                            title={`-${dayData?.exp}৳`}
                          />
                        )}
                      </div>

                      {/* Small text amount preview (shown on tablets & desktop to avoid mobile cell clipping) */}
                      {(hasInc || hasExp) && (
                        <span className="hidden sm:inline text-[9px] font-mono text-slate-300 leading-none truncate max-w-full">
                          {hasExp ? `-${dayData!.exp}` : `+${dayData!.inc}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 text-[9.5px] sm:text-[10px] text-slate-400 pt-2 border-t border-slate-800/70">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{t('Income', 'আয়')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>{t('Expense', 'খরচ')}</span>
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
      {/* 🌟 DAY-WISE BREAKDOWN (RESPONSIVE: MOBILE CARDS + DESKTOP TABLE) */}
      {/* Day | Income | Expense | Net Balance */}
      {/* ======================================================== */}
      {summaryScope === 'month' && (
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
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium block">
                  {t('Daily Income, Expense & Net Balance', 'প্রতিদিনের বিস্তারিত হিসাব')}
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
                  {t('Active Days', 'সক্রিয় দিন')}
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
                  {t('All Days', 'সব দিন')}
                </button>
              </div>

              {/* Sort Order */}
              <button
                type="button"
                onClick={() => setDaySortOrder(daySortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 cursor-pointer flex items-center gap-1 text-[10.5px] sm:text-[11px]"
                title={t('Toggle Sort Order', 'তারিখ ক্রমানুসারে সাজান')}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{daySortOrder === 'asc' ? '1➔31' : '31➔1'}</span>
              </button>
            </div>
          </div>

          {/* Content state */}
          {dayWiseList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {t('No transactions recorded for this month.', 'এই মাসে এখনও কোনো লেনদেন রেকর্ড করা হয়নি।')}
            </div>
          ) : (
            <>
              {/* 1. MOBILE RESPONSIVE DAY CARDS (Zero horizontal scroll on phones!) */}
              <div className="block sm:hidden space-y-2">
                {dayWiseList.map(item => {
                  const isToday = item.day === calendarDays.todayDate;
                  return (
                    <div
                      key={item.dateStr}
                      onClick={() => onSelectDate(item.dateStr)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer active:scale-98 flex items-center justify-between gap-2 ${
                        isToday
                          ? 'bg-indigo-950/40 border-indigo-500/40'
                          : item.hasActivity
                          ? 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/70'
                          : 'bg-slate-850/40 border-slate-800/60'
                      }`}
                    >
                      {/* Left: Day Badge & Date */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                            isToday
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : item.hasActivity
                              ? 'bg-slate-700 text-slate-100'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {formatDayDisplay(item.day, lang)}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {formatDayDisplay(item.day, lang)} {monthLabel.split(' ')[0]}
                          </div>
                          <span className="text-[10.5px] text-slate-400 font-medium">
                            {item.dayOfWeek} · {item.count} {t('items', 'টি')}
                          </span>
                        </div>
                      </div>

                      {/* Right: Income, Expense & Net Balance */}
                      <div className="flex items-center gap-2 shrink-0 text-right">
                        <div>
                          {item.inc > 0 && (
                            <span className="text-[11px] font-mono text-emerald-400 font-bold block tabular-nums">
                              +{formatNumberLocale(item.inc, lang)} ৳
                            </span>
                          )}
                          {item.exp > 0 && (
                            <span className="text-[11px] font-mono text-rose-400 font-bold block tabular-nums">
                              -{formatNumberLocale(item.exp, lang)} ৳
                            </span>
                          )}
                          {!item.hasActivity && (
                            <span className="text-[11px] font-mono text-slate-500 block">0 ৳</span>
                          )}
                          {item.hasActivity && (
                            <span
                              className={`text-[10px] font-mono font-bold block ${
                                item.net >= 0 ? 'text-emerald-300' : 'text-rose-300'
                              }`}
                            >
                              {t('Net: ', 'ব্যালেন্স: ')}{item.net >= 0 ? '+' : ''}{formatNumberLocale(item.net, lang)}
                            </span>
                          )}
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-slate-500 shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. TABLET & DESKTOP DATA TABLE */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">{t('Day / Date', 'দিন / তারিখ')}</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400">{t('Income', 'আয়')}</th>
                      <th className="py-2.5 px-3 text-right text-rose-400">{t('Expense', 'খরচ')}</th>
                      <th className="py-2.5 px-3 text-right">{t('Net Balance', 'অবশিষ্ট')}</th>
                      <th className="py-2.5 px-3 text-center">{t('Items', 'লেনদেন')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {dayWiseList.map(item => {
                      const isToday = item.day === calendarDays.todayDate;
                      return (
                        <tr
                          key={item.dateStr}
                          onClick={() => onSelectDate(item.dateStr)}
                          className={`hover:bg-slate-800/70 transition-colors cursor-pointer group ${
                            isToday ? 'bg-indigo-950/30' : ''
                          }`}
                        >
                          {/* Day & Date */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 font-sans">
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                                  isToday
                                    ? 'bg-indigo-600 text-white'
                                    : item.hasActivity
                                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                                    : 'bg-slate-850 text-slate-500'
                                }`}
                              >
                                {formatDayDisplay(item.day, lang)}
                              </span>
                              <div>
                                <div className="text-xs font-bold text-slate-200">
                                  {formatDayDisplay(item.day, lang)} {monthLabel.split(' ')[0]}
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {item.dayOfWeek}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Income */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {item.inc > 0 ? (
                              <span className="text-emerald-400 font-bold tabular-nums">
                                +{formatNumberLocale(item.inc, lang)} ৳
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Expense */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {item.exp > 0 ? (
                              <span className="text-rose-400 font-bold tabular-nums">
                                -{formatNumberLocale(item.exp, lang)} ৳
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Net */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            {item.hasActivity ? (
                              <span
                                className={`font-bold tabular-nums ${
                                  item.net > 0
                                    ? 'text-emerald-400'
                                    : item.net < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-300'
                                }`}
                              >
                                {item.net > 0 ? '+' : ''}
                                {formatNumberLocale(item.net, lang)} ৳
                              </span>
                            ) : (
                              <span className="text-slate-600">0 ৳</span>
                            )}
                          </td>

                          {/* Action / Inspect */}
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            {item.count > 0 ? (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  onSelectDate(item.dateStr);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all text-[11px] font-sans font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>{item.count}</span>
                                <Eye className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-slate-600 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-700 font-bold text-xs bg-slate-850/80">
                      <td className="py-2.5 px-3 text-white font-sans">
                        {t('Total (Selected Month)', 'মোট (এই মাস)')}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-mono tabular-nums">
                        +{formatNumberLocale(monthStats.inc, lang)} ৳
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-mono tabular-nums">
                        -{formatNumberLocale(monthStats.exp, lang)} ৳
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span className={monthStats.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {monthStats.net >= 0 ? '+' : ''}
                          {formatNumberLocale(monthStats.net, lang)} ৳
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {dayWiseList.reduce((acc, curr) => acc + curr.count, 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP 5 EXPENSE CATEGORIES */}
      {/* ======================================================== */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              {t('Top Expense Categories', 'শীর্ষ ব্যয়ের খাতসমূহ')}
            </h3>
          </div>
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
            {summaryScope === 'month' ? monthLabel : t('All-Time', 'সর্বমোট')}
          </span>
        </div>

        {topExpenseCategories.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            {t('No expense records found.', 'কোনো খরচের রেকর্ড পাওয়া যায়নি।')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {topExpenseCategories.map((item, idx) => (
              <div key={item.cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200 truncate">{item.cat}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-slate-400 text-[10.5px] sm:text-[11px]">{item.percent}%</span>
                    <span className="font-bold text-rose-300 tabular-nums">
                      {formatNumberLocale(item.val, lang)} ৳
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Number(item.percent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ALL CATEGORIES REPORT (WITH EXPENSE / INCOME TOGGLE) */}
      {/* ======================================================== */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white">
              {t('Category Breakdown Report', 'ক্যাটাগরিভিত্তিক বিস্তারিত রিপোর্ট')}
            </h3>
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

        {allCategoryBreakdown.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            {t('No categories found for this period.', 'এই সময়ের জন্য কোনো ক্যাটাগরি রেকর্ড নেই।')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            {allCategoryBreakdown.map(item => (
              <div
                key={item.cat}
                className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-white truncate">
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
                  {formatNumberLocale(item.total, lang)} ৳
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MONTHLY HISTORICAL COMPARISON */}
      {/* ======================================================== */}
      {monthlyHistory.length > 0 && (
        <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {t('Historical Months Overview', 'মাসওয়ারী তুলনামূলক ইতিহাস')}
                </h3>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                  {t('Tap any month to view details', 'যেকোনো মাসে ট্যাপ করে হিসাব দেখুন')}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Mobile Cards for History */}
          <div className="block sm:hidden space-y-2">
            {monthlyHistory.map(row => {
              const isSelected = row.monthKey === selectedMonth && summaryScope === 'month';
              return (
                <div
                  key={row.monthKey}
                  onClick={() => {
                    setSelectedMonth(row.monthKey);
                    setSummaryScope('month');
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
                          {t('SELECTED', 'নির্বাচিত')}
                        </span>
                      )}
                    </div>
                    {row.topCat && row.topCat !== 'None' && (
                      <span className="text-[10.5px] text-slate-400 truncate block mt-0.5">
                        {t('Top: ', 'শীর্ষ: ')}{row.topCat} {row.topCatVal > 0 ? `(${formatNumberLocale(row.topCatVal, lang)}৳)` : ''}
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className="flex items-center justify-end gap-2 text-[11px]">
                      <span className="text-emerald-400 font-bold tabular-nums">+{formatNumberLocale(row.inc, lang)}৳</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-rose-400 font-bold tabular-nums">-{formatNumberLocale(row.exp, lang)}৳</span>
                    </div>
                    <span
                      className={`text-[10.5px] font-bold block mt-0.5 tabular-nums ${
                        row.net >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {t('Net: ', 'ব্যালেন্স: ')}{row.net >= 0 ? '+' : ''}{formatNumberLocale(row.net, lang)} ৳
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Tablet & Desktop Data Table */}
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
                      +{formatNumberLocale(row.inc, lang)} ৳
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap text-rose-400 tabular-nums">
                      -{formatNumberLocale(row.exp, lang)} ৳
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right whitespace-nowrap font-bold tabular-nums ${
                        row.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {row.net >= 0 ? '+' : ''}
                      {formatNumberLocale(row.net, lang)} ৳
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans text-slate-300">
                      {row.topCat} {row.topCatVal > 0 ? `(${formatNumberLocale(row.topCatVal, lang)}৳)` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
