'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { fetchPublicForm, submitResponse, Question } from '../../../lib/api';

export interface FormResponse {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
  design_settings?: {
    bgColor?: string;
    textColor?: string;
    buttonColor?: string;
    fontFamily?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome screen (sc11)
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeScreen({ form, onStart }: { form: FormResponse; onStart: () => void }) {
  const btnColor = form.design_settings?.buttonColor || '#2563eb';
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl md:text-4xl font-semibold mb-6">{form.title}</h1>
        {form.description && <p className="text-xl mb-12 max-w-2xl mx-auto opacity-80">{form.description}</p>}
        <button
          onClick={onStart}
          className="text-white font-semibold py-3 px-8 rounded text-lg transition-colors shadow-sm"
          style={{ backgroundColor: btnColor }}
        >
          Start
        </button>
      </motion.div>
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
  buttonColor?: string;
}

function QuestionView({ question, index, total, value, onChange, onNext, validationError, isLast, buttonColor }: QuestionViewProps) {
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onNext();
    }
  };

  const options = question.settings?.options || [];
  const maxStars = question.settings?.max || 5;

  return (
    <div className="flex-1 flex flex-col justify-center px-6 md:px-16 py-12 max-w-3xl mx-auto w-full">
      {/* Question number + arrow badge */}
      <div className="flex items-start gap-5 mb-8">
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: buttonColor }}>
            {index + 1}
          </div>
          <span className="text-lg font-medium opacity-70">→</span>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold leading-tight">
            {question.title}
            {question.is_required && <span className="text-red-500 ml-1">*</span>}
          </h1>
          {question.description && (
            <p className="mt-2 text-base opacity-70">{question.description}</p>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="pl-12">
        {/* Short text / email / phone / number */}
        {['short_text', 'email', 'phone_number', 'number'].includes(question.type) && (
          <div className="border-b-2 border-current pb-1 mb-6 opacity-80">
            <input
              autoFocus
              type={question.type === 'email' ? 'email' : question.type === 'number' ? 'number' : 'text'}
              placeholder={question.type === 'email' ? 'name@example.com' : question.type === 'number' ? 'Type a number...' : 'Type your answer here...'}
              value={value ?? ''}
              onChange={e => onChange(e.target.value)}
              onKeyDown={handleKey}
              className="w-full outline-none text-xl bg-transparent placeholder-black/20 py-1"
            />
          </div>
        )}

        {/* Long text */}
        {question.type === 'long_text' && (
          <div className="border-b-2 border-current pb-1 mb-6 opacity-80">
            <textarea
              autoFocus
              placeholder="Type your answer here..."
              value={value ?? ''}
              onChange={e => onChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) onNext(); }}
              className="w-full outline-none text-xl bg-transparent placeholder-black/20 resize-none min-h-[80px] py-1"
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
                    ? 'border-current bg-black/5'
                    : 'border-black/10 hover:border-black/20'
                }`}
              >
                <span className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                  value === opt ? 'border-current bg-current text-white' : 'border-black/20'
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
              className="w-full border-b-2 border-current bg-transparent text-xl outline-none py-2 cursor-pointer appearance-none"
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
                    ? 'border-current bg-black/5'
                    : 'border-black/10 hover:border-black/20'
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
                className={`text-3xl md:text-4xl transition-colors leading-none ${Number(value) >= star ? 'text-yellow-500' : 'text-gray-200'}`}
              >
                ★
              </button>
            ))}
          </div>
        )}

        {/* Statement */}
        {question.type === 'statement' && (
          <div className="text-lg leading-relaxed mb-6 opacity-80">
            {question.description || question.title}
          </div>
        )}

        {/* Date */}
        {question.type === 'date' && (
          <div className="border-b-2 border-current pb-1 mb-6">
            <input
              autoFocus
              type="date"
              value={String(value ?? '')}
              onChange={e => onChange(e.target.value)}
              className="text-xl outline-none bg-transparent py-1 w-full"
            />
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-500/10 px-3 py-2 rounded-lg"
          >
            <span className="w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">!</span>
            {validationError}
          </motion.div>
        )}

        {/* OK button */}
        <button
          onClick={onNext}
          className="text-white font-semibold py-2 px-6 rounded transition-colors text-lg flex items-center gap-2"
          style={{ backgroundColor: buttonColor || '#2563eb' }}
        >
          {isLast ? 'Submit' : 'OK'} <span className="font-normal opacity-70">✓</span>
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
      <div className="w-16 h-16 bg-black/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h1 className="text-3xl md:text-4xl font-semibold mb-4">Thank you! 🎉</h1>
      <p className="text-lg opacity-60">Your response has been recorded.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main respondent flow
// ─────────────────────────────────────────────────────────────────────────────
export default function RespondentFlow() {
  const params = useParams() as { shareToken: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPreview = searchParams.get('preview') === '1';
  
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

    const currentQuestion = form.questions[currentQIndex];
    const answer = answers[currentQuestion.id];
    let nextIndex = currentQIndex + 1;

    const jumps = currentQuestion.settings?.logic_jumps || [];
    let jumped = false;

    for (const rule of jumps) {
      if (rule.value === answer) {
        if (rule.target_id === null) {
          nextIndex = form.questions.length; // End of form
        } else {
          const targetIndex = form.questions.findIndex(q => q.id === rule.target_id);
          if (targetIndex !== -1) nextIndex = targetIndex;
        }
        jumped = true;
        break;
      }
    }

    if (!jumped && currentQuestion.settings?.logic_fallback !== undefined && currentQuestion.settings?.logic_fallback !== null) {
      const targetIndex = form.questions.findIndex(q => q.id === currentQuestion.settings!.logic_fallback);
      if (targetIndex !== -1) nextIndex = targetIndex;
    }

    if (nextIndex < form.questions.length) {
      setCurrentQIndex(nextIndex);
    } else {
      submitForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, currentQIndex, validate, answers]);

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
      if (!isPreview) {
        const formatted = Object.entries(answers).map(([qId, val]) => ({
          question_id: parseInt(qId),
          value: val,
        }));
        await submitResponse(params.shareToken, formatted);
      }
      setPhase('submitted');
    } catch {
      setValidationError('Failed to submit. Please try again.');
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center flex-col gap-4">
      <p className="text-red-500 text-lg">{error}</p>
    </div>
  );

  if (!form) return null;

  const total = form.questions.length;
  const progress = phase === 'welcome' ? 0 : ((currentQIndex + 1) / total) * 100;
  const currentQ = form.questions[currentQIndex];

  const slideVariants = {
    enterDown: { y: 15, opacity: 0 },
    enterUp: { y: -15, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exitDown: { y: -15, opacity: 0 },
    exitUp: { y: 15, opacity: 0 },
  };

  const bgColor = form?.design_settings?.bgColor || '#ffffff';
  const textColor = form?.design_settings?.textColor || '#111827';
  const fontFamily = form?.design_settings?.fontFamily === 'mono' ? 'monospace' : form?.design_settings?.fontFamily === 'serif' ? 'serif' : 'sans-serif';
  const btnColor = form?.design_settings?.buttonColor || '#2563eb';

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: bgColor, color: textColor, fontFamily }}>
      {isPreview && (
        <div className="absolute top-4 left-4 z-50">
          <button
            onClick={() => router.push(`/builder/${form.id}`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Builder
          </button>
        </div>
      )}
      
      {/* Top progress bar */}
      <div className="h-1 w-full flex-shrink-0 bg-black/5">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: btnColor }}
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
              transition={{ duration: 0.4, ease: "easeInOut" }}
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
                buttonColor={btnColor}
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
