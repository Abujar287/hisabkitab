import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  FileText,
  Delete,
  Check,
  X,
  Plus,
  Wifi,
  Zap,
  Pill,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  Home,
  User,
  Users,
  Heart,
  Coffee,
  Flame,
  Moon,
  Monitor,
  Key,
  Armchair,
  Navigation,
  PiggyBank,
  Handshake,
  MoreHorizontal,
  Apple,
  Wallet,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { TransactionType } from '../types';
import { cleanCategoryName, getCategoryEmoji } from '../utils/categoryUtils';
import { evaluateExpression } from '../utils/calcUtils';
import { formatNumberLocale } from '../utils/dateUtils';

interface EntryTabProps {
  entryType: TransactionType;
  setEntryType: (type: TransactionType) => void;
  entryCategory: string;
  setEntryCategory: (cat: string) => void;
  entryDate: string;
  setEntryDate: (date: string) => void;
  entryNote: string;
  setEntryNote: (note: string) => void;
  calcDisplay: string;
  setCalcDisplay: (val: string) => void;
  expenseCategories: string[];
  incomeCategories: string[];
  onOpenCategoryManager: () => void;
  onSubmit: (evaluatedAmount?: number) => Promise<void>;
  isSubmitting: boolean;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

// Icon mapper matching the screenshot circular categories
const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  const lower = category.toLowerCase();

  if (lower.includes('saving') || lower.includes('সঞ্চয়')) return <PiggyBank className="w-5 h-5" />;
  if (lower.includes('gas') || lower.includes('গ্যাস')) return <Flame className="w-5 h-5" />;
  if (lower.includes('travel') || lower.includes('transport') || lower.includes('যাতায়াত') || lower.includes('ভ্রমণ')) return <Navigation className="w-5 h-5" />;
  if (lower.includes('wifi') || lower.includes('ওয়াইফাই')) return <Wifi className="w-5 h-5" />;
  if (lower.includes('electricity') || lower.includes('বিদ্যুৎ')) return <Zap className="w-5 h-5" />;
  if (lower.includes('relative') || lower.includes('আত্মীয়')) return <Users className="w-5 h-5" />;
  if (lower.includes('medicine') || lower.includes('ঔষধ')) return <Pill className="w-5 h-5" />;
  if (lower.includes('room rent') || lower.includes('রুম ভাড়া')) return <Key className="w-5 h-5" />;
  if (lower.includes('accessories') || lower.includes('সামগ্রী')) return <Armchair className="w-5 h-5" />;
  if (lower.includes('bajar') || lower.includes('bazar') || lower.includes('বাজার')) return <ShoppingBag className="w-5 h-5" />;
  if (lower.includes('family') || lower.includes('পারিবারিক')) return <Users className="w-5 h-5" />;
  if (lower.includes('mr & mrs') || lower.includes('দাম্পত্য')) return <Heart className="w-5 h-5" />;
  if (lower.includes('eid') || lower.includes('ঈদ')) return <Moon className="w-5 h-5" />;
  if (lower.includes('official') || lower.includes('অফিস')) return <Monitor className="w-5 h-5" />;
  if (lower.includes('fruit') || lower.includes('ফল')) return <Apple className="w-5 h-5" />;
  if (lower.includes('hangout') || lower.includes('আড্ডা')) return <Coffee className="w-5 h-5" />;
  if (lower.includes('ধার দিয়েছি') || lower.includes('lent')) return <Handshake className="w-5 h-5" />;
  if (lower.includes('ধার শোধ') || lower.includes('repaid')) return <CheckCircle2 className="w-5 h-5" />;
  if (lower.includes('personal') || lower.includes('পার্সোনাল')) return <User className="w-5 h-5" />;
  if (lower.includes('shopping') || lower.includes('শপিং') || lower.includes('কেনাকাটা')) return <ShoppingCart className="w-5 h-5" />;
  if (lower.includes('food') || lower.includes('খাবার')) return <Utensils className="w-5 h-5" />;
  if (lower.includes('home') || lower.includes('বাসা') || lower.includes('house')) return <Home className="w-5 h-5" />;
  if (lower.includes('salary') || lower.includes('বেতন')) return <Wallet className="w-5 h-5" />;
  if (lower.includes('loan') || lower.includes('ধার')) return <Handshake className="w-5 h-5" />;

