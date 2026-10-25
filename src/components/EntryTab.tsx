import React, { useState } from 'react';
import {
  PlusCircle,
  Calendar,
  FileText,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Delete,
  Check,
  Equal
} from 'lucide-react';
import { TransactionType } from '../types';
import { cleanCategoryName } from '../utils/categoryUtils';
import { evaluateExpression } from '../utils/calcUtils';

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
  onSubmit: (evaluatedAmount?: number) => Promise<void>;
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

    if (key === '=') {
      const res = evaluateExpression(calcDisplay);
      setCalcDisplay(String(res));
      return;
    }

    if (key === '+100' || key === '+500' || key === '+1000') {
      const added = Number(key.replace('+', ''));
      const curr = evaluateExpression(calcDisplay);
      setCalcDisplay(String(curr + added));
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

    if (key === '00') {
      if (calcDisplay === '0') return;
      if (calcDisplay.length < 12) setCalcDisplay(calcDisplay + '00');
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluated = evaluateExpression(calcDisplay);
    if (evaluated > 0) {
      setCalcDisplay(String(evaluated));
    }
    onSubmit(evaluated > 0 ? evaluated : undefined);
  };

  return (
    <div className="max-w-xl mx-auto space-y-3 animate-fadeIn pb-8">
      {/* Type Toggle: Expense vs Income */}
      <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700/50 shadow-md">
        <button
          type="button"
          onClick={() => {
            setEntryType('Expense');
            if (expenseCategories.length > 0) {
              setEntryCategory(expenseCategories[0]);
            }
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            entryType === 'Expense'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>{t('Expense', 'খরচ')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEntryType('Income');
            if (incomeCategories.length > 0) {
              setEntryCategory(incomeCategories[0]);
            }
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            entryType === 'Income'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{t('Income', 'আয়')}</span>
        </button>
      </div>

      {/* Amount Display */}
      <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700/50 shadow-lg text-center space-y-0.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
          {entryType === 'Expense' ? t('Expense Amount', 'খরচের পরিমাণ') : t('Income Amount', 'আয়ের পরিমাণ')}
        </span>
        <div className="flex flex-col items-center justify-center gap-0.5">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
              entryType === 'Expense' ? 'text-white' : 'text-emerald-400'
            }`}
          >
            {calcDisplay}
          </span>
          {/[+\-*/]/.test(calcDisplay) && (
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400">
              = {evaluateExpression(calcDisplay)}
            </span>
          )}
        </div>
      </div>

      {/* Quick Add Presets */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => handleKeyClick('+100')}
          className="py-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-200 text-[11px]  font-bold border border-slate-700/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-sm"
        >
          +100
        </button>
        <button
          type="button"
          onClick={() => handleKeyClick('+500')}
          className="py-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-200 text-[11px]  font-bold border border-slate-700/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-sm"
        >
          +500
        </button>
        <button
          type="button"
          onClick={() => handleKeyClick('+1000')}
          className="py-1.5 rounded-lg bg-slate-750 hover:bg-slate-700 text-slate-200 text-[11px]  font-bold border border-slate-700/50 transition-all cursor-pointer active:scale-95 flex items-center justify-center shadow-sm"
        >
          +1,000
        </button>
      </div>

      {/* Calculator Keypad */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-800 p-2 sm:p-3 rounded-2xl border border-slate-700/50 shadow-lg">
        {['7', '8', '9', 'C', '4', '5', '6', 'DEL', '1', '2', '3', '+', '0', '00', '.', '='].map(key => {
          const isAction = key === 'C' || key === 'DEL' || key === '+' || key === '=';
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleKeyClick(key)}
              className={`min-h-[40px] sm:min-h-[46px] rounded-lg text-sm sm:text-base  font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 select-none ${
                key === 'C'
                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                  : key === 'DEL'
                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                  : isAction
                  ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/20'
                  : 'bg-slate-750 hover:bg-slate-700 text-slate-100 border border-slate-700/40'
              }`}
            >
              {key === 'DEL' ? <Delete className="w-4 h-4" /> : key}
            </button>
          );
        })}
      </div>

      {/* Category Selection */}
      <div className="bg-slate-800 rounded-2xl p-3 sm:p-4 border border-slate-700/50 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] font-bold text-white uppercase tracking-tight">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t('Category', 'ক্যাটাগরি')}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenAddCategoryModal(entryType)}
            className="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
          >
            <Plus className="w-3 h-3" />
            <span>{t('New', 'নতুন')}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5 no-scrollbar">
          {currentCategories.map(cat => {
            const isSelected = entryCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setEntryCategory(cat)}
                className={`min-h-[36px] px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-between gap-1.5 cursor-pointer border text-left active:scale-98 ${
                  isSelected
                    ? entryType === 'Expense'
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-300 font-bold'
                      : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-bold'
                    : 'bg-slate-750/50 hover:bg-slate-750 border-slate-700/30 text-slate-400'
                }`}
              >
                <span className="truncate">{cleanCategoryName(cat, lang)}</span>
                {isSelected && (
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    entryType === 'Expense' ? 'bg-rose-400' : 'bg-emerald-400'
                  }`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date & Note Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Date Input */}
        <div className="bg-slate-800 rounded-xl p-2.5 border border-slate-700/50 shadow-md space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            <span>{t('Date', 'তারিখ')}</span>
          </label>
          <input
            type="date"
            value={entryDate}
            onChange={e => setEntryDate(e.target.value)}
            className="w-full bg-slate-750 border border-slate-700/50 rounded-lg p-1.5 text-[11px] font-semibold text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer min-h-[36px]"
          />
        </div>

        {/* Note Input */}
        <div className="bg-slate-800 rounded-xl p-2.5 border border-slate-700/50 shadow-md space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <FileText className="w-3 h-3 text-indigo-400" />
            <span>{t('Note', 'বিবরণ')}</span>
          </label>
          <input
            type="text"
            value={entryNote}
            onChange={e => setEntryNote(e.target.value)}
            placeholder={t('Optional', 'ঐচ্ছিক')}
            className="w-full bg-slate-750 border border-slate-700/50 rounded-lg p-1.5 text-[11px] text-slate-100 focus:outline-none focus:border-indigo-500 min-h-[36px]"
          />
        </div>
      </div>

      {/* Submit Action Button */}
      <button
        type="button"
        onClick={handleFormSubmit}
        disabled={isSubmitting}
        className={`w-full py-3 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
          entryType === 'Expense'
            ? 'bg-rose-600 hover:bg-rose-500 text-white'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
        } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <Check className="w-4 h-4" />
        <span>
          {isSubmitting
            ? t('Saving...', 'সেভ হচ্ছে...')
            : entryType === 'Expense'
            ? t('Save Expense', 'খরচ যোগ করুন')
            : t('Save Income', 'আয় যোগ করুন')}
        </span>
      </button>
    </div>
  );
};
