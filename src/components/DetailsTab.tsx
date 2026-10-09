import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Calendar,
  X,
  Download,
  Printer,
  Edit3,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { normalizeDate, formatNumberLocale, formatSyncDateTime } from '../utils/dateUtils';
import { cleanCategoryName } from '../utils/categoryUtils';

interface DetailsTabProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const DetailsTab: React.FC<DetailsTabProps> = ({
  transactions,
  onEdit,
  onDelete,
  lang,
  t
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Expense' | 'Income'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [filterPreset, setFilterPreset] = useState<string>('this_month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Extract unique categories in list
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(tx => {
      if (tx.category) set.add(tx.category);
    });
    return Array.from(set);
  }, [transactions]);

  // Compute date range from preset
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStr = normalizeDate(now);

    if (filterPreset === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (filterPreset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      const yStr = normalizeDate(yest);
      return { start: yStr, end: yStr };
    }
    if (filterPreset === 'this_week') {
      const curr = new Date(now);
      const first = curr.getDate() - curr.getDay();
      const firstDay = new Date(curr.setDate(first));
      return { start: normalizeDate(firstDay), end: todayStr };
    }
    if (filterPreset === 'last_7_days') {
      const past7 = new Date(now);
      past7.setDate(now.getDate() - 6);
      return { start: normalizeDate(past7), end: todayStr };
    }
    if (filterPreset === 'this_month') {
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return { start: `${ym}-01`, end: `${ym}-31` };
    }
    if (filterPreset === 'last_month') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const ym = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
      return { start: `${ym}-01`, end: `${ym}-31` };
    }
    if (filterPreset === 'this_year') {
      const y = now.getFullYear();
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
    if (filterPreset === 'custom') {
      return { start: customStartDate, end: customEndDate };
    }
    return { start: '', end: '' }; // All time
  }, [filterPreset, customStartDate, customEndDate]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Type
      if (typeFilter !== 'All' && tx.type !== typeFilter) return false;

      // 2. Category
      if (categoryFilter !== 'All' && tx.category !== categoryFilter) return false;

      // 3. Search keyword
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const catMatch = (tx.category || '').toLowerCase().includes(query);
        const noteMatch = (tx.note || '').toLowerCase().includes(query);
        const valMatch = String(tx.value || '').includes(query);
        const dateMatch = (tx.date || '').includes(query);
        if (!catMatch && !noteMatch && !valMatch && !dateMatch) return false;
      }

      // 4. Date range
      if (dateRange.start || dateRange.end) {
        const cleanDate = normalizeDate(tx.date);
        if (dateRange.start && cleanDate < dateRange.start) return false;
        if (dateRange.end && cleanDate > dateRange.end) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, categoryFilter, searchTerm, dateRange]);

  // Filtered totals
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
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hisab_kitab_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* FILTER & SEARCH CARD */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('Search by note, category, date, or amount...', 'বিবরণ, ক্যাটাগরি, তারিখ বা টাকার পরিমাণ দিয়ে খুঁজুন...')}
            className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-2xl pl-10 pr-10 py-2.5 text-base sm:text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute right-0 top-0 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Date Filter Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('Date Preset Range', 'তারিখ রেঞ্জ ফিল্টার')}</span>
          </label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: t('All Time', 'সব সময়') },
              { id: 'today', label: t('Today', 'আজ') },
              { id: 'yesterday', label: t('Yesterday', 'গতকাল') },
              { id: 'this_week', label: t('This Week', 'এই সপ্তাহ') },
              { id: 'last_7_days', label: t('Last 7 Days', 'গত ৭ দিন') },
              { id: 'this_month', label: t('This Month', 'এই মাস') },
              { id: 'last_month', label: t('Last Month', 'গত মাস') },
              { id: 'this_year', label: t('This Year', 'এই বছর') },
              { id: 'custom', label: t('Custom Range', 'কাস্টম তারিখ') }
            ].map(preset => {
              const isActive = filterPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setFilterPreset(preset.id)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Start & End Date if selected */}
        {filterPreset === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1 animate-fadeIn">
            <div>
              <label className="text-[10.5px] text-slate-400 font-medium block mb-1">
                {t('From Date', 'শুরুর তারিখ')}
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl p-2 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10.5px] text-slate-400 font-medium block mb-1">
                {t('To Date', 'শেষের তারিখ')}
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl p-2 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Type & Category Dropdowns */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10.5px] text-slate-400 font-medium block mb-1">
              {t('Transaction Type', 'লেনদেনের ধরন')}
            </label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl p-2 text-base sm:text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">{t('All Types', 'সব ধরনের লেনদেন')}</option>
              <option value="Expense">{t('Expense Only', 'শুধুমাত্র খরচ')}</option>
              <option value="Income">{t('Income Only', 'শুধুমাত্র আয়')}</option>
            </select>
          </div>

          <div>
            <label className="text-[10.5px] text-slate-400 font-medium block mb-1">
              {t('Category', 'ক্যাটাগরি')}
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full min-h-[44px] bg-slate-800 border border-slate-700 rounded-xl p-2 text-base sm:text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
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

      {/* FILTERED SUMMARY BANNER */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 bg-slate-900 rounded-3xl p-3.5 sm:p-4 border border-slate-800 shadow-xl">
        <div className="p-2 sm:p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">
            {t('Total Income', 'মোট আয়')}
          </span>
          <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 tabular-nums">
            +{formatNumberLocale(filteredTotals.inc, lang)} ৳
          </span>
        </div>

        <div className="p-2 sm:p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">
            {t('Total Expense', 'মোট খরচ')}
          </span>
          <span className="text-xs sm:text-sm font-bold font-mono text-rose-400 tabular-nums">
            -{formatNumberLocale(filteredTotals.exp, lang)} ৳
          </span>
        </div>

        <div className="p-2 sm:p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-center">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block truncate">
            {t('Net Balance', 'ব্যালেন্স')}
          </span>
          <span
            className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
              filteredTotals.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {filteredTotals.net >= 0 ? '+' : ''}
            {formatNumberLocale(filteredTotals.net, lang)} ৳
          </span>
        </div>
      </div>

      {/* ACTIONS ROW: COUNT & EXPORT */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 font-semibold">
          {t('Found', 'মোট')} <b className="text-white font-mono">{filteredTotals.count}</b> {t('transactions', 'টি রেকর্ড')}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer active:scale-95 transition-all"
            title={t('Export as CSV', 'CSV ডাউনলোড করুন')}
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold cursor-pointer active:scale-95 transition-all"
            title={t('Print or Save as PDF', 'প্রিন্ট বা PDF করুন')}
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t('Print', 'প্রিন্ট')}</span>
          </button>
        </div>
      </div>

      {/* TRANSACTIONS LIST */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-400 space-y-2">
          <p className="text-sm font-medium">
            {t('No transactions match the selected filters.', 'নির্বাচিত ফিল্টারের সাথে কোনো লেনদেন মিল পাওয়া যায়নি।')}
          </p>
          <p className="text-xs text-slate-500">
            {t('Try resetting filters or search terms.', 'ফিল্টার রিসেট করে আবার চেষ্টা করুন।')}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden divide-y divide-slate-800/80">
          {filteredTransactions.map(tx => {
            const isExpense = tx.type === 'Expense';
            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 hover:bg-slate-850 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                {/* Left info: Icon, Category, Note, Date */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isExpense ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    {isExpense ? <ArrowDownRight className="w-4.5 h-4.5" /> : <ArrowUpRight className="w-4.5 h-4.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 truncate">
                        {cleanCategoryName(tx.category, lang)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {tx.date}
                      </span>
                    </div>
                    {tx.note && (
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                        {tx.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right info: Amount & Actions */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <span
                    className={`font-bold font-mono text-xs sm:text-sm tabular-nums ${
                      isExpense ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isExpense ? '-' : '+'}
                    {formatNumberLocale(tx.value, lang)} ৳
                  </span>

                  <button
                    type="button"
                    onClick={() => onEdit(tx)}
                    className="min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 transition-colors cursor-pointer active:scale-95"
                    title={t('Edit', 'এডিট')}
                  >
                    <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(tx)}
                    className="min-w-[36px] min-h-[36px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition-colors cursor-pointer active:scale-95"
                    title={t('Delete', 'মুছে ফেলুন')}
                  >
                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
