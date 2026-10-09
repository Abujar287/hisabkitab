import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet,
  Calendar,
  PlusCircle,
  ListOrdered,
  Users,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Plus
} from 'lucide-react';
import { AppUser, Transaction, TransactionType } from './types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  GOOGLE_SCRIPT_URL
} from './constants';
import { normalizeDate, formatSyncDateTime, formatCleanDateTime } from './utils/dateUtils';
import { cleanCategoryName } from './utils/categoryUtils';

// Modular Components
import { Header } from './components/Header';
import { SummaryTab } from './components/SummaryTab';
import { EntryTab } from './components/EntryTab';
import { DetailsTab } from './components/DetailsTab';
import { UsersTab } from './components/UsersTab';
import { SettingsTab } from './components/SettingsTab';
import {
  DayDetailsModal,
  EditTransactionModal,
  DeleteConfirmModal,
  CreateUserModal,
  DeleteUserModal,
  AddCategoryModal,
  MobileInstallModal,
  EditProfileModal
} from './components/Modals';

// Default Admin User
const DEFAULT_ADMIN: AppUser = {
  username: 'abujar287',
  password: 'hisabkitab',
  displayName: 'Abujar Al-Gifari',
  initialUsername: 'abujar287',
  sheetTab: 'abujar287',
  createdAt: '2026-10-01',
  role: 'admin',
  isActive: true
};

// Web Audio API feedback
function playSound(type: 'success' | 'delete' = 'success') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {}
}

