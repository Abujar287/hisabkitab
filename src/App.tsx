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
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Smartphone,
  ExternalLink,
  Info
} from 'lucide-react';
import { Transaction, TransactionType } from './types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  INITIAL_TRANSACTIONS,
  GOOGLE_SCRIPT_URL
} from './constants';
import { usePWAInstall } from './usePWAInstall';

export default function App() {
  // ----------------------------------------------------
  // AUTHENTICATION STATE (Username & Password)
  // Required: username = abujar287, pass = hisabkitab
  // ----------------------------------------------------
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('auth_user_abujar') === 'true';
    } catch {
      return false;
    }
  });

  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
      // Validate credentials
      if (loginUsername.trim() === 'abujar287' && loginPassword === 'hisabkitab') {
        setIsAuthenticated(true);
        try {
          localStorage.setItem('auth_user_abujar', 'true');
        } catch {}
        setLoginError('');
      } else {
        setLoginError('ভুল ইউজারনেম বা পাসওয়ার্ড! দয়া করে সঠিক তথ্য দিন (Invalid username or password).');
      }
      setIsLoggingIn(false);
    }, 350);
  };

  const handleLogout = () => {
    if (window.confirm('আপনি কি লগআউট করতে চান? (Do you want to log out?)')) {
      setIsAuthenticated(false);
      try {
        localStorage.removeItem('auth_user_abujar');
      } catch {}
      setLoginUsername('');
      setLoginPassword('');
    }
  };

  // PWA Install Hook
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAPKGuideModal, setShowAPKGuideModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);

  // ----------------------------------------------------
  // APP NAVIGATION & TRANSACTIONS STATE
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'budget' | 'entry' | 'profile'>('summary');

  // Persistent Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('app_transactions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load transactions from localStorage', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_transactions_v2', JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [transactions]);

  // Initial silent fetch from Google Apps Script to merge remote data
  useEffect(() => {
    const fetchRemote = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${GOOGLE_SCRIPT_URL}?action=getDetails`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data && data.result === 'success' && Array.isArray(data.transactions) && data.transactions.length > 0) {
          const remoteList: Transaction[] = data.transactions.map((item: any, idx: number) => ({
            id: String(item.id || `remote-${idx}-${item.date || ''}`),
            datetime: item.datetime || new Date().toLocaleString(),
            type: item.type === 'Income' ? 'Income' : 'Expense',
            category: item.category || '🏷️ Others (অন্যান্য)',
            date: item.date || new Date().toISOString().split('T')[0],
            value: Number(item.value) || 0,
            note: item.note || ''
          }));

          setTransactions(prev => {
            const localMap = new Map(prev.map(t => [t.id, t]));
            remoteList.forEach(r => {
              if (!localMap.has(r.id)) {
                localMap.set(r.id, r);
              }
            });
            return Array.from(localMap.values());
          });
        }
      } catch {
        // Fallback to local offline state
      }
    };
    fetchRemote();
  }, []);

  // ----------------------------------------------------
  // ENTRY TAB STATE
  // ----------------------------------------------------
  const [entryType, setEntryType] = useState<TransactionType>('Expense');
  const [entryCategory, setEntryCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [entryNote, setEntryNote] = useState<string>('');
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [entryMessage, setEntryMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleTypeChange = (newType: TransactionType) => {
    setEntryType(newType);
    if (newType === 'Income') {
      setEntryCategory(INCOME_CATEGORIES[0]);
    } else {
      setEntryCategory(EXPENSE_CATEGORIES[0]);
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
        text: 'Please enter a valid amount and details! (সঠিক টাকার পরিমাণ দিন)',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    setEntryMessage({ text: 'Saving... (সংরক্ষণ করা হচ্ছে...)', type: '' });

    const newId = `ID-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTx: Transaction = {
      id: newId,
      datetime: new Date().toLocaleString(),
      type: entryType,
      category: entryCategory,
      date: entryDate,
      value: amount,
      note: entryNote.trim()
    };

    setTransactions(prev => [newTx, ...prev]);

    setEntryMessage({
      text: 'Saved successfully! (সফলভাবে সংরক্ষিত হয়েছে)',
      type: 'success'
    });
    setCalcDisplay('0');
    setEntryNote('');
    setIsSubmitting(false);

    try {
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(newTx)
      }).catch(e => console.log('Background sync note:', e));
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
      const cats = newType === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
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
        text: 'Please provide valid date and amount! (সঠিক তথ্য দিন)',
        type: 'error'
      });
      return;
    }

    const updatedItem: Transaction = {
      ...editingTx,
      date: editForm.date,
      type: editForm.type,
      category: editForm.category,
      value: valNum,
      note: editForm.note.trim()
    };

    setTransactions(prev => prev.map(t => (t.id === editingTx.id ? updatedItem : t)));

    setEditMessage({
      text: 'Updated successfully! (সফলভাবে আপডেট হয়েছে)',
      type: 'success'
    });

    try {
      fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'update',
          ...updatedItem
        })
      }).catch(e => console.log('Background update note:', e));
    } catch {}

    setTimeout(() => {
      closeEditModal();
    }, 600);
  };

  const handleDeleteTransaction = (txId: string) => {
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই লেনদেনটি মুছে ফেলতে চান? এটি গুগল শিট থেকেও রিমুভ হয়ে যাবে। (Are you sure you want to delete this transaction?)')) {
      const target = transactions.find(t => String(t.id) === String(txId));
      setTransactions(prev => prev.filter(t => t.id !== txId));
      closeEditModal();
      try {
        fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'delete',
            id: txId,
            date: target?.date,
            category: target?.category,
            value: target?.value,
            type: target?.type,
            note: target?.note
          })
        }).catch(e => console.log('Background delete note:', e));
      } catch {}
    }
  };

  // ----------------------------------------------------
  // MONTH & SUMMARY CALCULATIONS
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

  // Filter Presets
  const [filterPreset, setFilterPreset] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const handleFilterPresetChange = (preset: string) => {
    setFilterPreset(preset);
    const now = new Date();
    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    if (preset === 'today') {
      const s = formatDate(now);
      setStartDate(s);
      setEndDate(s);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(now.getDate() - 1);
      const s = formatDate(yest);
      setStartDate(s);
      setEndDate(s);
    } else if (preset === 'last7') {
      const s = new Date(now);
      s.setDate(now.getDate() - 6);
      setStartDate(formatDate(s));
      setEndDate(formatDate(now));
    } else if (preset === 'last30') {
      const s = new Date(now);
      s.setDate(now.getDate() - 29);
      setStartDate(formatDate(s));
      setEndDate(formatDate(now));
    } else if (preset === 'thisMonth') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatDate(s));
      setEndDate(formatDate(e));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const clearFilter = () => {
    setFilterPreset('');
    setStartDate('');
    setEndDate('');
  };

  // Monthly stats
  const monthTotals = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let exp = 0;
    let inc = 0;
    const dailyMap: Record<number, { exp: number; inc: number }> = {};

    transactions.forEach(t => {
      if (!t.date) return;
      const [ty, tm, td] = t.date.split('-').map(Number);
      if (ty === y && tm === m) {
        if (t.type === 'Expense') {
          exp += t.value;
          if (!dailyMap[td]) dailyMap[td] = { exp: 0, inc: 0 };
          dailyMap[td].exp += t.value;
        } else {
          inc += t.value;
          if (!dailyMap[td]) dailyMap[td] = { exp: 0, inc: 0 };
          dailyMap[td].inc += t.value;
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

  // Filtered dataset
  const filteredData = useMemo(() => {
    const useMonthFallback = !startDate && !endDate;
    const [targetY, targetM] = selectedMonth.split('-').map(Number);

    let fExp = 0;
    let fInc = 0;
    const catMap: Record<string, number> = {};
    const catCountMap: Record<string, number> = {};
    const matchedList: Transaction[] = [];

    transactions.forEach(t => {
      if (!t.date) return;
      const [ty, tm] = t.date.split('-').map(Number);

      let inRange = false;
      if (useMonthFallback) {
        inRange = ty === targetY && tm === targetM;
      } else {
        let valid = true;
        if (startDate && t.date < startDate) valid = false;
        if (endDate && t.date > endDate) valid = false;
        inRange = valid;
      }

      if (inRange) {
        matchedList.push(t);
        if (t.type === 'Expense') {
          fExp += t.value;
          catMap[t.category] = (catMap[t.category] || 0) + t.value;
          catCountMap[t.category] = (catCountMap[t.category] || 0) + 1;
        } else {
          fInc += t.value;
        }
      }
    });

    const sortedCats = Object.keys(catMap)
      .map(name => ({ name, val: catMap[name], count: catCountMap[name] || 0 }))
      .sort((a, b) => b.val - a.val);

    return { fExp, fInc, fBal: fInc - fExp, sortedCats, matchedList };
  }, [transactions, startDate, endDate, selectedMonth]);

  // Top 5 Donut Chart
  const donutColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
  const top5Categories = filteredData.sortedCats.slice(0, 5);

  const donutSegments = useMemo(() => {
    if (filteredData.fExp === 0 || top5Categories.length === 0) return [];
    let cumulative = 0;
    return top5Categories.map((item, idx) => {
      const percent = (item.val / filteredData.fExp) * 100;
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
  }, [filteredData.fExp, top5Categories]);

  // Modals for day and category details
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);
  const [selectedCatModal, setSelectedCatModal] = useState<string | null>(null);

  const dateModalTransactions = useMemo(() => {
    if (!selectedDateModal) return [];
    return transactions.filter(t => t.date === selectedDateModal);
  }, [transactions, selectedDateModal]);

  const catModalTransactions = useMemo(() => {
    if (!selectedCatModal) return [];
    return filteredData.matchedList.filter(t => t.type === 'Expense' && t.category === selectedCatModal);
  }, [filteredData.matchedList, selectedCatModal]);

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
      if (!map[t.date]) {
        map[t.date] = { exp: 0, inc: 0, items: [] };
      }
      if (t.type === 'Expense') {
        map[t.date].exp += t.value;
      } else {
        map[t.date].inc += t.value;
      }
      map[t.date].items.push(t);
    });

    const sortedDates = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return { sortedDates, map, totalItems: list.length };
  }, [transactions, searchQuery, detailFilterType]);

  // Budget state
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('app_budgets_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      '🏠 Room Rent (রুম ভাড়া)': 15000,
      '🛒 Bajar (বাজার)': 8000,
      '⚡ Electricity (বিদ্যুৎ)': 2000,
      '🍲 Food (খাবার)': 3000
    };
  });

  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});

  const handleSaveBudget = (cat: string) => {
    const val = parseFloat(budgetInputs[cat] || '');
    if (isNaN(val) || val < 0) return;
    const next = { ...budgets, [cat]: val };
    setBudgets(next);
    localStorage.setItem('app_budgets_v2', JSON.stringify(next));
  };

  const categorySpentInMonth = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const map: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'Expense' && t.date) {
        const [ty, tm] = t.date.split('-').map(Number);
        if (ty === y && tm === m) {
          map[t.category] = (map[t.category] || 0) + t.value;
        }
      }
    });
    return map;
  }, [transactions, selectedMonth]);

  const totalMonthlyBudget = useMemo(() => {
    return Object.values(budgets).reduce((sum, v) => sum + (v || 0), 0);
  }, [budgets]);

  const monthName = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const quickCategories = entryType === 'Expense'
    ? EXPENSE_CATEGORIES.slice(0, 8)
    : INCOME_CATEGORIES.slice(0, 6);

  // ========================================================
  // RENDER: LOGIN SCREEN IF NOT AUTHENTICATED
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-['Exo_2','Anek_Bangla',sans-serif]">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-scaleUp">
          {/* Subtle background glow */}
          <div className="absolute -right-12 -top-12 w-44 h-44 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-44 h-44 bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white mx-auto mb-3">
              <Wallet className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">হিসাব-নিকাশ</h1>
            <p className="text-xs text-indigo-300 font-medium mt-0.5">Expense & Income Tracker Pro</p>
            <p className="text-[11px] text-slate-400 mt-2">লগইন করতে ইউজারনেম ও পাসওয়ার্ড দিন</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ইউজারনেম (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
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
                পাসওয়ার্ড (Password)
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
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium animate-fadeIn">
                {loginError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              {isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন (Log In)'}
            </button>
          </form>

          {/* Footer Notice */}
          <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400">
              Protected Personal Financial Account
            </div>
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
      {/* Mobile-centric, ultra-clean container */}
      <div className="w-full max-w-[480px] bg-slate-50 min-h-screen shadow-2xl relative flex flex-col border-x border-slate-200/80">

        {/* ======================================================== */}
        {/* PREMIUM TOP HEADER BAR */}
        {/* ======================================================== */}
        <header className="bg-slate-900 text-white px-4 pt-3.5 pb-3 sticky top-0 z-30 shadow-md border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold tracking-tight text-white">হিসাব-নিকাশ</h1>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Tracker Pro
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                  <span>abujar287</span>
                  <span>•</span>
                  <span className="text-emerald-400">অনলাইন</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* PWA Install Button in Header if Installable */}
              {isInstallable && (
                <button
                  type="button"
                  onClick={install}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-all"
                  title="ফোনে ইনস্টল করুন"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>ইন্সটল</span>
                </button>
              )}

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-colors"
                title="লগআউট (Logout)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* MAIN BODY CONTENT AREA */}
        {/* ======================================================== */}
        <main className="flex-1 p-3.5 space-y-4">

          {/* ======================================================== */}
          {/* TAB 1: SUMMARY TAB */}
          {/* ======================================================== */}
          {activeTab === 'summary' && (
            <div className="animate-fadeIn space-y-3.5">
              
              {/* HERO FINANCIAL DASHBOARD CARD */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-4 shadow-xl border border-slate-800/80 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleShiftMonth(-1)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Previous month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-200 tracking-wide">
                      {monthName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleShiftMonth(1)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Next month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="bg-slate-800/90 text-slate-200 border border-slate-700 text-[11px] rounded-lg px-2 py-1 font-medium focus:outline-none"
                  >
                    {monthOptions.map(m => (
                      <option key={m.val} value={m.val}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Net Balance Centerpiece */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    মাসিক নিট ব্যালেন্স (Net Balance)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold tracking-tight text-white font-mono">
                      {monthTotals.bal >= 0 ? '+' : ''}{monthTotals.bal.toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-sky-400">৳ BDT</span>
                  </div>
                  {monthTotals.inc > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1 font-medium">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>সঞ্চয় হার (Savings Rate): {monthTotals.savingsRate}%</span>
                    </div>
                  )}
                </div>

                {/* Income & Expense Dual Stat Boxes */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700/60">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] uppercase font-semibold">মোট আয় (Income)</span>
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">
                      +{monthTotals.inc.toLocaleString()} ৳
                    </div>
                  </div>

                  <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700/60">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] uppercase font-semibold">মোট খরচ (Expense)</span>
                      <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="text-sm font-bold text-rose-400 font-mono">
                      -{monthTotals.exp.toLocaleString()} ৳
                    </div>
                  </div>
                </div>
              </div>

              {/* CALENDAR VIEW */}
              <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      ক্যালেন্ডার ভিউ ({monthName})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">যেকোনো দিনে ট্যাপ করুন</span>
                </div>

                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.emptySlots.map((_, i) => (
                    <div key={`cal-empty-${i}`} className="h-11 bg-transparent rounded-lg" />
                  ))}
                  {calendarDays.days.map(d => {
                    const dayData = monthTotals.dailyMap[d] || { exp: 0, inc: 0 };
                    const fMonth = String(calendarDays.month).padStart(2, '0');
                    const fDay = String(d).padStart(2, '0');
                    const dateStr = `${calendarDays.year}-${fMonth}-${fDay}`;
                    const isToday = d === calendarDays.todayDate;
                    const hasActivity = dayData.exp > 0 || dayData.inc > 0;

                    return (
                      <button
                        key={`cal-day-${d}`}
                        type="button"
                        onClick={() => setSelectedDateModal(dateStr)}
                        className={`h-11 rounded-lg border flex flex-col items-center justify-between p-1 transition-all text-left relative group ${
                          isToday
                            ? 'border-indigo-500 bg-indigo-50/60 font-bold ring-1 ring-indigo-400'
                            : hasActivity
                            ? 'border-slate-200 bg-slate-50/90 hover:bg-indigo-50/70 hover:border-indigo-300'
                            : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`text-[9.5px] leading-none ${
                            isToday ? 'text-indigo-600 font-extrabold' : 'text-slate-700 font-semibold'
                          }`}
                        >
                          {d}
                        </span>

                        <div className="w-full text-center space-y-0.5">
                          {dayData.exp > 0 && (
                            <div className="text-[7.5px] font-bold text-rose-500 leading-tight truncate">
                              -{dayData.exp >= 1000 ? `${(dayData.exp / 1000).toFixed(1)}k` : dayData.exp}
                            </div>
                          )}
                          {dayData.inc > 0 && (
                            <div className="text-[7.5px] font-bold text-emerald-600 leading-tight truncate">
                              +{dayData.inc >= 1000 ? `${(dayData.inc / 1000).toFixed(1)}k` : dayData.inc}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DATE FILTER CARD */}
              <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                    তারিখ অনুযায়ী ফিল্টার (Filter)
                  </span>
                  {(filterPreset || startDate || endDate) && (
                    <button
                      type="button"
                      onClick={clearFilter}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      ✕ Clear Filter
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    { id: 'today', label: 'Today (আজ)' },
                    { id: 'yesterday', label: 'Yesterday (গতকাল)' },
                    { id: 'last7', label: 'Last 7 Days' },
                    { id: 'thisMonth', label: 'This Month' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleFilterPresetChange(p.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        filterPreset === p.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Start Date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => {
                        setFilterPreset('');
                        setStartDate(e.target.value);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">End Date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => {
                        setFilterPreset('');
                        setEndDate(e.target.value);
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Filter Result Mini Card */}
                <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl shadow-inner">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold">
                    <span>ফিল্টার ব্যালেন্স (Filtered Balance)</span>
                    <span>{filteredData.matchedList.length} Entries</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-sky-400 my-1">
                    {filteredData.fBal >= 0 ? '+' : ''}{filteredData.fBal.toLocaleString()} ৳
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-slate-800 font-medium">
                    <span className="text-emerald-400">Income: +{filteredData.fInc.toLocaleString()} ৳</span>
                    <span className="text-rose-400">Expense: -{filteredData.fExp.toLocaleString()} ৳</span>
                  </div>
                </div>
              </div>

              {/* TOP 5 EXPENSE CATEGORIES & DONUT CHART */}
              <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span>⭐ শীর্ষ ৫ খরচের ক্যাটাগরি (Top 5 Categories)</span>
                  <span className="text-[10px] text-slate-400 font-normal">ক্লিক করে বিবরণ দেখুন</span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                    <svg width="110" height="110" viewBox="0 0 42 42" className="-rotate-90">
                      <circle
                        cx="21"
                        cy="21"
                        r="15.91549430918954"
                        fill="transparent"
                        stroke="#f1f5f9"
                        strokeWidth="4.5"
                      />
                      {donutSegments.map(seg => (
                        <circle
                          key={seg.name}
                          cx="21"
                          cy="21"
                          r="15.91549430918954"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="4.5"
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.dashOffset}
                          className="transition-all duration-700 ease-out"
                        />
                      ))}
                    </svg>
                    <div className="absolute text-center leading-tight">
                      <span className="text-[8.5px] text-slate-400 uppercase font-semibold">EXPENSE</span>
                      <b className="block text-[11px] text-slate-900 font-bold font-mono">
                        {filteredData.fExp.toLocaleString()}৳
                      </b>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-hidden">
                    {top5Categories.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">কোনো খরচের রেকর্ড নেই</p>
                    ) : (
                      donutSegments.map(item => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedCatModal(item.name)}
                          className="w-full text-left p-1 rounded-lg hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex justify-between items-center text-[11px] font-semibold mb-1">
                            <span className="truncate pr-1 text-slate-700 group-hover:text-indigo-600 transition-colors">
                              {item.name}
                            </span>
                            <span className="shrink-0 text-[10px] text-slate-500 font-mono">
                              {item.percent.toFixed(1)}% | {item.val.toLocaleString()}৳
                            </span>
                          </div>
                          <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
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
              </div>

              {/* ALL CATEGORY REPORT LIST */}
              <div className="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-3">
                  <span>📊 সম্পূর্ণ ক্যাটাগরি রিপোর্ট (Category Report)</span>
                  <span className="text-[10px] text-slate-400 font-normal">{filteredData.sortedCats.length} Categories</span>
                </div>

                <div className="space-y-2">
                  {filteredData.sortedCats.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">No category data found</p>
                  ) : (
                    filteredData.sortedCats.map((item, idx) => {
                      const percent = filteredData.fExp > 0 ? (item.val / filteredData.fExp) * 100 : 0;
                      const color = donutColors[idx % donutColors.length];
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedCatModal(item.name)}
                          className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 transition-all"
                        >
                          <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                            <span className="truncate pr-2 text-slate-800">{item.name}</span>
                            <span className="shrink-0 text-slate-700 font-mono font-bold">
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

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DETAILS TAB */}
          {/* ======================================================== */}
          {activeTab === 'details' && (
            <div className="animate-fadeIn space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">লেনদেন ইতিহাস (History)</h2>
                  <p className="text-xs text-slate-400">এডিট বা ডিলিট করতে কার্ডে ক্লিক করুন</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  {groupedDetails.totalItems} Records
                </span>
              </div>

              {/* Search bar & Type Toggle */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search category, note, amount... (অনুসন্ধান করুন)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDetailFilterType('All')}
                    className={`py-1.5 rounded-lg transition-all ${
                      detailFilterType === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailFilterType('Expense')}
                    className={`py-1.5 rounded-lg transition-all ${
                      detailFilterType === 'Expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    Expenses
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailFilterType('Income')}
                    className={`py-1.5 rounded-lg transition-all ${
                      detailFilterType === 'Income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Grouped Day-by-Day List */}
              {groupedDetails.sortedDates.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-xs">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">কোনো লেনদেন পাওয়া যায়নি</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? 'ভিন্ন কোনো শব্দ লিখে খুঁজুন।' : 'নতুন লেনদেন যুক্ত করতে "Entry" ট্যাবে যান।'}
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
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                      >
                        <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-200/80 flex justify-between items-center text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5 text-slate-900">
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
                                  <div className="text-xs font-bold text-slate-800">{item.category}</div>
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

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(item.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                                    title="Edit Transaction (এডিট করুন)"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTransaction(item.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                    title="Delete Transaction (মুছে ফেলুন)"
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
          {/* TAB 3: BUDGET PLANNING TAB */}
          {/* ======================================================== */}
          {activeTab === 'budget' && (
            <div className="animate-fadeIn space-y-3.5">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">মাসিক বাজেট পরিকল্পনা</h2>
                  <p className="text-xs text-slate-400">{monthName} Budget Plan</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Budget</span>
                  <span className="text-sm font-bold text-indigo-600 font-mono">
                    {totalMonthlyBudget.toLocaleString()} ৳
                  </span>
                </div>
              </div>

              {/* Overall Budget Progress Card */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-lg">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>বাজেট অগ্রগতি (Overall Spent)</span>
                  <span className="font-mono">
                    {monthTotals.exp.toLocaleString()} / {totalMonthlyBudget.toLocaleString()} ৳
                  </span>
                </div>
                <div className="bg-slate-700/60 rounded-full h-2.5 overflow-hidden my-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      monthTotals.exp > totalMonthlyBudget ? 'bg-rose-500' : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${totalMonthlyBudget > 0 ? Math.min(100, (monthTotals.exp / totalMonthlyBudget) * 100) : 0}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-300 font-medium">
                  <span>অবশিষ্ট: {(totalMonthlyBudget - monthTotals.exp).toLocaleString()} ৳</span>
                  <span>
                    {totalMonthlyBudget > 0 ? ((monthTotals.exp / totalMonthlyBudget) * 100).toFixed(1) : 0}% used
                  </span>
                </div>
              </div>

              {/* Category-by-Category Budget Cards */}
              <div className="space-y-2.5">
                {EXPENSE_CATEGORIES.map(cat => {
                  const spent = categorySpentInMonth[cat] || 0;
                  const budgetVal = budgets[cat] || 0;
                  const remain = budgetVal > 0 ? budgetVal - spent : 0;
                  const percent = budgetVal > 0 ? Math.min(100, (spent / budgetVal) * 100) : 0;
                  const isOverBudget = budgetVal > 0 && spent > budgetVal;

                  return (
                    <div
                      key={cat}
                      className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-800 truncate flex-1" title={cat}>
                          {cat}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            placeholder="বাজেট"
                            defaultValue={budgetVal > 0 ? budgetVal : ''}
                            onChange={e => setBudgetInputs(prev => ({ ...prev, [cat]: e.target.value }))}
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center font-semibold focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveBudget(cat)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                          >
                            Set
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] font-semibold text-slate-500 border-t border-slate-100 pt-1.5">
                        <span>খরচ: <b className="text-slate-800 font-mono">{spent.toLocaleString()} ৳</b></span>
                        <span>
                          অবশিষ্ট:{' '}
                          <b className={`font-mono ${isOverBudget ? 'text-rose-500' : 'text-emerald-600'}`}>
                            {budgetVal > 0 ? `${remain.toLocaleString()} ৳` : 'Not set'}
                          </b>
                        </span>
                      </div>

                      <div className="bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOverBudget ? 'bg-rose-500' : percent > 80 ? 'bg-amber-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ENTRY TAB */}
          {/* ======================================================== */}
          {activeTab === 'entry' && (
            <div className="animate-fadeIn space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">নতুন লেনদেন যোগ করুন</h2>
                  <p className="text-xs text-slate-400">Add Income or Expense</p>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Instant Saved
                </span>
              </div>

              <form onSubmit={e => { e.preventDefault(); handleEntrySubmit(); }} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Expense')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      entryType === 'Expense'
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    Expense (খরচ)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('Income')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      entryType === 'Income'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Income (আয়)
                  </button>
                </div>

                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    ক্যাটাগরি নির্বাচন করুন (Category)
                  </label>
                  
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {quickCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEntryCategory(cat)}
                        className={`text-[10.5px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                          entryCategory === cat
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <select
                    value={entryCategory}
                    onChange={e => setEntryCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  >
                    {(entryType === 'Expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">তারিখ (Date)</label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={e => setEntryDate(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                    <label className="block text-xs font-bold text-slate-700 mb-1">নোট / বিবরণ (Note)</label>
                    <input
                      type="text"
                      placeholder="যেমন: মাসিক বাজার..."
                      value={entryNote}
                      onChange={e => setEntryNote(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* CALCULATOR KEYPAD */}
                <div className="bg-slate-900 rounded-2xl p-3.5 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span className="font-semibold uppercase tracking-wider">Amount ৳ (টাকার পরিমাণ)</span>
                    <span className="text-[10px]">ক্যালকুলেট বা সরাসরি টাইপ</span>
                  </div>

                  <div className="bg-slate-950 text-sky-400 font-mono text-2xl font-bold text-right p-3 rounded-xl mb-3 tracking-wider flex items-center justify-end border border-slate-800/80 shadow-inner">
                    <span>{calcDisplay}</span>
                    <span className="text-sm font-semibold text-slate-500 ml-1.5">৳</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                    {[50, 100, 500, 1000, 2000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickAdd(amt)}
                        className="py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700/60 transition-colors"
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
                      className="calc-key bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xl shadow-lg shadow-emerald-900/30 active:scale-95 transition-all"
                      title="Save Transaction"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </form>

              {entryMessage.text && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold text-center border animate-fadeIn ${
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
          {/* TAB 5: PROFILE TAB */}
          {/* ======================================================== */}
          {activeTab === 'profile' && (
            <div className="animate-fadeIn space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-slate-900">ব্যবহারকারী প্রোফাইল</h2>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> লগআউট
                </button>
              </div>

              {/* Profile Card */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-xl text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
                  AG
                </div>
                <h3 className="text-base font-bold">Abujar Al-Gifari</h3>
                <p className="text-xs text-indigo-300 font-mono mt-0.5">Username: abujar287</p>

                <div className="mt-4 pt-3.5 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Entries</span>
                    <b className="text-sm font-mono text-white">{transactions.length}</b>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Security Status</span>
                    <b className="text-sm text-emerald-400 font-semibold">Protected</b>
                  </div>
                </div>
              </div>

              {/* Mobile Phone Installation / APK section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    মোবাইল অ্যাপ ও APK ইনস্টল
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                    PWA Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  এই অ্যাপটি আপনার অ্যান্ড্রয়েড বা আইফোনে সরাসরি আসল অ্যাপ (APK)-এর মতো ইনস্টল করে হোমস্ক্রিন থেকে ব্যবহার করতে পারবেন।
                </p>

                {/* Android / Desktop Direct Install */}
                {isInstallable && (
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    📲 ফোনে সরাসরি অ্যাপ ইনস্টল করুন (Install PWA)
                  </button>
                )}

                {/* If already running as installed standalone app */}
                {isInstalled && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>অ্যাপটি সফলভাবে আপনার ডিভাইসে ইনস্টল করা আছে!</span>
                  </div>
                )}

                {/* iOS install guide trigger */}
                {isIOS && !isInstalled && (
                  <button
                    type="button"
                    onClick={() => setShowIOSModal(true)}
                    className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    iPhone / iOS এ কীভাবে ইনস্টল করবেন
                  </button>
                )}

                {/* APK Instructions Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setShowAPKGuideModal(true)}
                  className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  📦 APK ফাইল তৈরি ও ডাউনলোড নির্দেশিকা
                </button>
              </div>

              {/* Data Export & Backup Tools */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  ডাটা ব্যাকআপ ও এক্সপোর্ট (Backup & Export)
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
                    const a = document.createElement('a');
                    a.href = dataStr;
                    a.download = `expense_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors border border-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-600" />
                    Download JSON Backup (সম্পূর্ণ ব্যাকআপ)
                  </span>
                  <span>📥</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const headers = 'ID,Date,Type,Category,Amount,Note\n';
                    const rows = transactions.map(t =>
                      `"${t.id}","${t.date}","${t.type}","${t.category}",${t.value},"${(t.note || '').replace(/"/g, '""')}"`
                    ).join('\n');
                    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors border border-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Export CSV for Excel (এক্সেল শিট এক্সপোর্ট)
                  </span>
                  <span>📊</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowScriptModal(true)}
                  className="w-full flex items-center justify-between p-3 bg-indigo-50/70 hover:bg-indigo-100/70 rounded-xl text-xs font-semibold text-indigo-900 transition-colors border border-indigo-200"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    গুগল শিট থেকে ডিলিট করার কোড (Google Sheet Delete Code)
                  </span>
                  <span>⚙️</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset all transactions to initial demo dataset?')) {
                      setTransactions(INITIAL_TRANSACTIONS);
                      alert('Reset complete!');
                    }
                  }}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-rose-50 rounded-xl text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors border border-slate-200"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-500" />
                    Reload Default Sample Data (নমুনা ডাটা)
                  </span>
                  <span>🔄</span>
                </button>
              </div>
            </div>
          )}

        </main>

        {/* ======================================================== */}
        {/* EDIT TRANSACTION MODAL */}
        {/* ======================================================== */}
        {editingTx && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={closeEditModal}
          >
            <div
              className="bg-white w-full max-w-sm rounded-2xl p-4.5 shadow-2xl relative animate-scaleUp border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-600 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  লেনদেন এডিট করুন (Edit Transaction)
                </span>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Type (ধরন)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditTypeChange('Expense')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        editForm.type === 'Expense'
                          ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      🔻 Expense (খরচ)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditTypeChange('Income')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        editForm.type === 'Income'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-600 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      🔺 Income (আয়)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">তারিখ (Date)</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ক্যাটাগরি (Category)</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    {(editForm.type === 'Expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">টাকার পরিমাণ ৳ (Amount)</label>
                  <input
                    type="number"
                    step="any"
                    value={editForm.value}
                    onChange={e => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">নোট / বিবরণ (Note)</label>
                  <textarea
                    rows={2}
                    value={editForm.note}
                    onChange={e => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Short note..."
                  />
                </div>

                {editMessage.text && (
                  <div
                    className={`p-2 rounded-xl text-[11px] font-semibold text-center border ${
                      editMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {editMessage.text}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteTransaction(editingTx.id)}
                    className="w-1/3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl border border-rose-200 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> মুছে ফেলুন
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateTransaction}
                    className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-colors"
                  >
                    <Check className="w-4 h-4" /> আপডেট করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DATE BREAKDOWN MODAL POPUP */}
        {/* ======================================================== */}
        {selectedDateModal && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-40 p-4"
            onClick={() => setSelectedDateModal(null)}
          >
            <div
              className="bg-white w-full max-w-sm rounded-2xl p-4 max-h-[80vh] overflow-y-auto shadow-2xl relative border border-slate-200 animate-scaleUp"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                <span className="font-bold text-xs text-indigo-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedDateModal} বিবরণী
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDateModal(null)}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
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
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="pr-2">
                        <div className="font-bold text-slate-800">{item.category}</div>
                        {item.note && <div className="text-[11px] text-slate-500 mt-0.5">{item.note}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-bold font-mono ${
                            item.type === 'Expense' ? 'text-rose-500' : 'text-emerald-600'
                          }`}
                        >
                          {item.type === 'Expense' ? '-' : '+'}
                          {item.value.toLocaleString()} ৳
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditModal(item.id)}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
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
        {/* CATEGORY BREAKDOWN MODAL POPUP */}
        {/* ======================================================== */}
        {selectedCatModal && (
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-40 p-4"
            onClick={() => setSelectedCatModal(null)}
          >
            <div
              className="bg-white w-full max-w-sm rounded-2xl p-4 max-h-[80vh] overflow-y-auto shadow-2xl relative border border-slate-200 animate-scaleUp"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                <span className="font-bold text-xs text-indigo-600 truncate pr-2">
                  📂 {selectedCatModal}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCatModal(null)}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
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
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="pr-2">
                        <div className="font-semibold text-slate-800">📅 {item.date}</div>
                        {item.note && <div className="text-[11px] text-slate-500 mt-0.5">{item.note}</div>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold font-mono text-rose-500">
                          -{item.value.toLocaleString()} ৳
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditModal(item.id)}
                          className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(item.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
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
        {/* APK / MOBILE INSTALL GUIDE MODAL */}
        {/* ======================================================== */}
        {showAPKGuideModal && (
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={() => setShowAPKGuideModal(false)}
          >
            <div
              className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl relative animate-scaleUp border border-slate-200 text-xs"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-600 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  APK ও মোবাইল ইনস্টল নির্দেশিকা
                </span>
                <button
                  type="button"
                  onClick={() => setShowAPKGuideModal(false)}
                  className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-slate-600 leading-relaxed">
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-indigo-900">
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    পদ্ধতি ১: সবচেয়ে সহজ (১-ক্লিকে ফোনে Install)
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    ক্রোম (Google Chrome) ব্রাউজারে অ্যাপটির লিঙ্ক ওপেন করে ওপরের <b>"📲 ইন্সটল"</b> বাটন চাপুন। এটি কোনো ফাইল ডাউনলোড ছাড়াই আপনার ফোনে সরাসরি হোমস্ক্রিন অ্যাপ হিসেবে ইনস্টল হয়ে যাবে!
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                  <div className="font-bold mb-1 flex items-center gap-1">
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    পদ্ধতি ২: GitHub Actions দিয়ে অটোমেটিক APK তৈরি
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    এই প্রজেক্টে GitHub Actions অটোমেটিক বিল্ডার (<code>.github/workflows/build-apk.yml</code>) যুক্ত করে দেওয়া হয়েছে। GitHub-এ পুশ করলেই Actions ট্যাবে সরাসরি ডাউনলোডযোগ্য <b>hisabkitab-app-debug.apk</b> ফাইল রেডি হয়ে যাবে!
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-700" />
                    পদ্ধতি ৩: Android Studio (Capacitor Native Project)
                  </div>
                  <p className="text-[11px] text-slate-600">
                    প্রজেক্টে সম্পূর্ণ নেটিভ <code>android/</code> ফোল্ডার ও Capacitor সেটআপ করা আছে। Android Studio দিয়ে <code>android</code> ফোল্ডারটি ওপেন করে <b>Build &gt; Build APK</b> চাপলেই আপনার APK তৈরি হয়ে যাবে।
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAPKGuideModal(false)}
                className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                বুঝেছি (Got It)
              </button>
            </div>
          </div>
        )}

        {/* iOS Safari Guide Modal */}
        {showIOSModal && (
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={() => setShowIOSModal(false)}
          >
            <div
              className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl relative animate-scaleUp text-xs"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                <span className="font-bold text-sm text-indigo-600">iPhone এ ইনস্টল করার নিয়ম</span>
                <button onClick={() => setShowIOSModal(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <ol className="list-decimal pl-4 space-y-2 text-slate-600 text-xs">
                <li>Safari ব্রাউজারে নিচের <b>Share (শেয়ার)</b> বাটনে ট্যাপ করুন।</li>
                <li>নিচে স্ক্রল করে <b>"Add to Home Screen"</b> অপশনটি বেছে নিন।</li>
                <li>ওপরের ডানপাশে <b>"Add"</b> চাপুন। অ্যাপটি আপনার আইফোনে ইনস্টল হয়ে যাবে!</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        )}

        {/* Google Sheet Delete Script Modal */}
        {showScriptModal && (
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center z-50 p-4"
            onClick={() => setShowScriptModal(false)}
          >
            <div
              className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl relative animate-scaleUp text-xs"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-3">
                <span className="font-bold text-sm text-indigo-600 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  গুগল শিট থেকে রো মুছে ফেলার কোড
                </span>
                <button onClick={() => setShowScriptModal(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <p className="text-slate-600 mb-2 leading-relaxed text-[11px]">
                আপনার গুগল শিট ব্যাকএন্ডের <code>Code.gs</code> ফাইলে নিচের কোডটি থাকলে অ্যাপ থেকে ডিলিট চাপলে গুগল শিটের লাইনটিও ডিলিট হয়ে যাবে:
              </p>

              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[10.5px] font-mono select-all">
{`if (data.action === 'delete') {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] == data.id || (values[i][2] == data.category && values[i][3] == data.date && values[i][4] == data.value)) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({ result: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }
  }
}`}
              </pre>

              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="w-full mt-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
              >
                ঠিক আছে (Close)
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PREMIUM FIXED BOTTOM NAVIGATION DOCK */}
        {/* ======================================================== */}
        <nav aria-label="Main Navigation" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl flex justify-around py-2 z-30">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex flex-col items-center text-[10.5px] font-bold transition-all relative py-1 px-3 ${
              activeTab === 'details' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className="w-4.5 h-4.5 mb-0.5" />
            বিবরণী
            {activeTab === 'details' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex flex-col items-center text-[10.5px] font-bold transition-all relative py-1 px-3 ${
              activeTab === 'summary' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5 mb-0.5" />
            সারসংক্ষেপ
            {activeTab === 'summary' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex flex-col items-center text-[10.5px] font-bold transition-all relative py-1 px-3 ${
              activeTab === 'budget' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PieChart className="w-4.5 h-4.5 mb-0.5" />
            বাজেট
            {activeTab === 'budget' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('entry')}
            className={`flex flex-col items-center text-[10.5px] font-bold transition-all relative py-1 px-3 ${
              activeTab === 'entry' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PlusCircle className="w-4.5 h-4.5 mb-0.5" />
            এন্ট্রি
            {activeTab === 'entry' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center text-[10.5px] font-bold transition-all relative py-1 px-3 ${
              activeTab === 'profile' ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-4.5 h-4.5 mb-0.5" />
            প্রোফাইল
            {activeTab === 'profile' && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5" />
            )}
          </button>
        </nav>

      </div>
    </div>
  );
}
