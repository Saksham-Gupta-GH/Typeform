'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { fetchPublicForm, submitResponse, Question } from '../../../lib/api';

export interface FormResponse {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome screen (sc11)
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeScreen({ form, onStart }: { form: FormResponse; onStart: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <h1 className="text-4xl font-semibold text-gray-900 mb-5">{form.title}</h1>
      {form.description && (
        <p className="text-lg text-gray-600 mb-10 max-w-lg">{form.description}</p>
      )}
      <button
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-10 rounded text-lg transition-colors shadow-sm"
        autoFocus
      >
        start
      </button>
      <p className="text-gray-400 text-sm mt-3 flex items-center gap-1.5">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        Takes {form.questions.length} minute{form.questions.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Question renderer (sc12)
// ─────────────────────────────────────────────────────────────────────────────
interface QuestionViewProps {
  question: Question;
  index: number;
  total: number;
  value: string | number | undefined;
  onChange: (val: string | number) => void;
  onNext: () => void;
  validationError: string;
  isLast: boolean;
}

function QuestionView({ question, index, total, value, onChange, onNext, validationError, isLast }: QuestionViewProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onNext();
    }
  };

  const options = question.settings?.options || [];
  const maxStars = question.settings?.max || 5;

  return (
    <div className="flex-1 flex flex-col justify-center px-16 py-12 max-w-3xl mx-auto w-full">
      {/* Question number + arrow badge */}
      <div className="flex items-start gap-5 mb-8">
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
            {index + 1}
          </div>
          <span className="text-blue-600 text-lg font-medium">→</span>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight">
            {question.title}
            {question.is_required && <span className="text-red-500 ml-1">*</span>}
          </h1>
          {question.description && (
            <p className="text-gray-500 mt-2 text-base">{question.description}</p>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="pl-12">
        {/* Short text / email / phone / number */}
        {['short_text', 'email', 'phone_number', 'number'].includes(question.type) && (
          <div className="border-b-2 border-blue-500 pb-1 mb-6">
            <input
              autoFocus
              type={question.type === 'email' ? 'email' : question.type === 'number' ? 'number' : 'text'}
              placeholder={question.type === 'email' ? 'name@example.com' : question.type === 'number' ? 'Type a number...' : 'Type your answer here...'}
              value={value ?? ''}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKey}
              className="w-full outline-none text-xl text-gray-800 bg-transparent placeholder-gray-300 py-1"
            />
          </div>
        )}

        {/* Long text */}
        {question.type === 'long_text' && (
          <div className="border-b-2 border-blue-500 pb-1 mb-6">
            <textarea
              autoFocus
              placeholder="Type your answer here..."
              value={value ?? ''}
              onChange={e => onChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) onNext(); }}
              className="w-full outline-none text-xl text-gray-800 bg-transparent placeholder-gray-300 resize-none min-h-[80px] py-1"
            />
          </div>
        )}

        {/* Multiple choice */}
        {question.type === 'multiple_choice' && (
          <div className="space-y-3 mb-6">
            {options.map((opt, i) => (
              <div
                key={i}
                onClick={() => { onChange(opt); }}
                className={`flex items-center gap-4 px-4 py-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                  value === opt
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  value === opt ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-500'
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-medium">{opt}</span>
              </div>
            ))}
          </div>
        )}

        {/* Dropdown */}
        {question.type === 'dropdown' && (
          <div className="mb-6">
            <select
              autoFocus
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value)}
              className="w-full border-b-2 border-blue-500 bg-transparent text-xl text-gray-800 outline-none py-2 cursor-pointer appearance-none"
            >
              <option value="" disabled>Select an option...</option>
              {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}

        {/* Yes/No */}
        {question.type === 'yes_no' && (
          <div className="flex gap-4 mb-6">
            {['Yes', 'No'].map(opt => (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`flex-1 flex items-center gap-3 px-6 py-4 border-2 rounded-xl text-lg font-semibold transition-all ${
                  value === opt
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{opt === 'Yes' ? '👍' : '👎'}</span> {opt}
              </button>
            ))}
          </div>
        )}

        {/* Rating */}
        {question.type === 'rating' && (
          <div className="flex gap-3 mb-6">
            {Array.from({ length: maxStars }, (_, i) => i + 1).map(star => (
              <button
                key={star}
                onClick={() => onChange(star)}
                className={`text-4xl transition-colors leading-none ${Number(value) >= star ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-200'}`}
              >
                ★
              </button>
            ))}
          </div>
        )}

        {/* Statement */}
        {question.type === 'statement' && (
          <div className="text-gray-600 text-lg leading-relaxed mb-6">
            {question.description || question.title}
          </div>
        )}

        {/* Date */}
        {question.type === 'date' && (
          <div className="border-b-2 border-blue-500 pb-1 mb-6">
            <input
              autoFocus
              type="date"
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value)}
              className="text-xl text-gray-800 outline-none bg-transparent py-1"
            />
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg"
          >
            <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">!</span>
            {validationError}
          </motion.div>
        )}

        {/* OK button */}
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded transition-colors flex items-center gap-2 text-sm"
        >
          {isLast ? 'Submit' : 'OK'} <span className="text-blue-200 font-normal">✓</span>
          {!isLast && <span className="text-blue-300 font-normal text-xs ml-1">press Enter ↵</span>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Thank you screen
// ─────────────────────────────────────────────────────────────────────────────
function ThankYouScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h1 className="text-4xl font-semibold text-gray-900 mb-4">Thank you! 🎉</h1>
      <p className="text-gray-500 text-lg">Your response has been recorded.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main respondent flow
// ─────────────────────────────────────────────────────────────────────────────
export default function RespondentFlow({ params }: { params: { shareToken: string } }) {
  const [form, setForm] = useState<FormResponse | null>(null);
  const [phase, setPhase] = useState<'welcome' | 'questions' | 'submitted'>('welcome');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [direction, setDirection] = useState<'up' | 'down'>('down');

  useEffect(() => {
    fetchPublicForm(params.shareToken)
      .then(data => setForm(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.shareToken]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase !== 'questions') return;
      if (e.key === 'ArrowDown' || (e.key === 'Enter' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'SELECT')) {
        // handled in component
      }
      if (e.key === 'ArrowUp') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, currentQIndex]);

  const validate = useCallback((): boolean => {
    if (!form) return false;
    const q = form.questions[currentQIndex];
    const val = answers[q.id];

    if (q.is_required && (val === undefined || val === '')) {
      setValidationError('This field is required.');
      return false;
    }

    if (q.type === 'email' && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(val))) {
        setValidationError('Please enter a valid email address.');
        return false;
      }
    }

    if (q.type === 'number' && val !== undefined && val !== '') {
      const num = Number(val);
      if (isNaN(num)) { setValidationError('Please enter a valid number.'); return false; }
      if (q.settings?.min !== undefined && num < q.settings.min) {
        setValidationError(`Minimum value is ${q.settings.min}.`); return false;
      }
      if (q.settings?.max !== undefined && num > q.settings.max) {
        setValidationError(`Maximum value is ${q.settings.max}.`); return false;
      }
    }

    setValidationError('');
    return true;
  }, [form, currentQIndex, answers]);

  const handleNext = useCallback(() => {
    if (!form) return;
    if (!validate()) return;
    setDirection('down');

    if (currentQIndex < form.questions.length - 1) {
      setCurrentQIndex(i => i + 1);
    } else {
      submitForm();
    }
  }, [form, currentQIndex, validate]);

  const handlePrev = useCallback(() => {
    if (currentQIndex > 0) {
      setDirection('up');
      setCurrentQIndex(i => i - 1);
      setValidationError('');
    } else {
      setPhase('welcome');
    }
  }, [currentQIndex]);

  const submitForm = async () => {
    if (!form) return;
    try {
      const formatted = Object.entries(answers).map(([qId, val]) => ({
        question_id: parseInt(qId),
        value: val,
      }));
      await submitResponse(params.shareToken, formatted);
      setPhase('submitted');
    } catch {
      setValidationError('Failed to submit. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-white flex-col gap-4">
      <p className="text-red-500 text-lg">{error}</p>
      <p className="text-gray-400 text-sm">This form may not be published or the link may be invalid.</p>
    </div>
  );

  if (!form) return null;

  const total = form.questions.length;
  const progress = phase === 'welcome' ? 0 : ((currentQIndex + 1) / total) * 100;
  const currentQ = form.questions[currentQIndex];

  const slideVariants = {
    enterDown: { y: 60, opacity: 0 },
    enterUp: { y: -60, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exitDown: { y: -60, opacity: 0 },
    exitUp: { y: 60, opacity: 0 },
  };

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Top blue progress bar */}
      <div className="h-1 bg-gray-200 w-full flex-shrink-0">
        <div
          className="h-full bg-blue-600 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      {phase === 'welcome' ? (
        <WelcomeScreen form={form} onStart={() => { setPhase('questions'); setCurrentQIndex(0); }} />
      ) : phase === 'submitted' ? (
        <ThankYouScreen />
      ) : (
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQ.id}
              custom={direction}
              variants={slideVariants}
              initial={direction === 'down' ? 'enterDown' : 'enterUp'}
              animate="center"
              exit={direction === 'down' ? 'exitDown' : 'exitUp'}
              transition={{ duration: 0.35, ease: [0.32, 0, 0.67, 0] }}
              className="absolute inset-0 flex"
            >
              <QuestionView
                question={currentQ}
                index={currentQIndex}
                total={total}
                value={answers[currentQ.id]}
                onChange={val => {
                  setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
                  setValidationError('');
                }}
                onNext={handleNext}
                validationError={validationError}
                isLast={currentQIndex === total - 1}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Bottom bar: Up/Down nav + Powered by */}
      {phase === 'questions' && (
        <div className="flex-shrink-0 flex items-center justify-end px-6 py-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={handlePrev}
                disabled={currentQIndex === 0}
                className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white transition-colors"
                title="Previous (↑)"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={handleNext}
                className="w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white transition-colors border-l border-blue-700"
                title="Next (↓ or Enter)"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-600 text-white rounded-lg px-3 py-2 text-xs font-semibold">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-sm flex-shrink-0"/>
              Powered by Typeform
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
