import React, { useState } from 'react';
import {
  PlusCircle,
  Calendar,
  FileText,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Delete,
  Check
} from 'lucide-react';
import { TransactionType } from '../types';
import { cleanCategoryName } from '../utils/categoryUtils';

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
  onOpenAddCategoryModal: (type: TransactionType) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  lang: 'en' | 'bn';
  t: (en: string, bn: string) => string;
}

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
  onOpenAddCategoryModal,
  onSubmit,
  isSubmitting,
  lang,
  t
}) => {
  const currentCategories = entryType === 'Expense' ? expenseCategories : incomeCategories;

  // Keypad operations
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

    if (key === '+100' || key === '+500' || key === '+1000') {
      const added = Number(key.replace('+', ''));
      const curr = parseFloat(calcDisplay) || 0;
      setCalcDisplay(String(curr + added));
      return;
    }

    // Number or dot
    if (calcDisplay === '0' && key !== '.') {
      setCalcDisplay(key);
    } else {
      // Prevent multiple dots
      if (key === '.' && calcDisplay.includes('.')) return;
      if (calcDisplay.length < 10) {
        setCalcDisplay(calcDisplay + key);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fadeIn pb-12">
      {/* Type Toggle: Expense vs Income */}
      <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-lg">
        <button
          type="button"
          onClick={() => {
            setEntryType('Expense');
            if (expenseCategories.length > 0) {
              setEntryCategory(expenseCategories[0]);
            }
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            entryType === 'Expense'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>{t('Expense (খরচ)', 'খরচ (Expense)')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryType('Income');
            if (incomeCategories.length > 0) {
              setEntryCategory(incomeCategories[0]);
            }
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            entryType === 'Income'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{t('Income (আয়)', 'আয় (Income)')}</span>
        </button>
      </div>

      {/* Amount Display */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl text-center space-y-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          {entryType === 'Expense' ? t('Expense Amount', 'খরচের পরিমাণ') : t('Income Amount', 'আয়ের পরিমাণ')}
        </span>
        <div className="flex items-baseline justify-center gap-1 font-mono">
          <span
            className={`text-4xl sm:text-5xl font-extrabold tracking-tight tabular-nums ${
              entryType === 'Expense' ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {calcDisplay}
          </span>
        </div>
      </div>

      {/* Quick Add Presets */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleKeyClick('+100')}
          className="min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs sm:text-sm font-mono font-bold border border-slate-700/80 transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-sm"
        >
          +100
        </button>
        <button
          type="button"
          onClick={() => handleKeyClick('+500')}
          className="min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs sm:text-sm font-mono font-bold border border-slate-700/80 transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-sm"
        >
          +500
        </button>
        <button
          type="button"
          onClick={() => handleKeyClick('+1000')}
          className="min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs sm:text-sm font-mono font-bold border border-slate-700/80 transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-sm"
        >
          +1,000
        </button>
      </div>

      {/* Calculator Keypad */}
      <div className="grid grid-cols-4 gap-2 bg-slate-900 p-3 sm:p-4 rounded-3xl border border-slate-800 shadow-xl">
        {['7', '8', '9', 'C', '4', '5', '6', 'DEL', '1', '2', '3', '+', '0', '00', '.', '='].map(key => {
          const isAction = key === 'C' || key === 'DEL' || key === '+' || key === '=';
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === '=') {
                  // Simply evaluate or finish
                  return;
                }
                handleKeyClick(key);
              }}
              className={`min-h-[48px] sm:min-h-[52px] rounded-xl text-base sm:text-lg font-mono font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 select-none ${
                key === 'C'
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                  : key === 'DEL'
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                  : isAction
                  ? 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700/80'
              }`}
            >
              {key === 'DEL' ? <Delete className="w-5 h-5" /> : key}
            </button>
          );
        })}
      </div>

      {/* Category Selection */}
      <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white">
            <Tag className="w-4 h-4 text-indigo-400" />
            <span>{t('Select Category', 'ক্যাটাগরি বাছাই করুন')}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenAddCategoryModal(entryType)}
            className="min-h-[38px] px-2.5 py-1 rounded-xl text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('Add New', 'নতুন যোগ')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
          {currentCategories.map(cat => {
            const isSelected = entryCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setEntryCategory(cat)}
                className={`min-h-[46px] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer border text-left active:scale-98 ${
                  isSelected
                    ? entryType === 'Expense'
                      ? 'bg-rose-600/20 border-rose-500 text-rose-200 font-bold ring-1 ring-rose-500 shadow-sm'
                      : 'bg-emerald-600/20 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700/80 text-slate-300'
                }`}
              >
                <span className="truncate">{cleanCategoryName(cat, lang)}</span>
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? entryType === 'Expense'
                        ? 'border-rose-400 bg-rose-500 text-white'
                        : 'border-emerald-400 bg-emerald-500 text-white'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date & Note Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Date Input */}
        <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-1.5">
          <label className="text-[11px] sm:text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('Transaction Date', 'তারিখ')}</span>
          </label>
          <input
            type="date"
            value={entryDate}
            onChange={e => setEntryDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-base sm:text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer min-h-[44px]"
          />
        </div>

        {/* Note Input */}
        <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 shadow-lg space-y-1.5">
          <label className="text-[11px] sm:text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('Note (Optional)', 'বিবরণ (ঐচ্ছিক)')}</span>
          </label>
          <input
            type="text"
            value={entryNote}
            onChange={e => setEntryNote(e.target.value)}
            placeholder={t('e.g., Grocery shopping, Uber, etc.', 'যেমন: বাজার খরচ, উবার ভাড়া ইত্যাদি')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-base sm:text-xs text-slate-100 focus:outline-none focus:border-indigo-500 min-h-[44px]"
          />
        </div>
      </div>

      {/* Submit Action Button */}
      <button
        type="button"
        onClick={handleFormSubmit}
        disabled={isSubmitting}
        className={`w-full min-h-[50px] py-3.5 rounded-2xl text-sm sm:text-base font-bold shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
          entryType === 'Expense'
            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
        } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <Check className="w-5 h-5" />
        <span>
          {isSubmitting
            ? t('Saving & Syncing...', 'সেভ ও সিঙ্ক হচ্ছে...')
            : entryType === 'Expense'
            ? t('Save Expense Entry', 'খরচ যোগ করুন')
            : t('Save Income Entry', 'আয় যোগ করুন')}
        </span>
      </button>
    </div>
  );
};
