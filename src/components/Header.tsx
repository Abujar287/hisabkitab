import React from 'react';
import {
  Wallet,
  RefreshCw,
  PlusCircle,
  BarChart3,
  ListOrdered,
  Users,
  Settings,
  Sliders
} from 'lucide-react';
import { AppUser, AppTab } from '../types';

interface HeaderProps {
  currentUser: AppUser | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  lastSyncTime?: string;
  isSyncing: boolean;
  onSync: () => void;
  viewMode: 'mobile' | 'desktop';
  t: (en: string, bn: string) => string;
  lang?: 'en' | 'bn';
  toggleLanguage?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  lastSyncTime,
  isSyncing,
  onSync,
  viewMode,
  t
}) => {
  const allNavItems = [
    { id: 'summary' as const, label: t('Summary', 'সারাংশ'), icon: BarChart3 },
    { id: 'entry' as const, label: t('Add Entry', 'হিসাব যোগ'), icon: PlusCircle },
    { id: 'details' as const, label: t('Details', 'বিস্তারিত'), icon: ListOrdered },
    { id: 'budget' as const, label: t('Budget', 'বাজেট'), icon: Sliders },
    { id: 'users' as const, label: t('Users', 'ইউজার'), icon: Users },
    { id: 'settings' as const, label: t('Settings', 'সেটিংস'), icon: Settings }
  ];

  let allowedTabs: AppTab[] = currentUser?.allowedTabs || (
    currentUser?.role === 'super_admin_2'
      ? ['summary', 'details']
      : ['summary', 'entry', 'details', 'budget', 'users', 'settings']
  );
  if (!allowedTabs.includes('budget') && currentUser?.role !== 'super_admin_2') {
    allowedTabs = [...allowedTabs, 'budget'];
  }

  const navItems = allNavItems.filter(item => allowedTabs.includes(item.id));

  return (
    <header className="sticky top-0 z-40 bg-slate-800/98 backdrop-blur-md border-b border-slate-700/50 text-white transition-all shadow-md w-full">
      <div className="w-full px-2.5 sm:px-4 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Zone 1: Brand & User Identity (Compact so it never crowds controls) */}
          <div className="flex items-center gap-2 shrink min-w-0 max-w-[150px] sm:max-w-xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30 text-white shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0 truncate">
              <span className="text-xs sm:text-sm font-bold tracking-tight text-white block truncate leading-tight">
                {t('Hisab-Kitab', 'হিসাব-নিকাশ')}
              </span>
              {currentUser && (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                  <span className="font-medium text-slate-300 truncate">
                    {currentUser.displayName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links (Shown in Desktop/Tablet Mode) */}
          {viewMode === 'desktop' && (
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
                        : 'text-slate-300 hover:text-white hover:bg-slate-750'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Zone 3: Quick Action Controls: Last Sync Time & Sync Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Last Sync display on the left of Sync button */}
            <div className="flex items-center text-[10px] sm:text-xs text-slate-300 font-medium whitespace-nowrap bg-slate-900/60 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
              <span className="text-slate-400 mr-1">Last Sync:</span>
              <span className="text-slate-200 font-semibold">{lastSyncTime || '—'}</span>
            </div>

            {/* Cloud Sync Button */}
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className={`h-8 sm:h-9 min-w-[34px] sm:min-w-[36px] flex items-center justify-center gap-1.5 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                isSyncing
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border-indigo-500/40 active:scale-95 shadow-sm'
              }`}
              title={t('Sync with Cloud', 'ক্লাউড সিঙ্ক করুন')}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline text-xs font-bold">{isSyncing ? '...' : t('Sync', 'সিঙ্ক')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
