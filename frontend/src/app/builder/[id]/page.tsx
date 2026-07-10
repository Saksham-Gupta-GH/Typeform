'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, Plus, GripVertical, Trash2, Smartphone, ChevronDown, Sparkles, X, 
  ChevronRight, HelpCircle, LayoutList, Share2, Diamond, Mic, Send, Play,
  RotateCcw, RefreshCw, Monitor
} from 'lucide-react';
import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion, reorderQuestions, Question, fetchForms, updateForm } from '../../../lib/api';
import { generateFormWithAI } from '../../../lib/openrouter';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ──────────────────────────────────────────────────────────────
// Question type helpers
// ──────────────────────────────────────────────────────────────
const TYPE_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  short_text:      { label: 'Short Text',      color: '#3b82f6', bg: '#dbeafe', icon: '—' },
  long_text:       { label: 'Long Text',        color: '#3b82f6', bg: '#dbeafe', icon: '≡' },
  multiple_choice: { label: 'Multiple Choice',  color: '#a855f7', bg: '#f3e8ff', icon: '☰' },
  dropdown:        { label: 'Dropdown',         color: '#8b5cf6', bg: '#ede9fe', icon: '▾' },
  email:           { label: 'Email',            color: '#ec4899', bg: '#fce7f3', icon: '@' },
  phone_number:    { label: 'Phone Number',     color: '#ec4899', bg: '#fce7f3', icon: '✆' },
  number:          { label: 'Number',           color: '#f59e0b', bg: '#fef3c7', icon: '#' },
  yes_no:          { label: 'Yes/No',           color: '#6366f1', bg: '#e0e7ff', icon: '?' },
  rating:          { label: 'Rating',           color: '#10b981', bg: '#d1fae5', icon: '★' },
  date:            { label: 'Date',             color: '#f59e0b', bg: '#fef3c7', icon: '📅' },
  statement:       { label: 'Statement',        color: '#64748b', bg: '#f1f5f9', icon: '"' },
};

