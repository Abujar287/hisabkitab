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
  LogOut
} from 'lucide-react';
import { AppUser, Transaction, TransactionType } from '../types';
import { cleanCategoryName } from '../utils/categoryUtils';

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
  toggleViewMode?: () => void;
  setViewMode?: (mode: 'mobile' | 'desktop') => void;
  onLogout?: () => void;
  t: (en: string, bn: string) => string;
}

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
  toggleViewMode,
  setViewMode,
  onLogout,
  t
}) => {
  const [categoryTypeTab, setCategoryTypeTab] = useState<TransactionType>('Expense');

  const activeCategories = categoryTypeTab === 'Expense' ? expenseCategories : incomeCategories;

  // Handle switching view mode directly
  const handleSelectViewMode = (mode: 'mobile' | 'desktop') => {
    if (setViewMode) {
      setViewMode(mode);
    } else if (toggleViewMode && viewMode !== mode) {
      toggleViewMode();
    }
  };

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
      {/* 1. DEVICE VIEWPORT MODE SELECTOR (PC/LAPTOP vs MOBILE PHONE) */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t('Device Viewport Layout', 'ডিভাইস ভিউ মোড')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('Switch between PC/Laptop/Tablet layout and Mobile Phone view', 'পিসি/ল্যাপটপ বা মোবাইল স্ক্রিন সাইজ নির্বাচন করুন')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleSelectViewMode('desktop')}
            className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-98 ${
              viewMode === 'desktop'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className={`w-6 h-6 ${viewMode === 'desktop' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <div className="text-center">
              <span className="text-xs font-bold block">{t('PC / Laptop / Tablet', 'পিসি / ল্যাপটপ')}</span>
              <span className="text-[10px] text-slate-400">{t('Full desktop layout', 'পূর্ণাঙ্গ বড় স্ক্রিন')}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectViewMode('mobile')}
            className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-98 ${
              viewMode === 'mobile'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500'
                : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className={`w-6 h-6 ${viewMode === 'mobile' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <div className="text-center">
              <span className="text-xs font-bold block">{t('Mobile Phone Mode', 'মোবাইল ফোন মোড')}</span>
              <span className="text-[10px] text-slate-400">{t('Compact phone app view', 'কমপ্যাক্ট মোবাইল অ্যাপ')}</span>
            </div>
          </button>
        </div>
      </div>
      {/* PROFILE CARD */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t('My Account & Profile', 'আমার অ্যাকাউন্ট ও প্রোফাইল')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('Personal profile and credentials', 'ব্যক্তিগত তথ্য ও নিরাপত্তা')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenEditProfile}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 cursor-pointer transition-all active:scale-95"
          >
            {t('Edit Profile', 'প্রোফাইল এডিট')}
          </button>
        </div>

        {currentUser && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800/70 rounded-2xl border border-slate-700/60">
              <span className="text-[10.5px] text-slate-400 block mb-0.5">{t('Full Name', 'পুরো নাম')}</span>
              <span className="font-bold text-white">{currentUser.displayName}</span>
            </div>
            <div className="p-3 bg-slate-800/70 rounded-2xl border border-slate-700/60">
              <span className="text-[10.5px] text-slate-400 block mb-0.5">{t('Username', 'ইউজারনেম')}</span>
              <span className="font-bold font-mono text-indigo-300">@{currentUser.username}</span>
            </div>
            <div className="p-3 bg-slate-800/70 rounded-2xl border border-slate-700/60">
              <span className="text-[10.5px] text-slate-400 block mb-0.5">{t('Role', 'ব্যবহারকারীর রোল')}</span>
              <span className="font-bold text-slate-200">
                {currentUser.role === 'admin' ? t('Administrator', 'অ্যাডমিনিস্ট্রেটর') : t('Team Member', 'টিম মেম্বার')}
              </span>
            </div>
            <div className="p-3 bg-slate-800/70 rounded-2xl border border-slate-700/60">
              <span className="text-[10.5px] text-slate-400 block mb-0.5">{t('Language', 'ভাষা')}</span>
              <button
                type="button"
                onClick={toggleLanguage}
                className="font-bold text-indigo-400 hover:underline cursor-pointer"
              >
                {lang === 'en' ? 'English (Switch to বাংলা)' : 'বাংলা (Switch to English)'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CLOUD STORAGE STATUS (NO SCRIPT OR LINK EXPOSURE!) */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t('Cloud Database Sync', 'ক্লাউড ডেটাবেস সিঙ্ক')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('Secure background cloud synchronization', 'স্বয়ংক্রিয় নিরাপদ ক্লাউড সিঙ্ক')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSyncing
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30 active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? t('Syncing...', 'সিঙ্ক হচ্ছে...') : t('Sync Now', 'সিঙ্ক করুন')}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">
                {t('Connected & Active', 'ক্লাউড কানেকশন সক্রিয়')}
              </span>
              <span className="text-[11px] text-slate-400">
                {t('Last Synced: ', 'সর্বশেষ সিঙ্ক: ')}
                <b className="font-mono text-slate-300">{lastSyncTime}</b>
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
            SECURE
          </span>
        </div>
      </div>

      {/* CATEGORY MANAGEMENT */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t('Manage Categories', 'ক্যাটাগরি ব্যবস্থাপনা')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('Customize your personal expense and income categories', 'আপনার ব্যক্তিগত আয় ও খরচের খাতসমূহ কাস্টমাইজ করুন')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddCategoryModal(categoryTypeTab)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('Add Category', 'নতুন খাত যোগ')}</span>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setCategoryTypeTab('Expense')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryTypeTab === 'Expense'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('Expense Categories', 'খরচের খাত')} ({expenseCategories.length})
          </button>
          <button
            type="button"
            onClick={() => setCategoryTypeTab('Income')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              categoryTypeTab === 'Income'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('Income Categories', 'আয়ের খাত')} ({incomeCategories.length})
          </button>
        </div>

        {/* Categories list */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
          {activeCategories.map(cat => (
            <div
              key={cat}
              className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs group"
            >
              <span className="font-semibold text-slate-200 truncate pr-1">
                {cleanCategoryName(cat, lang)}
              </span>
              <button
                type="button"
                onClick={() => onDeleteCategory(cat, categoryTypeTab)}
                className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 cursor-pointer transition-colors active:scale-95 shrink-0"
                title={t('Delete Category', 'মুছে ফেলুন')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* OFFLINE BACKUP EXPORT */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {t('Offline Backup & Export', 'অফলাইন ব্যাকআপ ও ফাইল এক্সপোর্ট')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('Download your data for offline safety', 'আপনার ডিভাইসে সম্পূর্ণ হিসাব ডাউনলোড করে রাখুন')}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadBackup}
          className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-2xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
        >
          <Download className="w-4 h-4 text-sky-400" />
          <span>{t('Download Full JSON Backup File', 'সম্পূর্ণ ডেটা JSON ব্যাকআপ ডাউনলোড করুন')}</span>
        </button>
      </div>

      {/* ACCOUNT LOGOUT SECTION */}
      {onLogout && (
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {t('Account Session', 'অ্যাকাউন্ট সেশন')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('Sign out of your account on this device', 'এই ডিভাইস থেকে লগআউট করুন')}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full min-h-[46px] py-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-rose-200 rounded-2xl text-xs sm:text-sm font-bold border border-rose-500/40 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all shadow-md shadow-rose-950/40"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>{t('Log Out of Account', 'লগআউট করুন')}</span>
          </button>
        </div>
      )}
    </div>
  );
};
