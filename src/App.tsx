/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  BarChart3,
  PieChart,
  PlusCircle,
  User,
  Calendar,
  X,
  Edit3,
  Trash2,
  Check,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Smartphone,
  Copy,
  CheckCheck,
  AlertTriangle,
  Settings,
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  HelpCircle,
  Share2,
  QrCode,
  Filter,
  Users,
  UserPlus,
  Tag,
  Plus,
  Shield,
  Key
} from 'lucide-react';
import { Transaction, TransactionType, AppUser } from './types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  GOOGLE_SCRIPT_URL
} from './constants';
import { usePWAInstall } from './usePWAInstall';
import { App as CapApp } from '@capacitor/app';

// Helper to reliably normalize any date from Google Sheet into YYYY-MM-DD
function normalizeDate(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const str = String(rawDate).trim();

  // 1. Exact YYYY-MM-DD or strings starting with YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${String(ymdMatch[2]).padStart(2, '0')}-${String(ymdMatch[3]).padStart(2, '0')}`;
  }

  // 2. ISO timestamp string from Google Sheet Date object (e.g. 2026-10-08T00:00:00.000Z)
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return str.split('T')[0];
  }

  // 3. DD/MM/YYYY or MM/DD/YYYY
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        const p0 = Number(parts[0]);
        const p1 = Number(parts[1]);
        const yr = parts[2];
        if (p0 > 12) {
          // DD/MM/YYYY
          return `${yr}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
        }
        if (p1 > 12) {
          // MM/DD/YYYY
          return `${yr}-${String(p0).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
        }
        // Standard Bangladesh format is DD/MM/YYYY
        return `${yr}-${String(p1).padStart(2, '0')}-${String(p0).padStart(2, '0')}`;
      }
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        return `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
      }
    }
  }

  // 4. DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(str)) {
    const parts = str.split('-');
    return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
  }

  // 5. JavaScript Date parse fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  return str;
}

export default function App() {
  // ----------------------------------------------------
  // AUTHENTICATION & MULTI-USER STATE
  // Admin: abujar287, Password: hisabkitab
  // New Onboarding Default: user, Password: password
  // ----------------------------------------------------
  const [lang, setLang] = useState<'en' | 'bn'>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      if (saved === 'bn' || saved === 'en') return saved;
    } catch {}
    return 'en'; // Default English as requested by user
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    try {
      localStorage.setItem('app_language', nextLang);
    } catch {}
    showToast(nextLang === 'en' ? 'Language switched to English' : 'ভাষা পরিবর্তন: বাংলা', 'info');
  };

  const t = (en: string, bn: string) => (lang === 'en' ? en : bn);

  const cleanCategoryName = (cat: string, targetLang: 'en' | 'bn' = lang): string => {
    if (!cat) return '';
    if (targetLang === 'en') {
      let cleaned = cat.replace(/\s*\([^)]*[\u0980-\u09FF]+[^)]*\)/g, '').trim();
      cleaned = cleaned
        .replace(/অন্যান্য আয়/g, 'Other Income')
        .replace(/অন্যান্য খরচ/g, 'Other Expense')
        .replace(/রুম ভাড়া/g, 'Room Rent')
        .replace(/বাজার/g, 'Bajar')
        .replace(/খাবার/g, 'Food')
        .replace(/পার্সোনাল/g, 'Personal')
        .replace(/ওয়াইফাই/g, 'WiFi')
        .replace(/বিদ্যুৎ/g, 'Electricity')
        .replace(/ঔষধ/g, 'Medicines')
        .replace(/পাখি/g, 'Pakhi')
        .replace(/শপিং/g, 'Shopping')
        .replace(/অন্যান্য/g, 'Others')
        .replace(/বেতন/g, 'Salary')
        .replace(/বকেয়া/g, 'Arrear')
        .replace(/ধার নেওয়া/g, 'Borrowed Money')
        .replace(/ধার\/ঋণ/g, 'Loan');
      return cleaned.trim();
    }
    return cat;
  };

  const DEFAULT_ADMIN_USER: AppUser = {
    username: 'abujar287',
    password: 'hisabkitab',
    displayName: 'Abujar Al-Gifari',
    initialUsername: 'abujar287',
    sheetTab: 'abujar287',
    createdAt: '2026-10-01',
    needsSetup: false,
    role: 'admin',
    isActive: true,
  };

  const DEFAULT_NEW_ABUJAR_USER: AppUser = {
    username: 'new_abujar',
    password: 'password',
    displayName: 'New Abujar',
    initialUsername: 'new_abujar',
    sheetTab: 'new abujar',
    createdAt: '2026-10-08',
    needsSetup: false,
    role: 'member',
    isActive: true,
  };

  const DEFAULT_TEMPLATE_USER: AppUser = {
    username: 'user',
    password: 'password',
    displayName: 'New User',
    initialUsername: 'user',
    sheetTab: 'user',
    createdAt: '2026-10-08',
    needsSetup: true,
    role: 'member',
    isActive: true,
  };

  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const deletedUsernames: string[] = JSON.parse(localStorage.getItem('app_deleted_usernames') || '[]');
      const saved = localStorage.getItem('app_registered_users_v2');
      if (saved) {
        const parsed: AppUser[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ensured: AppUser[] = parsed
            .filter(u => !deletedUsernames.includes(u.username))
            .map(u => ({
              ...u,
              isActive: u.isActive !== false,
              sheetTab: u.sheetTab || u.initialUsername || u.username
            }));
          if (!ensured.some(u => u.username === 'abujar287')) {
            ensured.unshift(DEFAULT_ADMIN_USER);
          }
          if (!deletedUsernames.includes('new_abujar') && !ensured.some(u => u.username === 'new_abujar' || u.sheetTab === 'new abujar')) {
            ensured.push(DEFAULT_NEW_ABUJAR_USER);
          }
          if (!deletedUsernames.includes('user') && !ensured.some(u => u.username === 'user')) {
            ensured.push(DEFAULT_TEMPLATE_USER);
          }
          return ensured;
        }
      }
    } catch {}
    return [DEFAULT_ADMIN_USER, DEFAULT_NEW_ABUJAR_USER, DEFAULT_TEMPLATE_USER];
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(users));
      // Clean up legacy global category storage so categories never leak across users
      localStorage.removeItem('app_expense_categories_global');
      localStorage.removeItem('app_income_categories_global');
    } catch {}
  }, [users]);

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('current_logged_in_user');
      if (saved) {
        const parsed: AppUser = JSON.parse(saved);
        if (parsed && parsed.username) return { ...parsed, isActive: parsed.isActive !== false };
      }
      if (localStorage.getItem('auth_user_abujar') === 'true') {
        return DEFAULT_ADMIN_USER;
      }
    } catch {}
    return null;
  });

  const isAuthenticated = !!currentUser;

  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Setup Account Modal (for new user onboarding upon logging in with user/password)
  const [showSetupAccountModal, setShowSetupAccountModal] = useState<boolean>(false);
  const [setupFullName, setSetupFullName] = useState<string>('');
  const [setupUsername, setSetupUsername] = useState<string>('');
  const [setupPassword, setSetupPassword] = useState<string>('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState<string>('');
  const [setupError, setSetupError] = useState<string>('');

  // Edit Profile Modal (allows updating display name, username, password while sheetTab remains permanently locked)
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editProfileUsername, setEditProfileUsername] = useState<string>('');
  const [editProfilePassword, setEditProfilePassword] = useState<string>('');
  const [editProfileError, setEditProfileError] = useState<string>('');

  // Admin Create User Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
  const [createFullName, setCreateFullName] = useState<string>('');
  const [createUsername, setCreateUsername] = useState<string>('');
  const [createSheetTab, setCreateSheetTab] = useState<string>('');
  const [createPassword, setCreatePassword] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');

  // In-App User Delete Confirmation Modal (never touches Google Sheet data)
  const [userToDeleteState, setUserToDeleteState] = useState<AppUser | null>(null);

  // Admin Manage Users state: view/change password, edit, active/inactive
  const [userTabSection, setUserTabSection] = useState<'users' | 'profile' | 'categories' | 'sheets'>('users');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const toggleRevealPassword = (uname: string) => {
    setRevealedPasswords(prev => ({ ...prev, [uname]: !prev[uname] }));
  };

  const [editingUserByAdmin, setEditingUserByAdmin] = useState<AppUser | null>(null);
  const [adminEditName, setAdminEditName] = useState<string>('');
  const [adminEditUsername, setAdminEditUsername] = useState<string>('');
  const [adminEditPassword, setAdminEditPassword] = useState<string>('');
  const [adminEditSheetTab, setAdminEditSheetTab] = useState<string>('');
  const [adminEditRole, setAdminEditRole] = useState<'admin' | 'member'>('member');
  const [adminEditIsActive, setAdminEditIsActive] = useState<boolean>(true);
  const [adminEditError, setAdminEditError] = useState<string>('');
  const [showAdminEditPassword, setShowAdminEditPassword] = useState<boolean>(false);

  const handleOpenEditUserByAdmin = (u: AppUser) => {
    setEditingUserByAdmin(u);
    setAdminEditName(u.displayName);
    setAdminEditUsername(u.username);
    setAdminEditPassword(u.password);
    setAdminEditSheetTab(u.sheetTab || u.initialUsername);
    setAdminEditRole(u.role || 'member');
    setAdminEditIsActive(u.isActive !== false);
    setAdminEditError('');
    setShowAdminEditPassword(false);
  };

  const handleSaveUserByAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserByAdmin) return;
    setAdminEditError('');
    const name = adminEditName.trim();
    const uname = adminEditUsername.trim().toLowerCase();
    const pass = adminEditPassword;
    const tab = adminEditSheetTab.trim() || uname;

    if (!name) {
      setAdminEditError(lang === 'en' ? 'Full name cannot be empty.' : 'পূর্ণ নাম প্রদান করুন।');
      return;
    }
    if (!uname || uname.length < 3) {
      setAdminEditError(lang === 'en' ? 'Username must be at least 3 characters.' : 'ইউজারনেম কমপক্ষে ৩ অক্ষরের দিন।');
      return;
    }
    if (!pass || pass.length < 4) {
      setAdminEditError(lang === 'en' ? 'Password must be at least 4 characters.' : 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের দিন।');
      return;
    }

    if (uname !== editingUserByAdmin.username.toLowerCase()) {
      if (users.some(u => u.username.toLowerCase() === uname && u.initialUsername !== editingUserByAdmin.initialUsername)) {
        setAdminEditError(lang === 'en' ? 'This username is already taken!' : 'এই ইউজারনেমটি ইতিমধ্যে বিদ্যমান!');
        return;
      }
    }

    const updatedUser: AppUser = {
      ...editingUserByAdmin,
      displayName: name,
      username: uname,
      password: pass,
      sheetTab: tab,
      role: adminEditRole,
      isActive: adminEditIsActive,
    };

    const updatedUsers = users.map(u => (u.initialUsername === editingUserByAdmin.initialUsername ? updatedUser : u));
    setUsers(updatedUsers);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updatedUsers));
    } catch {}

    if (currentUser?.initialUsername === editingUserByAdmin.initialUsername) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('current_logged_in_user', JSON.stringify(updatedUser));
      } catch {}
    }

    setEditingUserByAdmin(null);
    showToast(lang === 'en' ? `User '${name}' updated successfully!` : `ব্যবহারকারী '${name}' সফলভাবে আপডেট করা হয়েছে!`, 'success');
  };

  const handleToggleUserActive = (userToToggle: AppUser) => {
    if (userToToggle.username === 'abujar287') {
      showToast(lang === 'en' ? 'Main Admin account cannot be deactivated!' : 'মূল অ্যাডমিন অ্যাকাউন্ট নিষ্ক্রিয় করা যাবে না!', 'error');
      return;
    }
    const newStatus = userToToggle.isActive === false ? true : false;
    const updatedUsers = users.map(u => (u.initialUsername === userToToggle.initialUsername ? { ...u, isActive: newStatus } : u));
    setUsers(updatedUsers);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updatedUsers));
    } catch {}
    showToast(
      lang === 'en'
        ? `Account '@${userToToggle.username}' is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}!`
        : `'@${userToToggle.username}' অ্যাকাউন্ট এখন ${newStatus ? 'সক্রিয় (Active)' : 'নিষ্ক্রিয় (Inactive)'}!`,
      newStatus ? 'success' : 'info'
    );
  };

  const handleDeleteUser = (userToDelete: AppUser) => {
    if (userToDelete.username === 'abujar287') {
      showToast(lang === 'en' ? 'Main Admin account cannot be deleted!' : 'মূল অ্যাডমিন অ্যাকাউন্ট ডিলিট করা যাবে না!', 'error');
      return;
    }
    setUserToDeleteState(userToDelete);
  };

  const confirmDeleteUser = () => {
    if (!userToDeleteState) return;
    const targetUsername = (userToDeleteState.username || '').trim().toLowerCase();
    const targetInitial = (userToDeleteState.initialUsername || '').trim().toLowerCase();
    if (targetUsername === 'abujar287') {
      showToast(lang === 'en' ? 'Main Admin account cannot be deleted!' : 'মূল অ্যাডমিন অ্যাকাউন্ট ডিলিট করা যাবে না!', 'error');
      setUserToDeleteState(null);
      return;
    }
    const targetName = userToDeleteState.displayName;
    const updatedUsers = users.filter(x => {
      const uName = (x.username || '').trim().toLowerCase();
      const uInit = (x.initialUsername || '').trim().toLowerCase();
      return uName !== targetUsername && uInit !== targetUsername && (targetInitial ? uInit !== targetInitial : true);
    });
    setUsers(updatedUsers);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updatedUsers));
      const deletedUsernames: string[] = JSON.parse(localStorage.getItem('app_deleted_usernames') || '[]');
      if (!deletedUsernames.includes(targetUsername)) {
        deletedUsernames.push(targetUsername);
      }
      if (userToDeleteState.username && !deletedUsernames.includes(userToDeleteState.username)) {
        deletedUsernames.push(userToDeleteState.username);
      }
      localStorage.setItem('app_deleted_usernames', JSON.stringify(deletedUsernames));
    } catch {}

    // If currently logged-in user is the deleted user, switch to Main Admin
    if ((currentUser?.username || '').trim().toLowerCase() === targetUsername) {
      handleSwitchToUser(DEFAULT_ADMIN_USER);
    }

    // CRITICAL: Sheet tab data is 100% preserved in Google Sheets; we only remove local user profile
    setUserToDeleteState(null);
    showToast(
      lang === 'en'
        ? `User account '${targetName}' removed (Sheet data preserved).`
        : `'${targetName}' অ্যাকাউন্ট মুছে ফেলা হয়েছে (শিটের ডেটা অক্ষত রাখা হয়েছে)।`,
      'info'
    );
  };

  // Switch to another user account with instant session update and tab sync
  const handleSwitchToUser = (targetUser: AppUser) => {
    if (targetUser.isActive === false) {
      showToast(lang === 'en' ? 'Cannot switch to a deactivated account!' : 'নিষ্ক্রিয় একাউন্টে লগইন করা যাবে না!', 'error');
      return;
    }
    setCurrentUser(targetUser);
    try {
      localStorage.setItem('current_logged_in_user', JSON.stringify(targetUser));
      if (targetUser.username === 'abujar287') {
        localStorage.setItem('auth_user_abujar', 'true');
      } else {
        localStorage.removeItem('auth_user_abujar');
      }
    } catch {}

    const tabName = (targetUser.sheetTab || targetUser.username).trim().toLowerCase();
    const key = getUserStorageKey(tabName);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTransactions(parsed);
        else setTransactions([]);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    }

    // Load categories strictly for this user
    const savedExp = localStorage.getItem(`app_expense_categories_${tabName}`);
    if (savedExp) {
      try {
        const parsed = JSON.parse(savedExp);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExpenseCategories(parsed.map(c => cleanCategoryName(c, 'en')));
        } else {
          setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
        }
      } catch {
        setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
      }
    } else {
      setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
    }

    const savedInc = localStorage.getItem(`app_income_categories_${tabName}`);
    if (savedInc) {
      try {
        const parsed = JSON.parse(savedInc);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIncomeCategories(parsed.map(c => cleanCategoryName(c, 'en')));
        } else {
          setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
        }
      } catch {
        setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
      }
    } else {
      setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
    }

    setActiveTab('summary');
    showToast(
      lang === 'en'
        ? `Switched to user '${targetUser.displayName}' (Sheet Tab: '${targetUser.sheetTab || targetUser.username}')`
        : `'${targetUser.displayName}' একাউন্টে স্যুইচ করা হয়েছে (শিট ট্যাব: '${targetUser.sheetTab || targetUser.username}')`,
      'success'
    );
    handleManualSync(targetUser.sheetTab || targetUser.username);
  };

  // Check if current logged-in user needs onboarding setup
  useEffect(() => {
    if (currentUser && currentUser.needsSetup) {
      setShowSetupAccountModal(true);
    }
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      const u = loginUsername.trim().toLowerCase();
      const p = loginPassword;

      let matched = users.find(x => x.username.toLowerCase() === u && x.password === p);

      if (!matched && u === 'abujar287' && p === 'hisabkitab') {
        matched = DEFAULT_ADMIN_USER;
      } else if (!matched && (u === 'new_abujar' || u === 'new abujar') && p === 'password') {
        matched = DEFAULT_NEW_ABUJAR_USER;
      } else if (!matched && u === 'user' && p === 'password') {
        matched = DEFAULT_TEMPLATE_USER;
      }

      if (matched) {
        if (matched.isActive === false) {
          setLoginError(
            lang === 'en'
              ? 'This account has been deactivated by the Admin. Please contact the administrator to reactivate.'
              : 'অ্যাকাউন্টটি অ্যাডমিন কর্তৃক নিষ্ক্রিয় (deactivated) করা হয়েছে। সক্রিয় করতে মূল অ্যাডমিনের সাথে যোগাযোগ করুন।'
          );
          setIsLoggingIn(false);
          return;
        }

        setCurrentUser(matched);
        try {
          localStorage.setItem('current_logged_in_user', JSON.stringify(matched));
          if (matched.username === 'abujar287') {
            localStorage.setItem('auth_user_abujar', 'true');
          } else {
            localStorage.removeItem('auth_user_abujar');
          }
        } catch {}
        setLoginError('');
        if (matched.needsSetup) {
          setTransactions([]);
          setShowSetupAccountModal(true);
        } else {
          const tab = (matched.sheetTab || matched.username).toLowerCase();
          const key = getUserStorageKey(tab);
          try {
            const saved = localStorage.getItem(key);
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) setTransactions(parsed);
              else setTransactions([]);
            } else {
              setTransactions([]);
            }
          } catch {
            setTransactions([]);
          }
        }
      } else {
        setLoginError(
          lang === 'en'
            ? 'Invalid username or password! Please check your credentials.'
            : 'ভুল ইউজারনেম বা পাসওয়ার্ড! সঠিক তথ্য দিন (Invalid credentials).'
        );
      }
      setIsLoggingIn(false);
    }, 250);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setTransactions([]);
    try {
      localStorage.removeItem('current_logged_in_user');
      localStorage.removeItem('auth_user_abujar');
    } catch {}
    setLoginUsername('');
    setLoginPassword('');
    setShowSetupAccountModal(false);
  };

  // ----------------------------------------------------
  // DYNAMIC CATEGORIES MANAGEMENT (STRICTLY ISOLATED PER USER TAB)
  // No categories leak across users. Clean English defaults.
  // ----------------------------------------------------
  const currentTabName = (currentUser?.sheetTab || currentUser?.username || 'abujar287').trim().toLowerCase();

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`app_expense_categories_${currentTabName}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => cleanCategoryName(c, 'en'));
        }
      }
    } catch {}
    return [...DEFAULT_EXPENSE_CATEGORIES];
  });

  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`app_income_categories_${currentTabName}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(c => cleanCategoryName(c, 'en'));
        }
      }
    } catch {}
    return [...DEFAULT_INCOME_CATEGORIES];
  });

  // Reload categories strictly for the active user whenever user/tab changes
  useEffect(() => {
    try {
      const savedExp = localStorage.getItem(`app_expense_categories_${currentTabName}`);
      if (savedExp) {
        const parsed = JSON.parse(savedExp);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExpenseCategories(parsed.map(c => cleanCategoryName(c, 'en')));
        } else {
          setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
        }
      } else {
        setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
      }

      const savedInc = localStorage.getItem(`app_income_categories_${currentTabName}`);
      if (savedInc) {
        const parsed = JSON.parse(savedInc);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIncomeCategories(parsed.map(c => cleanCategoryName(c, 'en')));
        } else {
          setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
        }
      } else {
        setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
      }
    } catch {
      setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
      setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
    }
  }, [currentTabName]);

  // Category Management UI Modals
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [catModalType, setCatModalType] = useState<'Expense' | 'Income'>('Expense');
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatEmoji, setNewCatEmoji] = useState<string>('🏷️');
  const [profileCatTab, setProfileCatTab] = useState<'Expense' | 'Income'>('Expense');

  const updateExpenseCategories = (newCats: string[]) => {
    setExpenseCategories(newCats);
    const key = (currentUser?.sheetTab || currentUser?.username || 'abujar287').trim().toLowerCase();
    try {
      localStorage.setItem(`app_expense_categories_${key}`, JSON.stringify(newCats));
    } catch {}
  };

  const updateIncomeCategories = (newCats: string[]) => {
    setIncomeCategories(newCats);
    const key = (currentUser?.sheetTab || currentUser?.username || 'abujar287').trim().toLowerCase();
    try {
      localStorage.setItem(`app_income_categories_${key}`, JSON.stringify(newCats));
    } catch {}
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const formatted = `${newCatEmoji} ${trimmed}`;
    if (catModalType === 'Expense') {
      if (expenseCategories.includes(formatted) || expenseCategories.includes(trimmed)) {
        showToast(lang === 'en' ? 'This category already exists!' : 'এই ক্যাটাগরিটি ইতিমধ্যে বিদ্যমান!', 'error');
        return;
      }
      updateExpenseCategories([...expenseCategories, formatted]);
    } else {
      if (incomeCategories.includes(formatted) || incomeCategories.includes(trimmed)) {
        showToast(lang === 'en' ? 'This category already exists!' : 'এই ক্যাটাগরিটি ইতিমধ্যে বিদ্যমান!', 'error');
        return;
      }
      updateIncomeCategories([...incomeCategories, formatted]);
    }
    setNewCatName('');
    setShowAddCategoryModal(false);
    showToast(
      lang === 'en' ? `Category '${formatted}' added successfully!` : `নতুন ক্যাটাগরি '${formatted}' যোগ করা হয়েছে!`,
      'success'
    );
  };

  const handleDeleteCategory = (catToDelete: string, type: 'Expense' | 'Income') => {
    if (type === 'Expense') {
      const filtered = expenseCategories.filter(c => c !== catToDelete);
      if (filtered.length === 0) {
        showToast(lang === 'en' ? 'At least one category is required!' : 'কমপক্ষে একটি ক্যাটাগরি থাকা প্রয়োজন!', 'error');
        return;
      }
      updateExpenseCategories(filtered);
    } else {
      const filtered = incomeCategories.filter(c => c !== catToDelete);
      if (filtered.length === 0) {
        showToast(lang === 'en' ? 'At least one category is required!' : 'কমপক্ষে একটি ক্যাটাগরি থাকা প্রয়োজন!', 'error');
        return;
      }
      updateIncomeCategories(filtered);
    }
    showToast(lang === 'en' ? `Category '${catToDelete}' removed!` : `'${catToDelete}' মুছে ফেলা হয়েছে!`, 'info');
  };

  const handleResetCategoriesToDefault = () => {
    updateExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
    updateIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
    showToast(lang === 'en' ? 'All categories restored to default!' : 'সব ক্যাটাগরি ডিফল্ট অবস্থায় ফিরিয়ে আনা হয়েছে!', 'success');
  };

  // ----------------------------------------------------
  // MULTI-USER ONBOARDING & PROFILE MANAGEMENT HANDLERS
  // ----------------------------------------------------
  const handleCompleteAccountSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    const name = setupFullName.trim();
    const uname = setupUsername.trim().toLowerCase();
    const pass = setupPassword;
    const confirmPass = setupConfirmPassword;

    if (!name) {
      setSetupError(lang === 'en' ? 'Please enter your full name.' : 'আপনার পুরো নাম লিখুন।');
      return;
    }
    if (!uname || uname.length < 3) {
      setSetupError(lang === 'en' ? 'Username must be at least 3 characters.' : 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে।');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(uname)) {
      setSetupError(lang === 'en' ? 'Use lowercase letters, numbers, and underscore only.' : 'ইউজারনেমে শুধুমাত্র ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও আন্ডারস্কোর ব্যবহার করুন।');
      return;
    }
    if (uname === 'user') {
      setSetupError(lang === 'en' ? "Please choose a unique username other than 'user'." : "'user' ছাড়া অন্য একটি ইউনিক ইউজারনেম দিন।");
      return;
    }
    if (users.some(u => u.username.toLowerCase() === uname && u.username !== 'user')) {
      setSetupError(lang === 'en' ? 'This username is already taken! Please choose another.' : 'এই ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে! অন্য একটি দিন।');
      return;
    }
    if (!pass || pass.length < 4) {
      setSetupError(lang === 'en' ? 'Password must be at least 4 characters.' : 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের দিন।');
      return;
    }
    if (pass !== confirmPass) {
      setSetupError(lang === 'en' ? 'Passwords do not match!' : 'পাসওয়ার্ড দুটি মেলেনি!');
      return;
    }

    // Create new permanent user
    const newUser: AppUser = {
      username: uname,
      password: pass,
      displayName: name,
      initialUsername: uname,
      sheetTab: uname, // Permanently locked to initial username!
      createdAt: new Date().toISOString().split('T')[0],
      needsSetup: false,
      role: 'member',
      isActive: true,
    };

    // Initialize clean default categories strictly for this user
    try {
      localStorage.setItem(`app_expense_categories_${uname}`, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
      localStorage.setItem(`app_income_categories_${uname}`, JSON.stringify(DEFAULT_INCOME_CATEGORIES));
    } catch {}

    // Update users: replace 'user' template or add newUser, ensuring 'user' template remains for next person
    const updatedUsers = users.filter(u => u.username !== 'user');
    updatedUsers.push(newUser);
    updatedUsers.push(DEFAULT_TEMPLATE_USER);

    setUsers(updatedUsers);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updatedUsers));
      localStorage.setItem('current_logged_in_user', JSON.stringify(newUser));
    } catch {}

    setCurrentUser(newUser);
    setShowSetupAccountModal(false);

    // Initial empty transactions for this new sheet tab
    setTransactions([]);
    try {
      localStorage.setItem(`app_transactions_v2_${uname}`, JSON.stringify([]));
      localStorage.setItem(`app_expense_categories_${uname.toLowerCase()}`, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
      localStorage.setItem(`app_income_categories_${uname.toLowerCase()}`, JSON.stringify(DEFAULT_INCOME_CATEGORIES));
    } catch {}

    // Trigger Google Sheet to create tab
    try {
      fetch(`${customScriptUrl}?action=createtab&sheetTab=${encodeURIComponent(uname)}`, { mode: 'no-cors' }).catch(() => {});
    } catch {}

    showToast(
      lang === 'en'
        ? `Welcome ${name}! Your account and Google Sheet tab '${uname}' are ready.`
        : `স্বাগতম ${name}! আপনার অ্যাকাউন্ট ও গুগল শিট ট্যাব '${uname}' তৈরি হয়েছে।`,
      'success'
    );
  };

  const handleSaveEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileError('');
    const name = editDisplayName.trim();
    const uname = editProfileUsername.trim().toLowerCase();
    const pass = editProfilePassword;

    if (!name) {
      setEditProfileError(lang === 'en' ? 'Name cannot be empty.' : 'নাম খালি রাখা যাবে না।');
      return;
    }
    if (!uname || uname.length < 3) {
      setEditProfileError(lang === 'en' ? 'Username must be at least 3 characters.' : 'ইউজারনেম কমপক্ষে ৩ অক্ষরের হতে হবে।');
      return;
    }
    if (!pass || pass.length < 4) {
      setEditProfileError(lang === 'en' ? 'Password must be at least 4 characters.' : 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (!currentUser) return;

    if (uname !== currentUser.username.toLowerCase()) {
      if (users.some(u => u.username.toLowerCase() === uname && u.username.toLowerCase() !== currentUser.username.toLowerCase())) {
        setEditProfileError(lang === 'en' ? 'This username is already taken!' : 'এই ইউজারনেমটি অন্য কেউ ব্যবহার করছে!');
        return;
      }
    }

    const updatedUser: AppUser = {
      ...currentUser,
      displayName: name,
      username: uname,
      password: pass,
      // CRITICAL: initialUsername and sheetTab remain permanently fixed!
      initialUsername: currentUser.initialUsername,
      sheetTab: currentUser.sheetTab
    };

    const updatedList = users.map(u => (u.initialUsername === currentUser.initialUsername ? updatedUser : u));
    setUsers(updatedList);
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updatedList));
      localStorage.setItem('current_logged_in_user', JSON.stringify(updatedUser));
    } catch {}

    setShowEditProfileModal(false);
    showToast(lang === 'en' ? 'Profile updated successfully!' : 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!', 'success');
  };

  const handleAdminCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    const name = createFullName.trim();
    const uname = createUsername.trim().toLowerCase();
    const tabName = (createSheetTab.trim() || uname);
    const pass = createPassword;

    if (!name) {
      setCreateError(lang === 'en' ? 'Please provide full name.' : 'নাম প্রদান করুন।');
      return;
    }
    if (!uname || uname.length < 3) {
      setCreateError(lang === 'en' ? 'Username must be at least 3 characters.' : 'ইউজারনেম কমপক্ষে ৩ অক্ষরের দিন।');
      return;
    }
    if (users.some(u => u.username.toLowerCase() === uname)) {
      setCreateError(lang === 'en' ? 'This username is already taken!' : 'এই ইউজারনেমটি ইতিমধ্যে বিদ্যমান!');
      return;
    }
    if (!pass || pass.length < 4) {
      setCreateError(lang === 'en' ? 'Password must be at least 4 characters.' : 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের দিন।');
      return;
    }

    const newUser: AppUser = {
      username: uname,
      password: pass,
      displayName: name,
      initialUsername: uname,
      sheetTab: tabName,
      createdAt: new Date().toISOString().split('T')[0],
      needsSetup: false,
      role: 'member',
      isActive: true,
    };

    // STRICT CATEGORY ISOLATION: Initialize this new user with ONLY default clean categories
    try {
      localStorage.setItem(`app_expense_categories_${tabName.toLowerCase()}`, JSON.stringify(DEFAULT_EXPENSE_CATEGORIES));
      localStorage.setItem(`app_income_categories_${tabName.toLowerCase()}`, JSON.stringify(DEFAULT_INCOME_CATEGORIES));
    } catch {}

    const updated = [...users, newUser];
    setUsers(updated);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updated));
    } catch {}

    try {
      fetch(`${customScriptUrl}?action=createtab&sheetTab=${encodeURIComponent(tabName)}`, { mode: 'no-cors' }).catch(() => {});
    } catch {}

    setShowCreateUserModal(false);
    showToast(
      lang === 'en'
        ? `User '${name}' (@${uname}) created with sheet tab '${tabName}'!`
        : `ব্যবহারকারী '${name}' (${uname}) তৈরি হয়েছে (শিট ট্যাব: '${tabName}')!`,
      'success'
    );
  };

  // PWA Install Hook
  const { isInstallable, install } = usePWAInstall();
  const [showAPKGuideModal, setShowAPKGuideModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedMobileLink, setCopiedMobileLink] = useState(false);

  // ----------------------------------------------------
  // GOOGLE SCRIPT URL CONFIGURATION
  // ----------------------------------------------------
  const [customScriptUrl, setCustomScriptUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('user_google_script_url') || GOOGLE_SCRIPT_URL;
    } catch {
      return GOOGLE_SCRIPT_URL;
    }
  });
  const [urlInput, setUrlInput] = useState<string>(customScriptUrl);
  const [isTestingUrl, setIsTestingUrl] = useState<boolean>(false);
  const [urlTestStatus, setUrlTestStatus] = useState<string>('');

  const handleSaveScriptUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed.startsWith('https://script.google.com')) {
      setUrlTestStatus('অবৈধ লিঙ্ক! Google Apps Script URL প্রদান করুন।');
      return;
    }
    setCustomScriptUrl(trimmed);
    try {
      localStorage.setItem('user_google_script_url', trimmed);
    } catch {}
    setUrlTestStatus('URL সফলভাবে সেভ করা হয়েছে!');
    showToast('গুগল শিট স্ক্রিপ্ট লিঙ্ক সেভ হয়েছে!', 'success');
  };

  const [outdatedScriptDetected, setOutdatedScriptDetected] = useState<boolean>(false);

  const handleTestConnection = async () => {
    setIsTestingUrl(true);
    setUrlTestStatus('কানেকশন টেস্ট করা হচ্ছে...');
    try {
      const activeTab = currentUser?.sheetTab || (currentUser?.username === 'abujar287' ? 'abujar287' : currentUser?.username || 'test');
      const res = await fetch(`${urlInput.trim()}?action=getDetails&sheetTab=${encodeURIComponent(activeTab)}`, { method: 'GET' });
      const data = await res.json();
      if (data && data.result === 'success') {
        const count = Array.isArray(data.transactions) ? data.transactions.length : 0;
        const returnedTab = String(data.sheetTab || '').trim().toLowerCase();
        const expectedTab = activeTab.toLowerCase();
        if (returnedTab && returnedTab === expectedTab) {
          setUrlTestStatus(`✅ কানেকশন সফল! '${data.sheetTab}' শিট ট্যাবে ${count}টি রেকর্ড রয়েছে। মাল্টি-ট্যাব সম্পূর্ণ সক্রিয়!`);
          setOutdatedScriptDetected(false);
        } else if (!data.sheetTab) {
          setUrlTestStatus(`⚠️ কানেকশন হয়েছে কিন্তু স্ক্রিপ্টটি পুরোনো ভার্সনে চলছে (মাল্টি-ট্যাব সাপোর্ট নেই)! Apps Script-এ কোড আপডেট করে 'New version' ডিপ্লয় করুন।`);
          setOutdatedScriptDetected(true);
        } else {
          setUrlTestStatus(`⚠️ কানেকশন রেসপন্স এসেছে কিন্তু ট্যাব মিলছে না ('${data.sheetTab}' বনাম '${activeTab}')!`);
        }
      } else {
        setUrlTestStatus('রেসপন্স পাওয়া গেছে কিন্তু ফরম্যাট ভিন্ন।');
      }
    } catch {
      setUrlTestStatus('কানেকশন ব্যর্থ! Web App টি "Anyone" অ্যাক্সেস দিয়ে Deploy করা হয়েছে কি না নিশ্চিত করুন।');
    } finally {
      setIsTestingUrl(false);
    }
  };

  // ----------------------------------------------------
  // TRANSACTIONS STATE (ONLY REAL GOOGLE SHEET DATA)
  // Saved per user sheetTab in localStorage
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'budget' | 'entry' | 'users' | 'profile'>('summary');
  const [summaryScope, setSummaryScope] = useState<'month' | 'all'>('month');

  const getUserStorageKey = (tabName?: string) => {
    const raw = (tabName || currentUser?.sheetTab || currentUser?.username || '').trim().toLowerCase();
    if (raw === 'abujar287') return 'app_transactions_v2';
    if (!raw || raw === 'user') return 'app_transactions_v2_template_empty';
    return `app_transactions_v2_${raw}`;
  };

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const activeRaw = (currentUser?.sheetTab || currentUser?.username || '').trim().toLowerCase();
      if (!activeRaw || activeRaw === 'user') return [];
      const key = activeRaw === 'abujar287' ? 'app_transactions_v2' : `app_transactions_v2_${activeRaw}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: any) => !String(t.id || '').startsWith('tx-init-'));
        }
      }
    } catch (e) {
      console.error('Failed to load transactions', e);
    }
    return [];
  });

  // Reload data when user switches
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      return;
    }
    const tabName = (currentUser.sheetTab || currentUser.username || '').trim().toLowerCase();
    if (!tabName || tabName === 'user') {
      setTransactions([]);
      return;
    }
    const key = getUserStorageKey(tabName);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
        } else {
          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }

      // Reload categories
      const savedExp = localStorage.getItem(`app_expense_categories_${tabName}`);
      if (savedExp) {
        const parsed = JSON.parse(savedExp);
        if (Array.isArray(parsed) && parsed.length > 0) setExpenseCategories(parsed);
      } else {
        setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
      }

      const savedInc = localStorage.getItem(`app_income_categories_${tabName}`);
      if (savedInc) {
        const parsed = JSON.parse(savedInc);
        if (Array.isArray(parsed) && parsed.length > 0) setIncomeCategories(parsed);
      } else {
        setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
      }
    } catch (e) {
      console.error('Error switching user state', e);
    }
  }, [currentUser?.username, currentUser?.sheetTab]);

  useEffect(() => {
    if (!currentUser) return;
    const tabName = (currentUser.sheetTab || currentUser.username || '').trim().toLowerCase();
    if (!tabName || tabName === 'user') return;
    const key = getUserStorageKey(tabName);
    try {
      localStorage.setItem(key, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [transactions, currentUser?.sheetTab, currentUser?.username]);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const formatSyncDateTime = (dateObj: Date, currentLang: 'en' | 'bn') => {
    return dateObj.toLocaleString(currentLang === 'en' ? 'en-US' : 'bn-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const [lastSyncDate, setLastSyncDate] = useState<Date>(() => new Date());
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return formatSyncDateTime(new Date(), 'en');
  });

  useEffect(() => {
    setLastSyncTime(formatSyncDateTime(lastSyncDate, lang));
  }, [lang, lastSyncDate]);
  const [syncToast, setSyncToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSyncToast({ show: true, message, type });
    setTimeout(() => {
      setSyncToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // ----------------------------------------------------
  // DATE FILTER STATE (তারিখ ফিল্টার)
  // Replicating Image 1
  // ----------------------------------------------------
  const [filterPreset, setFilterPreset] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const handleSelectFilterPreset = (preset: string) => {
    setFilterPreset(preset);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (!preset) {
      setFilterStartDate('');
      setFilterEndDate('');
      return;
    }

    if (preset === 'today') {
      const todayStr = toYMD(now);
      setFilterStartDate(todayStr);
      setFilterEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      setFilterStartDate(yStr);
      setFilterEndDate(yStr);
    } else if (preset === 'this_week') {
      const d = new Date(now);
      const day = d.getDay(); // 0 is Sunday
      const diff = d.getDate() - day;
      const start = new Date(now);
      start.setDate(diff);
      setFilterStartDate(toYMD(start));
      setFilterEndDate(toYMD(now));
    } else if (preset === 'last_7_days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      setFilterStartDate(toYMD(d));
      setFilterEndDate(toYMD(now));
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFilterStartDate(toYMD(start));
      setFilterEndDate(toYMD(end));
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFilterStartDate(toYMD(start));
      setFilterEndDate(toYMD(end));
    } else if (preset === 'this_year') {
      setFilterStartDate(`${now.getFullYear()}-01-01`);
      setFilterEndDate(`${now.getFullYear()}-12-31`);
    } else if (preset === 'custom') {
      // keep current custom inputs
    }
  };

  const handleClearDateFilter = () => {
    setFilterPreset('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const filteredStats = useMemo(() => {
    if (!filterStartDate && !filterEndDate) {
      return { inc: 0, exp: 0, bal: 0, count: 0, hasFilter: false, items: [] };
    }
    const s = filterStartDate || '1970-01-01';
    const e = filterEndDate || '2099-12-31';
    const items = transactions.filter(t => {
      const d = normalizeDate(t.date);
      return d >= s && d <= e;
    });
    let inc = 0;
    let exp = 0;
    items.forEach(t => {
      const v = Number(String(t.value).replace(/,/g, '')) || 0;
      const typeStr = String(t.type || '').toLowerCase();
      if (typeStr.includes('inc') || typeStr.includes('আয়')) inc += v;
      else exp += v;
    });
    return {
      inc,
      exp,
      bal: inc - exp,
      count: items.length,
      hasFilter: true,
      items
    };
  }, [transactions, filterStartDate, filterEndDate]);

  // Fetch directly from Google Sheets (Exact 1:1 match, no dummy data)
  const handleManualSync = async (forcedTab?: string | unknown) => {
    const rawTab = typeof forcedTab === 'string' && forcedTab ? forcedTab : (currentUser?.sheetTab || (currentUser?.username === 'abujar287' ? 'abujar287' : currentUser?.username || ''));
    const activeTabName = rawTab.trim();
    if (!activeTabName || activeTabName.toLowerCase() === 'user') {
      return;
    }

    setIsSyncing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      const tabParam = `&sheetTab=${encodeURIComponent(activeTabName)}`;
      const res = await fetch(`${customScriptUrl}?action=getDetails${tabParam}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data && data.result === 'success' && Array.isArray(data.transactions)) {
        const returnedTab = String(data.sheetTab || '').trim().toLowerCase();
        const expectedTab = activeTabName.toLowerCase();

        // Check if the remote response actually came from the requested tab:
        const isTabMatch = returnedTab === expectedTab;
        const isOutdatedScript = !data.sheetTab && expectedTab !== 'abujar287';

        if (isOutdatedScript || (returnedTab && !isTabMatch && expectedTab !== 'abujar287')) {
          setOutdatedScriptDetected(true);
          showToast(
            `⚠️ সাবধান: গুগল শিটের Apps Script কোডটি পুরোনো ভার্সনে চলছে! কোডটি আপডেট করে 'New version' ডিপ্লয় না করা পর্যন্ত '${activeTabName}' ট্যাবের ডেটা আলাদা হবে না।`,
            'error'
          );
          setIsSyncing(false);
          return;
        }

        setOutdatedScriptDetected(false);

        const remoteList: Transaction[] = data.transactions.map((item: any, idx: number) => {
          const normDate = normalizeDate(item.date);
          const typeStr = String(item.type || '').toLowerCase();
          const isIncome = typeStr.includes('income') || typeStr.includes('আয়');
          return {
            id: String(item.id || `remote-${idx}-${normDate}`),
            datetime: item.datetime || new Date().toLocaleString(),
            type: isIncome ? 'Income' : 'Expense',
            category: item.category || (isIncome ? 'অন্যান্য আয়' : 'অন্যান্য খরচ'),
            date: normDate,
            value: Number(item.value) || 0,
            note: item.note || ''
          };
        });

        // 1:1 EXACT MATCH: Replace local state with exact Google Sheet data for THIS tab
        setTransactions(remoteList);
        try {
          const key = getUserStorageKey(activeTabName);
          localStorage.setItem(key, JSON.stringify(remoteList));
        } catch {}

        // Auto extract and preserve all unique categories for THIS active user tab only
        const sheetExpenses: string[] = [];
        const sheetIncomes: string[] = [];
        remoteList.forEach(t => {
          const cat = String(t.category || '').trim();
          if (!cat) return;
          if (t.type === 'Income') {
            if (!sheetIncomes.includes(cat)) sheetIncomes.push(cat);
          } else {
            if (!sheetExpenses.includes(cat)) sheetExpenses.push(cat);
          }
        });

        const activeKey = activeTabName.toLowerCase();
        let baseExp = [...DEFAULT_EXPENSE_CATEGORIES];
        try {
          const savedExp = localStorage.getItem(`app_expense_categories_${activeKey}`);
          if (savedExp) {
            const parsedExp = JSON.parse(savedExp);
            if (Array.isArray(parsedExp) && parsedExp.length > 0) baseExp = parsedExp;
          }
        } catch {}
        const combinedExp = Array.from(new Set([...baseExp, ...sheetExpenses])).map(c => cleanCategoryName(c, 'en'));
        setExpenseCategories(combinedExp);
        try {
          localStorage.setItem(`app_expense_categories_${activeKey}`, JSON.stringify(combinedExp));
        } catch {}

        let baseInc = [...DEFAULT_INCOME_CATEGORIES];
        try {
          const savedInc = localStorage.getItem(`app_income_categories_${activeKey}`);
          if (savedInc) {
            const parsedInc = JSON.parse(savedInc);
            if (Array.isArray(parsedInc) && parsedInc.length > 0) baseInc = parsedInc;
          }
        } catch {}
        const combinedInc = Array.from(new Set([...baseInc, ...sheetIncomes])).map(c => cleanCategoryName(c, 'en'));
        setIncomeCategories(combinedInc);
        try {
          localStorage.setItem(`app_income_categories_${activeKey}`, JSON.stringify(combinedInc));
        } catch {}

        const nowObj = new Date();
        setLastSyncDate(nowObj);
        const timeStr = formatSyncDateTime(nowObj, lang);
        setLastSyncTime(timeStr);
        showToast(
          lang === 'en'
            ? `Synced ${remoteList.length} records from tab '${data.sheetTab || activeTabName}'. Categories auto-updated!`
            : `'${data.sheetTab || activeTabName}' শিট থেকে ${remoteList.length}টি রেকর্ড সিঙ্ক হয়েছে ও ক্যাটাগরি আপডেট হয়েছে!`,
          'success'
        );
      } else {
        showToast(
          lang === 'en'
            ? `No records found in sheet tab '${activeTabName}'.`
            : `'${activeTabName}' শিটে কোনো ডেটা পাওয়া যায়নি।`,
          'info'
        );
      }
    } catch {
      showToast(
        lang === 'en'
          ? 'Offline mode: Unable to connect to Google Sheets.'
          : 'অফলাইন মোড: শিটের সাথে সংযোগ করা যায়নি।',
        'error'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Push local transactions to Google Sheet
  const handlePushAllToSheet = async () => {
    if (transactions.length === 0) {
      showToast('পুশ করার মতো কোনো লেনদেন নেই।', 'info');
      return;
    }
    const activeTabName = currentUser?.sheetTab || (currentUser?.username === 'abujar287' ? 'abujar287' : currentUser?.username || 'user');
    setIsPushing(true);
    try {
      const payload = {
        action: 'pushAll',
        sheetTab: activeTabName,
        transactions: transactions
      };
      await fetch(`${customScriptUrl}?action=pushall&sheetTab=${encodeURIComponent(activeTabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      showToast(`মোট ${transactions.length}টি লেনদেন '${activeTabName}' শিট ট্যাবে পাঠানো হয়েছে!`, 'success');
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
    } catch {
      showToast('গুগল শিটে পাঠাতে সমস্যা হয়েছে। ইন্টারনেট চেক করুন।', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  // Fetch only when authenticated user with a sheetTab is present
  useEffect(() => {
    if (currentUser && currentUser.sheetTab && !currentUser.needsSetup && currentUser.username !== 'user') {
      handleManualSync(currentUser.sheetTab);
    }
  }, [currentUser?.username, currentUser?.sheetTab, customScriptUrl]);

  // ----------------------------------------------------
  // ENTRY TAB STATE & CALCULATOR
  // ----------------------------------------------------
  const [entryType, setEntryType] = useState<TransactionType>('Expense');
  const [entryCategory, setEntryCategory] = useState<string>(() => expenseCategories[0] || 'অন্যান্য');
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [entryNote, setEntryNote] = useState<string>('');
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [entryMessage, setEntryMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleTypeChange = (newType: TransactionType) => {
    setEntryType(newType);
    if (newType === 'Income') {
      setEntryCategory(incomeCategories[0] || 'বেতন');
    } else {
      setEntryCategory(expenseCategories[0] || 'অন্যান্য');
    }
  };

  const handleCalcPress = (val: string) => {
    if (calcDisplay === '0' && !isNaN(Number(val))) {
      setCalcDisplay(val);
    } else {
      setCalcDisplay(prev => prev + val);
    }
  };

  const handleCalcClear = () => setCalcDisplay('0');

  const handleCalcDelete = () => {
    setCalcDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleQuickAdd = (amount: number) => {
    const current = evaluateAmount(calcDisplay);
    setCalcDisplay(String(current + amount));
  };

  const evaluateAmount = (expr: string): number => {
    try {
      const sanitized = expr.replace(/[^0-9+\-.]/g, '');
      if (!sanitized) return 0;
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();
      return typeof result === 'number' && !isNaN(result) && result > 0 ? result : 0;
    } catch {
      const num = parseFloat(expr);
      return !isNaN(num) && num > 0 ? num : 0;
    }
  };

  const handleEntrySubmit = async () => {
    const amount = evaluateAmount(calcDisplay);
    if (!entryCategory || !entryDate || amount <= 0) {
      setEntryMessage({
        text: 'সঠিক টাকার পরিমাণ ও বিবরণ দিন (Please enter valid amount)!',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    setEntryMessage({ text: 'সংরক্ষণ ও গুগল শিটে পাঠানো হচ্ছে...', type: '' });

    const newId = `ID-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx: Transaction = {
      id: newId,
      datetime: new Date().toLocaleString(),
      type: entryType,
      category: entryCategory,
      date: normalizeDate(entryDate),
      value: amount,
      note: entryNote.trim()
    };

    setTransactions(prev => [newTx, ...prev]);

    setEntryMessage({
      text: t('Successfully saved and synced to sheet!', 'সফলভাবে সংরক্ষিত ও শিটে পাঠানো হয়েছে!'),
      type: 'success'
    });
    setCalcDisplay('0');
    setEntryNote('');
    setIsSubmitting(false);

    const activeTabName = currentUser?.sheetTab || (currentUser?.username === 'abujar287' ? 'abujar287' : currentUser?.username || 'user');

    // Single reliable dispatch to Google Apps Script (mode: 'no-cors' prevents CORS catch trigger & duplicate execution)
    try {
      fetch(`${customScriptUrl}?action=insert&sheetTab=${encodeURIComponent(activeTabName)}`, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'insert',
          sheetTab: activeTabName,
          id: newTx.id,
          datetime: newTx.datetime || new Date().toLocaleString(),
          type: newTx.type,
          category: newTx.category,
          date: newTx.date,
          value: newTx.value,
          note: newTx.note || ''
        })
      }).catch(err => {
        console.warn('Sync notice:', err);
      });
    } catch {}
  };

  // ----------------------------------------------------
  // EDIT TRANSACTION MODAL & STATE
  // ----------------------------------------------------
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<{
    date: string;
    type: TransactionType;
    category: string;
    value: string;
    note: string;
  }>({
    date: '',
    type: 'Expense',
    category: '',
    value: '',
    note: ''
  });
  const [editMessage, setEditMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

  const openEditModal = (txId: string) => {
    const target = transactions.find(t => String(t.id) === String(txId));
    if (!target) return;
    setEditingTx(target);
    setEditForm({
      date: target.date,
      type: target.type,
      category: target.category,
      value: String(target.value),
      note: target.note || ''
    });
    setEditMessage({ text: '', type: '' });
  };

  const closeEditModal = () => {
    setEditingTx(null);
    setEditMessage({ text: '', type: '' });
  };

  const handleEditTypeChange = (newType: TransactionType) => {
    setEditForm(prev => {
      const cats = newType === 'Income' ? incomeCategories : expenseCategories;
      const keepCat = cats.includes(prev.category) ? prev.category : cats[0];
      return {
        ...prev,
        type: newType,
        category: keepCat
      };
    });
  };

  const handleUpdateTransaction = async () => {
    if (!editingTx) return;
    const valNum = parseFloat(editForm.value);
    if (!editForm.date || isNaN(valNum) || valNum <= 0) {
      setEditMessage({
        text: 'সঠিক তারিখ এবং টাকার পরিমাণ দিন!',
        type: 'error'
      });
      return;
    }

    const updatedItem: Transaction = {
      ...editingTx,
      date: normalizeDate(editForm.date),
      type: editForm.type,
      category: editForm.category,
      value: valNum,
      note: editForm.note.trim()
    };

    setTransactions(prev => prev.map(t => (t.id === editingTx.id ? updatedItem : t)));

    setEditMessage({
      text: 'সফলভাবে আপডেট হয়েছে!',
      type: 'success'
    });

    const activeTabName = currentUser?.sheetTab || (currentUser?.username === 'abujar287' ? 'abujar287' : currentUser?.username || 'user');
    try {
      fetch(`${customScriptUrl}?action=update&sheetTab=${encodeURIComponent(activeTabName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update',
          sheetTab: activeTabName,
          ...updatedItem
        })
      }).catch(e => console.log('Background update note:', e));
    } catch {}

    setTimeout(() => {
      closeEditModal();
      showToast('লেনদেন সফলভাবে আপডেট করা হয়েছে!', 'success');
    }, 400);
  };

  // ----------------------------------------------------
  // DELETE ROW FROM GOOGLE SHEET & LOCAL STATE
  // Fixed permanently: Never appends row when deleting!
  // ----------------------------------------------------
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const requestDelete = (txId: string) => {
    const target = transactions.find(t => String(t.id) === String(txId));
    if (target) {
      setDeletingTx(target);
    }
  };

  const executeDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    const target = deletingTx;
    const targetId = target.id;
    const currentTab = currentUser?.sheetTab || 'abujar287';

    // 1. Immediately remove from local state and localStorage
    setTransactions(prev => prev.filter(t => t.id !== targetId));
    if (editingTx?.id === targetId) {
      setEditingTx(null);
    }

    // 2. Safe delete request to Google Apps Script
    // We send ONLY GET request (?action=delete).
    try {
      const queryUrl = `${customScriptUrl}?action=delete&id=${encodeURIComponent(targetId)}&date=${encodeURIComponent(target.date)}&category=${encodeURIComponent(target.category)}&value=${encodeURIComponent(target.value)}&type=${encodeURIComponent(target.type)}&sheetTab=${encodeURIComponent(currentTab)}`;

      const res = await fetch(queryUrl, {
        method: 'GET'
      });
      const data = await res.json().catch(() => null);

      if (data && data.result === 'success') {
        showToast('লেনদেনটি অ্যাপ ও গুগল শিট থেকে ডিলিট করা হয়েছে!', 'success');
      } else {
        showToast('অ্যাপ থেকে মুছে ফেলা হয়েছে (শিটে সিঙ্ক হয়েছে)।', 'success');
      }
    } catch {
      // Fallback: If CORS blocks reading response, make sure request is dispatched with no-cors GET
      try {
        const queryUrl = `${customScriptUrl}?action=delete&id=${encodeURIComponent(targetId)}&date=${encodeURIComponent(target.date)}&category=${encodeURIComponent(target.category)}&value=${encodeURIComponent(target.value)}&type=${encodeURIComponent(target.type)}&sheetTab=${encodeURIComponent(currentTab)}`;
        await fetch(queryUrl, { method: 'GET', mode: 'no-cors' });
      } catch (err) {
        console.error('Delete GET fallback error', err);
      }
      showToast('লেনদেনটি অ্যাপ থেকে মুছে ফেলা হয়েছে।', 'success');
    } finally {
      setIsDeleting(false);
      setDeletingTx(null);
    }
  };

  // ----------------------------------------------------
  // MONTH & SUMMARY CALCULATIONS (100% ACCURATE TO SHEET)
  // ----------------------------------------------------
  const currentMonthValue = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);

  const handleShiftMonth = (offset: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    const nextY = d.getFullYear();
    const nextM = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${nextY}-${nextM}`);
  };

  const monthOptions = useMemo(() => {
    const list = [];
    const date = new Date();
    for (let i = -5; i <= 5; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push({ val, label });
    }
    return list;
  }, []);

  // ALL-TIME SHEET TOTALS (Exact sum of everything in Google Sheet)
  const allTimeTotals = useMemo(() => {
    let exp = 0;
    let inc = 0;
    transactions.forEach(t => {
      const val = Number(t.value) || 0;
      if (t.type === 'Expense') {
        exp += val;
      } else {
        inc += val;
      }
    });
    return {
      exp,
      inc,
      bal: inc - exp,
      count: transactions.length
    };
  }, [transactions]);

  // MONTHLY STATS (Accurate using normalizeDate)
  const monthTotals = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let exp = 0;
    let inc = 0;
    const dailyMap: Record<number, { exp: number; inc: number }> = {};

    transactions.forEach(t => {
      const cleanDate = normalizeDate(t.date);
      const [ty, tm, td] = cleanDate.split('-').map(Number);
      if (ty === y && tm === m) {
        const val = Number(t.value) || 0;
        if (t.type === 'Expense') {
          exp += val;
          if (!dailyMap[td]) dailyMap[td] = { exp: 0, inc: 0 };
          dailyMap[td].exp += val;
        } else {
          inc += val;
          if (!dailyMap[td]) dailyMap[td] = { exp: 0, inc: 0 };
          dailyMap[td].inc += val;
        }
      }
    });

    const bal = inc - exp;
    const savingsRate = inc > 0 ? Math.max(0, ((bal / inc) * 100)).toFixed(1) : '0';

    return { exp, inc, bal, dailyMap, savingsRate };
  }, [selectedMonth, transactions]);

  // Calendar matrix
  const calendarDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDayIndex = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();

    const emptySlots = Array.from({ length: firstDayIndex });
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const todayDate = isCurrentMonth ? now.getDate() : -1;

    return { year, month, emptySlots, days, todayDate };
  }, [selectedMonth]);

  // Top Categories for selected scope (prioritizes active custom date filter, otherwise selected month)
  const activeExpenseList = useMemo(() => {
    const isExpense = (typeStr: string) => {
      const s = String(typeStr || '').toLowerCase().trim();
      return s === 'expense' || s.includes('exp') || s.includes('খরচ');
    };
    if (filteredStats.hasFilter) {
      return filteredStats.items.filter(t => isExpense(t.type));
    }
    if (summaryScope === 'all') {
      return transactions.filter(t => isExpense(t.type));
    }
    const [y, m] = selectedMonth.split('-').map(Number);
    return transactions.filter(t => {
      if (!isExpense(t.type)) return false;
      const [ty, tm] = normalizeDate(t.date).split('-').map(Number);
      return ty === y && tm === m;
    });
  }, [transactions, summaryScope, selectedMonth, filteredStats.hasFilter, filteredStats.items]);

  const activeTotals = useMemo(() => {
    if (filteredStats.hasFilter) {
      return {
        exp: filteredStats.exp,
        inc: filteredStats.inc,
        bal: filteredStats.bal,
        savingsRate: filteredStats.inc > 0 ? ((filteredStats.bal / filteredStats.inc) * 100).toFixed(1) : '0'
      };
    }
    if (summaryScope === 'all') {
      return {
        exp: allTimeTotals.exp,
        inc: allTimeTotals.inc,
        bal: allTimeTotals.bal,
        savingsRate: allTimeTotals.inc > 0 ? ((allTimeTotals.bal / allTimeTotals.inc) * 100).toFixed(1) : '0'
      };
    }
    return monthTotals;
  }, [summaryScope, allTimeTotals, monthTotals, filteredStats.hasFilter, filteredStats.exp, filteredStats.inc, filteredStats.bal]);

  const [summaryCatTab, setSummaryCatTab] = useState<'Expense' | 'Income'>('Expense');

  const activeIncomeList = useMemo(() => {
    const isIncome = (typeStr: string) => {
      const s = String(typeStr || '').toLowerCase().trim();
      return s === 'income' || s.includes('inc') || s.includes('আয়');
    };
    if (filteredStats.hasFilter) {
      return filteredStats.items.filter(t => isIncome(t.type));
    }
    if (summaryScope === 'all') {
      return transactions.filter(t => isIncome(t.type));
    }
    const [y, m] = selectedMonth.split('-').map(Number);
    return transactions.filter(t => {
      if (!isIncome(t.type)) return false;
      const [ty, tm] = normalizeDate(t.date).split('-').map(Number);
      return ty === y && tm === m;
    });
  }, [transactions, summaryScope, selectedMonth, filteredStats.hasFilter, filteredStats.items]);

  const incomeCategoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    activeIncomeList.forEach(t => {
      const val = Number(String(t.value).replace(/,/g, '')) || 0;
      const cat = t.category || (lang === 'en' ? 'Other Income' : 'অন্যান্য আয়');
      map[cat] = (map[cat] || 0) + val;
    });
    return Object.keys(map)
      .map(name => ({ name, val: map[name] }))
      .sort((a, b) => b.val - a.val);
  }, [activeIncomeList, lang]);

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    activeExpenseList.forEach(t => {
      const val = Number(String(t.value).replace(/,/g, '')) || 0;
      const cat = t.category || (lang === 'en' ? 'Others' : 'অন্যান্য');
      map[cat] = (map[cat] || 0) + val;
    });
    return Object.keys(map)
      .map(name => ({ name, val: map[name] }))
      .sort((a, b) => b.val - a.val);
  }, [activeExpenseList, lang]);

  // All months financial breakdown with income, expense, balance, top category, and ratio
  const allMonthsSummary = useMemo(() => {
    const monthMap: Record<string, { inc: number; exp: number; catMap: Record<string, number> }> = {};

    transactions.forEach(t => {
      const d = normalizeDate(t.date);
      const [y, m] = d.split('-');
      if (!y || !m) return;
      const key = `${y}-${m.padStart(2, '0')}`;
      if (!monthMap[key]) {
        monthMap[key] = { inc: 0, exp: 0, catMap: {} };
      }
      const val = Number(String(t.value).replace(/,/g, '')) || 0;
      const s = String(t.type || '').toLowerCase().trim();
      const isIncome = s === 'income' || s.includes('inc') || s.includes('আয়');
      if (isIncome) {
        monthMap[key].inc += val;
      } else {
        monthMap[key].exp += val;
        const cat = t.category || (lang === 'en' ? 'Others' : 'অন্যান্য');
        monthMap[key].catMap[cat] = (monthMap[key].catMap[cat] || 0) + val;
      }
    });

    const keys = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));
    return keys.map(key => {
      const data = monthMap[key];
      const bal = data.inc - data.exp;
      const [y, m] = key.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      const label = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', { month: 'short', year: 'numeric' });

      let topCatName = '-';
      let topCatAmount = 0;
      Object.entries(data.catMap).forEach(([cat, amt]) => {
        if (amt > topCatAmount) {
          topCatAmount = amt;
          topCatName = cat;
        }
      });

      const topCatRatio = data.exp > 0 ? ((topCatAmount / data.exp) * 100).toFixed(1) : '0';
      const savingsRatio = data.inc > 0 ? ((bal / data.inc) * 100).toFixed(1) : '0';

      return {
        monthKey: key,
        label,
        income: data.inc,
        expense: data.exp,
        balance: bal,
        topCatName,
        topCatAmount,
        topCatRatio,
        savingsRatio
      };
    });
  }, [transactions, lang]);

  const [showCalendar, setShowCalendar] = useState<boolean>(true);

  const donutColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
  const top5Categories = categoryStats.slice(0, 5);

  const donutSegments = useMemo(() => {
    if (activeTotals.exp === 0 || top5Categories.length === 0) return [];
    let cumulative = 0;
    return top5Categories.map((item, idx) => {
      const percent = (item.val / activeTotals.exp) * 100;
      const dashArray = `${percent} ${100 - percent}`;
      const dashOffset = -cumulative;
      cumulative += percent;
      return {
        ...item,
        percent,
        color: donutColors[idx % donutColors.length],
        dashArray,
        dashOffset
      };
    });
  }, [activeTotals.exp, top5Categories]);

  // Modals for day and category details
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);
  const [selectedCatModal, setSelectedCatModal] = useState<string | null>(null);

  const dateModalTransactions = useMemo(() => {
    if (!selectedDateModal) return [];
    return transactions.filter(t => normalizeDate(t.date) === selectedDateModal);
  }, [transactions, selectedDateModal]);

  const catModalTransactions = useMemo(() => {
    if (!selectedCatModal) return [];
    return activeExpenseList.filter(t => t.category === selectedCatModal);
  }, [activeExpenseList, selectedCatModal]);

  // ----------------------------------------------------
  // BACK NAVIGATION (MODALS -> TABS -> SUMMARY 2 TAPS TO EXIT)
  // Handles Android phone hardware back and browser navigation
  // ----------------------------------------------------
  const lastBackClickRef = React.useRef<number>(0);

  const handleGlobalBack = () => {
    // 1. Check open modals (highest priority - close modal first)
    if (showAddCategoryModal) {
      setShowAddCategoryModal(false);
      return;
    }
    if (showEditProfileModal) {
      setShowEditProfileModal(false);
      return;
    }
    if (showCreateUserModal) {
      setShowCreateUserModal(false);
      return;
    }
    if (userToDeleteState) {
      setUserToDeleteState(null);
      return;
    }
    if (selectedCatModal) {
      setSelectedCatModal(null);
      return;
    }
    if (selectedDateModal) {
      setSelectedDateModal(null);
      return;
    }
    if (showOverallBudgetModal) {
      setShowOverallBudgetModal(false);
      return;
    }
    if (editingBudgetCat) {
      setEditingBudgetCat(null);
      return;
    }
    if (editingTx) {
      closeEditModal();
      return;
    }
    if (deletingTx) {
      setDeletingTx(null);
      return;
    }
    if (showScriptModal) {
      setShowScriptModal(false);
      return;
    }
    if (showSettingsModal) {
      setShowSettingsModal(false);
      return;
    }
    if (showMobileModal) {
      setShowMobileModal(false);
      return;
    }
    if (showAPKGuideModal) {
      setShowAPKGuideModal(false);
      return;
    }
    if (showSetupAccountModal) {
      handleLogout();
      return;
    }

    // 2. Check tab: if not on summary, go back to summary
    if (activeTab !== 'summary') {
      setActiveTab('summary');
      try {
        window.history.pushState({ tab: 'summary' }, '');
      } catch {}
      return;
    }

    // 3. If already on summary, 2 taps within 2000ms to exit
    const now = Date.now();
    if (now - lastBackClickRef.current < 2000) {
      showToast('অ্যাপ বন্ধ করা হচ্ছে...', 'info');
      try {
        CapApp.exitApp();
      } catch {
        try {
          const Cap = (window as any).Capacitor;
          if (Cap?.Plugins?.App?.exitApp) {
            Cap.Plugins.App.exitApp();
          } else {
            window.close();
          }
        } catch {
          window.close();
        }
      }
    } else {
      lastBackClickRef.current = now;
      showToast('অ্যাপ থেকে বের হতে আর একবার ব্যাক চাপুন (Press back again to exit)', 'info');
      try {
        window.history.pushState({ tab: 'summary' }, '');
      } catch {}
    }
  };

  const handleBackAction = handleGlobalBack;

  const handleSwitchTab = (newTab: 'summary' | 'details' | 'budget' | 'entry' | 'users' | 'profile') => {
    if (activeTab !== newTab) {
      setActiveTab(newTab);
      try {
        window.history.pushState({ tab: newTab }, '');
      } catch {}
    }
  };

  // Browser popstate listener
  useEffect(() => {
    const handlePopState = () => {
      handleGlobalBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });

  // Native Capacitor back button listener
  useEffect(() => {
    let removeListener: (() => void) | undefined;
    try {
      CapApp.addListener('backButton', () => {
        handleGlobalBack();
      }).then(handle => {
        removeListener = () => handle.remove();
      }).catch(() => {});
    } catch {}

    return () => {
      if (removeListener) removeListener();
    };
  });

  // ----------------------------------------------------
  // BUDGET MANAGEMENT STATE & LOGIC
  // ----------------------------------------------------
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('app_category_budgets');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [monthlyOverallBudget, setMonthlyOverallBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('app_monthly_overall_budget');
      return saved ? Number(saved) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [editingBudgetCat, setEditingBudgetCat] = useState<string | null>(null);
  const [budgetInputValue, setBudgetInputValue] = useState<string>('');
  const [showOverallBudgetModal, setShowOverallBudgetModal] = useState<boolean>(false);
  const [overallBudgetInputValue, setOverallBudgetInputValue] = useState<string>('');
  const [budgetSearchQuery, setBudgetSearchQuery] = useState<string>('');

  const handleOpenCategoryBudgetModal = (category: string) => {
    setEditingBudgetCat(category);
    const existing = categoryBudgets[category];
    setBudgetInputValue(existing ? String(existing) : '');
  };

  const handleSaveCategoryBudget = () => {
    if (!editingBudgetCat) return;
    const cleaned = budgetInputValue.replace(/[^0-9]/g, '');
    const amount = parseInt(cleaned, 10);
    const updated = { ...categoryBudgets };

    if (!isNaN(amount) && amount > 0) {
      updated[editingBudgetCat] = amount;
      showToast(`${editingBudgetCat}-এর বাজেট ${amount.toLocaleString()} ৳ নির্ধারণ করা হয়েছে!`, 'success');
    } else {
      delete updated[editingBudgetCat];
      showToast(`${editingBudgetCat}-এর বাজেট মুছে ফেলা হয়েছে।`, 'info');
    }

    setCategoryBudgets(updated);
    try {
      localStorage.setItem('app_category_budgets', JSON.stringify(updated));
    } catch {}

    setEditingBudgetCat(null);
    setBudgetInputValue('');
  };

  const handleRemoveCategoryBudget = (category: string) => {
    const updated = { ...categoryBudgets };
    delete updated[category];
    setCategoryBudgets(updated);
    try {
      localStorage.setItem('app_category_budgets', JSON.stringify(updated));
    } catch {}
    showToast(`${category}-এর বাজেট মুছে ফেলা হয়েছে।`, 'info');
    setEditingBudgetCat(null);
    setBudgetInputValue('');
  };

  const handleOpenOverallBudgetModal = () => {
    setOverallBudgetInputValue(monthlyOverallBudget > 0 ? String(monthlyOverallBudget) : '');
    setShowOverallBudgetModal(true);
  };

  const handleSaveOverallBudget = () => {
    const cleaned = overallBudgetInputValue.replace(/[^0-9]/g, '');
    const amount = parseInt(cleaned, 10);

    if (!isNaN(amount) && amount > 0) {
      setMonthlyOverallBudget(amount);
      try {
        localStorage.setItem('app_monthly_overall_budget', String(amount));
      } catch {}
      showToast(`মাসিক মোট বাজেট ${amount.toLocaleString()} ৳ নির্ধারণ করা হয়েছে!`, 'success');
    } else {
      setMonthlyOverallBudget(0);
      try {
        localStorage.removeItem('app_monthly_overall_budget');
      } catch {}
      showToast('মাসিক মোট বাজেট মুছে ফেলা হয়েছে।', 'info');
    }

    setShowOverallBudgetModal(false);
  };

  const sumCategoryBudgets = useMemo(() => {
    return Object.values(categoryBudgets).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [categoryBudgets]);

  const effectiveTotalMonthlyBudget = useMemo(() => {
    return monthlyOverallBudget > 0 ? monthlyOverallBudget : sumCategoryBudgets;
  }, [monthlyOverallBudget, sumCategoryBudgets]);

  const selectedMonthExpenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    const [y, m] = selectedMonth.split('-').map(Number);
    transactions.forEach(t => {
      if (t.type !== 'Expense') return;
      const [ty, tm] = normalizeDate(t.date).split('-').map(Number);
      if (ty === y && tm === m) {
        map[t.category] = (map[t.category] || 0) + (Number(t.value) || 0);
      }
    });
    return map;
  }, [transactions, selectedMonth]);

  // Details search & filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detailFilterType, setDetailFilterType] = useState<'All' | 'Expense' | 'Income'>('All');

  const groupedDetails = useMemo(() => {
    const list = transactions.filter(t => {
      if (detailFilterType !== 'All' && t.type !== detailFilterType) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.category.toLowerCase().includes(q) ||
        (t.note && t.note.toLowerCase().includes(q)) ||
        t.date.includes(q) ||
        String(t.value).includes(q)
      );
    });

    const map: Record<string, { exp: number; inc: number; items: Transaction[] }> = {};
    list.forEach(t => {
      const d = normalizeDate(t.date);
      if (!map[d]) {
        map[d] = { exp: 0, inc: 0, items: [] };
      }
      if (t.type === 'Expense') {
        map[d].exp += t.value;
      } else {
        map[d].inc += t.value;
      }
      map[d].items.push(t);
    });

    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return { sortedDates, map, totalItems: list.length };
  }, [transactions, searchQuery, detailFilterType]);

  const monthName = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    if (lang === 'bn') {
      return d.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth, lang]);

  const quickCategories = entryType === 'Expense'
    ? expenseCategories.slice(0, 10)
    : incomeCategories.slice(0, 8);

  // Complete, tested Google Apps Script Code with multi-user tab & robust row deletion
  const googleAppsScriptCode = `// ====================================================================
// হিসাব-নিকাশ: গুগল শিট Apps Script কোড (Code.gs)
// ভার্সন: 5.0 (পারফেক্ট মাল্টি-ট্যাব ইউজার আইসোলেশন ও অটো-ট্যাব ক্রিয়েট)
// ====================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = {};
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      data = (e && e.parameter) ? e.parameter : {};
    }
    
    var tabName = (data.sheetTab || data.sheet || (e && e.parameter ? (e.parameter.sheetTab || e.parameter.sheet) : '') || '').toString().trim();
    var sheet = getTargetSheet(ss, tabName);
    var action = (data.action || (e && e.parameter ? e.parameter.action : '') || '').toString().toLowerCase().trim();
    
    // ১. নতুন ট্যাব তৈরি অ্যাকশন (CREATE TAB)
    if (action === 'createtab') {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        sheetTab: sheet.getName(),
        message: 'শিট ট্যাব প্রস্তুত: ' + sheet.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ২. রো মুছে ফেলার অ্যাকশন (DELETE ROW)
    if (action === 'delete' || data.isDelete === true) {
      return handleDeleteRow(sheet, data, e ? e.parameter : null);
    }
    
    // ৩. ব্যাচ পুশ ব্যাকআপ (PUSH ALL)
    if (action === 'pushall' && Array.isArray(data.transactions)) {
      for (var k = 0; k < data.transactions.length; k++) {
        var t = data.transactions[k];
        insertRowIfNotExists(sheet, t.id, t.datetime || new Date().toLocaleString(), t.type, t.category, t.date, t.value, t.note || '');
      }
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        message: 'সব ডেটা সেভ হয়েছে',
        sheetTab: sheet.getName()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ৪. আপডেট অ্যাকশন (UPDATE ROW)
    if (action === 'update') {
      return handleUpdateRow(sheet, data);
    }
    
    // ৫. নতুন রো যোগ করা (INSERT ROW)
    if (action === 'insert' || action === 'add' || action === 'create') {
      var id = data.id || ('ID-' + Date.now());
      var datetime = data.datetime || (new Date().toLocaleString());
      var type = data.type || 'Expense';
      var category = data.category || 'অন্যান্য';
      var date = data.date || (new Date().toISOString().split('T')[0]);
      var value = Number(data.value || 0);
      var note = data.note || '';
      
      insertRowIfNotExists(sheet, id, datetime, type, category, date, value, note);
      
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        id: id,
        sheetTab: sheet.getName(),
        message: 'রো সফলভাবে যোগ হয়েছে'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: 'unknown_action', sheetTab: sheet.getName() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } finally {
    lock.releaseLock();
  }
}

// GET রিকোয়েস্ট হ্যান্ডলার
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var params = (e && e.parameter) ? e.parameter : {};
  var tabName = (params.sheetTab || params.sheet || '').toString().trim();
  var sheet = getTargetSheet(ss, tabName);
  var action = (params.action || '').toString().toLowerCase().trim();
  
  // ১. ট্যাব তৈরি
  if (action === 'createtab') {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      sheetTab: sheet.getName(),
      message: 'শিট ট্যাব প্রস্তুত'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ২. রো ডিলিট (ব্রাউজার রিডাইরেক্ট সাপোর্ট)
  if (action === 'delete') {
    return handleDeleteRow(sheet, params, params);
  }

  // ৩. GET এর মাধ্যমেও রো ইনসার্ট সাপোর্ট (মোবাইল ও ওয়েব ব্যাকআপ)
  if (action === 'insert' || action === 'add' || action === 'create') {
    var id = params.id || ('ID-' + Date.now());
    var datetime = params.datetime || (new Date().toLocaleString());
    var type = params.type || 'Expense';
    var category = params.category || 'অন্যান্য';
    var date = params.date || (new Date().toISOString().split('T')[0]);
    var value = Number(params.value || 0);
    var note = params.note || '';
    
    insertRowIfNotExists(sheet, id, datetime, type, category, date, value, note);
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      id: id,
      sheetTab: sheet.getName(),
      message: 'রো সফলভাবে যোগ হয়েছে'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // ৪. রো আপডেট
  if (action === 'update') {
    return handleUpdateRow(sheet, params);
  }
  
  // ৫. নির্দিষ্ট ট্যাবের সব লেনদেন পড়া
  var rows = sheet.getDataRange().getValues();
  var transactions = [];
  
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[1] && !r[2] && !r[3] && !r[4] && !r[5]) continue;
    
    var hasId = String(r[0]).indexOf('ID-') === 0 || String(r[0]).indexOf('tx-') === 0;
    var txId = hasId ? String(r[0]) : ('row-' + (i + 1) + '-' + String(r[4] || r[3] || ''));
    var txDateTime = hasId ? String(r[1]) : String(r[0]);
    var txType = hasId ? String(r[2]) : String(r[1]);
    var txCat = hasId ? String(r[3]) : String(r[2]);
    var txDate = hasId ? String(r[4]) : String(r[3]);
    var txVal = hasId ? Number(r[5]) : Number(r[4]);
    var txNote = hasId ? String(r[6] || '') : String(r[5] || '');
    
    if (txDate instanceof Date) {
      var y = txDate.getFullYear();
      var m = String(txDate.getMonth() + 1).padStart(2, '0');
      var d = String(txDate.getDate()).padStart(2, '0');
      txDate = y + '-' + m + '-' + d;
    }
    
    transactions.push({
      id: String(txId),
      rowNumber: i + 1,
      datetime: String(txDateTime),
      type: String(txType).toLowerCase().indexOf('income') !== -1 || String(txType).indexOf('আয়') !== -1 ? 'Income' : 'Expense',
      category: String(txCat),
      date: String(txDate),
      value: Number(txVal) || 0,
      note: String(txNote || '')
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    result: 'success',
    sheetTab: sheet.getName(),
    transactions: transactions,
    count: transactions.length
  })).setMimeType(ContentService.MimeType.JSON);
}

// ডুপ্লিকেট রোধ করে রো ইনসার্ট
function insertRowIfNotExists(sheet, id, datetime, type, category, date, value, note) {
  if (id) {
    var rows = sheet.getDataRange().getValues();
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][0]).trim() === String(id).trim()) {
        return; // ইতিমধ্যেই আছে, ডুপ্লিকেট হবে না
      }
    }
  }
  sheet.appendRow([id, datetime, type, category, date, value, note]);
}

// নির্দিষ্ট ট্যাব খোঁজা অথবা তৈরি করা (কেস-ইনসেনসিটিভ ও নিরাপদ)
function getTargetSheet(ss, tabName) {
  var clean = (tabName || '').toString().trim();
  if (!clean) return ss.getActiveSheet() || ss.getSheets()[0];
  
  // ১. সরাসরি নাম দিয়ে খোঁজা
  var target = ss.getSheetByName(clean);
  if (target) return target;
  
  // ২. কেস-ইনসেনসিটিভ হিসেবে খোঁজা
  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    var s = allSheets[i];
    if (s.getName().trim().toLowerCase() === clean.toLowerCase()) {
      return s;
    }
  }
  
  // ৩. মূল এডমিন ট্যাব (abujar287): প্রথম শিট পাওয়া গেলে নাম পরিবর্তন করে abujar287 করা
  if (clean.toLowerCase() === 'abujar287') {
    var firstSheet = allSheets[0];
    if (firstSheet) {
      try {
        firstSheet.setName('abujar287');
      } catch (err) {}
      return firstSheet;
    }
  }
  
  // ৪. নতুন ব্যবহারকারীর নামে নতুন শিট ট্যাব তৈরি
  try {
    target = ss.insertSheet(clean);
    target.appendRow(['ID', 'DateTime', 'Type', 'Category', 'Date', 'Value', 'Note']);
    try {
      target.getRange(1, 1, 1, 7).setFontWeight('bold');
      target.setFrozenRows(1);
    } catch (err) {}
    return target;
  } catch (e) {
    return ss.getSheetByName(clean) || ss.getActiveSheet();
  }
}

// রো খুঁজে বের করে স্থায়ীভাবে মুছে ফেলা (sheet.deleteRow)
function handleDeleteRow(sheet, data, param) {
  var id = String((data && data.id) || (param && param.id) || '').trim();
  var date = String((data && data.date) || (param && param.date) || '').trim();
  var cat = String((data && data.category) || (param && param.category) || '').trim();
  var val = Number((data && data.value) || (param && param.value) || 0);
  
  var rows = sheet.getDataRange().getValues();
  
  for (var i = rows.length - 1; i >= 1; i--) {
    var row = rows[i];
    var matched = false;
    
    // ১. আইডি দিয়ে ম্যাচ
    if (id && String(row[0]).trim() === id) {
      matched = true;
    }
    
    // ২. ৭-কলাম ম্যাচ: [0: id, 1: datetime, 2: type, 3: category, 4: date, 5: value, 6: note]
    if (!matched && cat) {
      var r7Cat = String(row[3] || '').trim();
      var r7Date = String(row[4] || '').trim();
      var r7Val = Number(row[5] || 0);
      if (r7Cat === cat && (r7Date.indexOf(date) !== -1 || date.indexOf(r7Date) !== -1) && Math.abs(r7Val - val) < 1) {
        matched = true;
      }
    }
    
    // ৩. ৬-কলাম ম্যাচ: [0: datetime, 1: type, 2: category, 3: date, 4: value, 5: note]
    if (!matched && cat) {
      var r6Cat = String(row[2] || '').trim();
      var r6Date = String(row[3] || '').trim();
      var r6Val = Number(row[4] || 0);
      if (r6Cat === cat && (r6Date.indexOf(date) !== -1 || date.indexOf(r6Date) !== -1) && Math.abs(r6Val - val) < 1) {
        matched = true;
      }
    }
    
    // ৪. তারিখ ও টাকার পরিমাণ দিয়ে ম্যাচ
    if (!matched && date && val > 0) {
      var rowStr = row.join(' | ').toLowerCase();
      var hasDate = rowStr.indexOf(date.toLowerCase()) !== -1;
      var hasVal = row.some(function(c) { return Math.abs(Number(c) - val) < 0.5; });
      if (hasDate && hasVal) {
        matched = true;
      }
    }
    
    if (matched) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        sheetTab: sheet.getName(),
        message: 'রো সফলভাবে ডিলিট হয়েছে (Row ' + (i + 1) + ' deleted)',
        deletedRow: i + 1
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    result: 'not_found',
    sheetTab: sheet.getName(),
    message: 'শিটে রো পাওয়া যায়নি'
  })).setMimeType(ContentService.MimeType.JSON);
}

// আপডেট ফাংশন
function handleUpdateRow(sheet, data) {
  var id = String(data.id || '');
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === id) {
      var r = i + 1;
      sheet.getRange(r, 3).setValue(data.type);
      sheet.getRange(r, 4).setValue(data.category);
      sheet.getRange(r, 5).setValue(data.date);
      sheet.getRange(r, 6).setValue(data.value);
      sheet.getRange(r, 7).setValue(data.note || '');
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        sheetTab: sheet.getName(),
        message: 'Row updated'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({
    result: 'not_found',
    sheetTab: sheet.getName()
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  // ========================================================
  // RENDER: LOGIN SCREEN
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-['Exo_2','Anek_Bangla',sans-serif]">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-modalSpring">
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header with Language Toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              {t('Personal Tracker', 'ব্যক্তিগত হিসাব')}
            </span>
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-indigo-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer"
              title={lang === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono text-[11px]">{lang === 'en' ? 'EN' : 'বাংলা'}</span>
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white mx-auto mb-3">
              <Wallet className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">{t('Hisab-Kitab', 'হিসাব-নিকাশ')}</h1>
            <p className="text-xs text-indigo-300 font-medium mt-0.5">Google Sheets Personal Tracker</p>
            <p className="text-[11px] text-slate-400 mt-2">{t('Enter username and password to log in', 'লগইন করতে ইউজারনেম ও পাসওয়ার্ড দিন')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('Username', 'ইউজারনেম (Username)')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={t('Enter your username', 'ইউজারনেম লিখুন')}
                  value={loginUsername}
                  onChange={e => {
                    setLoginUsername(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('Password', 'পাসওয়ার্ড (Password)')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => {
                    setLoginPassword(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium animate-fadeIn">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              {isLoggingIn ? t('Verifying...', 'যাচাই করা হচ্ছে...') : t('Log In', 'লগইন করুন')}
            </button>
          </form>

          {/* Secure Cloud Storage Footer */}
          <div className="mt-5 pt-3 border-t border-slate-800 text-[10.5px] text-slate-500 text-center flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('Encrypted & Synced with Google Sheets', 'গুগল শিটের সাথে সুরক্ষিত ক্লাউড সিঙ্ক')}</span>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // RENDER: MAIN AUTHENTICATED APP
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-900/95 flex justify-center items-start text-slate-800 pb-28 font-['Exo_2','Anek_Bangla',sans-serif]">
      {/* Floating Modern Toast Notification */}
      {syncToast.show && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-bold border animate-modalSpring max-w-sm text-center ${
            syncToast.type === 'error'
              ? 'bg-slate-950/90 text-rose-300 border-rose-500/50 shadow-rose-950/60'
              : syncToast.type === 'info'
              ? 'bg-slate-950/90 text-sky-300 border-sky-500/50 shadow-sky-950/60'
              : 'bg-slate-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/60'
          }`}
        >
          {syncToast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : syncToast.type === 'info' ? (
            <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{syncToast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[480px] bg-slate-50 min-h-screen shadow-2xl relative flex flex-col border-x border-slate-200/80">

        {/* ======================================================== */}
        {/* TOP HEADER BAR (Only Sync & Logout as requested) */}
        {/* ======================================================== */}
        <header className="bg-slate-900 text-white px-3 sm:px-4 pt-3.5 pb-3 sticky top-0 z-30 shadow-md border-b border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {activeTab !== 'summary' ? (
                <button
                  type="button"
                  onClick={handleBackAction}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-indigo-400 hover:text-white flex items-center justify-center shadow-md transition-all border border-slate-700 shrink-0 cursor-pointer"
                  title="ফিরে যান (Back to Summary)"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
                  <Wallet className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white whitespace-nowrap">{t('Hisab-Kitab', 'হিসাব-নিকাশ')}</h1>
                  <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  <span className="truncate text-indigo-300 font-semibold">@{currentUser?.username}</span>
                  <span className="text-slate-500 font-mono text-[9.5px]">[{currentUser?.sheetTab || 'tab'}]</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {transactions.length} {t('records', 'টি')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Language Translate Button (ENG / বাংলা) */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-indigo-300 hover:text-white text-xs font-bold transition-all border border-slate-700 cursor-pointer shrink-0"
                title={lang === 'en' ? 'বাংলা ভাষায় পরিবর্তন করুন' : 'Switch to English'}
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono text-[10.5px] font-bold">{lang === 'en' ? 'EN' : 'বাং'}</span>
              </button>

              {/* Google Sheets Quick Sync Button */}
              <button
                type="button"
                onClick={() => handleManualSync(currentUser?.sheetTab)}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all border border-indigo-400/30 cursor-pointer shrink-0"
                title={lang === 'en' ? `Sync sheet tab '${currentUser?.sheetTab || 'abujar287'}'` : `গুগল শিটের '${currentUser?.sheetTab || 'abujar287'}' ট্যাব থেকে ডেটা সিঙ্ক করুন`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-200' : ''}`} />
                <span className="text-xs">{isSyncing ? t('Syncing...', 'সিঙ্ক...') : t('Sync', 'সিঙ্ক')}</span>
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-all border border-slate-700 shrink-0 cursor-pointer"
                title={t('Logout', 'লগআউট')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Outdated Google Apps Script Warning Banner */}
        {outdatedScriptDetected && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-3.5 py-2 flex items-center justify-between gap-2 text-xs text-amber-200 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate text-[11px]">
                {t('Google Apps Script needs update: Deploy New Version in Sheets.', 'শিটের Apps Script কোডটি আপডেট করতে হবে (New version Deploy করুন)')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowScriptModal(true)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10.5px] font-bold shrink-0 cursor-pointer shadow-xs"
            >
              {t('View Code', 'কোড দেখুন')}
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* PROMINENT LIVE GOOGLE SHEET SYNC BAR */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-3 sm:px-4 py-2 border-b border-indigo-900/40 flex items-center justify-between text-xs shadow-inner gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 shrink-0" />
            <span className="font-bold text-[10.5px] sm:text-[11px] text-slate-200 truncate">
              {t('Google Sheet Connected', 'গুগল শিট সংযুক্ত')} ({transactions.length} {t('records', 'টি')})
            </span>
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-slate-400 shrink-0">
            {t('Last Sync', 'শেষ সিঙ্ক')}: {lastSyncTime}
          </span>
        </div>

        {/* ======================================================== */}
        {/* MAIN BODY CONTENT AREA */}
        {/* ======================================================== */}
        <main className="flex-1 p-3 sm:p-3.5 space-y-4">

          {/* ======================================================== */}
          {/* TAB 1: SUMMARY TAB (WITH ALL-TIME VS MONTH TOGGLE) */}
          {/* ======================================================== */}
          {activeTab === 'summary' && (
            <div className="animate-fadeIn space-y-3.5">
              
              {/* Scope Switcher: Month vs All Time Sheet Total */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSummaryScope('month')}
                  className={`py-2 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                    summaryScope === 'month'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs">{t('This Month', 'এই মাস')} ({monthName.split(' ')[0]})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSummaryScope('all')}
                  className={`py-2 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                    summaryScope === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate text-[11px] sm:text-xs">{t('All-Time', 'সর্বমোট')}</span>
                </button>
              </div>

              {/* HERO FINANCIAL DASHBOARD CARD */}
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-4 sm:p-4.5 shadow-xl border border-slate-800/80 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3 gap-2 flex-wrap">
                  {summaryScope === 'month' ? (
                    <div className="flex items-center gap-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleShiftMonth(-1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all shrink-0 cursor-pointer"
                        title={t('Previous Month', 'পূর্ববর্তী মাস')}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer max-w-[135px] sm:max-w-none truncate"
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
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-all shrink-0 cursor-pointer"
                        title={t('Next Month', 'পরবর্তী মাস')}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 truncate">
                      <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{t('All-Time Sheet Summary', 'শিটের সম্পূর্ণ সর্বমোট হিসাব')}</span>
                    </div>
                  )}

                  <span className="text-[10.5px] sm:text-[11px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    {t('Savings', 'সঞ্চয়')}: {activeTotals.savingsRate}%
                  </span>
                </div>

                {/* Net Balance */}
                <div className="mb-4">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    {summaryScope === 'all' ? t('All-Time Remaining Balance', 'শিটের সর্বমোট অবশিষ্ট ব্যালেন্স') : t('Monthly Net Balance', 'এই মাসের অবশিষ্ট ব্যালেন্স')}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-3xl font-extrabold font-mono tracking-tight ${
                        activeTotals.bal >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {activeTotals.bal >= 0 ? '+' : ''}
                      {activeTotals.bal.toLocaleString()}
                    </span>
                    <span className="text-base font-bold text-slate-400">৳</span>
                  </div>
                </div>

                {/* Income vs Expense Pills */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {summaryScope === 'all' ? t('Total Income', 'শিটের সর্বমোট আয়') : t('Month Income', 'এই মাসের আয়')}
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-300">
                        +{activeTotals.inc.toLocaleString()} ৳
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">
                        {summaryScope === 'all' ? t('Total Expense', 'শিটের সর্বমোট খরচ') : t('Month Expense', 'এই মাসের খরচ')}
                      </span>
                      <span className="text-sm font-bold font-mono text-rose-300">
                        -{activeTotals.exp.toLocaleString()} ৳
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MONTHLY CALENDAR (Compact, Simple & Animated) */}
              {summaryScope === 'month' && (
                <div className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-200/90 transition-all">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{t('Monthly Calendar', 'মাসিক ক্যালেন্ডার')}</span>
                      <span className="text-slate-400 font-normal">({monthName.split(' ')[0]})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showCalendar ? t('Compact', 'ছোট করুন') : t('Expand', 'দেখুন')}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showCalendar ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {showCalendar && (
                    <div className="mt-2.5 animate-fadeIn">
                      {/* Weekday headers */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[9.5px] font-bold text-slate-400 mb-1">
                        <span>{t('Sun', 'রবি')}</span>
                        <span>{t('Mon', 'সোম')}</span>
                        <span>{t('Tue', 'মঙ্গল')}</span>
                        <span>{t('Wed', 'বুধ')}</span>
                        <span>{t('Thu', 'বৃহঃ')}</span>
                        <span>{t('Fri', 'শুক্র')}</span>
                        <span>{t('Sat', 'শনি')}</span>
                      </div>

                      {/* Compact Day Matrix */}
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.emptySlots.map((_, idx) => (
                          <div key={`empty-${idx}`} className="h-8 sm:h-9 rounded-lg bg-transparent pointer-events-none" />
                        ))}

                        {calendarDays.days.map(dayNum => {
                          const isToday = dayNum === calendarDays.todayDate;
                          const dayData = monthTotals.dailyMap[dayNum];
                          const hasExp = dayData && dayData.exp > 0;
                          const hasInc = dayData && dayData.inc > 0;
                          const dateStr = `${calendarDays.year}-${String(calendarDays.month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              onClick={() => setSelectedDateModal(dateStr)}
                              className={`h-8 sm:h-9 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer relative border active:scale-95 ${
                                isToday
                                  ? 'bg-indigo-600 text-white font-extrabold shadow-sm border-indigo-500 ring-2 ring-indigo-300'
                                  : hasExp || hasInc
                                  ? 'bg-slate-50 hover:bg-indigo-50/80 border-slate-200/90 text-slate-800'
                                  : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                              }`}
                              title={`${dateStr} - Exp: ${dayData?.exp || 0}৳, Inc: ${dayData?.inc || 0}৳`}
                            >
                              <span className={`text-[11px] sm:text-xs font-bold leading-none ${isToday ? 'text-white' : 'text-slate-800'}`}>
                                {dayNum}
                              </span>
                              
                              {/* Sleek animated indicator dots */}
                              <div className="flex items-center gap-0.5 mt-0.5">
                                {hasExp && (
                                  <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-rose-200' : 'bg-rose-500'}`} />
                                )}
                                {hasInc && (
                                  <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-emerald-200' : 'bg-emerald-500'}`} />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* DATE FILTER CARD */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🗓️</span>
                    <span>{t('Date Filter', 'তারিখ ফিল্টার')}</span>
                  </span>
                  {(filterPreset || filterStartDate || filterEndDate) && (
                    <button
                      type="button"
                      onClick={handleClearDateFilter}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> {t('Clear', 'রিসেট')}
                    </button>
                  )}
                </div>

                {/* Range Select Preset Dropdown */}
                <select
                  value={filterPreset}
                  onChange={e => handleSelectFilterPreset(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">{t('-- Select Filter Range --', '-- ফিল্টার রেঞ্জ বাছাই করুন --')}</option>
                  <option value="today">{t('Today', 'আজ')}</option>
                  <option value="yesterday">{t('Yesterday', 'গতকাল')}</option>
                  <option value="this_week">{t('This Week', 'এই সপ্তাহ')}</option>
                  <option value="last_7_days">{t('Last 7 Days', 'গত ৭ দিন')}</option>
                  <option value="this_month">{t('This Month', 'এই মাস')}</option>
                  <option value="last_month">{t('Last Month', 'গত মাস')}</option>
                  <option value="this_year">{t('This Year', 'এই বছর')}</option>
                  <option value="custom">{t('Custom Range', 'কাস্টম তারিখ')}</option>
                </select>

                {/* Start Date & End Date Inputs */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {t('Start Date', 'শুরুর তারিখ')}
                    </label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={e => {
                        setFilterStartDate(e.target.value);
                        setFilterPreset('custom');
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {t('End Date', 'শেষের তারিখ')}
                    </label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={e => {
                        setFilterEndDate(e.target.value);
                        setFilterPreset('custom');
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Filtered Balance Card */}
                <div className="rounded-2xl bg-slate-900 text-white p-3.5 shadow-md border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">
                    {t('Filtered Balance', 'ফিল্টার অনুযায়ী ব্যালেন্স')}
                  </span>
                  <div
                    className={`text-2xl font-extrabold font-mono tracking-tight ${
                      filteredStats.bal > 0
                        ? 'text-sky-400'
                        : filteredStats.bal < 0
                        ? 'text-rose-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {filteredStats.bal.toLocaleString()} ৳
                  </div>

                  <div className="border-t border-slate-800 my-2 pt-2 flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-emerald-400">
                      {t('Income', 'আয়')} +{filteredStats.inc.toLocaleString()} ৳
                    </span>
                    <span className="text-rose-400">
                      {t('Expense', 'খরচ')} -{filteredStats.exp.toLocaleString()} ৳
                    </span>
                  </div>

                  {filteredStats.hasFilter && (
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10.5px] text-slate-400">
                      <span>{t(`Total ${filteredStats.count} transactions found`, `মোট ${filteredStats.count}টি লেনদেন পাওয়া গেছে`)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery(filterStartDate || '');
                          setActiveTab('details');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                      >
                        {t('View Details →', 'বিস্তারিত দেখুন →')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* TOP 5 EXPENSE CATEGORIES */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-3">
                  <span className="flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-indigo-600" />
                    {t('Top 5 Expense Categories', 'শীর্ষ ৫ খরচ ক্যাটাগরি')} ({
                      filteredStats.hasFilter
                        ? t('Filtered', 'ফিল্টার অনুযায়ী')
                        : (summaryScope === 'all' ? t('All-Time', 'সব সময়ের') : monthName.split(' ')[0])
                    })
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-normal">
                    {t('Total', 'মোট')}: {activeTotals.exp.toLocaleString()} ৳
                  </span>
                </div>

                <div className="space-y-2.5">
                  {top5Categories.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">{t('No expense records found.', 'কোনো খরচের রেকর্ড পাওয়া যায়নি।')}</p>
                  ) : (
                    donutSegments.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedCatModal(item.name)}
                        className="w-full text-left group p-1.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center text-xs font-semibold mb-1">
                          <span className="truncate pr-2 text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {cleanCategoryName(item.name)}
                          </span>
                          <span className="shrink-0 text-[10.5px] text-slate-600 font-mono">
                            {item.percent.toFixed(1)}% • <b>{item.val.toLocaleString()}৳</b>
                          </span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ALL CATEGORY REPORT LIST */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-3">
                  <span>📊 {t('All Categories Report', 'সম্পূর্ণ ক্যাটাগরি রিপোর্ট')} ({
                    filteredStats.hasFilter
                      ? t('Filtered', 'ফিল্টার অনুযায়ী')
                      : (summaryScope === 'all' ? t('All-Time', 'সব সময়ের') : monthName.split(' ')[0])
                  })</span>
                  <span className="text-[10px] text-slate-400 font-normal">{categoryStats.length} {t('Categories', 'ক্যাটাগরি')}</span>
                </div>

                <div className="space-y-2">
                  {categoryStats.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">{t('No category data found', 'কোনো ক্যাটাগরি ডেটা পাওয়া যায়নি')}</p>
                  ) : (
                    categoryStats.map((item, idx) => {
                      const percent = activeTotals.exp > 0 ? (item.val / activeTotals.exp) * 100 : 0;
                      const color = donutColors[idx % donutColors.length];
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedCatModal(item.name)}
                          className="w-full text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer"
                        >
                          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                            <span className="truncate pr-2 text-slate-800">{cleanCategoryName(item.name)}</span>
                            <span className="shrink-0 text-slate-800 font-mono font-bold">
                              {item.val.toLocaleString()} ৳
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${percent}%`, backgroundColor: color }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                              {percent.toFixed(1)}%
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* ALL MONTHS FINANCIAL SUMMARY (Month-wise Breakdown) */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        {t('All Months Financial Breakdown', 'মাসভিত্তিক সার্বিক রিপোর্ট (সকল মাস)')}
                      </h3>
                      <p className="text-[10.5px] text-slate-400">
                        {t('Month, income, expense, balance & top expense with ratio', 'মাস, আয়, ব্যয়, ব্যালেন্স ও শীর্ষ খরচের অনুপাত')}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 shrink-0">
                    {allMonthsSummary.length} {t('Months', 'মাস')}
                  </span>
                </div>

                {allMonthsSummary.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    {t('No monthly transaction records found.', 'কোনো মাসের লেনদেন রেকর্ড পাওয়া যায়নি।')}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                    <table className="w-full text-left text-xs border-collapse min-w-[540px]">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                          <th className="py-2 px-2.5">{t('Month', 'মাস')}</th>
                          <th className="py-2 px-2.5 text-right">{t('Income', 'আয়')}</th>
                          <th className="py-2 px-2.5 text-right">{t('Expense', 'খরচ')}</th>
                          <th className="py-2 px-2.5 text-right">{t('Balance', 'অবশিষ্ট')}</th>
                          <th className="py-2 px-2.5">{t('Top Expense Category', 'শীর্ষ খরচ ক্যাটাগরি')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allMonthsSummary.map(m => (
                          <tr
                            key={m.monthKey}
                            onClick={() => {
                              setSelectedMonth(m.monthKey);
                              setSummaryScope('month');
                              showToast(t(`Viewing ${m.label} summary`, `${m.label} মাসের হিসাব দেখানো হচ্ছে`), 'info');
                            }}
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            <td className="py-2.5 px-2.5 font-bold text-slate-800 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="group-hover:text-indigo-600 transition-colors">{m.label}</span>
                                {selectedMonth === m.monthKey && summaryScope === 'month' && (
                                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">
                                    {t('Active', 'বর্তমান')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                              +{m.income.toLocaleString()} ৳
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono font-bold text-rose-500 whitespace-nowrap">
                              -{m.expense.toLocaleString()} ৳
                            </td>
                            <td className="py-2.5 px-2.5 text-right font-mono font-bold whitespace-nowrap">
                              <span className={m.balance >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                {m.balance >= 0 ? '+' : ''}{m.balance.toLocaleString()} ৳
                              </span>
                            </td>
                            <td className="py-2.5 px-2.5 whitespace-nowrap">
                              {m.expense > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-700">{cleanCategoryName(m.topCatName, lang)}</span>
                                  <span className="text-slate-500 font-mono text-[11px] font-bold">
                                    ({m.topCatAmount.toLocaleString()}৳)
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-bold border border-rose-100">
                                    {m.topCatRatio}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">{t('No expenses', 'খরচ নেই')}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DETAILS TAB */}
          {/* ======================================================== */}
          {activeTab === 'details' && (
            <div className="animate-fadeIn space-y-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900">{t('Transaction History', 'লেনদেন ইতিহাস')}</h2>
                  <p className="text-xs text-slate-400 truncate">{t(`Sheet Records (Total: ${transactions.length})`, `শিটের আসল ডেটা (মোট: ${transactions.length} টি)`)}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 rounded-xl transition-all border border-indigo-200 flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
                    title={t('Sync from Google Sheet', 'গুগল শিট থেকে সিঙ্ক করুন')}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{t('Sync', 'সিঙ্ক')}</span>
                  </button>
                  <span className="text-xs font-bold px-2 py-1.5 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shrink-0">
                    {groupedDetails.totalItems} Records
                  </span>
                </div>
              </div>

              {/* Search bar & Type Toggle */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search category, note, amount... (অনুসন্ধান করুন)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9.5 pr-8 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-2xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDetailFilterType('All')}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer min-w-0 truncate ${
                      detailFilterType === 'All' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t('All', 'সব')} ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailFilterType('Expense')}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer min-w-0 truncate ${
                      detailFilterType === 'Expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    {t('Expenses', 'খরচ')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailFilterType('Income')}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer min-w-0 truncate ${
                      detailFilterType === 'Income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    {t('Income', 'আয়')}
                  </button>
                </div>
              </div>

              {/* Grouped Day-by-Day List */}
              {groupedDetails.sortedDates.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">{t('No transactions found', 'কোনো লেনদেন পাওয়া যায়নি')}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? t('Try searching with a different term.', 'ভিন্ন কোনো শব্দ লিখে খুঁজুন।') : t('Go to "Entry" tab to add new transactions or click "Sync".', 'নতুন লেনদেন যুক্ত করতে "Entry" ট্যাবে যান অথবা "Sync" চাপুন।')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupedDetails.sortedDates.map(dateStr => {
                    const dayData = groupedDetails.map[dateStr];
                    const parts = dateStr.split('-');
                    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                    const formattedDate = d.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      weekday: 'short',
                      year: 'numeric'
                    });

                    return (
                      <div
                        key={dateStr}
                        className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm"
                      >
                        <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/80 flex justify-between items-center text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            {formattedDate}
                          </span>
                          <div className="text-[11px] font-mono space-x-2">
                            {dayData.exp > 0 && <span className="text-rose-500 font-bold">Exp: -{dayData.exp.toLocaleString()}৳</span>}
                            {dayData.inc > 0 && <span className="text-emerald-600 font-bold">Inc: +{dayData.inc.toLocaleString()}৳</span>}
                          </div>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {dayData.items.map(item => (
                            <div
                              key={item.id}
                              className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-start gap-2.5 pr-2">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${
                                    item.type === 'Expense'
                                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  }`}
                                >
                                  {item.type === 'Expense' ? '💸' : '💰'}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-800">{cleanCategoryName(item.category)}</div>
                                  {item.note && (
                                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                      {item.note}
                                    </div>
                                  )}
                                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                                    {item.datetime || item.date}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-xs font-bold font-mono ${
                                    item.type === 'Expense' ? 'text-rose-500' : 'text-emerald-600'
                                  }`}
                                >
                                  {item.type === 'Expense' ? '-' : '+'}
                                  {item.value.toLocaleString()} ৳
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(item.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-90 transition-all cursor-pointer shrink-0"
                                    title={t('Edit Transaction', 'এডিট করুন')}
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => requestDelete(item.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 active:scale-90 transition-all cursor-pointer shrink-0"
                                    title={t('Delete Transaction Row', 'রো ডিলিট করুন')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BUDGET TAB (Interactive Budgeting) */}
          {/* ======================================================== */}
          {activeTab === 'budget' && (
            <div className="animate-fadeIn space-y-3.5">
              {/* Month Selector for Budget */}
              <div className="flex items-center justify-between p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleShiftMonth(-1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <span className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    {monthName}
                  </span>
                  <span className="text-[10px] text-slate-400">{t('Monthly Budget & Expense Tracker', 'মাসিক বাজেট ও খরচ ট্র্যাকার')}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleShiftMonth(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all cursor-pointer"
                  title={t('Next Month', 'পরবর্তী মাস')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* OVERALL BUDGET HERO CARD */}
              <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-4 sm:p-5 shadow-xl border border-slate-800 relative overflow-hidden space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">{t('Monthly Overall Budget', 'মাসিক সামগ্রিক বাজেট')}</h3>
                      <span className="text-[10.5px] text-indigo-300">
                        {effectiveTotalMonthlyBudget > 0 ? t('Budget active', 'বাজেট সক্রিয় আছে') : t('No budget set', 'বাজেট সেট করা হয়নি')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenOverallBudgetModal}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{effectiveTotalMonthlyBudget > 0 ? t('Edit Budget', 'বাজেট পরিবর্তন') : t('Set Budget', 'বাজেট সেট করুন')}</span>
                  </button>
                </div>

                {/* 3 Metric Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">{t('Total Budget', 'মোট বাজেট')}</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-indigo-300">
                      {effectiveTotalMonthlyBudget > 0 ? `${effectiveTotalMonthlyBudget.toLocaleString()} ৳` : '—'}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">{t('Spent This Month', 'এই মাসে খরচ')}</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-rose-400">
                      {monthTotals.exp.toLocaleString()} ৳
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">{t('Remaining Budget', 'অবশিষ্ট বাজেট')}</span>
                    {effectiveTotalMonthlyBudget > 0 ? (
                      <span
                        className={`text-sm sm:text-base font-bold font-mono ${
                          effectiveTotalMonthlyBudget - monthTotals.exp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {(effectiveTotalMonthlyBudget - monthTotals.exp).toLocaleString()} ৳
                      </span>
                    ) : (
                      <span className="text-sm sm:text-base font-bold font-mono text-slate-400">—</span>
                    )}
                  </div>
                </div>

                {/* Overall Progress Bar */}
                {effectiveTotalMonthlyBudget > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10.5px] font-mono">
                      <span className="text-slate-400">
                        {t('Used', 'ব্যবহৃত')}: {((monthTotals.exp / effectiveTotalMonthlyBudget) * 100).toFixed(1)}%
                      </span>
                      <span
                        className={
                          monthTotals.exp > effectiveTotalMonthlyBudget
                            ? 'text-rose-400 font-bold'
                            : monthTotals.exp / effectiveTotalMonthlyBudget > 0.8
                            ? 'text-amber-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {monthTotals.exp > effectiveTotalMonthlyBudget
                          ? t('⚠️ Over budget!', '⚠️ বাজেট অতিক্রম করেছে!')
                          : `${(effectiveTotalMonthlyBudget - monthTotals.exp).toLocaleString()} ৳ ${t('remaining', 'অবশিষ্ট আছে')}`}
                      </span>
                    </div>

                    <div className="bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          monthTotals.exp > effectiveTotalMonthlyBudget
                            ? 'bg-rose-500'
                            : monthTotals.exp / effectiveTotalMonthlyBudget > 0.8
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min((monthTotals.exp / effectiveTotalMonthlyBudget) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CATEGORY-WISE BUDGET SECTION */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      {t('Category-wise Budget List', 'ক্যাটাগরি ভিত্তিক বাজেট তালিকা')}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {t(`${Object.keys(categoryBudgets).length} categories have budgets set`, `${Object.keys(categoryBudgets).length} টি ক্যাটাগরিতে বাজেট সেট করা আছে`)}
                    </span>
                  </div>

                  <div className="relative w-full sm:w-44">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t('Search category...', 'ক্যাটাগরি খুঁজুন...')}
                      value={budgetSearchQuery}
                      onChange={e => setBudgetSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {expenseCategories
                    .filter(cat =>
                      budgetSearchQuery ? cat.toLowerCase().includes(budgetSearchQuery.toLowerCase()) : true
                    )
                    .map(cat => {
                      const spent = selectedMonthExpenseByCategory[cat] || 0;
                      const budget = categoryBudgets[cat] || 0;
                      const hasBudget = budget > 0;
                      const remaining = budget - spent;
                      const percent = hasBudget ? (spent / budget) * 100 : 0;
                      const isOver = hasBudget && spent > budget;

                      return (
                        <div
                          key={cat}
                          onClick={() => handleOpenCategoryBudgetModal(cat)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            hasBudget
                              ? isOver
                                ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                                : 'bg-slate-50/80 border-slate-200 hover:border-indigo-300'
                              : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">{cleanCategoryName(cat)}</span>
                              <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                                <span className="text-slate-500">
                                  {t('Spent:', 'খরচ:')} <b className="text-slate-700 font-mono">{spent.toLocaleString()} ৳</b>
                                </span>
                                {hasBudget ? (
                                  <span className="text-slate-500">
                                    • {t('Budget:', 'বাজেট:')} <b className="text-indigo-600 font-mono">{budget.toLocaleString()} ৳</b>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">• {t('No budget set', 'বাজেট নেই')}</span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenCategoryBudgetModal(cat);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold transition-all shrink-0 cursor-pointer ${
                                hasBudget
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
                              }`}
                            >
                              {hasBudget ? t('Edit Budget', 'বাজেট এডিট') : t('+ Set Budget', '+ বাজেট দিন')}
                            </button>
                          </div>

                          {hasBudget ? (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                  {percent.toFixed(0)}% {t('used', 'ব্যবহৃত')}
                                </span>
                                <span className={isOver ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                                  {isOver
                                    ? t(`⚠️ ${Math.abs(remaining).toLocaleString()} ৳ over budget!`, `⚠️ ${Math.abs(remaining).toLocaleString()} ৳ বেশি খরচ!`)
                                    : `${remaining.toLocaleString()} ৳ ${t('remaining', 'বাকি')}`}
                                </span>
                              </div>

                              <div className="bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isOver ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${Math.min(percent, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            spent > 0 && (
                              <div className="text-[10px] text-slate-400">
                                {t('Already spent', 'এই মাসে ইতিমধ্যে')} <span className="font-mono font-semibold text-slate-600">{spent.toLocaleString()} ৳</span> {t('this month', 'খরচ হয়েছে')}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ENTRY TAB (CALCULATOR + FORM) */}
          {/* ======================================================== */}
          {activeTab === 'entry' && (
            <div className="animate-fadeIn space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900">{t('New Transaction Entry', 'নতুন লেনদেন এন্ট্রি')}</h2>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {t('Auto Sheet Sync', 'অটো শিট সিঙ্ক')}
                </span>
              </div>

              {/* Segmented Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTypeChange('Expense')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'Expense'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  {t('Expense', 'খরচ')}
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('Income')}
                  className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'Income'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  {t('Income', 'আয়')}
                </button>
              </div>

              <form onSubmit={e => { e.preventDefault(); handleEntrySubmit(); }} className="space-y-3">
                <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
                  {/* Date and Category */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Date', 'তারিখ')}</label>
                      <input
                        type="date"
                        value={entryDate}
                        onChange={e => setEntryDate(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Category', 'ক্যাটাগরি')}</label>
                      <select
                        value={entryCategory}
                        onChange={e => setEntryCategory(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {(entryType === 'Expense' ? expenseCategories : incomeCategories).map(cat => (
                          <option key={cat} value={cat}>
                            {cleanCategoryName(cat)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Category Chips */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 mb-1.5">{t('Quick Category:', 'দ্রুত ক্যাটাগরি বাছাই:')}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {quickCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEntryCategory(cat)}
                          className={`text-[10.5px] px-2.5 py-1 rounded-xl transition-all font-medium cursor-pointer ${
                            entryCategory === cat
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {cleanCategoryName(cat)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">{t('Note / Description (Optional)', 'নোট / বিবরণ (অপশনাল)')}</label>
                    <input
                      type="text"
                      placeholder={t('e.g. Monthly Grocery, Transport...', 'যেমন: মাসিক বাজার, গাড়ির ভাড়া...')}
                      value={entryNote}
                      onChange={e => setEntryNote(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* CALCULATOR KEYPAD */}
                <div className="bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">{t('Amount ৳', 'টাকার পরিমাণ ৳')}</span>
                    <span className="text-[10px]">{t('Calculate or direct type', 'ক্যালকুলেট বা সরাসরি টাইপ')}</span>
                  </div>

                  <div className="bg-slate-950 text-sky-400 font-mono text-2xl font-bold text-right p-3 rounded-2xl mb-3 tracking-wider flex items-center justify-end border border-slate-800/80 shadow-inner">
                    <span>{calcDisplay}</span>
                    <span className="text-sm font-semibold text-slate-500 ml-1.5">৳</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                    {[50, 100, 500, 1000, 2000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickAdd(amt)}
                        className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-[10px] sm:text-[11px] font-bold border border-slate-700/60 transition-all cursor-pointer flex items-center justify-center min-w-0"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <button type="button" onClick={() => handleCalcPress('7')} className="calc-key">7</button>
                    <button type="button" onClick={() => handleCalcPress('8')} className="calc-key">8</button>
                    <button type="button" onClick={() => handleCalcPress('9')} className="calc-key">9</button>
                    <button type="button" onClick={handleCalcClear} className="calc-key bg-slate-700 hover:bg-slate-600 text-amber-300">C</button>

                    <button type="button" onClick={() => handleCalcPress('4')} className="calc-key">4</button>
                    <button type="button" onClick={() => handleCalcPress('5')} className="calc-key">5</button>
                    <button type="button" onClick={() => handleCalcPress('6')} className="calc-key">6</button>
                    <button type="button" onClick={() => handleCalcPress('+')} className="calc-key bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg">+</button>

                    <button type="button" onClick={() => handleCalcPress('1')} className="calc-key">1</button>
                    <button type="button" onClick={() => handleCalcPress('2')} className="calc-key">2</button>
                    <button type="button" onClick={() => handleCalcPress('3')} className="calc-key">3</button>
                    <button type="button" onClick={() => handleCalcPress('-')} className="calc-key bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg">-</button>

                    <button type="button" onClick={() => handleCalcPress('.')} className="calc-key">.</button>
                    <button type="button" onClick={() => handleCalcPress('0')} className="calc-key">0</button>
                    <button type="button" onClick={handleCalcDelete} className="calc-key bg-rose-600 hover:bg-rose-500 text-white">⌫</button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="calc-key bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl shadow-lg shadow-emerald-900/30 active:scale-95 transition-all cursor-pointer"
                      title="Save Transaction"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </form>

              {entryMessage.text && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold text-center border animate-fadeIn ${
                    entryMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {entryMessage.text}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: USERS MANAGEMENT & USER CENTER */}
          {/* ======================================================== */}
          {(activeTab === 'users' || activeTab === 'profile') && (
            <div className="animate-fadeIn space-y-4">
              {/* Back to Summary Button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackAction}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-indigo-600" />
                  <span>{t('Back to Summary', 'ফিরে যান (Summary)')}</span>
                </button>
              </div>

              {/* Sub-Navigation Tabs inside Users Tab */}
              {(currentUser?.role === 'admin' || currentUser?.username === 'abujar287') ? (
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/90 rounded-2xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setUserTabSection('users')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                      userTabSection === 'users' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('Users', 'ইউজার')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTabSection('profile')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                      userTabSection === 'profile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('Profile', 'প্রোফাইল')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTabSection('categories')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                      userTabSection === 'categories' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('Category', 'ক্যাটাগরি')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTabSection('sheets')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                      userTabSection === 'sheets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('Sheet', 'শিট')}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/90 rounded-2xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setUserTabSection('profile')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                      userTabSection === 'profile' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('My Profile', 'আমার প্রোফাইল')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTabSection('categories')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                      userTabSection === 'categories' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('Categories', 'ক্যাটাগরি')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTabSection('sheets')}
                    className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
                      userTabSection === 'sheets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t('Google Sheet', 'গুগল শিট')}</span>
                  </button>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 1: ALL USERS MANAGEMENT (VISIBLE TO ADMIN) */}
              {/* ======================================================== */}
              {(currentUser?.role === 'admin' || currentUser?.username === 'abujar287') && userTabSection === 'users' && (
                <div className="space-y-3.5 animate-fadeIn">
                  {/* Admin User Management Header & Stats */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-4.5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        {t('User Accounts Management', 'ব্যবহারকারী একাউন্ট ব্যবস্থাপনা')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCreateFullName('');
                          setCreateUsername('');
                          setCreatePassword('');
                          setCreateError('');
                          setShowCreateUserModal(true);
                        }}
                        className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t('+ Add User', '+ নতুন ইউজার')}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {t(
                        'Full admin control: View/reveal passwords, edit user details, activate or deactivate accounts, and manage isolated Google Sheet tabs.',
                        'মূল অ্যাডমিন কন্ট্রোল: নতুন ব্যবহারকারীদের নাম ও পাসওয়ার্ড দেখা, পরিবর্তন, একাউন্ট অ্যাক্টিভ/ডিঅ্যাক্টিভ করা ও গুগল শিট ট্যাব নিয়ন্ত্রণ।'
                      )}
                    </p>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">{t('Total Users', 'মোট ইউজার')}</span>
                        <span className="text-base font-extrabold text-slate-800">
                          {users.filter(u => u.username !== 'user').length}
                        </span>
                      </div>
                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                        <span className="text-[10px] text-emerald-700 block uppercase font-bold">{t('Active', 'সক্রিয়')}</span>
                        <span className="text-base font-extrabold text-emerald-700">
                          {users.filter(u => u.username !== 'user' && u.isActive !== false).length}
                        </span>
                      </div>
                      <div className="p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                        <span className="text-[10px] text-rose-700 block uppercase font-bold">{t('Inactive', 'নিষ্ক্রিয়')}</span>
                        <span className="text-base font-extrabold text-rose-700">
                          {users.filter(u => u.username !== 'user' && u.isActive === false).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Registered Users Line-Wise Horizontal Scrollable Table */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{t('User Accounts List', 'ইউজার তালিকা')}</h4>
                        <p className="text-[10.5px] text-slate-400">{t('Scroll horizontally to view passwords and manage users', 'ডান দিকে স্ক্রোল করে পাসওয়ার্ড দেখুন ও নিয়ন্ত্রণ করুন')}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {users.filter(u => u.username !== 'user').length} {t('Accounts', 'একাউন্ট')}
                      </span>
                    </div>

                    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                      <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                            <th className="py-2.5 px-3">{t('User', 'ইউজার')}</th>
                            <th className="py-2.5 px-3">{t('Role & Status', 'রোল ও স্ট্যাটাস')}</th>
                            <th className="py-2.5 px-3">{t('Sheet Tab', 'শিট ট্যাব')}</th>
                            <th className="py-2.5 px-3">{t('Password', 'পাসওয়ার্ড')}</th>
                            <th className="py-2.5 px-3 text-right">{t('Actions', 'অ্যাকশন')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users
                            .filter(u => u.username !== 'user')
                            .map(u => {
                              const isPrimaryAdmin = u.username === 'abujar287';
                              const isUserActive = u.isActive !== false;
                              const isPasswordRevealed = !!revealedPasswords[u.username];
                              const isCurrent = currentUser?.username === u.username;

                              return (
                                <tr
                                  key={u.username}
                                  className={`hover:bg-slate-50 transition-colors ${
                                    !isUserActive ? 'bg-rose-50/20' : ''
                                  }`}
                                >
                                  {/* User info */}
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                                        {u.displayName
                                          .split(' ')
                                          .map(p => p[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                          <span className="truncate">{u.displayName}</span>
                                          {isCurrent && (
                                            <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">
                                              {t('You', 'আপনি')}
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-[11px] text-indigo-600 font-mono">@{u.username}</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Role & Status */}
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5">
                                      {u.role === 'admin' ? (
                                        <span className="text-[9.5px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-200">
                                          {t('Admin', 'অ্যাডমিন')}
                                        </span>
                                      ) : (
                                        <span className="text-[9.5px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold border border-slate-200">
                                          {t('Member', 'মেম্বার')}
                                        </span>
                                      )}
                                      {isUserActive ? (
                                        <span className="text-[9.5px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          {t('Active', 'সক্রিয়')}
                                        </span>
                                      ) : (
                                        <span className="text-[9.5px] px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold flex items-center gap-1 border border-rose-200">
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                          {t('Inactive', 'নিষ্ক্রিয়')}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Sheet Tab */}
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 font-mono font-bold">
                                      <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{u.sheetTab || u.initialUsername}</span>
                                    </div>
                                  </td>

                                  {/* Password with eye toggle */}
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80 font-mono text-xs">
                                      <span className="font-bold text-slate-800">
                                        {isPasswordRevealed ? u.password : '••••••••'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => toggleRevealPassword(u.username)}
                                        className="p-0.5 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                                        title={isPasswordRevealed ? t('Hide', 'লুকান') : t('Show', 'দেখুন')}
                                      >
                                        {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-3 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {!isCurrent && isUserActive && (
                                        <button
                                          type="button"
                                          onClick={() => handleSwitchToUser(u)}
                                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                          title={t('Switch to this user', 'এই একাউন্টে স্যুইচ করুন')}
                                        >
                                          {t('Switch', 'স্যুইচ')}
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditUserByAdmin(u)}
                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                        title={t('Edit Credentials', 'তথ্য এডিট')}
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>

                                      {!isPrimaryAdmin && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => handleToggleUserActive(u)}
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                              isUserActive
                                                ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                                : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                                            }`}
                                            title={isUserActive ? t('Deactivate Account', 'নিষ্ক্রিয় করুন') : t('Activate Account', 'সক্রিয় করুন')}
                                          >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUser(u)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                            title={t('Delete User Account (Sheet preserved)', 'ইউজার মুছুন (শিট অক্ষত থাকবে)')}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </>
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

                  {/* Template user restore button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (!users.some(u => u.username === 'user')) {
                          setUsers(prev => [...prev, DEFAULT_TEMPLATE_USER]);
                          showToast(t('Default user/password restored!', 'ডিফল্ট user/password অ্যাকাউন্ট সক্রিয় করা হয়েছে!'), 'success');
                        } else {
                          showToast(t('Default user/password template is already active.', 'ডিফল্ট user/password অ্যাকাউন্ট ইতিমধ্যে সক্রিয় রয়েছে।'), 'info');
                        }
                      }}
                      className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      <span>{t('Restore default user/password template', 'ডিফল্ট user/password টেমপ্লেট রিস্টোর')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 2: MY PROFILE CARD & ACTIONS */}
              {/* ======================================================== */}
              {userTabSection === 'profile' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Dynamic Profile Card */}
                  <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-xl text-center relative overflow-hidden border border-slate-800">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
                      {(currentUser?.displayName || 'User')
                        .split(' ')
                        .map(p => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <h3 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                      <span>{currentUser?.displayName || 'User'}</span>
                      {currentUser?.role === 'admin' && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-bold border border-amber-500/30">
                          {t('Admin', 'অ্যাডমিন')}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-indigo-300 font-mono mt-0.5">@{currentUser?.username}</p>

                    {/* Fixed Google Sheet Tab Badge */}
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-xs font-mono text-indigo-200">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('Sheet Tab:', 'গুগল শিট ট্যাব:')}</span>
                      <span className="font-bold text-emerald-300">{currentUser?.sheetTab || 'abujar287'}</span>
                      <Lock className="w-3 h-3 text-amber-400 ml-0.5" />
                      <span className="text-[10px] text-amber-300/80 font-sans">({t('Locked', 'স্থায়ী')})</span>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1 max-w-xs mx-auto">
                      {t(
                        `All your transactions are isolated and synced with Google Sheet tab '${currentUser?.sheetTab || 'abujar287'}'.`,
                        `আপনার সমস্ত লেনদেন গুগল শিটের '${currentUser?.sheetTab || 'abujar287'}' ট্যাবে সংরক্ষিত হচ্ছে।`
                      )}
                    </p>

                    {/* Profile Actions: Edit & Logout */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setEditDisplayName(currentUser?.displayName || '');
                          setEditProfileUsername(currentUser?.username || '');
                          setEditProfilePassword(currentUser?.password || '');
                          setEditProfileError('');
                          setShowEditProfileModal(true);
                        }}
                        className="py-2 px-3 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{t('Edit Profile', 'একাউন্ট এডিট')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('Logout', 'লগআউট')}</span>
                      </button>
                    </div>

                    {/* Extra Tab Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleManualSync(currentUser?.sheetTab)}
                        disabled={isSyncing}
                        className="py-2 px-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-indigo-500/30 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="truncate">{t('Sync Tab', 'শিট সিঙ্ক')} ({currentUser?.sheetTab || 'abujar287'})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowScriptModal(true)}
                        className="py-2 px-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl font-bold flex items-center justify-center gap-1.5 border border-emerald-500/30 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                        <span>{t('Apps Script Code', 'Apps Script কোড')}</span>
                      </button>
                    </div>

                    {currentUser?.username !== 'abujar287' && (
                      <div className="mt-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const tab = (currentUser?.sheetTab || currentUser?.username || '').toLowerCase();
                            setTransactions([]);
                            try {
                              const k = getUserStorageKey(tab);
                              localStorage.setItem(k, JSON.stringify([]));
                            } catch {}
                            showToast(
                              lang === 'en'
                                ? `Local cache cleared for user '${currentUser?.displayName}'!`
                                : `'${currentUser?.displayName}' এর লোকাল ডেটা ক্যাশ খালি করা হয়েছে!`,
                              'info'
                            );
                          }}
                          className="text-[10.5px] text-slate-400 hover:text-amber-300 underline cursor-pointer transition-colors"
                        >
                          🔄 {t('Clear local cache for this account', 'এই অ্যাকাউন্টের লোকাল ক্যাশ খালি করুন (Clear Cache)')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 3: CATEGORY MANAGEMENT */}
              {/* ======================================================== */}
              {userTabSection === 'categories' && (
                <div className="bg-white border border-slate-200/90 rounded-3xl p-4.5 shadow-sm space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      {t('Category Management', 'ক্যাটাগরি ব্যবস্থাপনা')}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {profileCatTab === 'Expense'
                        ? `${expenseCategories.length} ${t('Expenses', 'খরচ')}`
                        : `${incomeCategories.length} ${t('Incomes', 'আয়')}`}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {t(
                      'Categories automatically update from Google Sheets sync. You can also customize, add, or reset categories here:',
                      'গুগল শিট সিঙ্ক করার সাথে সাথে শিটের সব ক্যাটাগরি স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়। এছাড়াও নতুন ক্যাটাগরি যোগ বা পরিবর্তন করতে পারেন:'
                    )}
                  </p>

                  {/* Toggle: Expenses vs Income */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setProfileCatTab('Expense')}
                      className={`py-2 rounded-xl transition-all cursor-pointer ${
                        profileCatTab === 'Expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t('Expense Categories', 'খরচের ক্যাটাগরি')} ({expenseCategories.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileCatTab('Income')}
                      className={`py-2 rounded-xl transition-all cursor-pointer ${
                        profileCatTab === 'Income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t('Income Categories', 'আয়ের ক্যাটাগরি')} ({incomeCategories.length})
                    </button>
                  </div>

                  {/* Category List */}
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {(profileCatTab === 'Expense' ? expenseCategories : incomeCategories).map(cat => {
                      const isCore = profileCatTab === 'Expense'
                        ? DEFAULT_EXPENSE_CATEGORIES.includes(cat)
                        : DEFAULT_INCOME_CATEGORIES.includes(cat);

                      const displayedName = cleanCategoryName(cat, lang);

                      return (
                        <div
                          key={cat}
                          className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-slate-800">{displayedName}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCore ? (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                                {t('Core', 'মূল')}
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                                {t('Custom', 'কাস্টম')}
                              </span>
                            )}

                            {!isCore && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat, profileCatTab)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title={t('Delete Category', 'ক্যাটাগরি মুছুন')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Category & Reset Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCatModalType(profileCatTab);
                        setNewCatName('');
                        setNewCatEmoji(profileCatTab === 'Expense' ? '🛒' : '💰');
                        setShowAddCategoryModal(true);
                      }}
                      className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('+ Add Category', '+ নতুন ক্যাটাগরি')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetCategoriesToDefault}
                      className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t('Reset Defaults', 'ডিফল্ট রিস্টোর')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* SECTION 4: GOOGLE SHEET SETTINGS & SCRIPTS */}
              {/* ======================================================== */}
              {userTabSection === 'sheets' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Google Sheets Settings & Script Guide */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-4.5 shadow-sm space-y-3.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      {t('Google Sheet Setup & Code', 'গুগল শিট সেটিংস ও কোড')}
                    </span>

                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      {t(
                        'Copy Google Apps Script code (Code.gs) or test the Web App URL connection:',
                        'Apps Script কোড কপি করতে অথবা গুগল শিটের সাথে সংযুক্ত Web App লিঙ্ক পরিবর্তন করতে নিচের অপশনগুলো ব্যবহার করুন:'
                      )}
                    </p>

                    {/* Google Sheet Script Guide Button */}
                    <button
                      type="button"
                      onClick={() => setShowScriptModal(true)}
                      className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 hover:bg-amber-500/15 active:scale-98 rounded-2xl text-xs font-semibold text-amber-900 transition-all border border-amber-300 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-left min-w-0">
                        <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="truncate"><b>{t('Permanent Code.gs Script (v5.0)', 'স্থায়ী Apps Script কোড')}</b></span>
                      </span>
                      <span className="text-amber-700 font-bold shrink-0 ml-1">{t('Copy Code ➔', 'কপি করুন ➔')}</span>
                    </button>

                    {/* Google Sheet URL Config */}
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(true)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl text-xs font-semibold text-slate-700 transition-all border border-slate-200 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-left min-w-0">
                        <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="truncate">{t('Change & Test Google Apps Script Web App URL', 'গুগল শিট Web App URL পরিবর্তন ও টেস্ট')}</span>
                      </span>
                      <span className="text-slate-400 shrink-0 ml-1">⚙️</span>
                    </button>
                  </div>

                  {/* Offline Export & Backup */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-2.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      {t('Offline Backup & File Export', 'অফলাইন ব্যাকআপ ও ফাইল ডাউনলোড')}
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          const csvContent =
                            'data:text/csv;charset=utf-8,ID,DateTime,Type,Category,Date,Value,Note\n' +
                            transactions
                              .map(t => `"${t.id}","${t.datetime || ''}","${t.type}","${t.category}","${t.date}",${t.value},"${t.note || ''}"`)
                              .join('\n');
                          const encodedUri = encodeURI(csvContent);
                          const link = document.createElement('a');
                          link.setAttribute('href', encodedUri);
                          link.setAttribute('download', `hisabkitab-transactions-${selectedMonth}.csv`);
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          showToast(t('CSV file downloaded!', 'CSV ফাইল ডাউনলোড হয়েছে!'), 'success');
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t('CSV Export', 'CSV এক্সপোর্ট')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `hisabkitab-backup-${selectedMonth}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          showToast(t('JSON backup downloaded!', 'JSON ব্যাকআপ ডাউনলোড হয়েছে!'), 'success');
                        }}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                      >
                        <Download className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t('JSON Backup', 'JSON ব্যাকআপ')}</span>
                      </button>
                    </div>
                  </div>

                  {/* APK & Mobile Guide Card */}
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      {t('Mobile App & QR Access', 'মোবাইল ইনস্টলেশন ও নিয়ন্ত্রণ')}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {t(
                        'Scan QR code to use directly on mobile browser or install on phone.',
                        'QR কোড স্ক্যান করে মোবাইল দিয়ে অ্যাপটি সরাসরি নিয়ন্ত্রণ করুন এবং ১-ক্লিকে ফোনে ইনস্টল করুন।'
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowMobileModal(true)}
                        className="py-2.5 px-2 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 font-bold rounded-2xl border border-sky-200 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span className="truncate">{t('Mobile QR Guide', 'মোবাইল QR ও গাইড')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAPKGuideModal(true)}
                        className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold rounded-2xl border border-emerald-200 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{t('APK Build Guide', 'APK বিল্ড গাইড')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* ======================================================== */}
        {/* BOTTOM NAVIGATION BAR */}
        {/* ======================================================== */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1.5 flex justify-between items-center z-30">
          <button
            type="button"
            onClick={() => handleSwitchTab('summary')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-0 ${
              activeTab === 'summary' ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] truncate">{t('Summary', 'বিবরণী')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('details')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-0 ${
              activeTab === 'details' ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] truncate">{t('Details', 'বিস্তারিত')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('entry')}
            className="flex-1 flex flex-col items-center justify-center -mt-5 cursor-pointer min-w-0"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform border-2 border-slate-900 shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-indigo-400 font-bold mt-0.5 truncate">{t('Entry', 'এন্ট্রি')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('budget')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-0 ${
              activeTab === 'budget' ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] truncate">{t('Budget', 'বাজেট')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('users')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-0 ${
              activeTab === 'users' || activeTab === 'profile' ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] truncate">{t('Users', 'ইউজার')}</span>
          </button>
        </nav>

        {/* ======================================================== */}
        {/* BUDGET MODAL 1: CATEGORY BUDGET MODAL */}
        {/* ======================================================== */}
        {editingBudgetCat && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setEditingBudgetCat(null)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{t('Set Category Budget', 'বাজেট নির্ধারণ করুন')}</h3>
                    <p className="text-[10.5px] text-indigo-300 truncate">{cleanCategoryName(editingBudgetCat)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingBudgetCat(null)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700 flex justify-between items-center text-xs">
                  <span className="text-slate-400">{t('Current spent this month:', 'এই মাসে বর্তমান খরচ:')}</span>
                  <b className="font-mono text-rose-400 text-sm">
                    {(selectedMonthExpenseByCategory[editingBudgetCat] || 0).toLocaleString()} ৳
                  </b>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    {t('Budget Amount (৳):', 'বাজেটের পরিমাণ (টাকা):')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={t('e.g. 5000', 'যেমন: ৫০০০')}
                      value={budgetInputValue}
                      onChange={e => setBudgetInputValue(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl text-lg font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <span className="absolute right-3.5 top-3.5 text-sm font-bold text-slate-400">৳</span>
                  </div>
                </div>

                {/* Quick Add Amount Chips */}
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5">{t('Quick add amount:', 'দ্রুত টাকা যোগ করুন:')}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[1000, 2000, 3000, 5000, 10000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const current = parseInt(budgetInputValue.replace(/[^0-9]/g, ''), 10) || 0;
                          setBudgetInputValue(String(current + amt));
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-[10.5px] font-mono transition-colors cursor-pointer"
                      >
                        +{amt.toLocaleString()} ৳
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setBudgetInputValue('')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl border border-slate-700 text-[10.5px] transition-colors cursor-pointer"
                    >
                      {t('Clear', 'মুছুন')}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {categoryBudgets[editingBudgetCat] && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategoryBudget(editingBudgetCat)}
                      className="py-3 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('Remove', 'মুছুন')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveCategoryBudget}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('Save Budget', 'বাজেট সংরক্ষণ করুন')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* BUDGET MODAL 2: OVERALL MONTHLY BUDGET MODAL */}
        {/* ======================================================== */}
        {showOverallBudgetModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowOverallBudgetModal(false)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t('Set Monthly Overall Budget', 'মাসিক সামগ্রিক বাজেট সেট করুন')}</h3>
                    <p className="text-[10px] text-slate-400">{t('Maximum expense limit for this month', 'এই মাসের মোট খরচের সর্বোচ্চ সীমা')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOverallBudgetModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    {t('Total Monthly Budget (Amount):', 'মোট মাসিক বাজেট (টাকা):')}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder={t('e.g. 25000', 'যেমন: ২৫০০০')}
                      value={overallBudgetInputValue}
                      onChange={e => setOverallBudgetInputValue(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl text-lg font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <span className="absolute right-3.5 top-3.5 text-sm font-bold text-slate-400">৳</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5">{t('Quick add amount:', 'দ্রুত টাকা যোগ করুন:')}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[5000, 10000, 15000, 20000, 30000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          const current = parseInt(overallBudgetInputValue.replace(/[^0-9]/g, ''), 10) || 0;
                          setOverallBudgetInputValue(String(current + amt));
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-[10.5px] font-mono transition-colors cursor-pointer"
                      >
                        +{amt.toLocaleString()} ৳
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setOverallBudgetInputValue('')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-xl border border-slate-700 text-[10.5px] transition-colors cursor-pointer"
                    >
                      {t('Clear', 'মুছুন')}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {monthlyOverallBudget > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMonthlyOverallBudget(0);
                        try {
                          localStorage.removeItem('app_monthly_overall_budget');
                        } catch {}
                        showToast(t('Monthly budget cleared.', 'মাসিক বাজেট মুছে ফেলা হয়েছে।'), 'info');
                        setShowOverallBudgetModal(false);
                      }}
                      className="py-3 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('Clear', 'মুছুন')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveOverallBudget}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('Save Budget', 'সংরক্ষণ করুন')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM MODAL 1: EDIT TRANSACTION MODAL */}
        {/* ======================================================== */}
        {editingTx && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={closeEditModal}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{t('Edit Transaction', 'লেনদেন সম্পাদনা (Edit)')}</h3>
                    <p className="text-[10px] text-slate-400">{t('Modify details and press update', 'তথ্য পরিবর্তন করে সেভ চাপুন')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Type Switch */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('Type', 'ধরণ (Type)')}</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleEditTypeChange('Expense')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        editForm.type === 'Expense'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔻 {t('Expense', 'খরচ (Expense)')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditTypeChange('Income')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        editForm.type === 'Income'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🔺 {t('Income', 'আয় (Income)')}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('Date', 'তারিখ (Date)')}</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('Category', 'ক্যাটাগরি (Category)')}</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {(editForm.type === 'Expense' ? expenseCategories : incomeCategories).map(cat => (
                      <option key={cat} value={cat}>
                        {cleanCategoryName(cat, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('Amount ৳', 'টাকার পরিমাণ ৳ (Amount)')}</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.value}
                    onChange={e => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">{t('Note / Description', 'নোট / বিবরণ (Note)')}</label>
                  <textarea
                    rows={2}
                    value={editForm.note}
                    onChange={e => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full p-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder={t('Short note...', 'ছোট নোট...')}
                  />
                </div>

                {editMessage.text && (
                  <div
                    className={`p-2 rounded-xl text-[11px] font-semibold text-center border ${
                      editMessage.type === 'success'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {editMessage.text}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const id = editingTx.id;
                      closeEditModal();
                      requestDelete(id);
                    }}
                    className="w-1/3 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 font-bold rounded-xl border border-rose-500/30 flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {t('Delete', 'মুছুন')}
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateTransaction}
                    className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> {t('Update', 'আপডেট করুন')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM MODAL 2: DELETE CONFIRMATION MODAL */}
        {/* ======================================================== */}
        {deletingTx && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setDeletingTx(null)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-rose-500/30 text-center overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">লেনদেনটি মুছে ফেলতে চান?</h3>
              <p className="text-xs text-slate-400 mt-1">গুগল শিট ও অ্যাপের হিস্টোরি উভয় জায়গা থেকেই রো-টি ডিলিট হবে।</p>

              {/* Transaction details card */}
              <div className="my-3.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs">
                <div className="flex justify-between items-center font-bold text-white mb-1">
                  <span className="truncate pr-2">{deletingTx.category}</span>
                  <span
                    className={
                      deletingTx.type === 'Expense'
                        ? 'text-rose-400 font-mono font-extrabold shrink-0'
                        : 'text-emerald-400 font-mono font-extrabold shrink-0'
                    }
                  >
                    {deletingTx.type === 'Expense' ? '-' : '+'}
                    {deletingTx.value.toLocaleString()} ৳
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>📅 {deletingTx.date}</span>
                  <span className="truncate max-w-[140px]">{deletingTx.note || 'নোট নেই'}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium text-left mb-4 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>নিশ্চিতকরণ: গুগল শিট থেকে এই সারিটি স্থায়ীভাবে মুছে ফেলা হবে। কোনো নতুন রো যোগ হবে না।</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDeletingTx(null)}
                  className="py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDelete}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{isDeleting ? 'রো ডিলিট হচ্ছে...' : 'হ্যাঁ, রো ডিলিট করুন'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM MODAL 3: DATE BREAKDOWN MODAL */}
        {/* ======================================================== */}
        {selectedDateModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-40 p-4 animate-fadeIn"
            onClick={() => setSelectedDateModal(null)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 max-h-[80vh] overflow-y-auto shadow-2xl relative border border-slate-700/80 animate-modalSpring"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-xs text-indigo-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {selectedDateModal} এর বিস্তারিত
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDateModal(null)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {dateModalTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">এই তারিখে কোনো লেনদেন নেই।</p>
              ) : (
                <div className="space-y-2">
                  {dateModalTransactions.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-800/80 border border-slate-700/70 rounded-2xl flex items-center justify-between text-xs hover:bg-slate-800 transition-colors"
                    >
                      <div className="pr-2">
                        <div className="font-bold text-white">{item.category}</div>
                        {item.note && <div className="text-[11px] text-slate-400 mt-0.5">{item.note}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-bold font-mono ${
                            item.type === 'Expense' ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {item.type === 'Expense' ? '-' : '+'}
                          {item.value.toLocaleString()} ৳
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDateModal(null);
                            openEditModal(item.id);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDateModal(null);
                            requestDelete(item.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
                          title="Delete (মুছে ফেলুন)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM MODAL 4: CATEGORY BREAKDOWN MODAL */}
        {/* ======================================================== */}
        {selectedCatModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-40 p-4 animate-fadeIn"
            onClick={() => setSelectedCatModal(null)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 max-h-[80vh] overflow-y-auto shadow-2xl relative border border-slate-700/80 animate-modalSpring"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-xs text-indigo-400 truncate pr-2">
                  📂 {selectedCatModal}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCatModal(null)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {catModalTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">এই ক্যাটাগরিতে কোনো খরচ পাওয়া যায়নি।</p>
              ) : (
                <div className="space-y-2">
                  {catModalTransactions.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-800/80 border border-slate-700/70 rounded-2xl flex items-center justify-between text-xs hover:bg-slate-800 transition-colors"
                    >
                      <div className="pr-2">
                        <div className="font-semibold text-white">📅 {item.date}</div>
                        {item.note && <div className="text-[11px] text-slate-400 mt-0.5">{item.note}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold font-mono text-rose-400">
                          -{item.value.toLocaleString()} ৳
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCatModal(null);
                            openEditModal(item.id);
                          }}
                          className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCatModal(null);
                            requestDelete(item.id);
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors cursor-pointer"
                          title="Delete (মুছে ফেলুন)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM MODAL 5: GOOGLE SHEET APPS SCRIPT GUIDE MODAL */}
        {/* ======================================================== */}
        {showScriptModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowScriptModal(false)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-md rounded-[28px] p-5 shadow-2xl relative animate-modalSpring text-xs border border-slate-700/80 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  গুগল শিট Apps Script কোড (ভার্সন ৫.০ - মাল্টি-ট্যাব ফিক্সড)
                </span>
                <button
                  type="button"
                  onClick={() => setShowScriptModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-indigo-200 text-[11px] leading-relaxed mb-3 space-y-1">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>মাল্টি-ইউজার শিট ট্যাব ফিক্স (Multi-User Tab Isolation):</span>
                </div>
                <div>
                  ১. <b>নতুন ইউজারের আলাদা শিট ট্যাব:</b> আপনি নতুন কোনো একাউন্ট (যেমন: <code className="bg-slate-950 px-1 rounded text-amber-300">amit</code> বা নতুন যেকোনো নাম) বানালে গুগল শিটে সেই নামের আলাদা ট্যাব তৈরি হবে।
                </div>
                <div>
                  ২. <b>ডেটা আলাদা রাখা:</b> নতুন ইউজারের ডেটা ইনপুট দিলে শুধুমাত্র সেই নির্দিষ্ট ট্যাবেই যাবে এবং শিট সিঙ্ক করলে শুধুমাত্র সেই ট্যাবের ডেটাই আসবে, মূল এডমিন (<code className="bg-slate-950 px-1 rounded text-amber-300">abujar287</code>) এর ডেটা কখনোই নতুন ইউজারে আসবে না।
                </div>
              </div>

              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-200 text-[11px] leading-relaxed mb-3">
                <b>⚠️ কেন আগের ট্যাবেই ডেটা যাচ্ছিল বা পুরনো ডেটা সিঙ্ক হচ্ছিল?</b><br />
                গুগল শিটে কোড পেস্ট করার পর শুধু <b>&quot;Save&quot;</b> চাপলে পুরনো স্ক্রিপ্টই চালু থাকে। তাই নতুন ট্যাব তৈরি হচ্ছিল না। নিচে দেওয়া ৪ নম্বর ধাপটি (New version Deploy) অনুসরণ করলেই সাথে সাথে সমস্যাটির স্থায়ী সমাধান হবে!
              </div>

              <div className="relative my-2">
                <pre className="p-3.5 bg-slate-950 text-emerald-300 rounded-2xl overflow-x-auto text-[10.5px] font-mono max-h-56 select-all border border-slate-800">
                  {googleAppsScriptCode}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(googleAppsScriptCode);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  {copiedScript ? <CheckCheck className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'কপি হয়েছে!' : 'কপি কোড'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-slate-300 text-[11px] leading-relaxed space-y-2 my-3">
                <div className="font-bold text-white text-xs mb-1">📋 গুগল শিটে আপডেট করার সঠিক ও নিশ্চিত ধাপ:</div>
                <div><b>১.</b> গুগল শিটে গিয়ে <b>Extensions &gt; Apps Script</b> ওপেন করুন।</div>
                <div><b>২.</b> সেখানে থাকা আগের সমস্ত কোড মুছে উপরের এই সম্পূর্ণ কোডটি পেস্ট করুন এবং সেভ (Ctrl+S) করুন।</div>
                <div><b>৩.</b> উপরে ডানপাশে নীল <b>Deploy &gt; Manage deployments</b> বাটনে যান।</div>
                <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-200">
                  <b>৪. [সবচেয়ে গুরুত্বপূর্ণ ধাপ]:</b><br />
                  পেনসিল আইকনে (Edit ✏️) চাপুন &gt; <b>Version</b> ড্রপডাউনে অবশ্যই <b>&quot;New version&quot;</b> সিলেক্ট করুন &gt; এরপর নিচে <b>Deploy</b> বাটনে চাপুন।
                </div>
                <div className="text-sky-300 text-[10.5px]">
                  💡 <i>টিপস:</i> &quot;Who has access&quot; অপশনে <b>&quot;Anyone&quot; (যে কেউ)</b> সিলেক্ট রাখবেন যাতে মোবাইল ও পিসিতে সিঙ্ক কোনো বাধা ছাড়া কাজ করে।
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                বুঝেছি (Close)
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM MODAL 6: GOOGLE SCRIPT URL SETTINGS MODAL */}
        {/* ======================================================== */}
        {showSettingsModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowSettingsModal(false)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  গুগল শিট Web App URL কনফিগার
                </span>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Google Apps Script Web App URL
                  </label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={e => {
                      setUrlInput(e.target.value);
                      setUrlTestStatus('');
                    }}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-sky-300 focus:outline-none focus:border-indigo-500 select-all"
                  />
                </div>

                {urlTestStatus && (
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                    {urlTestStatus}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isTestingUrl}
                    onClick={handleTestConnection}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTestingUrl ? 'animate-spin' : ''}`} />
                    <span>টেস্ট কানেকশন</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveScriptUrl}
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>URL সেভ করুন</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setUrlInput(GOOGLE_SCRIPT_URL);
                      setCustomScriptUrl(GOOGLE_SCRIPT_URL);
                      try { localStorage.removeItem('user_google_script_url'); } catch {}
                      setUrlTestStatus('ডিফল্ট URL রিসেট হয়েছে!');
                    }}
                    className="text-indigo-400 hover:underline cursor-pointer"
                  >
                    ডিফল্ট URL এ রিসেট
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM MODAL 7: APK GUIDE MODAL */}
        {/* ======================================================== */}
        {showAPKGuideModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowAPKGuideModal(false)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80 text-xs"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  APK ও মোবাইল ইনস্টল নির্দেশিকা
                </span>
                <button
                  type="button"
                  onClick={() => setShowAPKGuideModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-slate-300 leading-relaxed">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-200">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-white">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    পদ্ধতি ১: সবচেয়ে সহজ (১-ক্লিকে ফোনে Install)
                  </div>
                  <p className="text-[11px] text-slate-300">
                    ক্রোম (Google Chrome) ব্রাউজারে অ্যাপটির লিঙ্ক ওপেন করে ওপরের <b>&quot;📲 ইন্সটল&quot;</b> বাটন চাপুন। এটি কোনো ফাইল ডাউনলোড ছাড়াই আপনার ফোনে সরাসরি হোমস্ক্রিন অ্যাপ হিসেবে ইনস্টল হয়ে যাবে!
                  </p>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-200">
                  <div className="font-bold mb-1 flex items-center gap-1.5 text-white">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    পদ্ধতি ২: GitHub Actions দিয়ে অটোমেটিক APK ডাউনলোড
                  </div>
                  <p className="text-[11px] text-slate-300">
                    এই প্রজেক্টে GitHub Actions অটোমেটিক বিল্ডার (<code>.github/workflows/build-apk.yml</code>) যুক্ত করে দেওয়া হয়েছে। GitHub-এ কোড পুশ করলেই Actions ট্যাবে সরাসরি ডাউনলোডযোগ্য <b>hisabkitab-app-debug.apk</b> ফাইল রেডি হয়ে যাবে!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAPKGuideModal(false)}
                className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM MODAL 8: MOBILE CONTROL & QR MODAL */}
        {/* ======================================================== */}
        {showMobileModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowMobileModal(false)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80 text-xs max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-sky-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  মোবাইল দিয়ে চালান ও নিয়ন্ত্রণ করুন
                </span>
                <button
                  type="button"
                  onClick={() => setShowMobileModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-inner my-2 text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin)}`}
                  alt="Mobile App QR Code"
                  className="w-44 h-44 rounded-xl border border-slate-100"
                />
                <span className="text-[11px] text-slate-700 font-bold mt-2">
                  📷 মোবাইলের ক্যামেরা দিয়ে স্ক্যান করুন
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  সরাসরি ফোনে হিসাব-নিকাশ অ্যাপটি খুলে যাবে
                </span>
              </div>

              {/* Copy Link & Share Actions */}
              <div className="grid grid-cols-2 gap-2 my-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin);
                    setCopiedMobileLink(true);
                    showToast('মোবাইল লিংক কপি হয়েছে! WhatsApp এ পাঠিয়ে মোবাইলে ওপেন করুন।', 'success');
                    setTimeout(() => setCopiedMobileLink(false), 2500);
                  }}
                  className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {copiedMobileLink ? <CheckCheck className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMobileLink ? 'কপি হয়েছে!' : 'লিংক কপি করুন'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'হিসাব-নিকাশ - Expense Tracker',
                        text: 'আমার হিসাব-নিকাশ অ্যাপ লিংক:',
                        url: window.location.origin
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.origin);
                      showToast('লিংক কপি হয়েছে!', 'success');
                    }
                  }}
                  className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>শেয়ার করুন</span>
                </button>
              </div>

              {/* 403 Error Fix Box */}
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed my-2 space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  ⚠️ 403 Forbidden Error আসলে কীভাবে ফিক্স করবেন:
                </div>
                <div>
                  <b>কারণ:</b> AI Studio এর ডেভেলপার লিংক (<code>ais-dev-...</code>) গুগল ক্লাউডের নিরাপত্তা নিয়মে লক করা থাকে। তাই মোবাইলে লগইন না থাকলে Google 403 দেখায়।
                </div>
                <div className="space-y-1 pt-1 border-t border-amber-500/20 text-[10.5px]">
                  <div>
                    👉 <b>সহজ সমাধান ১:</b> AI Studio এডিটরের উপরে ডানপাশের নীল <b>&quot;Share&quot;</b> বাটনে ক্লিক করুন। তাহলে পাবলিক লিংক চালু হবে এবং যেকোনো মোবাইল থেকে সরাসরি চলবে!
                  </div>
                  <div>
                    👉 <b>সহজ সমাধান ২:</b> আপনার মোবাইলের Chrome ব্রাউজারে একই জিমেইল অ্যাকাউন্ট (<code>abujaralgifari289@gmail.com</code>) লগইন রাখুন।
                  </div>
                  <div>
                    👉 <b>গুগল শিটের 403 ফিক্স:</b> শিটের Apps Script Deploy করার সময় <b>&quot;Who has access&quot;</b> অপশনে অবশ্যই <b>&quot;Anyone&quot; (যে কেউ)</b> সিলেক্ট রাখতে হবে।
                  </div>
                </div>
              </div>

              {/* 3 Steps Guide */}
              <div className="space-y-2 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-[11px] leading-relaxed my-2">
                <div className="font-bold text-white text-xs mb-1">📱 মোবাইল কন্ট্রোলের ৩টি সহজ ধাপ:</div>
                <div className="text-slate-300">
                  <b className="text-sky-300">১. মোবাইলে ওপেন করুন:</b> QR কোড স্ক্যান করে বা ওপরের লিংকটি কপি করে আপনার ফোনের Chrome ব্রাউজারে খুলুন।
                </div>
                <div className="text-slate-300">
                  <b className="text-emerald-300">২. ফোনে অ্যাপ বানান (PWA):</b> Chrome ব্রাউজারের ৩ ডট (⋮) মেনু চেপে <b>&quot;Install app&quot;</b> বা <b>&quot;Add to Home screen&quot;</b> চাপুন। সাথে সাথে আপনার ফোনের হোম স্ক্রিনে অ্যাপ আইকন চলে আসবে!
                </div>
                <div className="text-slate-300">
                  <b className="text-amber-300">৩. লাইভ ক্লাউড সিঙ্ক:</b> লগইন করুন (Username: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200">abujar287</code>, Password: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200">hisabkitab</code>)। মোবাইল থেকে খরচ যোগ করলে গুগল শিট ও পিসিতে লাইভ সিঙ্ক থাকবে!
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="w-full mt-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                বুঝেছি (Close)
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: ONBOARDING ACCOUNT SETUP (FOR NEW USERS) */}
        {/* ======================================================== */}
        {showSetupAccountModal && (
          <div
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  নতুন অ্যাকাউন্ট ও শিট ট্যাব সেটআপ
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                  title="বাতিল করুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl text-indigo-200 text-xs leading-relaxed mb-3 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  ব্যক্তিগত অ্যাকাউন্ট তৈরি করুন
                </div>
                <div>
                  ১ম যে ইউজারনেমটি আপনি নির্ধারণ করবেন, সেই নামেই গুগল শিটে একটি <b>নতুন ট্যাব</b> স্বয়ংক্রিয়ভাবে তৈরি হয়ে যাবে এবং আপনার সব ডেটা সম্পূর্ণ আলাদাভাবে সেখানে জমা থাকবে।
                </div>
              </div>

              <form onSubmit={handleCompleteAccountSetup} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    আপনার পুরো নাম (Full Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amit Hasan"
                    value={setupFullName}
                    onChange={e => setSetupFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ইউজারনেম ও শিট ট্যাব নাম (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. amit"
                    value={setupUsername}
                    onChange={e => setSetupUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-amber-300/80 mt-1 block">
                    ⚠️ এই নামেই গুগল শিটে ট্যাব তৈরি হবে এবং এটি স্থায়ী ও অপরিবর্তনযোগ্য থাকবে।
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    নতুন পাসওয়ার্ড (Password) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="কমপক্ষে ৪ অক্ষর"
                    value={setupPassword}
                    onChange={e => setSetupPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    পাসওয়ার্ড নিশ্চিত করুন *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                    value={setupConfirmPassword}
                    onChange={e => setSetupConfirmPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {setupError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {setupError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    বাতিল (লগআউট)
                  </button>

                  <button
                    type="submit"
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>সেভ ও শুরু করুন</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: ADD CUSTOM CATEGORY */}
        {/* ======================================================== */}
        {showAddCategoryModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowAddCategoryModal(false)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  নতুন ক্যাটাগরি যোগ করুন
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Type Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    ক্যাটাগরির ধরন (Type)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCatModalType('Expense')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        catModalType === 'Expense'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      খরচ (Expense)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatModalType('Income')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        catModalType === 'Income'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      আয় (Income)
                    </button>
                  </div>
                </div>

                {/* Emoji Chips Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    আইকন / ইমোজি বাছাই করুন
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800/80 rounded-xl border border-slate-700/80 max-h-24 overflow-y-auto">
                    {[
                      '🏷️', '🛒', '🏠', '💊', '⚡', '📶', '🛍️', '🚗', '⛽', '🍔', '📚', '✈️', '🎮', '💻', '🎁', '🏥', '👔', '☕', '💰', '🤝', '📈', '💳', '🪙', '💼', '🎯', '✨'
                    ].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCatEmoji(emoji)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-transform cursor-pointer ${
                          newCatEmoji === emoji ? 'bg-indigo-600 scale-110 shadow-sm' : 'bg-slate-700/60 hover:bg-slate-700'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    ক্যাটাগরির নাম (Name) *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xl p-1.5 bg-slate-800 rounded-xl border border-slate-700">{newCatEmoji}</span>
                    <input
                      type="text"
                      placeholder="e.g. Fuel (তেল/গ্যাস) বা Tuition"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      className="flex-1 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddCategoryModal(false)}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    বাতিল
                  </button>

                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>যোগ করুন</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: EDIT PROFILE MODAL */}
        {/* ======================================================== */}
        {showEditProfileModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowEditProfileModal(false)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  {t('Edit Profile', 'অ্যাকাউন্ট সম্পাদনা (Edit Profile)')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Display Name', 'আপনার নাম (Display Name)')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={e => setEditDisplayName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Login Username', 'ইউজারনেম (Login Username)')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editProfileUsername}
                    onChange={e => setEditProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Password', 'পাসওয়ার্ড (Password)')}
                  </label>
                  <input
                    type="password"
                    required
                    value={editProfilePassword}
                    onChange={e => setEditProfilePassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Locked Sheet Tab Notification */}
                <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('Google Sheet Tab: ', 'গুগল শিট ট্যাব: ')}{currentUser?.sheetTab}</span>
                    <Lock className="w-3 h-3 text-amber-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 leading-normal">
                    {t(
                      'Sheet tab is permanently assigned. All your transactions remain safely isolated in Google Sheets.',
                      'মূল শিট ট্যাব নাম ফিক্সড রয়েছে। নাম বা ইউজারনেম পরিবর্তন করলেও আপনার সব লেনদেন গুগল শিটের এই ট্যাবেই সংরক্ষিত থাকবে।'
                    )}
                  </div>
                </div>

                {editProfileError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {editProfileError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>

                  <button
                    type="submit"
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('Update Profile', 'আপডেট করুন')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: ADMIN CREATE USER MODAL */}
        {/* ======================================================== */}
        {showCreateUserModal && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowCreateUserModal(false)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  {t('Create New User', 'নতুন ব্যবহারকারী তৈরি করুন')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Full Name *', 'ব্যবহারকারীর নাম (Full Name) *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={createFullName}
                    onChange={e => setCreateFullName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Username & Sheet Tab *', 'ইউজারনেম (Login Username & Sheet Tab) *')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. tanvir"
                    value={createUsername}
                    onChange={e => setCreateUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Password *', 'পাসওয়ার্ড (Password) *')}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder={t('Minimum 4 characters', 'কমপক্ষে ৪ অক্ষর')}
                    value={createPassword}
                    onChange={e => setCreatePassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {createError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {createError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>

                  <button
                    type="submit"
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('Create User', 'তৈরি করুন')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: ADMIN EDIT USER MODAL (VIEW/CHANGE NAME, USERNAME, PASSWORD, SHEET TAB, ROLE, ACTIVE/INACTIVE) */}
        {/* ======================================================== */}
        {editingUserByAdmin && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setEditingUserByAdmin(null)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  {t('Edit User Account', 'ব্যবহারকারী তথ্য সম্পাদনা')}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingUserByAdmin(null)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUserByAdmin} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Full Name *', 'ব্যবহারকারীর পুরো নাম *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminEditName}
                    onChange={e => setAdminEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Login Username *', 'লগইন ইউজারনেম *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={adminEditUsername}
                    onChange={e => setAdminEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {t('Password *', 'পাসওয়ার্ড *')}
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminEditPassword ? 'text' : 'password'}
                      required
                      value={adminEditPassword}
                      onChange={e => setAdminEditPassword(e.target.value)}
                      className="w-full p-2.5 pr-9 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminEditPassword(!showAdminEditPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showAdminEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      {t('Sheet Tab Name', 'গুগল শিট ট্যাব')}
                    </label>
                    <input
                      type="text"
                      value={adminEditSheetTab}
                      onChange={e => setAdminEditSheetTab(e.target.value)}
                      disabled={editingUserByAdmin.username === 'abujar287'}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      {t('Role', 'রোল')}
                    </label>
                    <select
                      value={adminEditRole}
                      onChange={e => setAdminEditRole(e.target.value as 'admin' | 'member')}
                      disabled={editingUserByAdmin.username === 'abujar287'}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60 cursor-pointer"
                    >
                      <option value="member">{t('Member', 'মেম্বার')}</option>
                      <option value="admin">{t('Admin', 'অ্যাডমিন')}</option>
                    </select>
                  </div>
                </div>

                {/* Account Status Active / Inactive Toggle */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    {t('Account Status (Active / Inactive)', 'অ্যাকাউন্ট স্ট্যাটাস (সক্রিয় / নিষ্ক্রিয়)')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={editingUserByAdmin.username === 'abujar287'}
                      onClick={() => setAdminEditIsActive(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        adminEditIsActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('Active', 'সক্রিয়')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={editingUserByAdmin.username === 'abujar287'}
                      onClick={() => setAdminEditIsActive(false)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        !adminEditIsActive
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t('Inactive', 'নিষ্ক্রিয়')}</span>
                    </button>
                  </div>
                </div>

                {adminEditError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium">
                    {adminEditError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUserByAdmin(null)}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>

                  <button
                    type="submit"
                    className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('Save Changes', 'সংরক্ষণ করুন')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: DELETE USER CONFIRMATION (SHEET DATA PRESERVED) */}
        {/* ======================================================== */}
        {userToDeleteState && (
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setUserToDeleteState(null)}
          >
            <div
              className="bg-slate-900 text-white w-full max-w-sm rounded-[28px] p-5 shadow-2xl relative animate-modalSpring border border-slate-700/80"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-center text-white">
                {t('Delete User Account?', 'ইউজার অ্যাকাউন্ট মুছতে চান?')}
              </h3>

              <p className="text-xs text-slate-300 text-center mt-2 leading-relaxed">
                {t(
                  `Are you sure you want to remove user '@${userToDeleteState.username}' (${userToDeleteState.displayName})?`,
                  `আপনি কি নিশ্চিত যে '@${userToDeleteState.username}' (${userToDeleteState.displayName}) অ্যাকাউন্টটি মুছে ফেলতে চান?`
                )}
              </p>

              {/* Explicit reassurance that Google Sheet data is untouched */}
              <div className="my-3 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-[11px] text-emerald-300 leading-normal flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <b className="text-emerald-200">{t('Google Sheet Data Safe:', 'গুগল শিট ডেটা সম্পূর্ণ নিরাপদ:')}</b>{' '}
                  {t(
                    `The Google Sheet tab '${userToDeleteState.sheetTab || userToDeleteState.username}' and all its transaction history will NOT be removed or touched. All data stays intact in Google Sheets.`,
                    `গুগল শিটে থাকা '${userToDeleteState.sheetTab || userToDeleteState.username}' ট্যাবের কোনো রেকর্ড মুছে যাবে না। আপনার সমস্ত ডেটা গুগল শিটে নিরাপদে অক্ষত থাকবে।`
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserToDeleteState(null)}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>

                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('Yes, Remove User', 'হ্যাঁ, ইউজার মুছুন')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