  // Emoji or fallback icon
  const emoji = getCategoryEmoji(category);
  if (emoji && emoji !== '🏷️') {
    return <span className="text-xl leading-none">{emoji}</span>;
  }

  return <Tag className="w-5 h-5" />;
};

export const EntryTab: React.FC<EntryTabProps> = ({
  entryType,
  setEntryType,
  entryCategory,
  setEntryCategory,
  entryDate,
  setEntryDate,
  entryNote,
  setEntryNote,
  calcDisplay,
  setCalcDisplay,
  expenseCategories,
  incomeCategories,
  onOpenCategoryManager,
  onSubmit,
  isSubmitting,
  lang,
  t
}) => {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);

  useEffect(() => {
    if (isCalculatorOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCalculatorOpen]);

  const currentCategories = entryType === 'Expense' ? expenseCategories : incomeCategories;

  // Handle Category Click -> Sets category & Opens Calculator
  const handleSelectCategory = (cat: string) => {
    setEntryCategory(cat);
    setIsCalculatorOpen(true);
  };

  // Calculator Keypad operations
  const handleKeyClick = (key: string) => {
    if (key === 'C') {
      setCalcDisplay('0');
      return;
    }
    if (key === 'DEL') {
      if (calcDisplay.length <= 1) {
        setCalcDisplay('0');
      } else {
        setCalcDisplay(calcDisplay.slice(0, -1));
      }
      return;
    }

    if (key === '✓') {
      handleSaveTransaction();
      return;
    }

    if (key === '=') {
      const res = evaluateExpression(calcDisplay);
      setCalcDisplay(String(res));
      return;
    }

    // Mathematical operators +, -, *, /
    if (['+', '-', '*', '/'].includes(key)) {
      const lastChar = calcDisplay.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        setCalcDisplay(calcDisplay.slice(0, -1) + key);
      } else {
        setCalcDisplay(calcDisplay + key);
      }
      return;
    }

    // Number or dot
    if (calcDisplay === '0' && key !== '.') {
      setCalcDisplay(key);
    } else {
      if (key === '.') {
        const parts = calcDisplay.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) return;
      }
      if (calcDisplay.length < 15) {
        setCalcDisplay(calcDisplay + key);
      }
    }
  };

  const handleSaveTransaction = async () => {
    const evaluated = evaluateExpression(calcDisplay);
    if (evaluated > 0) {
      setCalcDisplay(String(evaluated));
    }
    await onSubmit(evaluated > 0 ? evaluated : undefined);
    setIsCalculatorOpen(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-3.5 animate-fadeIn pb-12 select-none">
      {/* 1. Header Bar: Cancel | Add | Settings */}
      <div className="flex items-center justify-between px-1 pt-1 pb-0.5">
        <button
          type="button"
          onClick={() => {
            setCalcDisplay('0');
            setEntryNote('');
          }}
          className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {t('Clear', 'ক্লিয়ার')}
        </button>

        <h2 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
          {t('Add', 'যোগ করুন')}
        </h2>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onOpenCategoryManager}
            className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 active:scale-95"
            title={t('Add Category', 'নতুন ক্যাটাগরি')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('Add Category', 'ক্যাটাগরি')}</span>
          </button>
        </div>
      </div>

      {/* 2. Type Selector Tabs: Expense | Income */}
      <div className="bg-slate-800 border border-slate-700/60 p-1 rounded-xl grid grid-cols-2 gap-1 shadow-md">
        <button
          type="button"
          onClick={() => {
            setEntryType('Expense');
            if (expenseCategories.length > 0) setEntryCategory(expenseCategories[0]);
          }}
          className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
            entryType === 'Expense'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('Expense', 'খরচ')}
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryType('Income');
            if (incomeCategories.length > 0) setEntryCategory(incomeCategories[0]);
          }}
          className={`py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
            entryType === 'Income'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('Income', 'আয়')}
        </button>
      </div>

      {/* 3. Circular 4-Column Category Grid */}
      <div className="grid grid-cols-4 gap-y-4 gap-x-2 pt-1">
        {currentCategories.map(cat => {
          const isSelected = entryCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleSelectCategory(cat)}
              className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
            >
              {/* Circular Icon Container */}
              <div
                className={`w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isSelected
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-800 scale-105'
                    : 'bg-slate-800 border border-slate-700/70 text-slate-300 group-hover:border-slate-500 group-hover:bg-slate-750 group-hover:text-white'
                }`}
              >
                <CategoryIcon category={cat} />
              </div>

              {/* Category Name Underneath: slightly smaller font */}
              <span className="text-[10px] sm:text-[10.5px] font-medium text-slate-300 group-hover:text-white text-center leading-tight max-w-[76px] truncate mt-1.5">
                {cleanCategoryName(cat, lang)}
              </span>
            </button>
          );
        })}

        {/* Plus / Settings Button at the end of grid */}
        <button
          type="button"
          onClick={onOpenCategoryManager}
          className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
        >
          <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full bg-slate-800/80 border border-dashed border-slate-600 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-400 transition-all shadow-sm">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-medium text-slate-400 group-hover:text-indigo-300 text-center leading-tight mt-1.5">
            {t('Category', 'ক্যাটাগরি')}
          </span>
        </button>
      </div>

      {/* 4. Compact Calculator Bottom Sheet (Opens directly at viewport bottom via portal, zero scrolling) */}
      {isCalculatorOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
            onClick={() => setIsCalculatorOpen(false)}
          >
            <div
              className="bg-slate-800 text-slate-100 w-full max-w-md rounded-t-3xl sm:rounded-2xl p-3.5 sm:p-4 border-t sm:border border-slate-700/80 shadow-2xl space-y-2.5 animate-slideUp overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header: Category + Date + Close (Compact single row) */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${
                    entryType === 'Expense' ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}>
                    <CategoryIcon category={entryCategory} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white truncate block max-w-[120px]">
                      {cleanCategoryName(entryCategory, lang)}
                    </span>
                    <span className={`text-[9px] font-bold uppercase leading-none block ${
                      entryType === 'Expense' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {entryType === 'Expense' ? t('Expense', 'খরচ') : t('Income', 'আয়')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-800 border border-slate-700/60 rounded-lg px-2 py-1">
                    <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                    <input
                      type="date"
                      value={entryDate}
                      onChange={e => setEntryDate(e.target.value)}
                      className="bg-transparent text-[10.5px] font-semibold text-slate-200 focus:outline-none cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalculatorOpen(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Note input & Amount Display (Compact) */}
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={entryNote}
                  onChange={e => setEntryNote(e.target.value)}
                  placeholder={t('Add note (optional)...', 'নোট লিখুন (ঐচ্ছিক)...')}
                  className="w-full bg-slate-800/80 border border-slate-700/50 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none placeholder:text-slate-500"
                />

                <div className="bg-slate-800/90 rounded-xl px-3 py-1.5 border border-slate-700/60 flex items-baseline justify-between shadow-inner">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('Amount', 'পরিমাণ')}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    {/[+\-*/]/.test(calcDisplay) && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        = {formatNumberLocale(evaluateExpression(calcDisplay), lang)}
                      </span>
                    )}
                    <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                      entryType === 'Expense' ? 'text-white' : 'text-emerald-400'
                    }`}>
                      {calcDisplay}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4x4 Calculator Keypad with Integrated Save (✓) Key */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50">
                {['7', '8', '9', 'DEL', '4', '5', '6', '+', '1', '2', '3', '-', 'C', '0', '.', '✓'].map(key => {
                  const isSave = key === '✓';
                  const isAction = key === 'C' || key === 'DEL' || key === '+' || key === '-';

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeyClick(key)}
                      disabled={isSave && isSubmitting}
                      className={`h-11 sm:h-12 rounded-xl text-base font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 select-none ${
                        isSave
                          ? entryType === 'Expense'
                            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                          : key === 'C'
                          ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20'
                          : key === 'DEL'
                          ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/20'
                          : isAction
                          ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/20'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700/40 shadow-sm'
                      }`}
                    >
                      {key === 'DEL' ? (
                        <Delete className="w-4 h-4" />
                      ) : isSave ? (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        key
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
