import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { AppUser } from '../types';

interface UsersTabProps {
  users: AppUser[];
  currentUser: AppUser | null;
  onOpenCreateModal: () => void;
  onOpenEditModal: (user: AppUser) => void;
  onRequestDeleteUser: (user: AppUser) => void;
  onSwitchUser?: (user: AppUser) => void;
  onToggleActiveUser: (user: AppUser) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  currentUser,
  onOpenCreateModal,
  onOpenEditModal,
  onRequestDeleteUser,
  onToggleActiveUser,
  lang,
  t
}) => {
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'abujar287';

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn pb-12">
      {/* HEADER WITH ADD USER ACTION */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              {t('User & Team Management', 'ব্যবহারকারী ও টিম ব্যবস্থাপনা')}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400">
              {t('Manage user profiles, accounts & isolated tabs', 'অ্যাকাউন্ট ও ডেটা আইসোলেশন নিয়ন্ত্রণ করুন')}
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('Add New User', 'নতুন ইউজার যোগ')}</span>
          </button>
        )}
      </div>

      {/* CURRENT ACTIVE USER HIGHLIGHT */}
      {currentUser && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl p-4 sm:p-5 border border-indigo-500/30 shadow-xl">
          <span className="text-[10px] sm:text-[10.5px] font-semibold text-indigo-400 uppercase tracking-wider block mb-2">
            {t('Currently Active Session', 'বর্তমান সক্রিয় অ্যাকাউন্ট')}
          </span>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-md shrink-0">
                {currentUser.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate">{currentUser.displayName}</h3>
                  <span className="text-[9.5px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 whitespace-nowrap">
                    {t('Active', 'সক্রিয়')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5">
                  <span>@{currentUser.username}</span>
                  <span>·</span>
                  <span className="text-slate-300 font-sans">
                    {currentUser.role === 'admin' ? t('Super Admin', 'সুপার অ্যাডমিন') : t('Member', 'মেম্বার')}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenEditModal(currentUser)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Edit className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('Edit Profile', 'প্রোফাইল এডিট')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ALL USERS CONTAINER */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs sm:text-sm font-bold text-white">
            {t('All Registered Users', 'সমস্ত নিবন্ধিত ইউজার')} ({users.length})
          </span>
          <span className="text-[10.5px] sm:text-[11px] text-slate-400">
            {t('Switch or manage accounts', 'অ্যাকাউন্ট পরিবর্তন করুন')}
          </span>
        </div>

        {/* 1. MOBILE RESPONSIVE USER CARDS */}
        <div className="block md:hidden divide-y divide-slate-800/80">
          {users.map(u => {
            const isCurrent = currentUser?.username === u.username;
            const isMainAdmin = u.username === 'abujar287';

            return (
              <div
                key={u.username}
                className={`p-3.5 sm:p-4 space-y-3 transition-colors ${
                  isCurrent ? 'bg-indigo-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm shrink-0">
                      {u.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs sm:text-sm truncate">{u.displayName}</span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 whitespace-nowrap">
                            {t('YOU', 'আপনি')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>@{u.username}</span>
                        <span>·</span>
                        <span className="font-sans text-[10px] text-slate-300">
                          {u.role === 'admin' ? t('Admin', 'অ্যাডমিন') : t('Member', 'মেম্বার')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleActiveUser(u)}
                    disabled={isMainAdmin}
                    className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                      u.isActive !== false
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    } ${isMainAdmin ? 'opacity-80' : 'cursor-pointer'}`}
                  >
                    {u.isActive !== false ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{u.isActive !== false ? t('Active', 'সক্রিয়') : t('Inactive', 'নিষ্ক্রিয়')}</span>
                  </button>
                </div>

                {/* Password display row with Eye toggle */}
                <div className="flex items-center justify-between text-xs bg-slate-850/80 px-3 py-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-[11px]">{t('Password', 'পাসওয়ার্ড')}:</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-200 text-xs">
                      {visiblePasswords[u.username] ? u.password : '••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVisiblePasswords(prev => ({ ...prev, [u.username]: !prev[u.username] }))}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-750 transition-colors cursor-pointer active:scale-95"
                      title={visiblePasswords[u.username] ? t('Hide password', 'পাসওয়ার্ড লুকান') : t('Show password', 'পাসওয়ার্ড দেখুন')}
                    >
                      {visiblePasswords[u.username] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  </div>
                </div>

                {/* Actions bottom row (No switch button as requested) */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onOpenEditModal(u)}
                      className="min-w-[38px] min-h-[38px] px-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 cursor-pointer active:scale-95 text-xs font-semibold"
                      title={t('Edit User', 'এডিট')}
                    >
                      <Edit className="w-4 h-4 text-indigo-400" />
                      <span>{t('Edit User', 'এডিট')}</span>
                    </button>
                  )}

                  {isAdmin && !isMainAdmin && (
                    <button
                      type="button"
                      onClick={() => onRequestDeleteUser(u)}
                      className="min-w-[38px] min-h-[38px] px-3 flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 cursor-pointer active:scale-95 text-xs font-semibold"
                      title={t('Delete User', 'মুছুন')}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('Delete', 'মুছুন')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. TABLET & DESKTOP DATA TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-850/50">
                <th className="py-3 px-4">{t('User', 'ইউজার')}</th>
                <th className="py-3 px-4">{t('Role', 'রোল')}</th>
                <th className="py-3 px-4">{t('Password', 'পাসওয়ার্ড')}</th>
                <th className="py-3 px-4">{t('Status', 'স্ট্যাটাস')}</th>
                <th className="py-3 px-4">{t('Created', 'তৈরি')}</th>
                <th className="py-3 px-4 text-right">{t('Actions', 'অ্যাকশন')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(u => {
                const isCurrent = currentUser?.username === u.username;
                const isMainAdmin = u.username === 'abujar287';

                return (
                  <tr
                    key={u.username}
                    className={`hover:bg-slate-850/80 transition-colors ${
                      isCurrent ? 'bg-indigo-950/25' : ''
                    }`}
                  >
                    {/* User display name & username */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.displayName}</span>
                            {isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                                {t('YOU', 'আপনি')}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            @{u.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
                          u.role === 'admin'
                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        <span>{u.role === 'admin' ? t('Admin', 'অ্যাডমিন') : t('Member', 'মেম্বার')}</span>
                      </span>
                    </td>

                    {/* Password with View Toggle */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {visiblePasswords[u.username] ? u.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVisiblePasswords(prev => ({ ...prev, [u.username]: !prev[u.username] }))}
                          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title={visiblePasswords[u.username] ? t('Hide password', 'পাসওয়ার্ড লুকান') : t('Show password', 'পাসওয়ার্ড দেখুন')}
                        >
                          {visiblePasswords[u.username] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-indigo-400" />}
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleActiveUser(u)}
                        disabled={isMainAdmin}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                          u.isActive !== false
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25'
                        } ${isMainAdmin ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                        title={isMainAdmin ? t('Main admin cannot be disabled', 'মূল অ্যাডমিন নিষ্ক্রিয় করা যাবে না') : t('Click to toggle active status', 'ক্লিক করে স্ট্যাটাস পরিবর্তন করুন')}
                      >
                        {u.isActive !== false ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{u.isActive !== false ? t('Active', 'সক্রিয়') : t('Inactive', 'নিষ্ক্রিয়')}</span>
                      </button>
                    </td>

                    {/* Created */}
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                      {u.createdAt || '2026-10-01'}
                    </td>

                    {/* Actions (No switch button as requested) */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onOpenEditModal(u)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                            title={t('Edit user details', 'ব্যবহারকারী এডিট')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && !isMainAdmin && (
                          <button
                            type="button"
                            onClick={() => onRequestDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition-colors cursor-pointer border border-rose-500/30"
                            title={t('Delete user', 'ব্যবহারকারী মুছে ফেলুন')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
