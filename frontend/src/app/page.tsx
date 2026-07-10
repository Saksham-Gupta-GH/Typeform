'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, Users, Zap, MoreHorizontal, Diamond, HelpCircle, MessageSquare, Calendar, LayoutList, Mic, Send, X, ChevronDown, ChevronUp, FileText, Trash2, Copy, Edit3, Link, Move, ExternalLink } from 'lucide-react';
import { fetchForms, createForm, deleteForm, duplicateForm, updateForm, Form } from '@/lib/api';
import { generateFormWithAI } from '@/lib/openrouter';

type ContextMenu = {
  formId: number;
  x: number;
  y: number;
} | null;

type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error';
};

export default function WorkspaceDashboard() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  async function loadForms() {
    try {
      const data = await fetchForms();
      setForms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function addToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }

  function handleContextMenu(e: React.MouseEvent, formId: number) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ formId, x: e.clientX, y: e.clientY });
  }

  async function handleDelete(formId: number) {
    try {
      await deleteForm(formId);
      setForms(f => f.filter(x => x.id !== formId));
      addToast('Form deleted');
    } catch {
      addToast('Failed to delete form', 'error');
    }
    setContextMenu(null);
  }

  async function handleDuplicate(formId: number) {
    try {
      const newForm = await duplicateForm(formId);
      setForms(f => [...f, newForm]);
      addToast('Form duplicated');
    } catch {
      addToast('Failed to duplicate form', 'error');
    }
    setContextMenu(null);
  }

  function startRename(form: Form) {
    setRenamingId(form.id);
    setRenameValue(form.title);
    setContextMenu(null);
  }

  async function submitRename(formId: number) {
    if (!renameValue.trim()) return;
    try {
      const updated = await updateForm(formId, { title: renameValue.trim() });
      setForms(f => f.map(x => x.id === formId ? { ...x, title: updated.title } : x));
      addToast('Form renamed');
    } catch {
      addToast('Failed to rename form', 'error');
    }
    setRenamingId(null);
  }

  function copyLink(form: Form) {
    const url = `${window.location.origin}/form/${form.share_token}`;
    navigator.clipboard.writeText(url);
    addToast('Link copied to clipboard');
    setContextMenu(null);
  }

  async function handleCreateForm() {
    try {
      const newForm = await createForm({ title: 'New form' });
      router.push(`/builder/${newForm.id}`);
    } catch {
      addToast('Failed to create form', 'error');
    }
  }

  async function handleAiCreate() {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const generated = await generateFormWithAI(aiInput);
      // Create the form
      const newForm = await createForm({ title: generated.title, description: generated.description });
      // Store generated questions in localStorage to be picked up by builder
      localStorage.setItem(`pending_questions_${newForm.id}`, JSON.stringify(generated.questions));
      addToast('Form generated! Opening builder...');
      setTimeout(() => router.push(`/builder/${newForm.id}`), 500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI generation failed';
      addToast(message, 'error');
    } finally {
      setAiLoading(false);
      setAiInput('');
    }
  }

  const formContextMenuForm = forms.find(f => f.id === contextMenu?.formId);

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-in ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.message}
          </div>
        ))}
      </div>

      {/* AI Sidebar Panel */}
      {aiSidebarOpen && (
        <div className="fixed inset-0 z-30 flex">
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Diamond size={16} className="text-purple-500" />
                <span className="font-semibold text-sm">Typeform AI</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Beta</span>
              </div>
              <button onClick={() => setAiSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3 mb-4">
                {/* Example messages */}
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  <p className="font-medium mb-1">Here's what we did:</p>
                  <div className="flex items-center gap-2 text-green-700">
                    <span>✓</span> Created Amazon intern application form.
                  </div>
                </div>
                <p className="text-sm text-gray-600">Added. Is there anything else you'd like to include for applicants?</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-2 focus-within:border-purple-400 transition-colors">
                <input
                  type="text"
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  placeholder="Ask Typeform AI"
                  className="flex-1 text-sm outline-none bg-transparent"
                  onKeyDown={e => { if (e.key === 'Enter') handleAiCreate(); }}
                />
                <div className="flex items-center gap-1 text-gray-400">
                  <button className="hover:text-gray-600"><Mic size={16} /></button>
                  <button className="hover:text-gray-600"><Plus size={16} /></button>
                  <button className="hover:text-gray-600 text-gray-400">•••</button>
                </div>
                <button onClick={handleAiCreate} disabled={aiLoading || !aiInput.trim()} className="text-gray-400 hover:text-purple-600 disabled:opacity-30">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setAiSidebarOpen(false)} />
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[160px]"
          style={{ left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 300) }}
          onClick={e => e.stopPropagation()}
        >
          {formContextMenuForm && (
            <>
              <button onClick={() => copyLink(formContextMenuForm)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <Link size={14} className="text-gray-400" /> Copy link
              </button>
              <button onClick={() => router.push(`/builder/${contextMenu.formId}`)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <FileText size={14} className="text-gray-400" /> Content
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => startRename(formContextMenuForm)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <Edit3 size={14} className="text-gray-400" /> Rename
              </button>
              <button onClick={() => handleDuplicate(contextMenu.formId)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                <Copy size={14} className="text-gray-400" /> Duplicate
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => handleDelete(contextMenu.formId)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[280px] border-r border-gray-200 flex flex-col justify-between bg-gray-50/50 flex-shrink-0">
        <div>
          {/* User Profile */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
              <div className="w-8 h-8 rounded bg-[#b85434] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">S</div>
              <span className="font-medium text-sm flex-1">saksham77779</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>

          <div className="p-4">
            <button onClick={handleCreateForm} className="w-full bg-[#352f36] hover:bg-[#2a252b] text-white rounded-md py-2.5 px-4 flex items-center justify-center font-medium transition-colors mb-6 text-sm">
              <Plus size={16} className="mr-2" /> Create form
            </button>

            <div className="relative mb-6">
              <svg className="absolute left-3 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search" className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm placeholder-gray-400 focus:border-gray-300"/>
            </div>

            <div className="space-y-1">
              <div className="mt-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between cursor-pointer hover:bg-gray-100 rounded">
                  My Forms
                </div>
                <div className="mt-1">
                  <div className="px-2 py-2 text-sm text-gray-900 bg-gray-200/50 rounded-md font-medium flex justify-between items-center cursor-pointer">
                    My workspace <span className="text-gray-500 text-xs">{forms.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom AI button */}
        <div className="p-4 border-t border-gray-200">
          <button onClick={() => setAiSidebarOpen(true)} className="w-full border border-purple-200 bg-purple-50/30 rounded-lg p-2.5 flex items-center cursor-pointer hover:bg-purple-50 transition-colors group">
            <Mic size={16} className="text-gray-500 mr-3" />
            <span className="text-sm font-medium text-gray-700 flex-1 text-left group-hover:text-purple-900">Ask Typeform AI</span>
            <Send size={14} className="text-gray-400 group-hover:text-purple-500" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Top Header */}
        <header className="h-[52px] border-b border-gray-200 flex justify-between items-center px-4 bg-white flex-shrink-0">
          <div className="flex items-center h-full">
            <div className="flex space-x-1 h-full">
              <div className="px-4 h-full border-b-2 border-black font-semibold text-sm flex items-center gap-2">
                <FileText size={15}/> Forms
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-[#fce8cc] text-[#b85434] flex items-center justify-center font-bold text-xs cursor-pointer">SG</div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Promo Banner */}
          {showBanner && (
            <div className="bg-[#f2f8f6] border border-[#a8dbcc] rounded-lg mx-6 mt-4 px-4 py-2.5 flex justify-between items-center">
              <div className="flex items-center text-sm gap-2">
                <Diamond size={16} className="text-teal-700" />
                <span className="text-gray-800">You can collect <strong>10 form responses</strong> this month for free.</span>
                <button className="ml-2 bg-[#1f7363] text-white px-3 py-1 rounded text-xs font-medium hover:bg-[#155a4d]">Get more responses</button>
              </div>
              <button onClick={() => setShowBanner(false)} className="text-gray-400 hover:text-gray-600 ml-4">
                <X size={16}/>
              </button>
            </div>
          )}

          <div className="px-10 py-6">
            {/* Workspace Header */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-normal text-gray-900">My workspace</h1>
              </div>
              <div className="flex gap-3">
                <div className="flex border border-gray-200 rounded overflow-hidden">
                  <div className="px-3 py-1.5 bg-gray-100 text-gray-800 flex items-center font-medium text-sm gap-1.5">
                    <LayoutList size={14}/> List
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-gray-400 text-sm text-center mt-20">Loading...</div>
            ) : (
              <div>
                {/* AI Suggestions */}
                {forms.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="border border-purple-200 rounded-lg p-5 bg-white relative cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all">
                      <button className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"><X size={16}/></button>
                      <div className="flex gap-2 mb-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-500 flex-shrink-0 mt-0.5"><path d="M12 2l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill="currentColor"/></svg>
                        <p className="text-sm text-gray-800 pr-6">Create an <strong>Obtain informed consent from subjects before data collection in compliance with ethical standards.</strong></p>
                      </div>
                      <button className="text-xs font-medium border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-700 mt-1">Use this form</button>
                    </div>
                    <div className="border border-purple-200 rounded-lg p-5 bg-white relative cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all">
                      <button className="absolute top-4 right-4 text-gray-300 hover:text-gray-500"><X size={16}/></button>
                      <div className="flex gap-2 mb-3">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-purple-500 flex-shrink-0 mt-0.5"><path d="M12 2l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z" fill="currentColor"/></svg>
                        <p className="text-sm text-gray-800 pr-6">Create a <strong>Collect detailed feedback from participants to improve future research studies and methodologies.</strong></p>
                      </div>
                      <button className="text-xs font-medium border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-700 mt-1">Use this form</button>
                    </div>
                  </div>
                )}

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 mb-3 px-4">
                  <div className="col-span-8"/>
                  <div className="col-span-3 text-center">Updated</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-2">
                  {forms.map(form => (
                    <div key={form.id} className="grid grid-cols-12 gap-4 items-center bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow group">
                      <div className="col-span-8 flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#c07345] rounded-md flex-shrink-0"/>
                        <div className="flex-1 min-w-0">
                          {renamingId === form.id ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onBlur={() => submitRename(form.id)}
                              onKeyDown={e => { if (e.key === 'Enter') submitRename(form.id); if (e.key === 'Escape') setRenamingId(null); }}
                              className="font-semibold text-gray-900 text-sm border-b border-blue-500 outline-none bg-transparent w-full"
                            />
                          ) : (
                            <button className="font-semibold text-gray-900 text-sm truncate text-left hover:underline" onClick={() => router.push(`/builder/${form.id}`)}>
                              {form.title || 'Untitled form'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="col-span-3 text-center text-gray-600 text-sm">
                        {new Date(form.updated_at || form.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <button
                          onClick={e => handleContextMenu(e, form.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 transition-opacity p-1 rounded hover:bg-gray-100"
                        >
                          <MoreHorizontal size={18}/>
                        </button>
                      </div>
                    </div>
                  ))}

                  {forms.length === 0 && (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-gray-300"/>
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No forms yet</h3>
                      <p className="text-sm text-gray-400 mb-6">Create your first form or use AI to generate one</p>
                      <button onClick={handleCreateForm} className="bg-[#352f36] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#2a252b] transition-colors">
                        <Plus size={16} className="inline mr-2"/> Create form
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom AI Chat bar */}
        <div className="border-t border-gray-100 px-6 py-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 bg-white transition-all ${aiLoading ? 'border-purple-300' : 'border-gray-200 hover:border-gray-300'}`}>
              <Mic size={18} className="text-gray-400 flex-shrink-0"/>
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Ask Typeform AI to create a form..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                onKeyDown={e => { if (e.key === 'Enter') handleAiCreate(); }}
                disabled={aiLoading}
              />
              {aiLoading ? (
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0"/>
              ) : (
                <button onClick={handleAiCreate} disabled={!aiInput.trim()} className="text-gray-400 hover:text-purple-600 disabled:opacity-30 flex-shrink-0 transition-colors">
                  <Send size={16}/>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
