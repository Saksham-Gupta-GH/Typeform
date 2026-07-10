'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Plus, GripVertical, Trash2 } from 'lucide-react';
import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../../lib/api';

export default function BuilderPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load questions on mount
    fetchQuestions(params.id)
      .then(data => {
        setQuestions(data);
        if (data.length > 0) setSelectedQuestionId(data[0].id);
      })
      .catch(err => console.error("Could not fetch backend, using empty state.", err))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleAddQuestion = async () => {
    try {
      const newQ = await createQuestion(params.id, {
        type: 'short_text',
        title: 'New Question',
        order_index: questions.length
      });
      setQuestions([...questions, newQ]);
      setSelectedQuestionId(newQ.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteQuestion(id);
      setQuestions(questions.filter(q => q.id !== id));
      if (selectedQuestionId === id) setSelectedQuestionId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSelected = async (updates: any) => {
    if (!selectedQuestionId) return;
    try {
      // Optimistic update
      setQuestions(questions.map(q => q.id === selectedQuestionId ? { ...q, ...updates } : q));
      // Server update
      await updateQuestion(selectedQuestionId, updates);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* LEFT SIDEBAR: Question List */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Questions</h2>
          <button onClick={handleAddQuestion} className="text-gray-500 hover:text-black">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            questions.map((q, idx) => (
              <div 
                key={q.id}
                onClick={() => setSelectedQuestionId(q.id)}
                className={`group flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                  selectedQuestionId === q.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-100 border-transparent hover:border-gray-200'
                }`}
              >
                <GripVertical size={16} className="text-gray-400 mr-2" />
                <span className={`text-sm truncate flex-1 ${selectedQuestionId === q.id ? 'font-medium text-gray-700' : 'text-gray-600'}`}>
                  {idx + 1}. {q.title || 'Untitled'}
                </span>
                <button onClick={(e) => handleDeleteQuestion(q.id, e)}>
                  <Trash2 size={16} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CANVAS: Live Preview */}
      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('content')}
              className={`text-sm font-medium pb-4 border-b-2 mt-4 ${activeTab === 'content' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
            >
              Content
            </button>
            <button 
              onClick={() => setActiveTab('design')}
              className={`text-sm font-medium pb-4 border-b-2 mt-4 ${activeTab === 'design' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
            >
              Design
            </button>
          </div>
          <div className="flex items-center space-x-3">
             <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition">
               Publish
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-gray-100/50">
           {selectedQuestion ? (
             <div className="w-full max-w-3xl bg-white shadow-sm border border-gray-200 rounded-lg p-12 min-h-[400px] flex flex-col justify-center">
                <div className="flex items-start">
                  <span className="text-blue-600 font-bold mt-1 text-sm flex items-center">
                    {questions.findIndex(q => q.id === selectedQuestion.id) + 1} <span className="ml-2 mr-4">→</span>
                  </span>
                  <div className="flex-1">
                    <h2 className="text-3xl font-semibold text-gray-900">{selectedQuestion.title || "..."}</h2>
                    {selectedQuestion.description && (
                      <p className="text-gray-500 mt-2 text-sm">{selectedQuestion.description}</p>
                    )}
                    
                    <div className="mt-8">
                      <input type="text" placeholder="Type your answer here..." className="w-full border-b border-gray-300 pb-2 text-lg outline-none bg-transparent text-gray-800" disabled/>
                    </div>
                  </div>
                </div>
             </div>
           ) : (
             <div className="text-gray-400">Select or create a question to preview</div>
           )}
        </div>
      </main>

      {/* RIGHT SIDEBAR: Settings */}
      {activeTab === 'content' && selectedQuestion && (
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col">
           <div className="p-4 border-b border-gray-200 flex items-center">
             <Settings size={18} className="text-gray-500 mr-2" />
             <h2 className="font-semibold text-gray-800">Question Settings</h2>
           </div>
           <div className="p-6 space-y-6 flex-1 overflow-y-auto">
             
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text"
                  value={selectedQuestion.title}
                  onChange={(e) => handleUpdateSelected({ title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select 
                  value={selectedQuestion.type}
                  onChange={(e) => handleUpdateSelected({ type: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="short_text">Short Text</option>
                  <option value="long_text">Long Text</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
             </div>

             <div>
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={selectedQuestion.is_required}
                    onChange={(e) => handleUpdateSelected({ is_required: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={3} 
                  value={selectedQuestion.description || ''}
                  onChange={(e) => handleUpdateSelected({ description: e.target.value })}
                  placeholder="Add a description..."
                  className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
             </div>
           </div>
        </aside>
      )}
    </div>
  );
}
