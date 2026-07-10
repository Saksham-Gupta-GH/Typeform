'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPublicForm, submitResponse, Question } from '../../../lib/api';

export interface FormResponse {
  id: number;
  title: string;
  questions: Question[];
}

export default function RespondentFlow({ params }: { params: { shareToken: string } }) {
  const [form, setForm] = useState<FormResponse | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    fetchPublicForm(params.shareToken)
      .then(data => setForm(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.shareToken]);

  const validateCurrentQuestion = () => {
    if (!form) return false;
    const currentQ = form.questions[currentQIndex];
    const val = answers[currentQ.id];

    if (currentQ.is_required && (val === undefined || val === '')) {
      setValidationError('This field is required.');
      return false;
    }

    if (val !== undefined && val !== '') {
      if (currentQ.type === 'email') {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailRegex.test(String(val))) {
          setValidationError('Please enter a valid email address.');
          return false;
        }
      }
      if (currentQ.type === 'number') {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          setValidationError('Please enter a valid number.');
          return false;
        }
        if (currentQ.settings) {
          if (currentQ.settings.min !== undefined && numVal < currentQ.settings.min) {
            setValidationError(`Number must be at least ${currentQ.settings.min}.`);
            return false;
          }
          if (currentQ.settings.max !== undefined && numVal > currentQ.settings.max) {
            setValidationError(`Number must be at most ${currentQ.settings.max}.`);
            return false;
          }
        }
      }
    }

    setValidationError('');
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentQuestion()) return;

    if (form && currentQIndex < form.questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      submitForm();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNext();
    }
  };

  const submitForm = async () => {
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        question_id: parseInt(qId),
        value: val
      }));

      await submitResponse(params.shareToken, formattedAnswers);
      setSubmitted(true);
    } catch (err) {
      alert("Error submitting form");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  if (submitted) return (
    <div className="flex h-screen items-center justify-center bg-gray-50 flex-col">
      <h1 className="text-3xl font-semibold mb-4 text-gray-800">Thank you!</h1>
      <p className="text-gray-500">Your response has been recorded.</p>
    </div>
  );

  if (!form || !form.questions || form.questions.length === 0) {
    return <div className="flex h-screen items-center justify-center">This form has no questions.</div>;
  }

  const currentQ = form.questions[currentQIndex];
  // Calculate progress starting > 0
  const progress = ((currentQIndex + 1) / form.questions.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 w-full fixed top-0">
        <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            <div className="flex items-start mb-8">
              <span className="text-blue-600 font-bold mt-1 text-sm flex items-center">
                {currentQIndex + 1} <span className="ml-2 mr-4">→</span>
              </span>
              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  {currentQ.title}
                  {currentQ.is_required && <span className="text-red-500 ml-2">*</span>}
                </h1>
                {currentQ.description && (
                  <p className="text-gray-500 text-lg">{currentQ.description}</p>
                )}
              </div>
            </div>

            <div className="ml-10">
              {currentQ.type === 'short_text' || currentQ.type === 'email' || currentQ.type === 'number' ? (
                <input 
                  type={currentQ.type === 'email' ? 'email' : currentQ.type === 'number' ? 'number' : 'text'}
                  autoFocus
                  placeholder="Type your answer here..."
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => {
                     setAnswers({...answers, [currentQ.id]: e.target.value});
                     setValidationError('');
                  }}
                  onKeyDown={handleKeyPress}
                  className="w-full border-b-2 border-gray-300 pb-2 text-2xl outline-none focus:border-blue-600 transition-colors bg-transparent text-blue-800 placeholder-blue-200"
                />
              ) : currentQ.type === 'multiple_choice' ? (
                <div className="space-y-3">
                  {(currentQ.settings?.options || []).map((opt, i) => (
                    <div 
                      key={i}
                      onClick={() => {
                        setAnswers({...answers, [currentQ.id]: opt});
                        setValidationError('');
                      }}
                      className={`p-4 border rounded-md cursor-pointer text-lg transition-colors ${answers[currentQ.id] === opt ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              ) : (
                <textarea 
                  autoFocus
                  placeholder="Type your answer here..."
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => {
                     setAnswers({...answers, [currentQ.id]: e.target.value});
                     setValidationError('');
                  }}
                  className="w-full border-b-2 border-gray-300 pb-2 text-2xl outline-none focus:border-blue-600 transition-colors bg-transparent text-blue-800 placeholder-blue-200 resize-none h-32"
                />
              )}

              {validationError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-3 bg-red-50 p-2 rounded-md inline-block"
                >
                  {validationError}
                </motion.p>
              )}
            </div>

            <div className="mt-12 ml-10">
              <button 
                onClick={handleNext}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-md text-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                {currentQIndex === form.questions.length - 1 ? 'Submit' : 'OK'}
                <span className="ml-2 text-blue-200 font-normal text-sm">press Enter ↵</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
