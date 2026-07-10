'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, FileText, Settings, User } from 'lucide-react';

export default function WorkspaceDashboard() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Check Backend Status
    fetch(`${API_URL}/`)
      .then(res => {
        if (res.ok) setBackendStatus('connected');
        else setBackendStatus('disconnected');
      })
      .catch(() => setBackendStatus('disconnected'));
      
    // Fetch Forms
    fetch(`${API_URL}/forms/`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch forms');
        return res.json();
      })
      .then(data => setForms(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
      
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Typeform Dark Sidebar */}
      <aside className="w-64 bg-[#191919] text-white flex flex-col justify-between hidden md:flex">
        <div>
          <div className="p-6">
            <h2 className="text-xl font-bold tracking-tight mb-8 cursor-pointer">Typeform</h2>
            
            <nav className="space-y-1 text-sm font-medium">
              <a href="#" className="flex items-center space-x-3 bg-white/10 px-3 py-2 rounded-lg text-white">
                <LayoutGrid size={18} />
                <span>My Workspace</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
                <FileText size={18} />
                <span>Responses</span>
              </a>
              <a href="#" className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition">
                <Settings size={18} />
                <span>Settings</span>
              </a>
            </nav>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User size={16} />
            </div>
            <span className="text-sm font-medium">Creator</span>
          </div>
          
          {/* Backend Status Indicator */}
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-500' : backendStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
            <span>
              {backendStatus === 'connected' ? 'Backend Connected' : 
               backendStatus === 'checking' ? 'Checking connection...' : 'Backend Disconnected'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-800">My Workspace</h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          
          <div className="mb-8 flex justify-between items-center max-w-6xl">
            <div className="flex items-center space-x-2">
              <input 
                type="text" 
                placeholder="Search..." 
                className="border border-gray-300 rounded-md px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-black w-64"
              />
            </div>
            <Link 
              href="/builder/new" 
              className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium flex items-center hover:bg-gray-800 transition"
            >
              <Plus size={16} className="mr-2" />
              Create typeform
            </Link>
          </div>

          {loading ? (
            <div className="text-gray-500">Loading workspace...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl">
              {/* New Form Card */}
              <Link href="/builder/new">
                <div className="h-48 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:text-black hover:border-black transition cursor-pointer bg-white">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Plus size={20} />
                  </div>
                  <span className="font-medium text-sm">Create new form</span>
                </div>
              </Link>
              
              {/* Existing Forms */}
              {forms.map(form => (
                <div key={form.id} className="group relative bg-white h-48 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden flex flex-col cursor-pointer">
                  <Link href={`/builder/${form.id}`} className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:underline">
                        {form.title || 'Untitled form'}
                      </h3>
                      <div className="mt-3 flex space-x-2">
                        {form.status === 'published' ? (
                           <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-md font-medium">Published</span>
                        ) : (
                           <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">Draft</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 border-t border-gray-100 pt-3">
                      <span className="text-xs font-medium text-gray-500 flex items-center">
                        <FileText size={14} className="mr-1.5" />
                        {form.response_count || 0} responses
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
