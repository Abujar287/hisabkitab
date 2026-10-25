import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Trash2,
  Edit3,
  UserPlus,
  User,
  Smartphone,
  Copy,
  CheckCheck,
  Tag,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  GripVertical
} from 'lucide-react';
import { Transaction, AppUser, TransactionType, AppTab, UserRole } from '../types';
import { formatNumberLocale, formatCleanDateTime, formatDateShortDemo, normalizeDate, formatDayHeader } from '../utils/dateUtils';
import { cleanCategoryName, getCategoryEmoji, getCategoryColor } from '../utils/categoryUtils';

// Global Portal Wrapper to guarantee modals render at viewport center with no parent scroll displacement
const ModalPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return createPortal(children, document.body);
};

// ========================================================
// 1. DAY DETAILS MODAL
// ========================================================
interface DayDetailsModalProps {
  dateStr: string | null;
  transactions: Transaction[];
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
  isReadOnly?: boolean;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  dateStr,
  transactions,
  onClose,
  onEdit,
  onDelete,
  lang,
  t,
  isReadOnly
}) => {
  React.useEffect(() => {
    if (dateStr) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [dateStr]);

  const formattedHeaderDate = useMemo(() => {
    if (!dateStr) return '';
    return formatDayHeader(dateStr, lang);
  }, [dateStr, lang]);

  if (!dateStr) return null;

  const dayTransactions = transactions.filter(tx => normalizeDate(tx.date) === normalizeDate(dateStr));
  const totalInc = dayTransactions.reduce((acc, t) => t.type === 'Income' ? acc + (Number(t.value) || 0) : acc, 0);
  const totalExp = dayTransactions.reduce((acc, t) => t.type === 'Expense' ? acc + (Number(t.value) || 0) : acc, 0);
  const net = totalInc - totalExp;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[360px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring max-h-[85vh] overflow-y-auto overscroll-contain my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-100 truncate">
              {formattedHeaderDate} ({dayTransactions.length} {t('Records', 'টি রেকর্ড')})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-full bg-slate-700 cursor-pointer shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {dayTransactions.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-4">
            {t('No records.', 'কোনো হিসাব নেই।')}
          </p>
        ) : (
          <div className="space-y-0.5 max-h-[50vh] overflow-y-auto pr-0.5">
            {dayTransactions.map(tx => {
              const isExpense = tx.type === 'Expense';
              const emoji = getCategoryEmoji(tx.category);
              const circleColor = getCategoryColor(tx.category);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 px-1 hover:bg-slate-700/30 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 shadow-sm ${circleColor} text-slate-900`}>
                      {emoji}
                    </div>
                    <span className="font-medium text-slate-100 text-[11px] truncate">
                      {cleanCategoryName(tx.category, lang)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold text-[11px] tabular-nums ${isExpense ? 'text-slate-100' : 'text-emerald-400'}`}>
                      {isExpense ? '-' : ''}{formatNumberLocale(tx.value, lang)}
                    </span>
                    {!isReadOnly && (
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onEdit(tx);
                          }}
                          className="text-slate-500 hover:text-indigo-300 cursor-pointer active:scale-90"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onDelete(tx);
                          }}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer active:scale-90"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 2. EDIT TRANSACTION MODAL
// ========================================================
interface EditTransactionModalProps {
  tx: Transaction | null;
  onClose: () => void;
  onSave: (updated: Transaction) => Promise<void>;
  expenseCategories: string[];
  incomeCategories: string[];
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  tx,
  onClose,
  onSave,
  expenseCategories,
  incomeCategories,
  lang,
  t
}) => {
  if (!tx) return null;

  const [type, setType] = useState<TransactionType>(tx.type);
  const [category, setCategory] = useState<string>(tx.category);
  const [date, setDate] = useState<string>(tx.date);
  const [value, setValue] = useState<string>(String(tx.value));
  const [note, setNote] = useState<string>(tx.note || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const categories = type === 'Expense' ? expenseCategories : incomeCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(value);
    if (isNaN(val) || val <= 0) return;

    setIsSaving(true);
    await onSave({
      ...tx,
      type,
      category,
      date,
      value: val,
      note
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[340px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring max-h-[85vh] overflow-y-auto overscroll-contain my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-100">{t('Edit Transaction', 'লেনদেন এডিট')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setType('Expense');
                if (expenseCategories.length > 0) setCategory(expenseCategories[0]);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                type === 'Expense'
                  ? 'bg-rose-600 text-slate-100 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-100'
              }`}
            >
              {t('Expense', 'খরচ')}
            </button>
            <button
              type="button"
              onClick={() => {
                setType('Income');
                if (incomeCategories.length > 0) setCategory(incomeCategories[0]);
              }}
              className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                type === 'Income'
                  ? 'bg-emerald-600 text-slate-100 shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-100'
              }`}
            >
              {t('Income', 'আয়')}
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              {t('Amount', 'টাকা')}
            </label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              {t('Category', 'ক্যাটাগরি')}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {cleanCategoryName(c, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              {t('Date', 'তারিখ')}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              {t('Note', 'বিবরণ')}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg font-bold transition-all shadow-sm cursor-pointer mt-1 active:scale-98 flex items-center justify-center gap-1.5 text-xs"
          >
            {isSaving ? t('Saving...', 'সেভ হচ্ছে...') : t('Save Changes', 'সেভ করুন')}
          </button>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 3. DELETE CONFIRMATION MODAL
// ========================================================
interface DeleteConfirmModalProps {
  tx: Transaction | null;
  onClose: () => void;
  onConfirm: (tx: Transaction) => Promise<void>;
  isDeleting: boolean;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  tx,
  onClose,
  onConfirm,
  isDeleting,
  lang,
  t
}) => {
  if (!tx) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[320px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring text-center space-y-3 my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Trash2 className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-100">
            {t('Delete Transaction?', 'লেনদেনটি মুছতে চান?')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {cleanCategoryName(tx.category, lang)} · {formatNumberLocale(tx.value, lang)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer active:scale-95"
          >
            {t('Cancel', 'বাতিল')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(tx)}
            disabled={isDeleting}
            className="py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-100 rounded-lg text-xs font-bold shadow-sm cursor-pointer active:scale-95"
          >
            {isDeleting ? t('Deleting...', 'মুছছে...') : t('Yes, Delete', 'হ্যাঁ, মুছুন')}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 4. CREATE USER MODAL
// ========================================================
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    username: string,
    pass: string,
    role: UserRole,
    allowedTabs: AppTab[],
    isReadOnly: boolean,
    viewTargetTab?: string
  ) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  lang,
  t
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('member');
  const [allowedTabs, setAllowedTabs] = useState<AppTab[]>(['summary', 'entry', 'details']);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [viewTargetTab, setViewTargetTab] = useState<string>('abujar287');
  const [error, setError] = useState('');

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'super_admin' || newRole === 'admin') {
      setAllowedTabs(['summary', 'entry', 'details', 'users', 'settings']);
      setIsReadOnly(false);
    } else if (newRole === 'super_admin_2') {
      setAllowedTabs(['summary', 'details']);
      setIsReadOnly(true);
      setViewTargetTab('abujar287');
    } else if (newRole === 'senior_member') {
      setAllowedTabs(['summary', 'entry', 'details']);
      setIsReadOnly(false);
    } else {
      setAllowedTabs(['summary', 'entry', 'details']);
      setIsReadOnly(false);
    }
  };

  const toggleTab = (tab: AppTab) => {
    if (allowedTabs.includes(tab)) {
      setAllowedTabs(allowedTabs.filter(t => t !== tab));
    } else {
      setAllowedTabs([...allowedTabs, tab]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setError(t('Please fill all fields', 'সবগুলো তথ্য পূরণ করুন'));
      return;
    }
    if (allowedTabs.length === 0) {
      setError(t('Select at least one allowed tab', 'কমপক্ষে একটি ট্যাব নির্বাচন করুন'));
      return;
    }
    onCreate(
      name.trim(),
      username.trim().toLowerCase(),
      password.trim(),
      role,
      allowedTabs,
      isReadOnly,
      role === 'super_admin_2' ? 'abujar287' : viewTargetTab
    );
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[350px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring max-h-[88vh] overflow-y-auto overscroll-contain my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-100">{t('Create New User', 'নতুন ব্যবহারকারী')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
          {error && <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 text-[10px]">{error}</div>}

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">{t('Full Name', 'নাম')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">{t('Username', 'ইউজারনেম')}</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">{t('Password', 'পাসওয়ার্ড')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">{t('Role', 'রোল')}</label>
            <select
              value={role}
              onChange={e => handleRoleChange(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="super_admin" className="bg-slate-900 text-white">{t('Super Admin', 'সুপার অ্যাডমিন')}</option>
              <option value="super_admin_2" className="bg-slate-900 text-white">{t('Super Admin 2 (Viewer @abujar287)', 'সুপার অ্যাডমিন ২ (আবুজারের হিসাব दर्शक)')}</option>
              <option value="admin" className="bg-slate-900 text-white">{t('Admin', 'অ্যাডমিন')}</option>
              <option value="senior_member" className="bg-slate-900 text-white">{t('Senior Member', 'সিনিয়র মেম্বার')}</option>
              <option value="member" className="bg-slate-900 text-white">{t('Member', 'মেম্বার')}</option>
            </select>
          </div>

          {/* Allowed Tabs Checkboxes */}
          <div>
            <label className="text-[10px] font-semibold text-slate-300 block mb-1">
              {t('Tab Access Permissions', 'ট্যাব এক্সেস')}
            </label>
            <div className="grid grid-cols-2 gap-1 p-1.5 bg-slate-800/80 rounded-lg border border-slate-700">
              {[
                { id: 'summary' as AppTab, label: t('Summary', 'সারাংশ') },
                { id: 'details' as AppTab, label: t('Details', 'বিস্তারিত') },
                { id: 'entry' as AppTab, label: t('Add Entry', 'হিসাব যোগ') },
                { id: 'users' as AppTab, label: t('Users', 'ইউজার') },
                { id: 'settings' as AppTab, label: t('Settings', 'সেটিংস') }
              ].map(tabItem => {
                const checked = allowedTabs.includes(tabItem.id);
                return (
                  <label
                    key={tabItem.id}
                    className="flex items-center gap-1.5 p-1 rounded hover:bg-slate-700/50 cursor-pointer select-none text-[10px]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTab(tabItem.id)}
                      className="rounded border-slate-600 text-indigo-600 focus:ring-0 cursor-pointer w-3 h-3"
                    />
                    <span className="text-slate-200">{tabItem.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Read Only Toggle */}
          <div>
            <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isReadOnly}
                onChange={e => setIsReadOnly(e.target.checked)}
                className="rounded border-slate-600 text-indigo-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
              />
              <span className="text-[10px] font-medium text-slate-200">
                {t('Read-Only Access', 'শুধুমাত্র পড়তে পারবে')}
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg font-bold shadow-sm cursor-pointer mt-2 active:scale-98 text-xs"
          >
            {t('Create User Account', 'অ্যাকাউন্ট তৈরি করুন')}
          </button>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 5. DELETE USER CONFIRMATION MODAL
// ========================================================
interface DeleteUserModalProps {
  user: AppUser | null;
  onClose: () => void;
  onConfirm: (user: AppUser) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  onClose,
  onConfirm,
  lang,
  t
}) => {
  if (!user) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[320px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring text-center space-y-3 my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Trash2 className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-100">
            {t('Delete User Account?', 'ইউজার ডিলিট করতে চান?')}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            @{user.username} ({user.displayName})
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer active:scale-95"
          >
            {t('Cancel', 'বাতিল')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(user)}
            className="py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-100 rounded-lg text-xs font-bold shadow-sm cursor-pointer active:scale-95"
          >
            {t('Yes, Delete', 'হ্যাঁ, মুছুন')}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 6. ADD CATEGORY MODAL
// ========================================================
interface AddCategoryModalProps {
  isOpen: boolean;
  type: TransactionType;
  onClose: () => void;
  onAdd: (catName: string, type: TransactionType) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  type,
  onClose,
  onAdd,
  lang,
  t
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏷️');

  const presetEmojis = [
    '🏷️', '💰', '💳', '💵', '🪙', '📈', '📊', '💼', '🎁', '🎓', '✈️',
    '🍳', '☕', '🧋', '🍵', '🍕', '🍔', '🥗', '🍎', '🍌', '🛒', '🛍️',
    '🚗', '🚌', '🏍️', '⛽', '🚕', '🚂', '📱', '📶', '⚡', '💧', '💡',
    '🔌', '💊', '🏥', '🩺', '🏠', '🛋️', '🔑', '🧹', '🧴', '🧼', '👨‍👩‍👧',
    '👥', '💑', '🌙', '🐦', '🐾', '💻', '👕', '👔', '💇', '📚', '✏️',
    '🔧', '🔨', '⚽', '🏋️', '🎮', '🎬', '🎧', '💎', '⭐', '🔥'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const full = `${emoji} ${name.trim()}`;
    onAdd(full, type);
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-md rounded-2xl p-4 sm:p-5 shadow-2xl relative border border-slate-700/50 animate-modalSpring max-h-[92vh] overflow-y-auto overscroll-contain my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-100">
              {t('Add New Category', 'নতুন ক্যাটাগরি যোগ')} ({type === 'Expense' ? t('Expense', 'খরচ') : t('Income', 'আয়')})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-full bg-slate-700 hover:bg-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Emoji Selection Grid - FULL VIEW WITHOUT ANY INNER SCROLL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                {t('Pick Emoji Icon', 'আইকন বা ইমোজি নির্বাচন করুন')}
              </label>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{t('Selected:', 'নির্বাচিত:')}</span>
                <span className="text-base p-0.5 bg-slate-900 border border-indigo-500/50 rounded-lg inline-flex items-center justify-center w-6 h-6">{emoji}</span>
              </div>
            </div>
            
            {/* Full grid with NO inner scrollbar - all emojis fully visible */}
            <div className="grid grid-cols-8 sm:grid-cols-9 gap-1.5 p-2.5 bg-slate-900/90 rounded-xl border border-slate-700/60 overflow-visible">
              {presetEmojis.map(em => {
                const isSelected = emoji === em;
                return (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmoji(em)}
                    className={`h-9 rounded-xl text-base flex items-center justify-center cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/50 ring-2 ring-indigo-400 z-10'
                        : 'bg-slate-800/80 hover:bg-slate-700 hover:scale-105 border border-slate-700/40 text-slate-100'
                    }`}
                    title={em}
                  >
                    {em}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
              {t('Category Name', 'ক্যাটাগরির নাম')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl p-2 bg-slate-900 border border-slate-700 rounded-xl shrink-0 flex items-center justify-center w-11 h-11">
                {emoji}
              </span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('e.g., Gym, Coffee, Netflix', 'যেমন: জিম, কফি, কেনাকাটা')}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                required
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-xl font-bold shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-98 text-xs transition-all"
          >
            {t('Add Category', 'ক্যাটাগরি যোগ করুন')}
          </button>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 7. MOBILE APP QR & INSTALL MODAL
// ========================================================
interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
  lang,
  t
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[320px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring text-xs space-y-2.5 max-h-[88vh] overflow-y-auto overscroll-contain my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-100">{t('Mobile App & QR Code', 'মোবাইল অ্যাপ ও QR কোড')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* QR Code */}
        <div className="p-2.5 bg-white rounded-xl flex flex-col items-center justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(window.location.origin)}`}
            alt="Mobile App QR Code"
            className="w-28 h-28 rounded-lg"
          />
          <span className="text-[10px] font-bold text-slate-800 mt-1">
            {t('Scan with Camera', 'ক্যামেরা দিয়ে স্ক্যান করুন')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 text-xs"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? t('Copied Link!', 'লিংক কপি হয়েছে!') : t('Copy App Link', 'লিংক কপি করুন')}</span>
        </button>

        <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700 text-[10px] text-slate-300 space-y-0.5">
          <b className="text-slate-100 block">{t('Instructions:', 'ইন্সটল পদ্ধতি:')}</b>
          <p>
            {t(
              '1. Open link in Chrome.\n2. Tap menu (⋮) > "Install App" or "Add to Home screen".',
              '১. Chrome এ খুলুন।\n২. মেনু (⋮) > "Install App" বা "Add to Home screen" দিন।'
            )}
          </p>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 8. EDIT PROFILE MODAL
// ========================================================
interface EditProfileModalProps {
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    displayName: string,
    newPass?: string,
    role?: UserRole,
    allowedTabs?: AppTab[],
    isReadOnly?: boolean
  ) => void;
  isAdmin?: boolean;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  isAdmin = false,
  lang,
  t
}) => {
  if (!isOpen || !user) return null;

  const [displayName, setDisplayName] = useState(user.displayName);
  const [password, setPassword] = useState(user.password);
  const [role, setRole] = useState<UserRole>(user.role || 'member');
  const [allowedTabs, setAllowedTabs] = useState<AppTab[]>(() => {
    if (user.allowedTabs && user.allowedTabs.length > 0) return user.allowedTabs;
    if (user.role === 'super_admin_2') return ['summary', 'details'];
    return ['summary', 'entry', 'details', 'users', 'settings'];
  });
  const [isReadOnly, setIsReadOnly] = useState<boolean>(() => {
    if (user.isReadOnly !== undefined) return user.isReadOnly;
    return user.role === 'super_admin_2';
  });

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'super_admin_2') {
      setAllowedTabs(['summary', 'details']);
      setIsReadOnly(true);
    } else if (newRole === 'super_admin' || newRole === 'admin') {
      setAllowedTabs(['summary', 'entry', 'details', 'users', 'settings']);
      setIsReadOnly(false);
    }
  };

  const toggleTab = (tab: AppTab) => {
    setAllowedTabs(prev => {
      if (prev.includes(tab)) {
        if (prev.length <= 1) return prev;
        return prev.filter(t => t !== tab);
      } else {
        return [...prev, tab];
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    onSave(displayName.trim(), password.trim(), role, allowedTabs, isReadOnly);
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[340px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring max-h-[88vh] overflow-y-auto overscroll-contain my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-100">{t('Edit Profile', 'প্রোফাইল এডিট')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              {t('Display Name', 'নাম')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              {t('Username', 'ইউজারনেম')}
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
              {t('Password', 'পাসওয়ার্ড')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Role and Permissions for Admin */}
          {isAdmin && user.username !== 'abujar287' && (
            <>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                  {t('Role', 'রোল')}
                </label>
                <select
                  value={role}
                  onChange={e => handleRoleChange(e.target.value as UserRole)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="super_admin" className="bg-slate-900 text-white">{t('Super Admin', 'সুপার অ্যাডমিন')}</option>
                  <option value="super_admin_2" className="bg-slate-900 text-white">{t('Super Admin 2 (Viewer @abujar287)', 'সুপার অ্যাডমিন ২ (আবুজারের হিসাব दर्शक)')}</option>
                  <option value="admin" className="bg-slate-900 text-white">{t('Admin', 'অ্যাডমিন')}</option>
                  <option value="senior_member" className="bg-slate-900 text-white">{t('Senior Member', 'সিনিয়র মেম্বার')}</option>
                  <option value="member" className="bg-slate-900 text-white">{t('Member', 'মেম্বার')}</option>
                </select>
              </div>

              {/* Allowed Tabs */}
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  {t('Tab Access Permissions', 'ট্যাব এক্সেস')}
                </label>
                <div className="grid grid-cols-2 gap-1 p-1.5 bg-slate-800/80 rounded-lg border border-slate-700">
                  {[
                    { id: 'summary' as AppTab, label: t('Summary', 'সারাংশ') },
                    { id: 'details' as AppTab, label: t('Details', 'বিস্তারিত') },
                    { id: 'entry' as AppTab, label: t('Add Entry', 'হিসাব যোগ') },
                    { id: 'users' as AppTab, label: t('Users', 'ইউজার') },
                    { id: 'settings' as AppTab, label: t('Settings', 'সেটিংস') }
                  ].map(tabItem => {
                    const checked = allowedTabs.includes(tabItem.id);
                    return (
                      <label
                        key={tabItem.id}
                        className="flex items-center gap-1.5 p-1 rounded hover:bg-slate-700/50 cursor-pointer select-none text-[10px]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTab(tabItem.id)}
                          className="rounded border-slate-600 text-indigo-600 focus:ring-0 cursor-pointer w-3 h-3"
                        />
                        <span className="text-slate-200">{tabItem.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg font-bold shadow-sm cursor-pointer mt-2 active:scale-98 text-xs"
          >
            {t('Save Changes', 'সেভ করুন')}
          </button>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 9. CATEGORY DETAILS MODAL (POPUP WHEN TAPPING A CATEGORY)
// ========================================================
export interface CategoryDetailsModalProps {
  categoryName: string | null;
  transactions: Transaction[];
  onClose: () => void;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
  isReadOnly?: boolean;
}

export const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({
  categoryName,
  transactions,
  onClose,
  onEdit,
  onDelete,
  lang,
  t,
  isReadOnly
}) => {
  React.useEffect(() => {
    if (categoryName) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [categoryName]);

  if (!categoryName) return null;

  const catTxs = transactions.filter(tx => {
    if (!categoryName) return false;
    const c1 = cleanCategoryName(tx.category, 'en').toLowerCase();
    const c2 = cleanCategoryName(categoryName, 'en').toLowerCase();
    if (c1 === c2) return true;
    const b1 = cleanCategoryName(tx.category, 'bn').toLowerCase();
    const b2 = cleanCategoryName(categoryName, 'bn').toLowerCase();
    if (b1 === b2) return true;
    return c1.includes(c2) || c2.includes(c1) || b1.includes(b2) || b2.includes(b1);
  });
  const totalVal = catTxs.reduce((sum, tx) => sum + Math.abs(Number(tx.value) || 0), 0);
  const isExpense = catTxs.length > 0 ? catTxs[0].type === 'Expense' : true;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[360px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring max-h-[85vh] overflow-y-auto overscroll-contain my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <h3 className="text-xs font-bold text-slate-100 truncate max-w-[220px]">
              {cleanCategoryName(categoryName, lang)} {t('Details', 'এর হিসাব')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Total Header */}
        <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between mb-2.5">
          <div>
            <span className="text-[9.5px] text-slate-400 block font-semibold">
              {t('Total Records', 'মোট সংখ্যা')}
            </span>
            <span className="text-xs font-bold text-slate-200">
              {catTxs.length} {t('items', 'টি')}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[9.5px] text-slate-400 block font-semibold">
              {isExpense ? t('Total Spent', 'মোট খরচ') : t('Total Income', 'মোট আয়')}
            </span>
            <span
              className={`text-xs font-extrabold tabular-nums ${
                isExpense ? 'text-slate-100' : 'text-emerald-400'
              }`}
            >
              {isExpense ? '-' : '+'}
              {formatNumberLocale(totalVal, lang)}
            </span>
          </div>
        </div>

        {/* Transactions List */}
        {catTxs.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-6">
            {t('No transactions found in this category.', 'এই ক্যাটাগরিতে কোনো হিসাব নেই।')}
          </p>
        ) : (
          <div className="space-y-0.5 max-h-[50vh] overflow-y-auto pr-0.5">
            {catTxs.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-1.5 text-[11px] hover:bg-slate-700/30 rounded-lg px-1 -mx-1 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="font-bold text-slate-100 truncate">
                    {formatDateShortDemo(tx.date, lang)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`font-bold tabular-nums ${
                      tx.type === 'Expense' ? 'text-slate-100' : 'text-emerald-400'
                    }`}
                  >
                    {tx.type === 'Expense' ? '-' : '+'}
                    {formatNumberLocale(tx.value, lang)}
                  </span>

                  {!isReadOnly && onEdit && onDelete && (
                    <div className="flex items-center gap-1.5 ml-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEdit(tx);
                        }}
                        className="text-slate-400 hover:text-indigo-300 cursor-pointer active:scale-90"
                        title={t('Edit', 'এডিট')}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onDelete(tx);
                        }}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer active:scale-90"
                        title={t('Delete', 'মুছুন')}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 10. GOOGLE APPS SCRIPT CODE MODAL
// ========================================================
interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  lang,
  t
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const appsScriptCode = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheetName = data.sheetName || "abujar287";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (data.action === "save" && data.transactions) {
      sheet.clear();
      sheet.appendRow(["ID", "Type", "Category", "Value", "Date", "Note", "Datetime"]);
      data.transactions.forEach(function(tx) {
        sheet.appendRow([tx.id, tx.type, tx.category, tx.value, tx.date, tx.note || "", tx.datetime || ""]);
      });
    }
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: "active", message: "Hisab Kitab Backend Running"}))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-[380px] rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring max-h-[88vh] overflow-y-auto overscroll-contain space-y-3 my-auto"
          onClick={e => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-100">
              {t('Apps Script Backend Code', 'অ্যাপস স্ক্রিপ্ট কোড')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative">
          <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-indigo-200 overflow-x-auto max-h-48 no-scrollbar">
            {appsScriptCode}
          </pre>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98 text-xs"
        >
          {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? t('Copied!', 'কপি হয়েছে!') : t('Copy Code', 'কোড কপি করুন')}</span>
        </button>
      </div>
    </div>
    </ModalPortal>
  );
};

// ========================================================
// 11. CATEGORY MANAGER MODAL (Move, Edit, Delete, Add)
// ========================================================
interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseCategories: string[];
  incomeCategories: string[];
  onUpdateCategories: (newCats: string[], type: TransactionType) => void;
  onOpenAddModal: (type: TransactionType) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  expenseCategories,
  incomeCategories,
  onUpdateCategories,
  onOpenAddModal,
  lang,
  t
}) => {
  if (!isOpen) return null;

  const [activeType, setActiveType] = useState<TransactionType>('Expense');
  const categories = activeType === 'Expense' ? expenseCategories : incomeCategories;

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const cats = [...categories];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= cats.length) return;
    const temp = cats[index];
    cats[index] = cats[target];
    cats[target] = temp;
    onUpdateCategories(cats, activeType);
  };

  const handleEdit = (cat: string, index: number) => {
    const newName = prompt(t('Edit category name:', 'নতুন ক্যাটাগরির নাম দিন:'), cat);
    if (!newName || !newName.trim()) return;
    const cats = [...categories];
    cats[index] = newName.trim();
    onUpdateCategories(cats, activeType);
  };

  const handleDelete = (cat: string) => {
    if (categories.length <= 1) {
      alert(t('At least one category is required.', 'কমপক্ষে একটি ক্যাটাগরি থাকা আবশ্যক।'));
      return;
    }
    const cats = categories.filter(c => c !== cat);
    onUpdateCategories(cats, activeType);
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[999999] p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="bg-slate-800 text-slate-100 w-full max-w-md rounded-2xl p-4 shadow-2xl relative border border-slate-700/50 animate-modalSpring max-h-[85vh] flex flex-col my-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase">
                {t('Manage Categories', 'ক্যাটাগরি ম্যানেজমেন্ট')}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Type Tab Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl mb-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveType('Expense')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'Expense' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('Expense Categories', 'খরচের ক্যাটাগরি')} ({expenseCategories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveType('Income')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === 'Income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('Income Categories', 'আয়ের ক্যাটাগরি')} ({incomeCategories.length})
            </button>
          </div>

          {/* List of Categories with Move Up, Move Down, Edit, Delete */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mb-3">
            {categories.map((cat, idx) => (
              <div
                key={cat}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing p-0.5 rounded border border-slate-700 bg-slate-800" title="Move / Drag">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-100 truncate">
                    {cleanCategoryName(cat, lang)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer text-[10px] font-bold shadow-sm"
                    title="Move Up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === categories.length - 1}
                    className="px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer text-[10px] font-bold shadow-sm"
                    title="Move Down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(cat, idx)}
                    className="p-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 cursor-pointer shadow-sm"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer shadow-sm"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Category Button at Bottom */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddModal(activeType);
            }}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98 shrink-0 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t('+ Add New Category', '+ নতুন ক্যাটাগরি যোগ করুন')}</span>
          </button>
        </div>
      </div>
    </ModalPortal>
  );
};

