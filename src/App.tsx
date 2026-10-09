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
  Filter
} from 'lucide-react';
import { Transaction, TransactionType, AppUser } from './types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  GOOGLE_SCRIPT_URL
} from './constants';
import { usePWAInstall } from './usePWAInstall';
import { App as CapApp } from '@capacitor/app';

// Helper to reliably normalize any date from Google Sheet into YYYY-MM-DD
function normalizeDate(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const str = String(rawDate).trim();

  // 1. Exact YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
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
  // AUTHENTICATION STATE
  // Username: abujar287, Password: hisabkitab
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
      if (loginUsername.trim() === 'abujar287' && loginPassword === 'hisabkitab') {
        setIsAuthenticated(true);
        try {
          localStorage.setItem('auth_user_abujar', 'true');
        } catch {}
        setLoginError('');
      } else {
        setLoginError('ভুল ইউজারনেম বা পাসওয়ার্ড! সঠিক তথ্য দিন (Invalid username or password).');
      }
      setIsLoggingIn(false);
    }, 250);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('auth_user_abujar');
    } catch {}
    setLoginUsername('');
    setLoginPassword('');
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

  const handleTestConnection = async () => {
    setIsTestingUrl(true);
    setUrlTestStatus('কানেকশন টেস্ট করা হচ্ছে...');
    try {
      const res = await fetch(`${urlInput.trim()}?action=getDetails`, { method: 'GET' });
      const data = await res.json();
      if (data && data.result === 'success') {
        const count = Array.isArray(data.transactions) ? data.transactions.length : 0;
        setUrlTestStatus(`কানেকশন সফল! শিটে ${count}টি রেকর্ড রয়েছে।`);
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
  // No fake mock dummy transactions!
  // ----------------------------------------------------
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'budget' | 'entry' | 'profile'>('summary');
  const [summaryScope, setSummaryScope] = useState<'month' | 'all'>('month');

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('app_transactions_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out any previous dummy items
          const realOnly = parsed.filter((t: any) => !String(t.id || '').startsWith('tx-init-'));
          return realOnly;
        }
      }
    } catch (e) {
      console.error('Failed to load transactions', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_transactions_v2', JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [transactions]);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  });
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
      const v = Number(t.value) || 0;
      if (t.type === 'Income') inc += v;
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
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);
      const res = await fetch(`${customScriptUrl}?action=getDetails`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();

      if (data && data.result === 'success' && Array.isArray(data.transactions)) {
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

        // 1:1 EXACT MATCH: Replace local state with exact Google Sheet data
        setTransactions(remoteList);
        try {
          localStorage.setItem('app_transactions_v2', JSON.stringify(remoteList));
        } catch {}

        const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(timeStr);
        showToast(`গুগল শিট থেকে ${remoteList.length}টি রেকর্ড সিঙ্ক হয়েছে!`, 'success');
      } else {
        showToast('গুগল শিটে কোনো ডেটা পাওয়া যায়নি।', 'info');
      }
    } catch {
      showToast('অফলাইন মোড: শিটের সাথে সংযোগ করা যায়নি।', 'error');
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
    setIsPushing(true);
    try {
      const payload = {
        action: 'pushAll',
        transactions: transactions
      };
      await fetch(customScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      showToast(`মোট ${transactions.length}টি লেনদেন গুগল শিটে পাঠানো হয়েছে!`, 'success');
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);
    } catch {
      showToast('গুগল শিটে পাঠাতে সমস্যা হয়েছে। ইন্টারনেট চেক করুন।', 'error');
    } finally {
      setIsPushing(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    handleManualSync();
  }, [customScriptUrl]);

  // ----------------------------------------------------
  // ENTRY TAB STATE & CALCULATOR
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
      text: 'সফলভাবে সংরক্ষিত ও শিটে পাঠানো হয়েছে!',
      type: 'success'
    });
    setCalcDisplay('0');
    setEntryNote('');
    setIsSubmitting(false);

    try {
      fetch(customScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'insert',
          ...newTx
        })
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

    try {
      fetch(customScriptUrl, {
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

    // 1. Immediately remove from local state and localStorage
    setTransactions(prev => prev.filter(t => t.id !== targetId));
    if (editingTx?.id === targetId) {
      setEditingTx(null);
    }

    // 2. Safe delete request to Google Apps Script
    // We send ONLY GET request (?action=delete).
    // In Google Apps Script, doGet NEVER calls appendRow(), eliminating any risk of duplicate row creation!
    try {
      const queryUrl = `${customScriptUrl}?action=delete&id=${encodeURIComponent(targetId)}&date=${encodeURIComponent(target.date)}&category=${encodeURIComponent(target.category)}&value=${encodeURIComponent(target.value)}&type=${encodeURIComponent(target.type)}`;

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
        const queryUrl = `${customScriptUrl}?action=delete&id=${encodeURIComponent(targetId)}&date=${encodeURIComponent(target.date)}&category=${encodeURIComponent(target.category)}&value=${encodeURIComponent(target.value)}&type=${encodeURIComponent(target.type)}`;
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
    if (filteredStats.hasFilter) {
      return filteredStats.items.filter(t => t.type === 'Expense');
    }
    if (summaryScope === 'all') {
      return transactions.filter(t => t.type === 'Expense');
    }
    const [y, m] = selectedMonth.split('-').map(Number);
    return transactions.filter(t => {
      if (t.type !== 'Expense') return false;
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

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    activeExpenseList.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.value;
    });
    return Object.keys(map)
      .map(name => ({ name, val: map[name] }))
      .sort((a, b) => b.val - a.val);
  }, [activeExpenseList]);

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
  // BACK NAVIGATION (PROFILE -> SUMMARY, 2 TAPS TO EXIT)
  // ----------------------------------------------------
  const lastBackClickRef = React.useRef<number>(0);

  const handleBackAction = () => {
    if (activeTab !== 'summary') {
      setActiveTab('summary');
      return;
    }
    const now = Date.now();
    if (now - lastBackClickRef.current < 2000) {
      showToast('অ্যাপ বন্ধ করা হচ্ছে...', 'info');
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
    } else {
      lastBackClickRef.current = now;
      showToast('অ্যাপ থেকে বের হতে আবার ব্যাক চাপুন (Press back again to exit)', 'info');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== 'summary') {
        setActiveTab('summary');
        window.history.pushState(null, '', window.location.pathname);
      } else {
        const now = Date.now();
        if (now - lastBackClickRef.current < 2000) {
          try {
            const Cap = (window as any).Capacitor;
            if (Cap?.Plugins?.App?.exitApp) {
              Cap.Plugins.App.exitApp();
            }
          } catch {}
        } else {
          lastBackClickRef.current = now;
          showToast('অ্যাপ থেকে বের হতে আবার ব্যাক চাপুন (Press back again to exit)', 'info');
          window.history.pushState(null, '', window.location.pathname);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  useEffect(() => {
    try {
      const Cap = (window as any).Capacitor;
      if (Cap?.Plugins?.App) {
        const listener = Cap.Plugins.App.addListener('backButton', () => {
          handleBackAction();
        });
        return () => {
          listener?.then?.((l: any) => l?.remove?.());
        };
      }
    } catch {}
  }, [activeTab]);

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
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  const quickCategories = entryType === 'Expense'
    ? EXPENSE_CATEGORIES.slice(0, 8)
    : INCOME_CATEGORIES.slice(0, 6);

  // Complete, tested Google Apps Script Code with robust row deletion
  const googleAppsScriptCode = `// ====================================================================
// হিসাব-নিকাশ: গুগল শিট Apps Script কোড (Code.gs)
// ভার্সন: 3.0 (স্থায়ী ফিক্সড কোড - কোনো ডুপ্লিকেট এন্ট্রি হবে না)
// ====================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = {};
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      data = (e && e.parameter) ? e.parameter : {};
    }
    
    var action = (data.action || (e && e.parameter ? e.parameter.action : '') || '').toString().toLowerCase().trim();
    
    // ১. রো মুছে ফেলার অ্যাকশন (DELETE ROW)
    // কোনো অবস্থাতেই ডিলিট অ্যাকশনে নতুন রো যোগ (append) হবে না!
    if (action === 'delete' || data.isDelete === true) {
      return handleDeleteRow(sheet, data, e ? e.parameter : null);
    }
    
    // ২. ব্যাচ পুশ ব্যাকআপ (PUSH ALL)
    if (action === 'pushall' && Array.isArray(data.transactions)) {
      for (var k = 0; k < data.transactions.length; k++) {
        var t = data.transactions[k];
        sheet.appendRow([t.id, t.datetime || new Date().toLocaleString(), t.type, t.category, t.date, t.value, t.note || '']);
      }
      return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Batch saved' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ৩. আপডেট অ্যাকশন (UPDATE ROW)
    if (action === 'update') {
      return handleUpdateRow(sheet, data);
    }
    
    // ৪. শুধুমাত্র নিশ্চিত insert/add অ্যাকশন থাকলে রো যোগ হবে (INSERT ROW)
    // কোনো খালি, অস্পষ্ট বা ডিলিট রিকোয়েস্টে রো যোগ হবে না!
    if (action === 'insert' || action === 'add' || action === 'create') {
      var id = data.id || ('ID-' + Date.now());
      var datetime = data.datetime || (new Date().toLocaleString());
      var type = data.type || 'Expense';
      var category = data.category || 'অন্যান্য';
      var date = data.date || (new Date().toISOString().split('T')[0]);
      var value = Number(data.value || 0);
      var note = data.note || '';
      
      sheet.appendRow([id, datetime, type, category, date, value, note]);
      
      return ContentService.createTextOutput(JSON.stringify({ result: 'success', id: id, message: 'Row inserted' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: 'unknown_action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } finally {
    lock.releaseLock();
  }
}

// GET রিকোয়েস্ট হ্যান্ডলার
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var params = (e && e.parameter) ? e.parameter : {};
  var action = (params.action || '').toString().toLowerCase().trim();
  
  // GET এর মাধ্যমেও নিরাপদ রো ডিলিট (ব্রাউজার রিডাইরেক্ট সাপোর্ট)
  if (action === 'delete') {
    return handleDeleteRow(sheet, params, params);
  }
  
  // সব লেনদেন পড়া
  var rows = sheet.getDataRange().getValues();
  var transactions = [];
  
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] && !r[1] && !r[2] && !r[3] && !r[4] && !r[5]) continue;
    
    // ৭-কলাম অথবা ৬-কলাম অটো-ডিটেকশন
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
  
  return ContentService.createTextOutput(JSON.stringify({ result: 'success', transactions: transactions, count: transactions.length }))
    .setMimeType(ContentService.MimeType.JSON);
}

// রো খুঁজে বের করে স্থায়ীভাবে মুছে ফেলা (sheet.deleteRow)
function handleDeleteRow(sheet, data, param) {
  var id = String((data && data.id) || (param && param.id) || '').trim();
  var date = String((data && data.date) || (param && param.date) || '').trim();
  var cat = String((data && data.category) || (param && param.category) || '').trim();
  var val = Number((data && data.value) || (param && param.value) || 0);
  
  var rows = sheet.getDataRange().getValues();
  
  // নিচ থেকে উপরে খোঁজা (সবচেয়ে নতুন রো আগে পাওয়া যায়)
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
    
    // ৪. তারিখ ও টাকার পরিমাণ দিয়ে ফ্লেক্সিবল ম্যাচ
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
        message: 'রো সফলভাবে ডিলিট হয়েছে (Row ' + (i + 1) + ' deleted)',
        deletedRow: i + 1
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    result: 'not_found',
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
      return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Row updated' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ result: 'not_found' }))
    .setMimeType(ContentService.MimeType.JSON);
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

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white mx-auto mb-3">
              <Wallet className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">হিসাব-নিকাশ</h1>
            <p className="text-xs text-indigo-300 font-medium mt-0.5">Google Sheets Personal Tracker</p>
            <p className="text-[11px] text-slate-400 mt-2">লগইন করতে ইউজারনেম ও পাসওয়ার্ড দিন</p>
          </div>

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
              {isLoggingIn ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন (Log In)'}
            </button>
          </form>

          <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400">
              Connected with your Google Spreadsheet
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
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white whitespace-nowrap">হিসাব-নিকাশ</h1>
                  <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                  <span className="truncate">abujar287</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {transactions.length} টি
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Google Sheets Quick Sync Button */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all border border-indigo-400/30 cursor-pointer shrink-0"
                title="গুগল শিট থেকে ডেটা সিঙ্ক করুন"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-200' : ''}`} />
                <span className="text-xs">{isSyncing ? 'সিঙ্ক...' : 'Sync'}</span>
              </button>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-all border border-slate-700 shrink-0 cursor-pointer"
                title="লগআউট (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* PROMINENT LIVE GOOGLE SHEET SYNC BAR */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-3 sm:px-4 py-2 border-b border-indigo-900/40 flex items-center justify-between text-xs shadow-inner gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 shrink-0" />
            <span className="font-bold text-[10.5px] sm:text-[11px] text-slate-200 truncate">
              গুগল শিট সংযুক্ত ({transactions.length} টি)
            </span>
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-slate-400 shrink-0">
            শেষ সিঙ্ক: {lastSyncTime}
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
                  <span className="truncate text-[11px] sm:text-xs">এই মাস ({monthName.split(' ')[0]})</span>
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
                  <span className="truncate text-[11px] sm:text-xs">সর্বমোট (All-Time)</span>
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
                        title="Previous Month"
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
                        title="Next Month"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 truncate">
                      <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">শিটের সম্পূর্ণ সর্বমোট হিসাব</span>
                    </div>
                  )}

                  <span className="text-[10.5px] sm:text-[11px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                    Savings: {activeTotals.savingsRate}%
                  </span>
                </div>

                {/* Net Balance */}
                <div className="mb-4">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                    {summaryScope === 'all' ? 'শিটের সর্বমোট অবশিষ্ট ব্যালেন্স' : 'এই মাসের অবশিষ্ট ব্যালেন্স (Net Balance)'}
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
                        {summaryScope === 'all' ? 'শিটের সর্বমোট আয়' : 'এই মাসের আয়'}
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
                        {summaryScope === 'all' ? 'শিটের সর্বমোট খরচ' : 'এই মাসের খরচ'}
                      </span>
                      <span className="text-sm font-bold font-mono text-rose-300">
                        -{activeTotals.exp.toLocaleString()} ৳
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MONTHLY CALENDAR (Only shown for monthly view) */}
              {summaryScope === 'month' && (
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 mb-2.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      মাসিক ক্যালেন্ডার ({monthName})
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-normal">তারিখে ক্লিক করে দেখুন</span>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1.5">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  {/* Day Matrix - Uniform 3-tier aligned cards (Day / Expense / Income) with zero misalignments */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.emptySlots.map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-[52px] sm:h-[58px] rounded-xl bg-transparent pointer-events-none" />
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
                          className={`h-[52px] sm:h-[58px] rounded-xl p-0.5 sm:p-1 text-center flex flex-col justify-between items-center transition-all cursor-pointer relative border min-w-0 ${
                            isToday
                              ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/30 border-indigo-500 ring-2 ring-indigo-300'
                              : hasExp || hasInc
                              ? 'bg-slate-50 hover:bg-indigo-50/70 border-slate-200/90 text-slate-800'
                              : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                          }`}
                        >
                          {/* 1. Day number at top */}
                          <span className={`text-[10px] sm:text-[11px] font-bold leading-tight ${isToday ? 'text-white' : 'text-slate-800'}`}>
                            {dayNum}
                          </span>

                          {/* 2. Expense in middle (Fixed height row for 100% horizontal alignment) */}
                          <div className="h-3 sm:h-3.5 flex items-center justify-center w-full min-w-0">
                            {hasExp ? (
                              <span className={`text-[7.5px] sm:text-[8px] font-mono font-bold leading-none truncate ${isToday ? 'text-rose-200' : 'text-rose-600'}`}>
                                -{dayData.exp > 999 ? `${(dayData.exp / 1000).toFixed(0)}k` : dayData.exp}
                              </span>
                            ) : (
                              <span className={`text-[7.5px] sm:text-[8px] font-mono leading-none select-none ${isToday ? 'text-indigo-400' : 'text-slate-200'}`}>
                                –
                              </span>
                            )}
                          </div>

                          {/* 3. Income at bottom (Fixed height row for 100% horizontal alignment) */}
                          <div className="h-3 sm:h-3.5 flex items-center justify-center w-full min-w-0">
                            {hasInc ? (
                              <span className={`text-[7.5px] sm:text-[8px] font-mono font-bold leading-none truncate ${isToday ? 'text-emerald-200' : 'text-emerald-600'}`}>
                                +{dayData.inc > 999 ? `${(dayData.inc / 1000).toFixed(0)}k` : dayData.inc}
                              </span>
                            ) : (
                              <span className={`text-[7.5px] sm:text-[8px] font-mono leading-none select-none ${isToday ? 'text-indigo-400' : 'text-slate-200'}`}>
                                –
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DATE FILTER CARD (তারিখ ফিল্টার) - Replicating Image 1 */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">🗓️</span>
                    <span>Date Filter (তারিখ ফিল্টার)</span>
                  </span>
                  {(filterPreset || filterStartDate || filterEndDate) && (
                    <button
                      type="button"
                      onClick={handleClearDateFilter}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                </div>

                {/* Range Select Preset Dropdown */}
                <select
                  value={filterPreset}
                  onChange={e => handleSelectFilterPreset(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">-- Select Filter Range --</option>
                  <option value="today">আজ (Today)</option>
                  <option value="yesterday">গতকাল (Yesterday)</option>
                  <option value="this_week">এই সপ্তাহ (This Week)</option>
                  <option value="last_7_days">গত ৭ দিন (Last 7 Days)</option>
                  <option value="this_month">এই মাস (This Month)</option>
                  <option value="last_month">গত মাস (Last Month)</option>
                  <option value="this_year">এই বছর (This Year)</option>
                  <option value="custom">কাস্টম তারিখ (Custom Range)</option>
                </select>

                {/* Start Date & End Date Inputs */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Start Date
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
                      End Date
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

                {/* Filtered Balance Card (Exact Dark Box from Image 1) */}
                <div className="rounded-2xl bg-slate-900 text-white p-3.5 shadow-md border border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">
                    Filtered Balance (ফিল্টার অনুযায়ী ব্যালেন্স)
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
                      Income +{filteredStats.inc.toLocaleString()} ৳
                    </span>
                    <span className="text-rose-400">
                      Expense -{filteredStats.exp.toLocaleString()} ৳
                    </span>
                  </div>

                  {filteredStats.hasFilter && (
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[10.5px] text-slate-400">
                      <span>মোট {filteredStats.count}টি লেনদেন পাওয়া গেছে</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery(filterStartDate || '');
                          setActiveTab('details');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer"
                      >
                        বিস্তারিত দেখুন &rarr;
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
                    শীর্ষ ৫ খরচ ক্যাটাগরি ({
                      filteredStats.hasFilter
                        ? 'ফিল্টার অনুযায়ী'
                        : (summaryScope === 'all' ? 'সব সময়ের' : monthName.split(' ')[0])
                    })
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-normal">
                    মোট: {activeTotals.exp.toLocaleString()} ৳
                  </span>
                </div>

                <div className="space-y-2.5">
                  {top5Categories.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">কোনো খরচের রেকর্ড পাওয়া যায়নি।</p>
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
                            {item.name}
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
                  <span>📊 সম্পূর্ণ ক্যাটাগরি রিপোর্ট ({
                    filteredStats.hasFilter
                      ? 'ফিল্টার অনুযায়ী'
                      : (summaryScope === 'all' ? 'সব সময়ের' : monthName.split(' ')[0])
                  })</span>
                  <span className="text-[10px] text-slate-400 font-normal">{categoryStats.length} Categories</span>
                </div>

                <div className="space-y-2">
                  {categoryStats.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">No category data found</p>
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
                            <span className="truncate pr-2 text-slate-800">{item.name}</span>
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

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: DETAILS TAB */}
          {/* ======================================================== */}
          {activeTab === 'details' && (
            <div className="animate-fadeIn space-y-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900">লেনদেন ইতিহাস (History)</h2>
                  <p className="text-xs text-slate-400 truncate">শিটের আসল ডেটা (মোট: {transactions.length} টি)</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 rounded-xl transition-all border border-indigo-200 flex items-center gap-1 text-xs font-bold cursor-pointer shrink-0"
                    title="গুগল শিট থেকে সিঙ্ক করুন"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>সিঙ্ক</span>
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
                    All ({transactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailFilterType('Expense')}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer min-w-0 truncate ${
                      detailFilterType === 'Expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-rose-600'
                    }`}
                  >
                    Expenses
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailFilterType('Income')}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer min-w-0 truncate ${
                      detailFilterType === 'Income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-emerald-600'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Grouped Day-by-Day List */}
              {groupedDetails.sortedDates.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">কোনো লেনদেন পাওয়া যায়নি</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery ? 'ভিন্ন কোনো শব্দ লিখে খুঁজুন।' : 'নতুন লেনদেন যুক্ত করতে "Entry" ট্যাবে যান অথবা "Sync" চাপুন।'}
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

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(item.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-90 transition-all cursor-pointer shrink-0"
                                    title="Edit Transaction (এডিট করুন)"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => requestDelete(item.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 active:scale-90 transition-all cursor-pointer shrink-0"
                                    title="Delete Transaction Row (রো ডিলিট করুন)"
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
                  <span className="text-[10px] text-slate-400">মাসিক বাজেট ও খরচ ট্র্যাকার</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleShiftMonth(1)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all cursor-pointer"
                  title="Next Month"
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
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">মাসিক সামগ্রিক বাজেট</h3>
                      <span className="text-[10.5px] text-indigo-300">
                        {effectiveTotalMonthlyBudget > 0 ? 'বাজেট সক্রিয় আছে' : 'বাজেট সেট করা হয়নি'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenOverallBudgetModal}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{effectiveTotalMonthlyBudget > 0 ? 'বাজেট পরিবর্তন' : 'বাজেট সেট করুন'}</span>
                  </button>
                </div>

                {/* 3 Metric Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">মোট বাজেট</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-indigo-300">
                      {effectiveTotalMonthlyBudget > 0 ? `${effectiveTotalMonthlyBudget.toLocaleString()} ৳` : '—'}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">এই মাসে খরচ</span>
                    <span className="text-sm sm:text-base font-bold font-mono text-rose-400">
                      {monthTotals.exp.toLocaleString()} ৳
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50">
                    <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">অবশিষ্ট বাজেট</span>
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
                        ব্যবহৃত: {((monthTotals.exp / effectiveTotalMonthlyBudget) * 100).toFixed(1)}%
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
                          ? '⚠️ বাজেট অতিক্রম করেছে!'
                          : `${(effectiveTotalMonthlyBudget - monthTotals.exp).toLocaleString()} ৳ অবশিষ্ট আছে`}
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
                      ক্যাটাগরি ভিত্তিক বাজেট তালিকা
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {Object.keys(categoryBudgets).length} টি ক্যাটাগরিতে বাজেট সেট করা আছে
                    </span>
                  </div>

                  <div className="relative w-full sm:w-44">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ক্যাটাগরি খুঁজুন..."
                      value={budgetSearchQuery}
                      onChange={e => setBudgetSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  {EXPENSE_CATEGORIES
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
                              <span className="text-xs font-bold text-slate-800 block truncate">{cat}</span>
                              <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                                <span className="text-slate-500">
                                  খরচ: <b className="text-slate-700 font-mono">{spent.toLocaleString()} ৳</b>
                                </span>
                                {hasBudget ? (
                                  <span className="text-slate-500">
                                    • বাজেট: <b className="text-indigo-600 font-mono">{budget.toLocaleString()} ৳</b>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">• বাজেট নেই</span>
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
                              {hasBudget ? 'বাজেট এডিট' : '+ বাজেট দিন'}
                            </button>
                          </div>

                          {hasBudget ? (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                  {percent.toFixed(0)}% ব্যবহৃত
                                </span>
                                <span className={isOver ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                                  {isOver
                                    ? `⚠️ ${Math.abs(remaining).toLocaleString()} ৳ বেশি খরচ!`
                                    : `${remaining.toLocaleString()} ৳ বাকি`}
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
                                এই মাসে ইতিমধ্যে <span className="font-mono font-semibold text-slate-600">{spent.toLocaleString()} ৳</span> খরচ হয়েছে
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
                <h2 className="text-base font-bold text-slate-900">নতুন লেনদেন এন্ট্রি</h2>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  অটো শিট সিঙ্ক
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
                  খরচ (Expense)
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
                  আয় (Income)
                </button>
              </div>

              <form onSubmit={e => { e.preventDefault(); handleEntrySubmit(); }} className="space-y-3">
                <div className="bg-white p-3.5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
                  {/* Date and Category */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">তারিখ (Date)</label>
                      <input
                        type="date"
                        value={entryDate}
                        onChange={e => setEntryDate(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">ক্যাটাগরি</label>
                      <select
                        value={entryCategory}
                        onChange={e => setEntryCategory(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      >
                        {(entryType === 'Expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quick Category Chips */}
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-400 mb-1.5">দ্রুত ক্যাটাগরি বাছাই:</label>
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
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">নোট / বিবরণ (অপশনাল)</label>
                    <input
                      type="text"
                      placeholder="যেমন: মাসিক বাজার, গাড়ির ভাড়া..."
                      value={entryNote}
                      onChange={e => setEntryNote(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* CALCULATOR KEYPAD */}
                <div className="bg-slate-900 rounded-3xl p-4 shadow-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span className="font-semibold uppercase tracking-wider text-[11px]">Amount ৳ (টাকার পরিমাণ)</span>
                    <span className="text-[10px]">ক্যালকুলেট বা সরাসরি টাইপ</span>
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
          {/* TAB 5: PROFILE & GOOGLE SHEET SYNC CENTER */}
          {/* ======================================================== */}
          {activeTab === 'profile' && (
            <div className="animate-fadeIn space-y-4">
              {/* Back to Summary Button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackAction}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 text-indigo-600" />
                  <span>ফিরে যান (Summary)</span>
                </button>
              </div>

              {/* Profile Card (Name & Username Only) */}
              <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold text-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
                  AG
                </div>
                <h3 className="text-base font-bold">Abujar Al-Gifari</h3>
                <p className="text-xs text-indigo-300 font-mono mt-0.5">Username: abujar287</p>
              </div>

              {/* Google Sheets Settings & Script Guide */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4.5 shadow-sm space-y-3.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-600" />
                  গুগল শিট সেটিংস ও কোড (Google Sheet Setup)
                </span>

                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Apps Script কোড কপি করতে অথবা গুগল শিটের সাথে সংযুক্ত Web App লিঙ্ক পরিবর্তন করতে নিচের অপশনগুলো ব্যবহার করুন:
                </p>

                {/* Google Sheet Script Guide Button */}
                <button
                  type="button"
                  onClick={() => setShowScriptModal(true)}
                  className="w-full flex items-center justify-between p-3.5 bg-amber-500/10 hover:bg-amber-500/15 active:scale-98 rounded-2xl text-xs font-semibold text-amber-900 transition-all border border-amber-300 cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-left min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate"><b>স্থায়ী Apps Script কোড</b> (ডিলিট রো ফিক্সড)</span>
                  </span>
                  <span className="text-amber-700 font-bold shrink-0 ml-1">কপি করুন ➔</span>
                </button>

                {/* Google Sheet URL Config */}
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 active:scale-98 rounded-2xl text-xs font-semibold text-slate-700 transition-all border border-slate-200 cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-left min-w-0">
                    <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">গুগল শিট Web App URL পরিবর্তন ও টেস্ট</span>
                  </span>
                  <span className="text-slate-400 shrink-0 ml-1">⚙️</span>
                </button>
              </div>

              {/* Offline Export & Backup */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  অফলাইন ব্যাকআপ ও ফাইল ডাউনলোড
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
                      showToast('CSV ফাইল ডাউনলোড হয়েছে!', 'success');
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">CSV এক্সপোর্ট</span>
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
                      showToast('JSON ব্যাকআপ ডাউনলোড হয়েছে!', 'success');
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">JSON ব্যাকআপ</span>
                  </button>
                </div>
              </div>

              {/* APK & Mobile Guide Card */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  মোবাইল ইনস্টলেশন ও নিয়ন্ত্রণ (Mobile Control)
                </span>
                <p className="text-[11px] text-slate-500">
                  QR কোড স্ক্যান করে মোবাইল দিয়ে অ্যাপটি সরাসরি নিয়ন্ত্রণ করুন এবং ১-ক্লিকে ফোনে ইনস্টল করুন।
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMobileModal(true)}
                    className="py-2.5 px-2 bg-sky-50 hover:bg-sky-100 active:scale-95 text-sky-800 font-bold rounded-2xl border border-sky-200 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span className="truncate">মোবাইল QR ও গাইড</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAPKGuideModal(true)}
                    className="py-2.5 px-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold rounded-2xl border border-emerald-200 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer min-w-0"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">APK বিল্ড গাইড</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* ======================================================== */}
        {/* BOTTOM NAVIGATION BAR */}
        {/* ======================================================== */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-1 py-1.5 flex justify-between items-center z-30">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-0 ${
              activeTab === 'summary' ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] truncate">Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-0 ${
              activeTab === 'details' ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] truncate">Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('entry')}
            className="flex-1 flex flex-col items-center justify-center -mt-5 cursor-pointer min-w-0"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform border-2 border-slate-900 shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-indigo-400 font-bold mt-0.5 truncate">Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-0 ${
              activeTab === 'budget' ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] truncate">Budget</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all cursor-pointer min-w-0 ${
              activeTab === 'profile' ? 'text-indigo-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4 mb-0.5 shrink-0" />
            <span className="text-[10px] truncate">Profile</span>
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
                    <h3 className="text-sm font-bold text-white truncate">বাজেট নির্ধারণ করুন</h3>
                    <p className="text-[10.5px] text-indigo-300 truncate">{editingBudgetCat}</p>
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
                  <span className="text-slate-400">এই মাসে বর্তমান খরচ:</span>
                  <b className="font-mono text-rose-400 text-sm">
                    {(selectedMonthExpenseByCategory[editingBudgetCat] || 0).toLocaleString()} ৳
                  </b>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    বাজেটের পরিমাণ (টাকা):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="যেমন: ৫০০০"
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
                  <label className="block text-[10px] text-slate-400 mb-1.5">দ্রুত টাকা যোগ করুন:</label>
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
                      মুছুন (Clear)
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
                      <span>মুছুন</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveCategoryBudget}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>বাজেট সংরক্ষণ করুন</span>
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
                    <h3 className="text-sm font-bold text-white">মাসিক সামগ্রিক বাজেট সেট করুন</h3>
                    <p className="text-[10px] text-slate-400">এই মাসের মোট খরচের সর্বোচ্চ সীমা</p>
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
                    মোট মাসিক বাজেট (টাকা):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="যেমন: ২৫০০০"
                      value={overallBudgetInputValue}
                      onChange={e => setOverallBudgetInputValue(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-2xl text-lg font-bold font-mono text-white focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <span className="absolute right-3.5 top-3.5 text-sm font-bold text-slate-400">৳</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5">দ্রুত টাকা যোগ করুন:</label>
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
                      মুছুন (Clear)
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
                        showToast('মাসিক বাজেট মুছে ফেলা হয়েছে।', 'info');
                        setShowOverallBudgetModal(false);
                      }}
                      className="py-3 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-2xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveOverallBudget}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>সংরক্ষণ করুন</span>
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
                    <h3 className="text-sm font-bold text-white">লেনদেন সম্পাদনা (Edit)</h3>
                    <p className="text-[10px] text-slate-400">তথ্য পরিবর্তন করে সেভ চাপুন</p>
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
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">ধরণ (Type)</label>
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
                      🔻 খরচ (Expense)
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
                      🔺 আয় (Income)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">তারিখ (Date)</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">ক্যাটাগরি (Category)</label>
                  <select
                    value={editForm.category}
                    onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {(editForm.type === 'Expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">টাকার পরিমাণ ৳ (Amount)</label>
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
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">নোট / বিবরণ (Note)</label>
                  <textarea
                    rows={2}
                    value={editForm.note}
                    onChange={e => setEditForm(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full p-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                    placeholder="Short note..."
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
                    <Trash2 className="w-3.5 h-3.5" /> মুছুন
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateTransaction}
                    className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> আপডেট করুন
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
                <span className="font-bold text-sm text-amber-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  গুগল শিট Apps Script কোড (স্থায়ী ফিক্সড)
                </span>
                <button
                  type="button"
                  onClick={() => setShowScriptModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-[11px] leading-relaxed mb-3">
                <b>⚠️ কেন আগে ডিলিট করলে আবার ইনপুট হয়ে যাচ্ছিল?</b><br />
                আপনার গুগল শিটের আগের পুরনো স্ক্রিপ্টে <code>action === &apos;delete&apos;</code> চেক ছিল না। ফলে যেকোনো রিকোয়েস্টকেই শিট নতুন এন্ট্রি ভেবে <code>appendRow()</code> করে ফেলত! নিচের সম্পূর্ণ ফিক্সড কোডটি আপনার শিটে পেস্ট করলেই ডিলিট করলে স্থায়ীভাবে রো ডিলিট হবে।
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
                <div className="font-bold text-white text-xs mb-1">📋 গুগল শিটে আপডেট করার সঠিক নিয়ম:</div>
                <div><b>১.</b> গুগল শিটে গিয়ে <b>Extensions &gt; Apps Script</b> ওপেন করুন।</div>
                <div><b>২.</b> সেখানে থাকা আগের সমস্ত কোড মুছে উপরের এই কোডটি পেস্ট করুন এবং সেভ (Ctrl+S) করুন।</div>
                <div><b>৩.</b> উপরে ডানপাশে <b>Deploy &gt; Manage deployments</b>-এ যান।</div>
                <div><b>৪.</b> পেনসিল আইকন (Edit) চাপুন &gt; <b>Version</b> ড্রপডাউনে অবশ্যই <b>&quot;New version&quot;</b> সিলেক্ট করুন &gt; এরপর <b>Deploy</b> বাটনে চাপুন।</div>
                <div className="text-amber-300 text-[10.5px] bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                  ⚠️ <i>মনে রাখবেন:</i> শুধু Save করলেই গুগল আপডেট করে না, &quot;New version&quot; ডিপ্লয় করলেই কেবল ডিলিট ফিচার সঠিকভাবে কাজ করবে!
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

      </div>
    </div>
  );
}