function TypeIcon({ type, size = 'sm' }: { type: string; size?: 'sm' | 'lg' }) {
  const m = TYPE_META[type] || { color: '#94a3b8', bg: '#f1f5f9', icon: '?' };
  const dim = size === 'lg' ? 'w-8 h-8 text-sm' : 'w-6 h-6 text-xs';
  return (
    <div className={`${dim} rounded flex items-center justify-center font-bold flex-shrink-0`}
      style={{ backgroundColor: m.bg, color: m.color }}>
      {m.icon}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sortable sidebar item
// ──────────────────────────────────────────────────────────────
interface SortableItemProps {
  id: number;
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
}

function SortableQuestionItem({ id, question, index, isSelected, onSelect, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(id)}
      className={`group flex items-center p-2.5 rounded-lg cursor-pointer transition-colors mb-1.5 border ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50 border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab mr-1 flex-shrink-0 text-gray-300 hover:text-gray-500">
        <GripVertical size={14} />
      </div>
      <div className="flex-shrink-0 mr-2.5">
        <TypeIcon type={question.type} />
      </div>
      <span className="text-sm text-gray-700 flex-shrink-0 font-medium w-4 mr-2 text-gray-400">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <span className={`text-sm truncate block ${isSelected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {question.title || 'Untitled'}
        </span>
      </div>
      <button onClick={(e) => onDelete(id, e)} className="p-1 flex-shrink-0 ml-1">
        <Trash2 size={13} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Add Content Modal  
// ──────────────────────────────────────────────────────────────
const ELEMENT_CATEGORIES = [
  {
    name: 'Recommended',
    items: [
      { type: 'short_text', label: 'Short Text' },
      { type: 'multiple_choice', label: 'Multiple Choice' },
    ],
  },
  {
    name: 'Contact info',
    items: [
      { type: 'email', label: 'Email' },
      { type: 'phone_number', label: 'Phone Number' },
    ],
  },
  {
    name: 'Choice',
    items: [
      { type: 'multiple_choice', label: 'Multiple Choice' },
      { type: 'dropdown', label: 'Dropdown' },
      { type: 'yes_no', label: 'Yes/No' },
    ],
  },
  {
    name: 'Text & Video',
    items: [
      { type: 'long_text', label: 'Long Text' },
      { type: 'short_text', label: 'Short Text' },
      { type: 'statement', label: 'Statement' },
    ],
  },
  {
    name: 'Other',
    items: [
      { type: 'number', label: 'Number' },
      { type: 'date', label: 'Date' },
      { type: 'rating', label: 'Rating' },
    ],
  },
];

const AI_TEMPLATES = [
  { label: 'Lead qualification form', desc: 'Qualify your leads with AI-generated questions and scoring rules.' },
  { label: 'Product recommendation quiz', desc: 'Boost sales by recommending products with AI-generated questions and matching rules.' },
  { label: 'Personality quiz', desc: 'Show different results based on answers with AI-generated questions and matching rules.' },
];

interface AddContentModalProps {
  onClose: () => void;
  onAddElement: (type: string) => void;
  onGenerateWithAI: (prompt: string) => Promise<void>;
}

function AddContentModal({ onClose, onAddElement, onGenerateWithAI }: AddContentModalProps) {
  const [tab, setTab] = useState<'elements' | 'import' | 'ai'>('elements');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [importText, setImportText] = useState('');

  async function handleAiGenerate() {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      await onGenerateWithAI(aiPrompt);
      onClose();
    } finally {
      setAiLoading(false);
    }
  }

  async function handleImport() {
    const lines = importText.split('\n').filter(l => l.trim());
    for (const line of lines) {
      await onAddElement('short_text');
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[760px] max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200 px-6 pt-4">
          <button onClick={() => setTab('elements')} className={`pb-3 mr-6 text-sm font-medium border-b-2 transition-colors ${tab === 'elements' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Add form elements
          </button>
          <button onClick={() => setTab('import')} className={`pb-3 mr-6 text-sm font-medium border-b-2 transition-colors ${tab === 'import' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Import questions
          </button>
          <button onClick={() => setTab('ai')} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'ai' ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Create with AI
          </button>
          <button onClick={onClose} className="ml-auto mb-3 text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'elements' && (
            <div className="p-6 grid grid-cols-3 gap-6">
              {ELEMENT_CATEGORIES.map(cat => (
                <div key={cat.name}>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat.name}</h4>
                  <div className="space-y-2">
                    {cat.items.map(item => (
                      <button
                        key={item.type + item.label}
                        onClick={() => { onAddElement(item.type); onClose(); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors border border-transparent hover:border-gray-200"
                      >
                        <TypeIcon type={item.type} />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'import' && (
            <div className="p-6 flex gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-3">Form questions</label>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="Copy and paste or type in your questions, and press enter after each one."
                  className="w-full h-64 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-blue-400 resize-none text-gray-700 placeholder-gray-400"
                />
              </div>
              <div className="w-64">
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="w-8 h-8 border-2 border-blue-400 rounded-full flex items-center justify-center mb-3">
                    <span className="text-blue-600 font-bold text-sm">i</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                    <li>Paste or type your questions in the text field</li>
                    <li>Or try Create with AI to build your form from a description, file upload, or URL</li>
                  </ul>
                </div>
                <button onClick={() => setTab('ai')} className="w-full border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Create with AI
                </button>
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="p-6">
              <div className="flex gap-8">
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Typeform AI</p>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">What would you like to create?</h2>
                </div>
              </div>
              <div className="border-2 border-purple-300 rounded-xl p-4 mb-6 focus-within:border-purple-500 transition-colors">
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Personalize the form with the customer's name."
                  className="w-full min-h-[100px] outline-none text-sm text-gray-700 resize-none placeholder-gray-400 bg-transparent"
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAiGenerate(); }}
                />
                <div className="flex items-center gap-3 mt-2 pt-3 border-t border-gray-100">
                  <button className="text-gray-400 hover:text-gray-600"><Mic size={16}/></button>
                  <button className="text-gray-400 hover:text-gray-600"><Plus size={16}/></button>
                  <button className="text-gray-400 hover:text-gray-600 font-bold tracking-wider">•••</button>
                  <div className="flex-1"/>
                  <button
                    onClick={handleAiGenerate}
                    disabled={!aiPrompt.trim() || aiLoading}
                    className="text-gray-300 hover:text-purple-600 disabled:opacity-30 transition-colors"
                  >
                    {aiLoading ? (
                      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/>
                    ) : (
                      <Send size={16}/>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {AI_TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => setAiPrompt(t.desc)}
                    className="w-full flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={18} className="text-gray-500"/>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {tab === 'import' && (
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-40 transition-colors"
            >
              Import questions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Canvas preview per question type
// ──────────────────────────────────────────────────────────────
function QuestionPreview({ question, isWelcome }: { question: Question | null; isWelcome?: boolean }) {
  if (!question) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400 text-sm">Select a question to preview</p>
      </div>
    );
  }

  if (isWelcome) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-16 text-center">
        <h1 className="text-4xl font-semibold text-gray-900 mb-4">{question.title || 'Form Title'}</h1>
        {question.description && <p className="text-lg text-gray-500 mb-8 max-w-md">{question.description}</p>}
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded text-lg transition-colors shadow-sm">start</button>
        <p className="text-gray-400 text-xs mt-3 flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Takes X minutes
        </p>
      </div>
    );
  }

  const type = question.type;
  const options = question.settings?.options || [];

  return (
    <div className="flex flex-col justify-center px-16 py-12 h-full max-w-2xl mx-auto">
      {question.description && (
        <p className="text-sm text-gray-500 mb-4">{question.description}</p>
      )}
      <h2 className="text-3xl font-semibold text-gray-900 mb-8">{question.title || 'Untitled question'}</h2>

      {(type === 'short_text' || type === 'email' || type === 'phone_number') && (
        <div className="border-b-2 border-blue-500 py-2">
          <input type="text" placeholder={type === 'email' ? 'name@example.com' : 'Type your answer here...'} className="w-full outline-none text-gray-400 text-lg bg-transparent pointer-events-none" readOnly />
        </div>
      )}

      {type === 'long_text' && (
        <div className="border-b-2 border-blue-500 py-2">
          <textarea placeholder="Type your answer here..." className="w-full outline-none text-gray-400 text-lg bg-transparent h-20 resize-none pointer-events-none" readOnly />
        </div>
      )}

      {type === 'number' && (
        <div className="border-b-2 border-blue-500 py-2">
          <input type="number" placeholder="Type a number..." className="w-full outline-none text-gray-400 text-lg bg-transparent pointer-events-none" readOnly />
        </div>
      )}

      {(type === 'multiple_choice' || type === 'dropdown') && (
        <div className="space-y-3">
          {options.length > 0 ? options.map((opt, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center text-xs font-medium text-gray-500 flex-shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-gray-700">{opt}</span>
            </div>
          )) : (
            <p className="text-gray-400 text-sm">Add choices in the settings panel →</p>
          )}
        </div>
      )}

      {type === 'yes_no' && (
        <div className="flex gap-4">
          <button className="flex-1 flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-colors">
            <span className="text-2xl">👍</span>
            <span className="font-medium">Yes</span>
          </button>
          <button className="flex-1 flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 transition-colors">
            <span className="text-2xl">👎</span>
            <span className="font-medium">No</span>
          </button>
        </div>
      )}

      {type === 'rating' && (
        <div className="flex gap-3">
          {Array.from({ length: question.settings?.max || 5 }, (_, i) => (
            <button key={i} className="w-12 h-12 border-2 border-gray-200 rounded-xl flex items-center justify-center text-xl hover:border-yellow-400 hover:text-yellow-500 transition-colors text-gray-300">
              ★
            </button>
          ))}
        </div>
      )}

      {type === 'date' && (
        <div className="border-b-2 border-blue-500 py-2">
          <input type="date" className="outline-none text-gray-400 text-lg bg-transparent pointer-events-none" readOnly />
        </div>
      )}

      {type === 'statement' && (
        <div className="text-gray-600 text-lg leading-relaxed">{question.description || 'This is a statement block. Use the description field to add text.'}</div>
      )}

      <div className="mt-8">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded transition-colors text-sm">OK ✓</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Right Sidebar Settings
// ──────────────────────────────────────────────────────────────
function RightSidebar({ question, onChange, isWelcome }: {
  question: Question | null;
  onChange: (updates: Partial<Question>) => void;
  isWelcome?: boolean;
}) {
  const [buttonText, setButtonText] = useState('start');

  if (!question) {
    return (
      <aside className="w-[300px] bg-white border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Select a question</p>
      </aside>
    );
  }

  const options = question.settings?.options || [];

  return (
    <aside className="w-[300px] bg-white border-l border-gray-200 flex flex-col shadow-[-2px_0_8px_rgba(0,0,0,0.03)]">
      {/* Type selector */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 cursor-pointer hover:bg-gray-200 transition-colors">
          <TypeIcon type={question.type} />
          <span className="ml-2 text-sm font-medium text-gray-700 flex-1 capitalize">{(TYPE_META[question.type]?.label) || question.type}</span>
          <ChevronDown size={14} className="text-gray-500"/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {isWelcome ? (
          <>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">Time to complete <HelpCircle size={13} className="text-gray-400"/></label>
              <div className="w-10 h-5 bg-gray-800 rounded-full p-0.5 flex items-center cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"/>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">Number of submissions <HelpCircle size={13} className="text-gray-400"/></label>
              <div className="w-10 h-5 bg-gray-300 rounded-full p-0.5 flex items-center cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full shadow-sm"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Button</label>
              <div className="relative">
                <input
                  type="text"
                  value={buttonText}
                  onChange={e => setButtonText(e.target.value)}
                  maxLength={24}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:border-blue-500 bg-white"
                />
                <span className="absolute right-2 top-2 text-xs text-gray-400">{buttonText.length}/24</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Image or video</label>
                <button className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600 transition-colors">
                  <Plus size={16}/>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                Required <HelpCircle size={13} className="text-gray-400"/>
              </label>
              <div
                onClick={() => onChange({ is_required: !question.is_required })}
                className={`w-10 h-5 rounded-full p-0.5 flex items-center cursor-pointer transition-colors ${question.is_required ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${question.is_required ? 'translate-x-5' : 'translate-x-0'}`}/>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description / help text</label>
              <textarea
                value={question.description || ''}
                onChange={e => onChange({ description: e.target.value })}
                placeholder="Add a description..."
                className="w-full border border-gray-200 rounded-md p-2.5 text-sm outline-none focus:border-blue-400 resize-none h-20 placeholder-gray-400"
              />
            </div>

            {(question.type === 'multiple_choice' || question.type === 'dropdown') && (
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-3">Choices</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2 group">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...options];
                          newOpts[i] = e.target.value;
                          onChange({ settings: { ...question.settings, options: newOpts } });
                        }}
                        className="flex-1 border border-gray-200 rounded p-2 text-sm outline-none focus:border-blue-400 hover:border-gray-300 transition-colors"
                      />
                      <button
                        onClick={() => {
                          const newOpts = options.filter((_, idx) => idx !== i);
                          onChange({ settings: { ...question.settings, options: newOpts } });
                        }}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOpts = [...options, `Choice ${options.length + 1}`];
                      onChange({ settings: { ...question.settings, options: newOpts } });
                    }}
                    className="text-sm text-gray-500 font-medium hover:text-black flex items-center mt-1"
                  >
                    <Plus size={14} className="mr-1"/> Add choice
                  </button>
                </div>
              </div>
            )}

            {question.type === 'rating' && (
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-3">Steps (max stars)</label>
                <select
                  value={question.settings?.max || 5}
                  onChange={e => onChange({ settings: { ...question.settings, max: parseInt(e.target.value) } })}
                  className="w-full border border-gray-200 rounded-md p-2 text-sm outline-none focus:border-blue-400"
                >
                  {[3, 4, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
        <span>Comments</span>
        <Diamond size={14} className="text-teal-600"/>
      </div>
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Builder Page
// ──────────────────────────────────────────────────────────────
export default function BuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'content' | 'workflow' | 'connect'>('content');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('Untitled form');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [formId, setFormId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  useEffect(() => {
    if (params.id === 'new') {
      // Redirect handled by dashboard
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [qs, forms] = await Promise.all([
          fetchQuestions(params.id),
          fetchForms(),
        ]);
        setQuestions(qs);
        const form = forms.find(f => f.id === parseInt(params.id));
        if (form) {
          setFormTitle(form.title);
          setFormId(form.id);
        }

        // Pick up AI-generated pending questions
        const pendingKey = `pending_questions_${params.id}`;
        const pending = localStorage.getItem(pendingKey);
        if (pending && qs.length === 0) {
          localStorage.removeItem(pendingKey);
          const generated: Partial<Question>[] = JSON.parse(pending);
          const created: Question[] = [];
          for (let i = 0; i < generated.length; i++) {
            const q = await createQuestion(params.id, { ...generated[i], order_index: i });
            created.push(q);
          }
          setQuestions(created);
          if (created.length > 0) setSelectedId(created[0].id);
          showToast(`✓ Generated ${created.length} questions`);
          return;
        }

        if (qs.length > 0) setSelectedId(qs[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, showToast]);

  const handleAddElement = async (type: string) => {
    try {
      const defaults: Partial<Question> = {
        type,
        title: TYPE_META[type]?.label ? `${TYPE_META[type].label} question` : 'New question',
        order_index: questions.length,
        is_required: false,
        settings: (type === 'multiple_choice' || type === 'dropdown') ? { options: ['Option 1', 'Option 2'] } : 
                   type === 'rating' ? { min: 1, max: 5 } : undefined,
      };
      const newQ = await createQuestion(params.id, defaults);
      setQuestions(prev => [...prev, newQ]);
      setSelectedId(newQ.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateWithAI = async (prompt: string) => {
    const { generateFormWithAI: gen } = await import('../../../lib/openrouter');
    const generated = await gen(prompt);
    const created: Question[] = [];
    for (let i = 0; i < generated.questions.length; i++) {
      const q = await createQuestion(params.id, { ...generated.questions[i], order_index: questions.length + i });
      created.push(q);
    }
    setQuestions(prev => [...prev, ...created]);
    if (created.length > 0) setSelectedId(created[0].id);
    showToast(`✓ Added ${created.length} questions from AI`);
  };

  const handleDeleteQuestion = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (selectedId === id) setSelectedId(questions.find(q => q.id !== id)?.id ?? null);
    } catch (err) { console.error(err); }
  };

  const handleUpdateSelected = useCallback(async (updates: Partial<Question>) => {
    if (!selectedId) return;
    setQuestions(prev => prev.map(q => q.id === selectedId ? { ...q, ...updates } : q));
    try {
      await updateQuestion(selectedId, updates);
    } catch (err) { console.error(err); }
  }, [selectedId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = questions.findIndex(q => q.id === active.id);
      const newIdx = questions.findIndex(q => q.id === over.id);
      const reordered = arrayMove(questions, oldIdx, newIdx);
      setQuestions(reordered);
      try { await reorderQuestions(reordered.map(q => q.id)); } catch (err) { console.error(err); }
    }
  };

  const handleChatCreate = async () => {
    if (!chatInput.trim() || chatLoading) return;
    setChatLoading(true);
    try {
      await handleGenerateWithAI(chatInput);
      setChatInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI generation failed';
      showToast(`✕ ${msg}`);
    } finally {
      setChatLoading(false);
    }
  };

  const handleShareOrPublish = async () => {
    if (!formId) return;
    try {
      await updateForm(formId, { is_published: true });
      const forms = await fetchForms();
      const form = forms.find(f => f.id === formId);
      if (form) {
        const url = `${window.location.origin}/form/${form.share_token}`;
        navigator.clipboard.writeText(url).catch(() => {});
        showToast(`✓ Published! Link copied: ${url}`);
      }
    } catch {
      showToast('✕ Failed to publish');
    }
  };

  const selectedQuestion = questions.find(q => q.id === selectedId) ?? null;
  // First question acts as the "welcome screen" / form title block
  const isWelcomeSelected = selectedId === questions[0]?.id;

  return (
    <div className="flex h-screen bg-[#f3f3f3] font-sans overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <AddContentModal
          onClose={() => setShowAddModal(false)}
          onAddElement={handleAddElement}
          onGenerateWithAI={handleGenerateWithAI}
        />
      )}

      {/* ── Top Navigation ── */}
      <header className="absolute top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 w-1/3">
          <button onClick={() => router.push('/')} className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <LayoutList size={16} className="mr-1.5"/> Forms
          </button>
          <ChevronRight size={14} className="text-gray-400"/>
          <input
            type="text"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            onBlur={async () => {
              if (formId) await updateForm(formId, { title: formTitle });
            }}
            className="text-sm font-semibold text-gray-900 outline-none bg-transparent hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          />
        </div>

        <div className="flex gap-1 justify-center w-1/3">
          {(['content', 'workflow', 'connect'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
                activeTab === tab ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-1/3 justify-end">
          <button
            onClick={handleShareOrPublish}
            className="text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50 transition-colors"
          >
            <Share2 size={14}/> Share
          </button>
          <button className="bg-[#1f7363] hover:bg-[#155a4d] text-white rounded-md px-4 py-1.5 text-sm font-semibold transition-colors">
            View plans
          </button>
          <HelpCircle size={18} className="text-gray-400 cursor-pointer"/>
          <div className="w-8 h-8 rounded-full bg-[#fce8cc] text-[#b85434] flex items-center justify-center font-bold text-xs cursor-pointer">SG</div>
        </div>
      </header>

      {/* ── Main Area ── */}
      <div className="flex w-full h-full pt-14">

        {activeTab === 'content' ? (
          <>
            {/* ── LEFT SIDEBAR ── */}
            <aside className="w-[272px] bg-[#f9f9f9] border-r border-gray-200 flex flex-col flex-shrink-0">
              {/* Mode selector */}
              <div className="p-3 border-b border-gray-200">
                <button className="w-full flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2"><LayoutList size={15}/> Universal mode</span>
                  <ChevronDown size={14} className="text-gray-400"/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Pages</h3>

                {loading ? (
                  <div className="text-sm text-gray-400 py-4 text-center">Loading...</div>
                ) : (
                  <>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                        {questions.map((q, idx) => (
                          <SortableQuestionItem
                            key={q.id}
                            id={q.id}
                            question={q}
                            index={idx}
                            isSelected={selectedId === q.id}
                            onSelect={setSelectedId}
                            onDelete={handleDeleteQuestion}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    <div className="h-px bg-gray-200 my-3"/>

                    <div className="space-y-1.5">
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="w-full border border-dashed border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-500 hover:text-black hover:border-gray-400 transition-all flex items-center justify-center gap-2 bg-white"
                      >
                        <Plus size={15}/> Add question
                      </button>
                      <div className="border border-purple-200 bg-purple-50/50 rounded-lg p-2.5 cursor-pointer group flex items-center justify-between hover:bg-purple-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Sparkles size={15} className="text-purple-500"/>
                          <span className="text-sm font-medium text-gray-700 text-sm">Personalize with branching</span>
                        </div>
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-black transition-colors"/>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex justify-between items-center mb-2 px-1">
                        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Endings</h3>
                        <Plus size={14} className="text-gray-400 cursor-pointer hover:text-black"/>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>

            {/* ── CENTER CANVAS ── */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
              {/* Canvas Toolbar */}
              <div className="h-12 flex items-center justify-between px-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-sm transition-colors"
                  >
                    <Plus size={14}/> Add content
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors px-3 py-1.5 rounded-md hover:bg-gray-100">
                    🎨 Design
                  </button>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Mobile preview">
                    <Smartphone size={16}/>
                  </button>
                  <button
                    onClick={() => selectedQuestion && router.push(`/form/${selectedQuestion.form_id}?preview=1`)}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors" title="Preview"
                  >
                    <Play size={16}/>
                  </button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><HelpCircle size={16}/></button>
                  <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><Settings size={16}/></button>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden bg-[#f3f3f3]">
                <div className="w-full max-w-3xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] rounded-2xl min-h-[480px] flex flex-col relative overflow-hidden">
                  <div className="flex-1">
                    <QuestionPreview question={selectedQuestion} isWelcome={isWelcomeSelected} />
                  </div>
                </div>

                {/* Chat to create */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg">
                  <div className={`bg-white rounded-2xl shadow-lg border px-4 py-3 flex items-center gap-3 transition-colors ${chatLoading ? 'border-purple-300' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Mic size={18} className="text-gray-400 flex-shrink-0"/>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Chat to create"
                      className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                      onKeyDown={e => { if (e.key === 'Enter') handleChatCreate(); }}
                      disabled={chatLoading}
                    />
                    {chatLoading ? (
                      <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0"/>
                    ) : (
                      <button onClick={handleChatCreate} disabled={!chatInput.trim()} className="text-gray-400 hover:text-purple-600 disabled:opacity-30 transition-colors flex-shrink-0">
                        <Send size={16}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </main>

            {/* ── RIGHT SIDEBAR ── */}
            <RightSidebar
              question={selectedQuestion}
              onChange={handleUpdateSelected}
              isWelcome={isWelcomeSelected}
            />
          </>
        ) : activeTab === 'workflow' ? (
          /* ── WORKFLOW TAB ── */
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 bg-[#f5f5f5] relative overflow-hidden">
              <div className="absolute top-4 left-4 flex gap-4 z-10">
                <button className={`text-sm font-medium px-1 py-1 border-b-2 transition-colors ${true ? 'border-black text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Branching</button>
                {['Scoring', 'Tagging', 'Outcome quiz'].map(t => (
                  <button key={t} className="text-sm font-medium px-1 py-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 transition-colors">{t}</button>
                ))}
                <div className="flex items-center gap-3 ml-4 text-gray-400">
                  <Play size={16} className="cursor-pointer hover:text-gray-700"/>
                  <span className="font-medium">{'(x)'}</span>
                  <RefreshCw size={16} className="cursor-pointer hover:text-gray-700"/>
                  <Settings size={16} className="cursor-pointer hover:text-gray-700"/>
                </div>
              </div>

              {/* Workflow nodes */}
              <div className="absolute top-1/2 left-8 right-[320px] -translate-y-1/2 overflow-x-auto">
                <div className="flex items-center gap-0 min-w-max px-4">
                  {questions.map((q, i) => (
                    <React.Fragment key={q.id}>
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-white rounded-xl border-2 border-gray-200 flex items-center justify-center shadow-sm cursor-pointer hover:border-blue-400 transition-colors">
                          <TypeIcon type={q.type} />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{i + 1}</span>
                      </div>
                      {i < questions.length - 1 && (
                        <div className="w-12 h-0.5 bg-gray-300 flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full bg-gray-900 text-white flex items-center justify-center text-[8px] flex-shrink-0">→</div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Bottom controls */}
              <div className="absolute bottom-4 left-4 flex gap-3 text-gray-400">
                <button className="hover:text-gray-700 text-lg font-medium">-</button>
                <button className="hover:text-gray-700 text-lg font-medium">+</button>
                <button className="hover:text-gray-700"><Monitor size={16}/></button>
                <button className="hover:text-gray-700"><RotateCcw size={16}/></button>
              </div>
            </main>

            {/* Workflow right panel */}
            <aside className="w-[300px] bg-white border-l border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-5">Actions</h3>
              <div className="space-y-5">
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <LayoutList size={18} className="text-gray-500"/>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Connect</h4>
                  <div className="flex gap-2 mt-3">
                    <div className="w-8 h-8 bg-green-100 rounded-md"/>
                    <div className="w-8 h-8 bg-green-600 rounded-md"/>
                    <div className="w-8 h-8 bg-red-500 rounded-md"/>
                    <button className="w-8 h-8 border border-gray-200 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-50"><Plus size={14}/></button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <Sparkles size={18} className="text-gray-500"/>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Automations <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-1">New</span></h4>
                  <p className="text-xs text-gray-500">Activate automations based on submissions to this form.</p>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <Settings size={18} className="text-gray-500"/>
                  </div>
                  <h4 className="font-semibold text-sm text-gray-900 mb-1">Contacts</h4>
                  <p className="text-xs text-gray-500">Map form responses to create or update your contacts.</p>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* ── CONNECT TAB ── */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LayoutList size={28} className="text-gray-300"/>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Connect integrations</h3>
              <p className="text-sm text-gray-400">Coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom AI Chat in Workflow/Connect */}
      {activeTab !== 'content' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 w-[400px]">
            <Mic size={18} className="text-gray-400"/>
            <input type="text" placeholder="Chat to create" className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"/>
            <Send size={16} className="text-gray-300"/>
          </div>
        </div>
      )}
    </div>
  );
}
