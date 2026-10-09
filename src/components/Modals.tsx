import React, { useState } from 'react';
import {
  X,
  Calendar,
  Check,
  Trash2,
  Edit3,
  UserPlus,
  User,
  Lock,
  Smartphone,
  Copy,
  CheckCheck,
  Tag,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Transaction, AppUser, TransactionType } from '../types';
import { formatNumberLocale } from '../utils/dateUtils';
import { cleanCategoryName } from '../utils/categoryUtils';

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
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  dateStr,
  transactions,
  onClose,
  onEdit,
  onDelete,
  lang,
  t
}) => {
  if (!dateStr) return null;

  const dayTransactions = transactions.filter(t => t.date === dateStr);
  const totalInc = dayTransactions.reduce((acc, t) => t.type === 'Income' ? acc + (Number(t.value) || 0) : acc, 0);
  const totalExp = dayTransactions.reduce((acc, t) => t.type === 'Expense' ? acc + (Number(t.value) || 0) : acc, 0);
  const net = totalInc - totalExp;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 pb-safe sm:pb-5 shadow-2xl relative border-t sm:border border-slate-700/80 animate-modalSpring max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle indicator */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              {dateStr} {t('Daily Transactions', 'এর বিস্তারিত হিসাব')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Day mini summary KPI */}
        <div className="grid grid-cols-3 gap-2 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 text-center mb-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{t('Income', 'আয়')}</span>
            <span className="text-xs font-bold font-mono text-emerald-400 tabular-nums">
              +{formatNumberLocale(totalInc, lang)} ৳
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{t('Expense', 'খরচ')}</span>
            <span className="text-xs font-bold font-mono text-rose-400 tabular-nums">
              -{formatNumberLocale(totalExp, lang)} ৳
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">{t('Net', 'উদ্বৃত্ত')}</span>
            <span
              className={`text-xs font-bold font-mono tabular-nums ${
                net >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {net >= 0 ? '+' : ''}
              {formatNumberLocale(net, lang)} ৳
            </span>
          </div>
        </div>

        {dayTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            {t('No transactions recorded for this day.', 'এই দিনে কোনো লেনদেন রেকর্ড করা নেই।')}
          </p>
        ) : (
          <div className="space-y-2">
            {dayTransactions.map(tx => {
              const isExpense = tx.type === 'Expense';
              return (
                <div
                  key={tx.id}
                  className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-white truncate">
                      {cleanCategoryName(tx.category, lang)}
                    </div>
                    {tx.note && <div className="text-[11px] text-slate-400 mt-0.5 truncate">{tx.note}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-bold font-mono ${
                        isExpense ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isExpense ? '-' : '+'}
                      {formatNumberLocale(tx.value, lang)} ৳
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit(tx);
                      }}
                      className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 cursor-pointer"
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
                      className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
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
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-safe sm:pb-5 shadow-2xl relative border-t sm:border border-slate-700/80 animate-modalSpring"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">{t('Edit Transaction', 'লেনদেন এডিট')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setType('Expense');
                if (expenseCategories.length > 0) setCategory(expenseCategories[0]);
              }}
              className={`py-2 rounded-xl font-bold cursor-pointer transition-all ${
                type === 'Expense'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
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
              className={`py-2 rounded-xl font-bold cursor-pointer transition-all ${
                type === 'Income'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t('Income', 'আয়')}
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Amount (৳)', 'টাকার পরিমাণ (৳)')}
            </label>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Category', 'ক্যাটাগরি')}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {cleanCategoryName(c, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Date', 'তারিখ')}
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Note', 'বিবরণ')}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md cursor-pointer mt-2 active:scale-98"
          >
            {isSaving ? t('Saving...', 'সেভ হচ্ছে...') : t('Save Changes', 'পরিবর্তন সেভ করুন')}
          </button>
        </form>
      </div>
    </div>
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
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-safe sm:pb-5 shadow-2xl relative border-t sm:border border-slate-700/80 animate-modalSpring text-center space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2 sm:hidden" />

        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">
            {t('Delete Transaction?', 'লেনদেনটি মুছে ফেলতে চান?')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {cleanCategoryName(tx.category, lang)} · {formatNumberLocale(tx.value, lang)} ৳ ({tx.date})
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer active:scale-95"
          >
            {t('Cancel', 'বাতিল')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(tx)}
            disabled={isDeleting}
            className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer active:scale-95"
          >
            {isDeleting ? t('Deleting...', 'মুছে ফেলা হচ্ছে...') : t('Yes, Delete', 'হ্যাঁ, মুছুন')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ========================================================
// 4. CREATE USER MODAL
// ========================================================
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, username: string, pass: string, role: 'admin' | 'member') => void;
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
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password.trim()) {
      setError(t('Please fill all fields', 'সবগুলো তথ্য পূরণ করুন'));
      return;
    }
    onCreate(name.trim(), username.trim().toLowerCase(), password.trim(), role);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-safe sm:pb-5 shadow-2xl relative border-t sm:border border-slate-700/80 animate-modalSpring"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">{t('Create New User', 'নতুন ব্যবহারকারী তৈরি')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {error && <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 text-[11px]">{error}</div>}

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">{t('Full Name', 'পুরো নাম')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">{t('Username', 'ইউজারনেম')}</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 font-mono text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">{t('Password', 'পাসওয়ার্ড')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">{t('Role', 'রোল')}</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="member">{t('Member', 'মেম্বার')}</option>
              <option value="admin">{t('Admin', 'অ্যাডমিন')}</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md cursor-pointer mt-3 active:scale-98"
          >
            {t('Create User Account', 'অ্যাকাউন্ট তৈরি করুন')}
          </button>
        </form>
      </div>
    </div>
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
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-safe sm:pb-5 shadow-2xl relative border-t sm:border border-slate-700/80 animate-modalSpring text-center space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2 sm:hidden" />

        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-white">
            {t('Delete User Account?', 'ইউজার অ্যাকাউন্ট ডিলিট করতে চান?')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            @{user.username} ({user.displayName})
          </p>
          <p className="text-[11px] text-amber-300/80 mt-2">
            {t(
              'This will remove this user from the app. Cloud sheet records remain safe.',
              'অ্যাপ থেকে ইউজারটি মুছে যাবে। তবে গুগল শিটের রেকর্ড সুরক্ষিত থাকবে।'
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer active:scale-95"
          >
            {t('Cancel', 'বাতিল')}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(user)}
            className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer active:scale-95"
          >
            {t('Yes, Delete', 'হ্যাঁ, মুছুন')}
          </button>
        </div>
      </div>
    </div>
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

  const presetEmojis = ['🏷️', '🍔', '🛒', '🚗', '💊', '⚡', '📶', '🎮', '🏠', '✈️', '💼', '🎁', '🎓', '🏥', '💰'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const full = `${emoji} ${name.trim()}`;
    onAdd(full, type);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-safe sm:pb-5 shadow-2xl relative border-t sm:border border-slate-700/80 animate-modalSpring"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              {t('Add New Category', 'নতুন ক্যাটাগরি যোগ')} ({type})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Emoji row */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Pick Emoji Icon', 'ইমোজি বাছাই')}
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800 rounded-xl border border-slate-700 max-h-24 overflow-y-auto">
              {presetEmojis.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center cursor-pointer transition-all ${
                    emoji === em ? 'bg-indigo-600 scale-110' : 'hover:bg-slate-700'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Category Name', 'ক্যাটাগরির নাম')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xl p-2 bg-slate-800 rounded-xl border border-slate-700">{emoji}</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('e.g., Gym, Netflix, Coffee', 'যেমন: জিম, রেস্তোরাঁ, কফি')}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md cursor-pointer mt-2 active:scale-98"
          >
            {t('Add Category', 'ক্যাটাগরি যোগ করুন')}
          </button>
        </form>
      </div>
    </div>
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
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-safe sm:pb-5 shadow-2xl relative border-t sm:border border-slate-700/80 animate-modalSpring text-xs space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2 sm:hidden" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">{t('Mobile App & QR Code', 'মোবাইল অ্যাপ ও QR কোড')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code */}
        <div className="p-3 bg-white rounded-2xl flex flex-col items-center justify-center">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin)}`}
            alt="Mobile App QR Code"
            className="w-36 h-36 rounded-xl"
          />
          <span className="text-[11px] font-bold text-slate-800 mt-2">
            {t('Scan with Phone Camera', 'মোবাইলের ক্যামেরা দিয়ে স্ক্যান করুন')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
        >
          {copied ? <CheckCheck className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? t('Copied Link!', 'লিংক কপি হয়েছে!') : t('Copy App Link', 'অ্যাপের লিংক কপি করুন')}</span>
        </button>

        <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1 text-[11px] text-slate-300">
          <b className="text-white block">{t('Install Instructions:', 'ইন্সটল নির্দেশিকা:')}</b>
          <p>
            {t(
              '1. Open this link in Google Chrome on your phone.\n2. Tap the Chrome menu (⋮) > "Install App" or "Add to Home screen".',
              '১. মোবাইলের Chrome ব্রাউজারে লিংকটি খুলুন।\n২. উপরের ৩ ডট (⋮) মেনু চেপে "Install App" বা "Add to Home screen" চাপুন।'
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// ========================================================
// 8. EDIT PROFILE MODAL
// ========================================================
interface EditProfileModalProps {
  user: AppUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (displayName: string, newPass?: string) => void;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  lang,
  t
}) => {
  if (!isOpen || !user) return null;

  const [displayName, setDisplayName] = useState(user.displayName);
  const [password, setPassword] = useState(user.password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    onSave(displayName.trim(), password.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 text-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 pb-safe sm:pb-5 shadow-2xl relative border-t sm:border border-slate-700/80 animate-modalSpring"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">{t('Edit Profile', 'প্রোফাইল এডিট')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Display Name', 'নাম')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Username (Read-only)', 'ইউজারনেম')}
            </label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-2.5 text-slate-400 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {t('Password', 'পাসওয়ার্ড')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md cursor-pointer mt-3 active:scale-98"
          >
            {t('Save Profile Changes', 'পরিবর্তন সেভ করুন')}
          </button>
        </form>
      </div>
    </div>
  );
};
