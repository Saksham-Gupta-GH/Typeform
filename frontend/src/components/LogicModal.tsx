'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Question } from '@/lib/api';

export interface LogicRule {
  value: string;
  target_id: number | null; // null means 'Next question'
}

interface LogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rules: LogicRule[], alwaysJumpTo: number | null) => void;
  question: Question;
  index: number;
  questions: Question[];
}

export default function LogicModal({ isOpen, onClose, onSave, question, index, questions }: LogicModalProps) {
  const [rules, setRules] = useState<LogicRule[]>([]);
  const [alwaysJumpTo, setAlwaysJumpTo] = useState<number | null>(null);

  // Initialize state from existing settings
  useEffect(() => {
    if (isOpen) {
      const existingRules = question.settings?.logic_jumps || [];
      setRules(existingRules);
      setAlwaysJumpTo(question.settings?.logic_fallback || null);
    }
  }, [isOpen, question]);

  if (!isOpen) return null;

  const getOptions = () => {
    if (question.type === 'multiple_choice' || question.type === 'dropdown') {
      return question.settings?.options || [];
    }
    if (question.type === 'yes_no') {
      return ['Yes', 'No'];
    }
    return []; // other types shouldn't really have branching by value, but we can leave it empty
  };
  
  const options = getOptions();
  
  const subsequentQuestions = questions.slice(index + 1);

  const handleSave = () => {
    onSave(rules, alwaysJumpTo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm text-gray-500 font-normal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                See all rules
              </span>
              <span className="mx-2 text-gray-300">|</span>
              Edit logic for 
              <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-sm">
                {index + 1}
              </span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">Create rules to branch flows or calculate prices</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-700 text-xs font-semibold">
                {index + 1}
              </div>
              <span className="font-medium text-gray-800">{question.title || 'Untitled'}</span>
            </div>

            <div className="space-y-4 mb-4">
              {rules.map((rule, i) => (
                <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-700 w-16">If</span>
                  <select 
                    value={rule.value} 
                    onChange={e => {
                      const newRules = [...rules];
                      newRules[i].value = e.target.value;
                      setRules(newRules);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 bg-white"
                  >
                    <option value="">Select answer...</option>
                    {options.map((opt: string, idx: number) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <span className="text-sm font-medium text-gray-700">then go to</span>
                  <select 
                    value={rule.target_id || ''} 
                    onChange={e => {
                      const newRules = [...rules];
                      newRules[i].target_id = e.target.value ? parseInt(e.target.value) : null;
                      setRules(newRules);
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 bg-white"
                  >
                    <option value="">Next question</option>
                    {subsequentQuestions.map(sq => (
                      <option key={sq.id} value={sq.id}>{sq.order_index + 1}. {sq.title || 'Untitled'}</option>
                    ))}
                  </select>
                  <button onClick={() => setRules(rules.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 w-24">Always go to</span>
              <select 
                value={alwaysJumpTo || ''}
                onChange={e => setAlwaysJumpTo(e.target.value ? parseInt(e.target.value) : null)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 bg-white"
              >
                <option value="">Default (Next question)</option>
                {subsequentQuestions.map(sq => (
                  <option key={sq.id} value={sq.id}>{sq.order_index + 1}. {sq.title || 'Untitled'}</option>
                ))}
              </select>
            </div>

            {options.length > 0 && (
                <button type="button" onClick={() => setRules([...rules, { value: '', target_id: null }])} className="text-gray-500 text-sm font-medium mt-4 flex items-center gap-1 hover:text-gray-900 transition-colors">
                  <Plus size={16} /> Add rule
                </button>
            )}
            {options.length === 0 && (
                <p className="text-xs text-gray-400 mt-4">Branching conditions are only available for multiple choice, dropdown, or yes/no questions.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button 
            onClick={() => { setRules([]); setAlwaysJumpTo(null); }}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors disabled:opacity-50"
            disabled={rules.length === 0 && alwaysJumpTo === null}
          >
            <Trash2 size={16} /> Delete all rules
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
