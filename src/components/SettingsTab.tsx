import React, { useState } from 'react';
import {
  Settings,
  User,
  Tag,
  Download,
  Shield,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Globe,
  Sliders,
  Smartphone,
  Monitor,
  LogOut,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { AppUser, Transaction, TransactionType } from '../types';
import { cleanCategoryName } from '../utils/categoryUtils';
import { normalizeDate, formatNumberLocale, formatCleanDateTime } from '../utils/dateUtils';
import { AppsScriptModal } from './Modals';

interface SettingsTabProps {
  currentUser: AppUser | null;
  expenseCategories: string[];
  incomeCategories: string[];
  onOpenAddCategoryModal: (type: TransactionType) => void;
  onDeleteCategory: (category: string, type: TransactionType) => void;
  transactions: Transaction[];
  isSyncing: boolean;
  onSync: () => void;
  lastSyncTime: string;
  lang: 'en' | 'bn';
  toggleLanguage: () => void;
  onOpenEditProfile: () => void;
  viewMode: 'mobile' | 'desktop';
  onLogout?: () => void;
  t: (en: string, bn: string) => string;
}

const getRoleLabel = (role?: string) => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'super_admin_2': return 'Super Admin (Viewer)';
    case 'admin': return 'Admin';
    case 'senior_member': return 'Senior Member';
    case 'member': return 'Member';
    default: return 'User';
  }
};

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentUser,
  expenseCategories,
  incomeCategories,
  onOpenAddCategoryModal,
  onDeleteCategory,
  transactions,
  isSyncing,
  onSync,
  lastSyncTime,
  lang,
  toggleLanguage,
  onOpenEditProfile,
  viewMode,
  onLogout,
  t
}) => {
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.username === 'abujar287';
  const [showAppsScriptModal, setShowAppsScriptModal] = useState(false);
  const [categoryTypeTab, setCategoryTypeTab] = useState<TransactionType>('Expense');

  const activeCategories = categoryTypeTab === 'Expense' ? expenseCategories : incomeCategories;

  // Print Full Month Overall Report
  const handlePrintFullMonth = () => {
    const originalTitle = document.title;
    document.title = `hisab_kitab_full_month_report_${new Date().toISOString().split('T')[0]}`;
    try {
      window.focus();
      window.print();
    } catch {}
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  // Full month stats for printing
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthTransactions = transactions.filter(tx => normalizeDate(tx.date).startsWith(currentMonthPrefix));
  const monthInc = monthTransactions.reduce((acc, tx) => tx.type === 'Income' ? acc + (Number(tx.value) || 0) : acc, 0);
  const monthExp = monthTransactions.reduce((acc, tx) => tx.type === 'Expense' ? acc + (Number(tx.value) || 0) : acc, 0);
  const monthNet = monthInc - monthExp;

  // Export full JSON backup
  const handleDownloadBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hisab_kitab_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* GOOGLE APPS SCRIPT INTEGRATION */}
      {isAdmin && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-indigo-500/30 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-white uppercase tracking-tight">
                  {t('Apps Script', 'অ্যাপস স্ক্রিপ্ট')}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAppsScriptModal(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{t('View Code', 'কোড দেখুন')}</span>
            </button>
          </div>
        </div>
      )}

      {/* FULL MONTH PRINT REPORT SECTION */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 shadow-lg space-y-3 print:hidden">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-white uppercase tracking-tight">
                {t('Monthly Report', 'মাসিক রিপোর্ট')}
              </h3>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrintFullMonth}
          className="w-full py-2.5 bg-slate-750 hover:bg-slate-700 text-slate-100 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all border border-slate-700/50 shadow-sm"
        >
          <Printer className="w-4 h-4 text-indigo-400" />
          <span>{t('Print Full Month Report', 'পূর্ণাঙ্গ মাসিক রিপোর্ট প্রিন্ট করুন')}</span>
        </button>
      </div>
      {/* PROFILE CARD */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-bold text-white uppercase tracking-tight">
              {t('Profile', 'প্রোফাইল')}
            </h3>
          </div>

          <button
            type="button"
            onClick={onOpenEditProfile}
            className="px-2 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 cursor-pointer active:scale-95"
          >
            {t('Edit', 'এডিট')}
          </button>
        </div>

        {currentUser && (
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-slate-750/50 rounded-xl border border-slate-700/30">
              <span className="text-slate-500 block mb-0.5">{t('Name', 'নাম')}</span>
              <span className="font-bold text-slate-200">{currentUser.displayName}</span>
            </div>
            <div className="p-2 bg-slate-750/50 rounded-xl border border-slate-700/30">
              <span className="text-slate-500 block mb-0.5">{t('User', 'ইউজার')}</span>
              <span className="font-bold  text-indigo-400">@{currentUser.username}</span>
            </div>
            <div className="p-2 bg-slate-750/50 rounded-xl border border-slate-700/30">
              <span className="text-slate-500 block mb-0.5">{t('Role', 'রোল')}</span>
              <span className="font-bold text-slate-300">{getRoleLabel(currentUser.role)}</span>
            </div>
            <div className="p-2 bg-slate-750/50 rounded-xl border border-slate-700/30">
              <span className="text-slate-500 block mb-0.5">{t('Lang', 'ভাষা')}</span>
              <button onClick={toggleLanguage} className="font-bold text-indigo-400 hover:underline">
                {lang === 'en' ? 'ENG' : 'বাংলা'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CLOUD STORAGE STATUS */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-bold text-white uppercase tracking-tight">
              {t('Cloud Sync', 'ক্লাউড সিঙ্ক')}
            </h3>
          </div>

          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSyncing
                ? 'bg-slate-750 text-slate-500 border-slate-700'
                : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/20 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('Syncing...', 'সিঙ্ক হচ্ছে...') : t('Sync', 'সিঙ্ক')}</span>
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-750/50 border border-slate-700/30 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-slate-200 block">{t('Connected', 'সক্রিয়')}</span>
              <span className="text-slate-500 truncate block">
                {t('Last:', 'সর্বশেষ:')} {lastSyncTime}
              </span>
            </div>
          </div>
          <span className="text-[9px]  px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            OK
          </span>
        </div>
      </div>

      {/* CATEGORY MANAGEMENT */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-[11px] font-bold text-white uppercase tracking-tight">
              {t('Categories', 'ক্যাটাগরি')}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddCategoryModal(categoryTypeTab)}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold border border-indigo-500/20 cursor-pointer active:scale-95 transition-all"
          >
            <span>{t('Add New', 'নতুন যোগ')}</span>
          </button>
        </div>

        <div className="flex items-center bg-slate-750 p-0.5 rounded-xl border border-slate-700/50">
          <button
            type="button"
            onClick={() => setCategoryTypeTab('Expense')}
            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              categoryTypeTab === 'Expense' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t('Exp', 'ব্যয়')} ({expenseCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryTypeTab('Income')}
            className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              categoryTypeTab === 'Income' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t('Inc', 'আয়')} ({incomeCategories.length})
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5 no-scrollbar">
          {activeCategories.map(cat => (
            <div
              key={cat}
              className="p-2 rounded-xl bg-slate-750/50 border border-slate-700/30 flex items-center justify-between text-[10px] group"
            >
              <span className="font-semibold text-slate-300 truncate pr-1">
                {cleanCategoryName(cat, lang)}
              </span>
              <button
                type="button"
                onClick={() => onDeleteCategory(cat, categoryTypeTab)}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* BACKUP */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 shadow-lg space-y-3">
        <button
          type="button"
          onClick={handleDownloadBackup}
          className="w-full py-2.5 bg-slate-750 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold border border-slate-700/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Download className="w-4 h-4 text-sky-400" />
          <span>{t('Download Backup', 'ব্যাকআপ ডাউনলোড')}</span>
        </button>
      </div>

      {/* LOGOUT */}
      {onLogout && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50 shadow-lg">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 rounded-xl text-[11px] font-bold border border-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('Log Out', 'লগআউট করুন')}</span>
          </button>
        </div>
      )}

      {/* Apps Script Modal */}
      <AppsScriptModal
        isOpen={showAppsScriptModal}
        onClose={() => setShowAppsScriptModal(false)}
        lang={lang}
        t={t}
      />

      {/* Printable Full Month Overall Report (Hidden except in print mode) */}
      <div className="hidden print:block printable-container text-slate-900 bg-white p-4">
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              Hisab Kitab - Full Month Overall Report ({currentMonthPrefix})
            </h1>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              User: @{currentUser?.username || 'user'} ({currentUser?.displayName})
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-semibold">Generated: {new Date().toLocaleDateString()}</p>
            <p>{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="mb-4">
          <table className="w-full text-xs border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold bg-slate-100 w-1/4">Total Income</td>
                <td className="p-2  font-bold text-emerald-700">+{formatNumberLocale(monthInc, lang)}</td>
                <td className="p-2 font-bold bg-slate-100 w-1/4">Total Expense</td>
                <td className="p-2  font-bold text-rose-700">-{formatNumberLocale(monthExp, lang)}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-slate-100">Net Balance</td>
                <td className="p-2  font-bold text-slate-900">{monthNet >= 0 ? '+' : ''}{formatNumberLocale(monthNet, lang)}</td>
                <td className="p-2 font-bold bg-slate-100">Total Transactions</td>
                <td className="p-2 ">{monthTransactions.length} records</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <table className="w-full text-xs border border-slate-300 ">
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
              {monthTransactions.map(tx => (
                <tr key={tx.id} className="border-b border-slate-200">
                  <td className="p-1.5 text-[10.5px]  whitespace-nowrap">{formatCleanDateTime(tx.datetime || tx.date, lang)}</td>
                  <td className="p-1.5 text-center font-semibold">{tx.type}</td>
                  <td className="p-1.5 font-semibold">{cleanCategoryName(tx.category, lang)}</td>
                  <td className="p-1.5 text-slate-700">{tx.note || '—'}</td>
                  <td className={`p-1.5 text-right  font-bold ${tx.type === 'Expense' ? 'text-rose-700' : 'text-emerald-700'}`}>
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
