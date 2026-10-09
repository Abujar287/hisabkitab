import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Download,
  Printer,
  Edit3,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  RotateCcw,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { Transaction, AppUser } from '../types';
import { normalizeDate, formatNumberLocale, formatDateFull, formatCleanDateTime } from '../utils/dateUtils';
import { cleanCategoryName } from '../utils/categoryUtils';

interface DetailsTabProps {
  transactions: Transaction[];
  currentUser?: AppUser | null;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  isReadOnly?: boolean;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

interface DateGroup {
  dateStr: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({
  transactions,
  currentUser,
  onEdit,
  onDelete,
  isReadOnly: isReadOnlyProp,
  lang,
  t
}) => {
  const isReadOnly = isReadOnlyProp || currentUser?.isReadOnly || currentUser?.role === 'super_admin_2';
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Expense' | 'Income'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Extract unique categories across transactions
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(tx => {
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Check if any filter is currently applied
  const isFilterActive = searchTerm.trim() !== '' || typeFilter !== 'All' || categoryFilter !== 'All';

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setCategoryFilter('All');
  };

  // Filtered transactions (no date range preset as requested!)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Transaction Type
      if (typeFilter !== 'All' && tx.type !== typeFilter) return false;

      // 2. Category
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) return false;

      // 3. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const catMatch = (tx.category || '').toLowerCase().includes(query);
        const noteMatch = (tx.note || '').toLowerCase().includes(query);
        const valMatch = String(tx.value || '').includes(query);
        const dateMatch = (tx.date || '').includes(query);
        if (!catMatch && !noteMatch && !valMatch && !dateMatch) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, searchTerm]);

