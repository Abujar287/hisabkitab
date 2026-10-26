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
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700 text-white w-full">
      <div className="w-full px-3 py-2 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold block truncate leading-tight">
              {t('AG HisabKitab', 'AG HisabKitab')}
            </span>
          </div>
        </div>

        {/* Sync Controls */}
        <button
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            isSyncing
              ? 'bg-slate-800 text-slate-400'
              : 'bg-indigo-600/20 text-indigo-300'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? '...' : t('Sync', 'সিঙ্ক')}</span>
        </button>
      </div>
    </header>
  );
};
