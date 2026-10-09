import React from 'react';
import {
  Wallet,
  RefreshCw,
  Globe,
  LogOut,
  Smartphone,
  User,
  PlusCircle,
  BarChart3,
  ListOrdered,
  Users,
  Settings
} from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  currentUser: AppUser | null;
  activeTab: 'summary' | 'entry' | 'details' | 'users' | 'settings';
  setActiveTab: (tab: 'summary' | 'entry' | 'details' | 'users' | 'settings') => void;
  lang: 'en' | 'bn';
  toggleLanguage: () => void;
  isSyncing: boolean;
  onSync: () => void;
  onLogout: () => void;
  onOpenMobileModal: () => void;
  t: (en: string, bn: string) => string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  lang,
  toggleLanguage,
  isSyncing,
  onSync,
  onLogout,
  onOpenMobileModal,
  t
}) => {
  const navItems = [
    { id: 'summary' as const, label: t('Summary', 'সারাংশ'), icon: BarChart3 },
    { id: 'entry' as const, label: t('Add Entry', 'হিসাব যোগ'), icon: PlusCircle },
    { id: 'details' as const, label: t('Details', 'বিস্তারিত'), icon: ListOrdered },
    { id: 'users' as const, label: t('Users', 'ইউজার'), icon: Users },
    { id: 'settings' as const, label: t('Settings', 'সেটিংস'), icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 text-white transition-all">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Brand & User Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30 text-white shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap">
                {t('Hisab-Kitab', 'হিসাব-নিকাশ')}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {t('Cloud Active', 'ক্লাউড সিঙ্ক')}
              </span>
            </div>
            {currentUser && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate leading-tight">
                <User className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="font-medium text-slate-300 truncate max-w-[90px] sm:max-w-[130px]">
                  {currentUser.displayName}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-[10px] text-slate-500 font-mono truncate">
                  @{currentUser.username}
                </span>
                {currentUser.role === 'admin' && (
                  <span className="text-[9px] px-1 py-0.1 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 shrink-0">
                    ADM
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Cloud Sync Button */}
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className={`min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isSyncing
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-200 border-indigo-500/30 active:scale-95'
            }`}
            title={t('Sync with Cloud', 'ক্লাউড সিঙ্ক করুন')}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? t('Syncing...', 'সিঙ্ক হচ্ছে...') : t('Sync', 'সিঙ্ক')}</span>
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-200 border border-slate-700 transition-colors active:scale-95 cursor-pointer"
            title={t('Switch Language', 'ভাষা পরিবর্তন')}
          >
            <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-mono text-[11px]">{lang === 'en' ? 'বাংলা' : 'EN'}</span>
          </button>

          {/* Mobile Install / QR Button */}
          <button
            type="button"
            onClick={onOpenMobileModal}
            className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors active:scale-95 cursor-pointer"
            title={t('Install as Mobile App (PWA)', 'ফোনে ইনস্টল নির্দেশিকা')}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">{t('App', 'অ্যাপ')}</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[38px] min-w-[38px] sm:min-h-0 sm:min-w-0 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-colors active:scale-95 cursor-pointer"
            title={t('Logout', 'লগআউট')}
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">{t('Logout', 'লগআউট')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