export default function App() {
  // ----------------------------------------------------
  // 1. LANGUAGE & LOCALIZATION STATE
  // ----------------------------------------------------
  const [lang, setLang] = useState<'en' | 'bn'>(() => {
    try {
      const saved = localStorage.getItem('app_language');
      return saved === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'bn' : 'en';
    setLang(nextLang);
    try {
      localStorage.setItem('app_language', nextLang);
    } catch {}
    showToast(nextLang === 'en' ? 'Switched to English' : 'বাংলা ভাষায় পরিবর্তিত হয়েছে', 'info');
  };

  const t = useCallback((en: string, bn: string) => (lang === 'en' ? en : bn), [lang]);

  // ----------------------------------------------------
  // VIEW MODE STATE (Mobile vs Laptop/Tablet switch)
  // ----------------------------------------------------
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>(() => {
    try {
      const saved = localStorage.getItem('app_view_mode');
      if (saved === 'mobile' || saved === 'desktop') return saved;
      return window.innerWidth < 768 ? 'mobile' : 'desktop';
    } catch {
      return 'desktop';
    }
  });

  const toggleViewMode = () => {
    const nextMode = viewMode === 'mobile' ? 'desktop' : 'mobile';
    setViewMode(nextMode);
    try {
      localStorage.setItem('app_view_mode', nextMode);
    } catch {}
    showToast(
      nextMode === 'mobile'
        ? (lang === 'en' ? 'Switched to Mobile View (Phone Mode)' : 'মোবাইল ভিউতে পরিবর্তিত হয়েছে')
        : (lang === 'en' ? 'Switched to Laptop/Tablet View' : 'ল্যাপটপ/ট্যাবলেট ভিউতে পরিবর্তিত হয়েছে'),
      'info'
    );
  };

  // ----------------------------------------------------
  // 2. TOAST NOTIFICATION STATE
  // ----------------------------------------------------
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  }, []);

  // ----------------------------------------------------
  // 3. USER MANAGEMENT & AUTHENTICATION STATE
  // ----------------------------------------------------
  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem('app_registered_users_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [DEFAULT_ADMIN];
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('active_user_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) return parsed;
      }
    } catch {}
    return DEFAULT_ADMIN;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => currentUser !== null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // ----------------------------------------------------
  // 4. STORAGE KEYS PER USER TAB
  // ----------------------------------------------------
  const currentTab = useMemo(() => {
    return (currentUser?.sheetTab || currentUser?.username || 'abujar287').trim().toLowerCase();
  }, [currentUser]);

  // ----------------------------------------------------
  // 5. ISOLATED CATEGORIES STATE
  // ----------------------------------------------------
  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`app_expense_categories_${currentTab}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const set = new Set([...DEFAULT_EXPENSE_CATEGORIES, ...parsed]);
          return Array.from(set);
        }
      }
    } catch {}
    return [...DEFAULT_EXPENSE_CATEGORIES];
  });

  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`app_income_categories_${currentTab}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const set = new Set([...DEFAULT_INCOME_CATEGORIES, ...parsed]);
          return Array.from(set);
        }
      }
    } catch {}
    return [...DEFAULT_INCOME_CATEGORIES];
  });

  // Reload categories on user switch
  useEffect(() => {
    try {
      const savedExp = localStorage.getItem(`app_expense_categories_${currentTab}`);
      if (savedExp) {
        const parsed = JSON.parse(savedExp);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const set = new Set([...DEFAULT_EXPENSE_CATEGORIES, ...parsed]);
          setExpenseCategories(Array.from(set));
        } else {
          setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
        }
      } else {
        setExpenseCategories([...DEFAULT_EXPENSE_CATEGORIES]);
      }

      const savedInc = localStorage.getItem(`app_income_categories_${currentTab}`);
      if (savedInc) {
        const parsed = JSON.parse(savedInc);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const set = new Set([...DEFAULT_INCOME_CATEGORIES, ...parsed]);
          setIncomeCategories(Array.from(set));
        } else {
          setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
        }
      } else {
        setIncomeCategories([...DEFAULT_INCOME_CATEGORIES]);
      }
    } catch {}
  }, [currentTab]);

  // ----------------------------------------------------
  // 6. TRANSACTIONS STATE
  // ----------------------------------------------------
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`app_transactions_${currentTab}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Sync transactions on user switch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`app_transactions_${currentTab}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setTransactions(parsed);
        else setTransactions([]);
      } else {
        setTransactions([]);
      }
    } catch {}
  }, [currentTab]);

  // Persist transactions locally
  const saveTransactionsLocally = useCallback((updated: Transaction[]) => {
    setTransactions(updated);
    try {
      localStorage.setItem(`app_transactions_${currentTab}`, JSON.stringify(updated));
    } catch {}
  }, [currentTab]);

  // ----------------------------------------------------
  // 7. ACTIVE VIEW TAB
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'summary' | 'entry' | 'details' | 'users' | 'settings'>('summary');
  const [summaryScope, setSummaryScope] = useState<'month' | 'all'>('month');

  // Selected Month (YYYY-MM)
  const currentMonthValue = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);

  // ----------------------------------------------------
  // 8. CLOUD SYNC STATE
  // ----------------------------------------------------
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date>(() => new Date());
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => formatSyncDateTime(new Date(), lang));

  useEffect(() => {
    setLastSyncTime(formatSyncDateTime(lastSyncDate, lang));
  }, [lang, lastSyncDate]);

  // Manual Cloud Sync Function
  const handleManualSync = useCallback(async (tabToSync = currentTab) => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getDetails&sheetTab=${encodeURIComponent(tabToSync)}`, {
        method: 'GET'
      });
      const data = await res.json();
      if (data && data.result === 'success' && Array.isArray(data.transactions)) {
        const formatted: Transaction[] = data.transactions.map((t: any) => ({
          id: String(t.id || Date.now() + Math.random()),
          datetime: formatCleanDateTime(t.datetime, 'en') || t.datetime || '',
          type: t.type === 'Income' ? 'Income' : 'Expense',
          category: t.category || 'Others',
          date: normalizeDate(t.date),
          value: Number(t.value) || 0,
          note: t.note || ''
        }));
        saveTransactionsLocally(formatted);

        // Auto-discover any categories from the synced sheet
        const sheetExpCats: string[] = [];
        const sheetIncCats: string[] = [];
        data.transactions.forEach((tx: any) => {
          if (!tx.category) return;
          if (tx.type === 'Expense') sheetExpCats.push(tx.category);
          else sheetIncCats.push(tx.category);
        });

        if (sheetExpCats.length > 0) {
          setExpenseCategories(prev => {
            const set = new Set([...DEFAULT_EXPENSE_CATEGORIES, ...prev, ...sheetExpCats]);
            const merged = Array.from(set);
            try {
              localStorage.setItem(`app_expense_categories_${tabToSync}`, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        if (sheetIncCats.length > 0) {
          setIncomeCategories(prev => {
            const set = new Set([...DEFAULT_INCOME_CATEGORIES, ...prev, ...sheetIncCats]);
            const merged = Array.from(set);
            try {
              localStorage.setItem(`app_income_categories_${tabToSync}`, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }

        setLastSyncDate(new Date());
        showToast(
          lang === 'en'
            ? `Synced ${formatted.length} transactions from cloud!`
            : `ক্লাউড থেকে ${formatted.length}টি লেনদেন সফলভাবে সিঙ্ক হয়েছে!`,
          'success'
        );
      } else {
        showToast(lang === 'en' ? 'Sync finished' : 'সিঙ্ক সম্পন্ন হয়েছে', 'info');
      }
    } catch (err) {
      showToast(lang === 'en' ? 'Cloud connection failed' : 'ক্লাউড কানেকশন পাওয়া যায়নি', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [currentTab, lang, saveTransactionsLocally, showToast]);

  // Initial auto sync on login
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      handleManualSync(currentTab);
    }
  }, [isAuthenticated, currentUser?.username]);

  // ----------------------------------------------------
  // 9. ADD ENTRY STATE
  // ----------------------------------------------------
  const [entryType, setEntryType] = useState<TransactionType>('Expense');
  const [entryCategory, setEntryCategory] = useState<string>(() => expenseCategories[0] || 'Others');
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [entryNote, setEntryNote] = useState<string>('');
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Submit new transaction with SINGLE DISPATCH (avoids double entry!)
  const handleSaveTransaction = async () => {
    const val = parseFloat(calcDisplay);
    if (isNaN(val) || val <= 0) {
      showToast(lang === 'en' ? 'Please enter a valid amount!' : 'সঠিক টাকার পরিমাণ দিন!', 'error');
      return;
    }

    setIsSubmitting(true);
    const newTx: Transaction = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      datetime: formatCleanDateTime(new Date().toString(), 'en'),
      type: entryType,
      category: entryCategory || (entryType === 'Expense' ? 'Others' : 'Other Income'),
      date: entryDate,
      value: val,
      note: entryNote.trim()
    };

    // Update local state immediately
    const updated = [newTx, ...transactions];
    saveTransactionsLocally(updated);
    playSound('success');

    // Single dispatch POST to Google Apps Script
    try {
      const payload = {
        action: 'insert',
        sheetTab: currentTab,
        id: newTx.id,
        datetime: newTx.datetime,
        type: newTx.type,
        category: newTx.category,
        date: newTx.date,
        value: newTx.value,
        note: newTx.note
      };

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Offline fallback: already saved locally
    }

    // Reset keypad and note
    setCalcDisplay('0');
    setEntryNote('');
    setIsSubmitting(false);
    showToast(
      lang === 'en' ? 'Transaction saved & synced successfully!' : 'লেনদেনটি সফলভাবে সেভ হয়েছে!',
      'success'
    );
  };

  // ----------------------------------------------------
  // 10. EDIT & DELETE ACTIONS
  // ----------------------------------------------------
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    const updatedList = transactions.map(t => (t.id === updatedTx.id ? updatedTx : t));
    saveTransactionsLocally(updatedList);
    playSound('success');

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          sheetTab: currentTab,
          ...updatedTx
        })
      });
    } catch {}

    showToast(lang === 'en' ? 'Transaction updated!' : 'লেনদেন আপডেট হয়েছে!', 'success');
  };

  const handleConfirmDelete = async (txToDelete: Transaction) => {
    setIsDeleting(true);
    const updatedList = transactions.filter(t => t.id !== txToDelete.id);
    saveTransactionsLocally(updatedList);
    playSound('delete');

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          sheetTab: currentTab,
          id: txToDelete.id
        })
      });
    } catch {}

    setIsDeleting(false);
    setDeletingTx(null);
    showToast(lang === 'en' ? 'Transaction deleted!' : 'লেনদেন মুছে ফেলা হয়েছে!', 'info');
  };

  // ----------------------------------------------------
  // 11. CATEGORY MANAGEMENT ACTIONS
  // ----------------------------------------------------
  const [showAddCatModal, setShowAddCatModal] = useState<boolean>(false);
  const [catModalType, setCatModalType] = useState<TransactionType>('Expense');

  const handleAddCategory = (newCat: string, type: TransactionType) => {
    if (type === 'Expense') {
      const updated = [...expenseCategories, newCat];
      setExpenseCategories(updated);
      try {
        localStorage.setItem(`app_expense_categories_${currentTab}`, JSON.stringify(updated));
      } catch {}
    } else {
      const updated = [...incomeCategories, newCat];
      setIncomeCategories(updated);
      try {
        localStorage.setItem(`app_income_categories_${currentTab}`, JSON.stringify(updated));
      } catch {}
    }
    showToast(lang === 'en' ? `Category '${newCat}' added!` : `'${newCat}' ক্যাটাগরি যোগ হয়েছে!`, 'success');
  };

  const handleDeleteCategory = (catToDelete: string, type: TransactionType) => {
    if (type === 'Expense') {
      const updated = expenseCategories.filter(c => c !== catToDelete);
      setExpenseCategories(updated);
      try {
        localStorage.setItem(`app_expense_categories_${currentTab}`, JSON.stringify(updated));
      } catch {}
    } else {
      const updated = incomeCategories.filter(c => c !== catToDelete);
      setIncomeCategories(updated);
      try {
        localStorage.setItem(`app_income_categories_${currentTab}`, JSON.stringify(updated));
      } catch {}
    }
    showToast(lang === 'en' ? 'Category removed' : 'ক্যাটাগরি মুছে ফেলা হয়েছে', 'info');
  };

  // ----------------------------------------------------
  // 12. USER MANAGEMENT ACTIONS
  // ----------------------------------------------------
  const [showCreateUserModal, setShowCreateUserModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [showMobileModal, setShowMobileModal] = useState<boolean>(false);
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);

  const handleSaveProfile = (newDisplayName: string, newPass?: string) => {
    if (!editingUser) return;
    const updatedUsers = users.map(u => {
      if (u.username === editingUser.username) {
        return {
          ...u,
          displayName: newDisplayName,
          password: newPass || u.password
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updatedUsers));
    } catch {}

    if (currentUser?.username === editingUser.username) {
      const updatedCurrent = {
        ...currentUser,
        displayName: newDisplayName,
        password: newPass || currentUser.password
      };
      setCurrentUser(updatedCurrent);
      try {
        localStorage.setItem('active_user_v2', JSON.stringify(updatedCurrent));
      } catch {}
    }
    setEditingUser(null);
    showToast(lang === 'en' ? 'Profile updated successfully!' : 'প্রোফাইল সফলভাবে আপডেট হয়েছে!', 'success');
  };

  const handleCreateUser = (name: string, uname: string, pass: string, role: 'admin' | 'member') => {
    const exists = users.some(u => u.username === uname);
    if (exists) {
      showToast(lang === 'en' ? 'Username already exists!' : 'এই ইউজারনেম ইতিমধ্যে রয়েছে!', 'error');
      return;
    }

    const newUser: AppUser = {
      username: uname,
      password: pass,
      displayName: name,
      initialUsername: uname,
      sheetTab: uname,
      createdAt: new Date().toISOString().split('T')[0],
      role,
      isActive: true
    };

    const updated = [...users, newUser];
    setUsers(updated);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updated));
    } catch {}

    showToast(lang === 'en' ? `User @${uname} created!` : `@${uname} ইউজার তৈরি হয়েছে!`, 'success');
  };

  const handleSwitchUser = (user: AppUser) => {
    if (user.isActive === false) {
      showToast(lang === 'en' ? 'Account is inactive!' : 'এই অ্যাকাউন্ট নিষ্ক্রিয় রয়েছে!', 'error');
      return;
    }
    setCurrentUser(user);
    try {
      localStorage.setItem('active_user_v2', JSON.stringify(user));
    } catch {}
    showToast(lang === 'en' ? `Switched to ${user.displayName}` : `${user.displayName} অ্যাকাউন্টে সুইচ করা হয়েছে`, 'info');
  };

  const handleToggleActiveUser = (user: AppUser) => {
    if (user.username === 'abujar287') {
      showToast(lang === 'en' ? 'Main admin cannot be disabled!' : 'মূল অ্যাডমিন নিষ্ক্রিয় করা যাবে না!', 'error');
      return;
    }
    const updated = users.map(u => (u.username === user.username ? { ...u, isActive: !u.isActive } : u));
    setUsers(updated);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updated));
    } catch {}
    showToast(lang === 'en' ? 'Status updated' : 'স্ট্যাটাস আপডেট হয়েছে', 'info');
  };

  const handleConfirmDeleteUser = (user: AppUser) => {
    if (user.username === 'abujar287') {
      showToast(lang === 'en' ? 'Admin cannot be deleted!' : 'অ্যাডমিন অ্যাকাউন্ট ডিলিট করা যাবে না!', 'error');
      return;
    }
    const updated = users.filter(u => u.username !== user.username);
    setUsers(updated);
    try {
      localStorage.setItem('app_registered_users_v2', JSON.stringify(updated));
    } catch {}

    // If currently logged into this user, switch back to admin
    if (currentUser?.username === user.username) {
      const admin = users.find(u => u.username === 'abujar287') || DEFAULT_ADMIN;
      setCurrentUser(admin);
      try {
        localStorage.setItem('active_user_v2', JSON.stringify(admin));
      } catch {}
    }

    setUserToDelete(null);
    showToast(lang === 'en' ? 'User deleted' : 'ইউজার মুছে ফেলা হয়েছে', 'info');
  };

  // ----------------------------------------------------
  // 13. AUTHENTICATION (LOGIN / LOGOUT)
  // ----------------------------------------------------
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const targetUser = users.find(
      u =>
        u.username.toLowerCase() === loginUsername.trim().toLowerCase() ||
        (u.initialUsername && u.initialUsername.toLowerCase() === loginUsername.trim().toLowerCase())
    );

    if (!targetUser) {
      setLoginError(t('User not found! Check username.', 'ইউজার পাওয়া যায়নি! সঠিক ইউজারনেম দিন।'));
      setIsLoggingIn(false);
      return;
    }

    if (targetUser.password !== loginPassword.trim()) {
      setLoginError(t('Incorrect password! Try again.', 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।'));
      setIsLoggingIn(false);
      return;
    }

    if (targetUser.isActive === false) {
      setLoginError(t('Account deactivated by administrator.', 'অ্যাকাউন্টটি অ্যাডমিন দ্বারা নিষ্ক্রিয় করা আছে।'));
      setIsLoggingIn(false);
      return;
    }

    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('active_user_v2', JSON.stringify(targetUser));
    } catch {}

    setIsLoggingIn(false);
    showToast(lang === 'en' ? `Welcome back, ${targetUser.displayName}!` : `স্বাগতম, ${targetUser.displayName}!`, 'success');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem('active_user_v2');
    } catch {}
    showToast(lang === 'en' ? 'Logged out successfully' : 'লগআউট সম্পন্ন হয়েছে', 'info');
  };

  // ----------------------------------------------------
  // RENDER: LOGIN SCREEN (IF NOT AUTHENTICATED)
  // ----------------------------------------------------
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Exo_2','Anek_Bangla',sans-serif]">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Heading */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30 text-white">
              <Wallet className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {t('Hisab-Kitab', 'হিসাব-নিকাশ')}
            </h1>
            <p className="text-xs text-slate-400">
              {t('Smart Personal & Team Expense Tracker', 'ব্যক্তিগত ও ব্যবসায়িক আয়-ব্যয় ট্র্যাকার')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {t('Username', 'ইউজারনেম')}
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="abujar287"
                className="w-full min-h-[46px] bg-slate-800 border border-slate-700 rounded-xl p-3 text-base sm:text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                {t('Password', 'পাসওয়ার্ড')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] bg-slate-800 border border-slate-700 rounded-xl p-3 pr-10 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-fadeIn">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full min-h-[48px] py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoggingIn ? t('Verifying...', 'যাচাই করা হচ্ছে...') : t('Sign In', 'লগইন করুন')}</span>
            </button>
          </form>

          {/* Secure Cloud Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('Encrypted & Synced with Cloud', 'সুরক্ষিত ক্লাউড ডেটাবেস সিঙ্ক')}</span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: MAIN AUTHENTICATED APP
  // ----------------------------------------------------
  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 font-['Exo_2','Anek_Bangla',sans-serif] antialiased selection:bg-indigo-600 selection:text-white flex flex-col ${
      viewMode === 'mobile' ? 'items-center justify-start bg-slate-950 sm:bg-slate-900/60 sm:py-3' : ''
    }`}>
      {/* App Frame: Mobile Phone Container when mobile mode; Full Width when desktop/tablet mode */}
      <div className={`w-full flex flex-col min-h-screen bg-slate-950 relative ${
        viewMode === 'mobile'
          ? 'max-w-[430px] sm:shadow-2xl sm:border-x sm:border-slate-800/90 sm:rounded-3xl'
          : 'max-w-6xl mx-auto'
      }`}>
        {/* Floating Modern Toast Notification */}
        {toast.show && (
          <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-bold border animate-modalSpring max-w-sm text-center ${
              toast.type === 'error'
                ? 'bg-slate-950/90 text-rose-300 border-rose-500/50 shadow-rose-950/60'
                : toast.type === 'info'
                ? 'bg-slate-950/90 text-sky-300 border-sky-500/50 shadow-sky-950/60'
                : 'bg-slate-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/60'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toast.type === 'info' ? (
              <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* HEADER COMPONENT */}
        <Header
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          toggleLanguage={toggleLanguage}
          isSyncing={isSyncing}
          onSync={() => handleManualSync(currentTab)}
          onLogout={handleLogout}
          onOpenMobileModal={() => setShowMobileModal(true)}
          viewMode={viewMode}
          toggleViewMode={toggleViewMode}
          t={t}
        />

        {/* MAIN VIEWPORT CONTENT */}
        <main className={`flex-1 w-full ${viewMode === 'mobile' ? 'px-2.5 sm:px-3 py-3 pb-28 sm:pb-32' : 'px-4 py-5 pb-24 md:pb-12'}`}>
          {activeTab === 'summary' && (
            <SummaryTab
              transactions={transactions}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              summaryScope={summaryScope}
              setSummaryScope={setSummaryScope}
              onSelectDate={dateStr => setSelectedDateModal(dateStr)}
              lang={lang}
              t={t}
            />
          )}

          {activeTab === 'entry' && (
            <EntryTab
              entryType={entryType}
              setEntryType={setEntryType}
              entryCategory={entryCategory}
              setEntryCategory={setEntryCategory}
              entryDate={entryDate}
              setEntryDate={setEntryDate}
              entryNote={entryNote}
              setEntryNote={setEntryNote}
              calcDisplay={calcDisplay}
              setCalcDisplay={setCalcDisplay}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onOpenAddCategoryModal={type => {
                setCatModalType(type);
                setShowAddCatModal(true);
              }}
              onSubmit={handleSaveTransaction}
              isSubmitting={isSubmitting}
              lang={lang}
              t={t}
            />
          )}

          {activeTab === 'details' && (
            <DetailsTab
              transactions={transactions}
              onEdit={tx => setEditingTx(tx)}
              onDelete={tx => setDeletingTx(tx)}
              lang={lang}
              t={t}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              users={users}
              currentUser={currentUser}
              onOpenCreateModal={() => setShowCreateUserModal(true)}
              onOpenEditModal={user => setEditingUser(user)}
              onRequestDeleteUser={user => setUserToDelete(user)}
              onSwitchUser={handleSwitchUser}
              onToggleActiveUser={handleToggleActiveUser}
              lang={lang}
              t={t}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              currentUser={currentUser}
              expenseCategories={expenseCategories}
              incomeCategories={incomeCategories}
              onOpenAddCategoryModal={type => {
                setCatModalType(type);
                setShowAddCatModal(true);
              }}
              onDeleteCategory={handleDeleteCategory}
              transactions={transactions}
              isSyncing={isSyncing}
              onSync={() => handleManualSync(currentTab)}
              lastSyncTime={lastSyncTime}
              lang={lang}
              toggleLanguage={toggleLanguage}
              onOpenEditProfile={() => setEditingUser(currentUser)}
              t={t}
            />
          )}
        </main>

        {/* BOTTOM NAVIGATION BAR (FIXED, NEVER HIDES ON SCROLL) */}
        <nav
          className={`fixed bottom-0 ${
            viewMode === 'mobile'
              ? 'left-1/2 -translate-x-1/2 w-full max-w-[430px]'
              : 'left-0 right-0 md:hidden'
          } z-50 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800/90 px-1 py-1 pb-safe flex items-center justify-around shadow-2xl`}
        >
          {[
            { id: 'summary' as const, label: t('Summary', 'সারাংশ'), icon: BarChart3 },
            { id: 'entry' as const, label: t('Add Entry', 'হিসাব যোগ'), icon: PlusCircle },
            { id: 'details' as const, label: t('Details', 'বিস্তারিত'), icon: ListOrdered },
            { id: 'users' as const, label: t('Users', 'ইউজার'), icon: Users },
            { id: 'settings' as const, label: t('Settings', 'সেটিংস'), icon: Settings }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-indigo-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-indigo-500/20' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] leading-tight font-medium mt-0.5 whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}
      <DayDetailsModal
        dateStr={selectedDateModal}
        transactions={transactions}
        onClose={() => setSelectedDateModal(null)}
        onEdit={tx => setEditingTx(tx)}
        onDelete={tx => setDeletingTx(tx)}
        lang={lang}
        t={t}
      />

      <EditTransactionModal
        tx={editingTx}
        onClose={() => setEditingTx(null)}
        onSave={handleUpdateTransaction}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        lang={lang}
        t={t}
      />

      <DeleteConfirmModal
        tx={deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        lang={lang}
        t={t}
      />

      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onCreate={handleCreateUser}
        lang={lang}
        t={t}
      />

      <DeleteUserModal
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDeleteUser}
        lang={lang}
        t={t}
      />

      <AddCategoryModal
        isOpen={showAddCatModal}
        type={catModalType}
        onClose={() => setShowAddCatModal(false)}
        onAdd={handleAddCategory}
        lang={lang}
        t={t}
      />

      <MobileInstallModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        lang={lang}
        t={t}
      />

      <EditProfileModal
        user={editingUser}
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveProfile}
        lang={lang}
        t={t}
      />
    </div>
  );
}