  // Overall Filtered Totals
  const filteredTotals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(tx => {
      const val = Number(tx.value) || 0;
      if (tx.type === 'Expense') exp += val;
      else inc += val;
    });
    return { inc, exp, net: inc - exp, count: filteredTransactions.length };
  }, [filteredTransactions]);

  // Date-wise Grouping:
  // "details to date wise asbe as like oi date a income expanse balance
  // category wise seitar amount then porer date"
  const dateGroups = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(tx => {
      const d = normalizeDate(tx.date);
      if (!map[d]) map[d] = [];
      map[d].push(tx);
    });

    const sortedDates = Object.keys(map).sort((a, b) => {
      return sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
    });

    return sortedDates.map(dateStr => {
      const txs = map[dateStr];
      let totalIncome = 0;
      let totalExpense = 0;
      txs.forEach(t => {
        const val = Number(t.value) || 0;
        if (t.type === 'Expense') totalExpense += val;
        else totalIncome += val;
      });
      return {
        dateStr,
        transactions: txs,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
      };
    });
  }, [filteredTransactions, sortOrder]);

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Note'];
    const rows = filteredTransactions.map(tx => [
      `"${tx.id}"`,
      `"${tx.date}"`,
      `"${tx.type}"`,
      `"${cleanCategoryName(tx.category, lang)}"`,
      tx.value,
      `"${(tx.note || '').replace(/"/g, '""')}"`
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hisab_kitab_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `hisab_kitab-details-${new Date().toISOString().split('T')[0]}`;
    try {
      window.focus();
      window.print();
    } catch {}
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-16">
      {/* ON-SCREEN INTERACTIVE DETAILS (HIDDEN IN PRINT) */}
      <div className="print:hidden space-y-4 sm:space-y-5">
        {/* 1. SEARCH & FILTER CARD (NO DATE RANGE PRESET AS PER INSTRUCTION) */}
        <div className="bg-slate-900 rounded-3xl p-3.5 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        {/* Search Input Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t(
                'Search note, category, date, or amount...',
                'বিবরণ, ক্যাটাগরি, তারিখ বা টাকার পরিমাণ দিয়ে খুঁজুন...'
              )}
              className="w-full min-h-[42px] bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="min-h-[42px] min-w-[42px] flex items-center justify-center absolute right-0 top-0 text-slate-400 hover:text-white cursor-pointer"
                title={t('Clear search', 'সার্চ মুছুন')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Clear Filter Button */}
          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="min-h-[42px] px-3 rounded-2xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shrink-0"
              title={t('Reset all filters', 'সব ফিল্টার মুছুন')}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{t('Clear Filter', 'ফিল্টার মুছুন')}</span>
            </button>
          )}
        </div>

        {/* Filter Dropdowns (Type & Category) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <label className="text-[10px] sm:text-[10.5px] text-slate-400 font-semibold block mb-1">
              {t('Transaction Type', 'লেনদেনের ধরন')}
            </label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
            >
              <option value="All">{t('All Types', 'সব ধরনের লেনদেন')}</option>
              <option value="Expense">{t('Expense Only', 'শুধুমাত্র খরচ')}</option>
              <option value="Income">{t('Income Only', 'শুধুমাত্র আয়')}</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] sm:text-[10.5px] text-slate-400 font-semibold block mb-1">
              {t('Category', 'ক্যাটাগরি')}
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full min-h-[40px] bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer truncate shadow-inner"
            >
              <option value="All">{t('All Categories', 'সব ক্যাটাগরি')}</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cleanCategoryName(cat, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. OVERALL FILTERED SUMMARY BANNER (NO TAKA ICON AS REQUESTED) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-900 rounded-3xl p-3 sm:p-4 border border-slate-800 shadow-xl">
        <div className="p-2 sm:p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-center">
          <span className="text-[9.5px] sm:text-[10.5px] text-slate-400 font-semibold uppercase block truncate">
            {t('Total Income', 'মোট আয়')}
          </span>
          <span className="text-xs sm:text-base font-bold font-mono text-emerald-400 tabular-nums block mt-0.5">
            +{formatNumberLocale(filteredTotals.inc, lang)}
          </span>
        </div>

        <div className="p-2 sm:p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-center">
          <span className="text-[9.5px] sm:text-[10.5px] text-slate-400 font-semibold uppercase block truncate">
            {t('Total Expense', 'মোট খরচ')}
          </span>
          <span className="text-xs sm:text-base font-bold font-mono text-rose-400 tabular-nums block mt-0.5">
            -{formatNumberLocale(filteredTotals.exp, lang)}
          </span>
        </div>

        <div className="p-2 sm:p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-center">
          <span className="text-[9.5px] sm:text-[10.5px] text-slate-400 font-semibold uppercase block truncate">
            {t('Net Balance', 'ব্যালেন্স')}
          </span>
          <span
            className={`text-xs sm:text-base font-bold font-mono tabular-nums block mt-0.5 ${
              filteredTotals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {filteredTotals.net >= 0 ? '+' : ''}
            {formatNumberLocale(filteredTotals.net, lang)}
          </span>
        </div>
      </div>

      {/* 3. ACTIONS ROW: COUNT, SORT, & EXPORT */}
      <div className="flex items-center justify-between gap-2 text-xs flex-wrap px-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold text-[11px] sm:text-xs">
            {t('Showing', 'প্রদর্শিত')} <b className="text-white font-mono">{filteredTotals.count}</b> {t('items across', 'টি হিসাব')} <b className="text-indigo-300 font-mono">{dateGroups.length}</b> {t('dates', 'টি দিনে')}
          </span>

          {/* Toggle Sort Order */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-mono text-[10px] sm:text-[11px] cursor-pointer flex items-center gap-1 active:scale-95"
            title={t('Toggle date order', 'তারিখের ক্রমানুসার পরিবর্তন')}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{sortOrder === 'desc' ? 'New➔Old' : 'Old➔New'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer active:scale-95 transition-all text-xs"
            title={t('Export as CSV', 'CSV ডাউনলোড করুন')}
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer active:scale-95 transition-all text-xs"
            title={t('Print or Save as PDF', 'প্রিন্ট বা PDF করুন')}
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('Print', 'প্রিন্ট')}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. DATE-WISE GROUPED TRANSACTIONS LEDGER */}
      {/* Date Header: Date | Day Income | Day Expense | Day Balance */}
      {/* Rows: In/Out Icon | Category & Note & Time | Income Amount | Expense Amount | Edit | Remove */}
      {/* Followed by next date! */}
      {/* ======================================================== */}
      {dateGroups.length === 0 ? (
        <div className="p-10 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
          <p className="text-sm font-medium">
            {t('No transactions match the selected filters.', 'নির্বাচিত ফিল্টারের সাথে কোনো লেনদেন মিল পাওয়া যায়নি।')}
          </p>
          {isFilterActive && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('Clear Filters', 'ফিল্টার মুছুন')}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {dateGroups.map(group => {
            return (
              <div
                key={group.dateStr}
                className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden transition-all"
              >
                {/* DATE HEADER CARD (Oi date er income, expense, balance!) */}
                <div className="bg-gradient-to-r from-slate-850 via-slate-850 to-slate-900 p-3 sm:p-3.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Left: Date Title & Count */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                        {formatDateFull(group.dateStr, lang)}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {group.dateStr} · {group.transactions.length} {t('records', 'টি লেনদেন')}
                      </span>
                    </div>
                  </div>

                  {/* Right: Date-wise Income, Expense, and Balance (NO TAKA SYMBOL) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-xs flex-wrap justify-end">
                    {group.totalIncome > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10.5px] sm:text-xs tabular-nums">
                        +{formatNumberLocale(group.totalIncome, lang)}
                      </span>
                    )}

                    {group.totalExpense > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-[10.5px] sm:text-xs tabular-nums">
                        -{formatNumberLocale(group.totalExpense, lang)}
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-lg border font-bold text-[10.5px] sm:text-xs tabular-nums ${
                        group.netBalance >= 0
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      }`}
                    >
                      {t('Bal: ', 'ব্যালেন্স: ')}
                      {group.netBalance >= 0 ? '+' : ''}
                      {formatNumberLocale(group.netBalance, lang)}
                    </span>
                  </div>
                </div>

                {/* TRANSACTIONS LIST FOR THIS DATE */}
                {/* Structured columns: in/out icon, category, income amount, expense amount, edit, remove */}
                <div className="divide-y divide-slate-800/60">
                  {group.transactions.map(tx => {
                    const isExpense = tx.type === 'Expense';
                    return (
                      <div
                        key={tx.id}
                        className="p-2.5 sm:p-3 hover:bg-slate-850/60 transition-colors flex items-center justify-between gap-2 sm:gap-3 text-xs"
                      >
                        {/* Zone 1: In/Out Icon + Category & Note & Time */}
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                              isExpense
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/25'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                            }`}
                          >
                            {isExpense ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Line 1: Category Name */}
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                                {cleanCategoryName(tx.category, lang)}
                              </span>
                            </div>

                            {/* Line 2: Note */}
                            {tx.note ? (
                              <p className="text-[11px] text-slate-300 mt-0.5 break-words font-medium leading-tight">
                                {tx.note}
                              </p>
                            ) : null}

                            {/* Line 3: Clean Date & Time */}
                            <p className="text-[9.5px] sm:text-[10px] text-slate-400 font-mono mt-0.5 leading-tight">
                              {formatCleanDateTime(tx.datetime || tx.date, lang)}
                            </p>
                          </div>
                        </div>

                        {/* Zone 2: Income Amount & Expense Amount (Separate display, no taka symbol) */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-right">
                          <div className="flex flex-col items-end min-w-[70px] sm:min-w-[90px]">
                            {isExpense ? (
                              <span className="font-bold font-mono text-xs sm:text-sm text-rose-400 tabular-nums">
                                -{formatNumberLocale(Math.abs(tx.value), lang)}
                              </span>
                            ) : (
                              <span className="font-bold font-mono text-xs sm:text-sm text-emerald-400 tabular-nums">
                                +{formatNumberLocale(Math.abs(tx.value), lang)}
                              </span>
                            )}
                          </div>

                          {/* Zone 3: Action Buttons (Edit & Remove - Hidden if Read-Only) */}
                          {!isReadOnly && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEdit(tx)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 transition-colors cursor-pointer active:scale-95"
                                title={t('Edit', 'এডিট')}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onDelete(tx)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition-colors cursor-pointer active:scale-95"
                                title={t('Remove', 'মুছে ফেলুন')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* ======================================================== */}
      {/* 5. PRINTABLE DETAILS REPORT VIEW (A4 PDF & BROWSER PRINT) */}
      {/* ======================================================== */}
      <div id="printable-details-report" className="hidden print:block printable-container font-sans text-slate-900 bg-white p-4">
        {/* Header with Title and Metadata */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              Hisab Kitab - Transaction Ledger Report
            </h1>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Filter: {typeFilter !== 'All' ? typeFilter : 'All Types'} · Category: {categoryFilter !== 'All' ? cleanCategoryName(categoryFilter, lang) : 'All Categories'} {searchTerm ? `· Search: "${searchTerm}"` : ''}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-semibold">Statement Date: {new Date().toLocaleDateString()}</p>
            <p>{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Financial Summary Box */}
        <div className="mb-4 print-avoid-break">
          <table className="w-full text-xs border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold bg-slate-100 w-1/4">Total Income</td>
                <td className="p-2 font-mono font-bold text-emerald-700">+{formatNumberLocale(filteredTotals.inc, lang)}</td>
                <td className="p-2 font-bold bg-slate-100 w-1/4">Total Expense</td>
                <td className="p-2 font-mono font-bold text-rose-700">-{formatNumberLocale(filteredTotals.exp, lang)}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-slate-100">Net Balance</td>
                <td className="p-2 font-mono font-bold text-slate-900">{filteredTotals.net >= 0 ? '+' : ''}{formatNumberLocale(filteredTotals.net, lang)}</td>
                <td className="p-2 font-bold bg-slate-100">Total Records</td>
                <td className="p-2 font-mono">{filteredTotals.count} items across {dateGroups.length} dates</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Transactions Table */}
        <div className="mb-4">
          <table className="w-full text-xs border border-slate-300 font-mono">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-300 font-sans">
                <th className="p-1.5 text-left">Date / Time</th>
                <th className="p-1.5 text-center">Type</th>
                <th className="p-1.5 text-left">Category</th>
                <th className="p-1.5 text-left">Note / Description</th>
                <th className="p-1.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-slate-200">
                  <td className="p-1.5 text-[10.5px] font-mono whitespace-nowrap">{formatCleanDateTime(tx.datetime || tx.date, lang)}</td>
                  <td className="p-1.5 text-center font-semibold font-sans">{tx.type}</td>
                  <td className="p-1.5 font-semibold font-sans">{cleanCategoryName(tx.category, lang)}</td>
                  <td className="p-1.5 text-slate-700 font-sans">{tx.note || '—'}</td>
                  <td className={`p-1.5 text-right font-mono font-bold ${tx.type === 'Expense' ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {tx.type === 'Expense' ? '-' : '+'}{formatNumberLocale(Math.abs(tx.value), lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
