'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, LayoutGrid, Users, Zap, MoreHorizontal, MessageSquare, Diamond, HelpCircle, FileText, Calendar, LayoutList } from 'lucide-react';

export default function WorkspaceDashboard() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const API_URL = '/api';
    
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
    <div className="flex h-screen bg-white font-sans text-gray-900 overflow-hidden">
      {/* Typeform Light Sidebar */}
      <aside className="w-[280px] border-r border-gray-200 flex flex-col justify-between bg-gray-50/50">
        <div>
          {/* Top User Profile Area */}
          <div className="p-4 border-b border-gray-200">
             <div className="flex items-center space-x-3 cursor-pointer">
               <div className="w-8 h-8 rounded bg-[#b85434] text-white flex items-center justify-center font-semibold text-sm">
                 S
               </div>
               <span className="font-medium text-sm flex-1">saksham77779</span>
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </div>
          </div>
          
          <div className="p-4">
            <Link href="/builder/new">
              <button className="w-full bg-[#352f36] hover:bg-[#2a252b] text-white rounded-md py-2.5 px-4 flex items-center justify-center font-medium transition-colors mb-6 text-sm">
                <Plus size={16} className="mr-2" /> Create form
              </button>
            </Link>
            
            <div className="relative mb-6">
               <svg className="absolute left-3 top-2.5 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
               <input 
                 type="text"
                 placeholder="Search"
                 className="w-full pl-9 pr-3 py-2 bg-transparent border-none outline-none text-sm placeholder-gray-500"
               />
            </div>
            
            <div className="space-y-1 mb-8">
              <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                <span className="font-medium text-gray-800 flex items-center">
                  <LayoutGrid size={16} className="mr-3 text-gray-500"/> Workspaces
                </span>
                <button className="p-1 border rounded text-gray-500 hover:border-gray-400"><Plus size={14}/></button>
              </div>
              
              <div className="mt-2">
                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between cursor-pointer hover:bg-gray-100 rounded">
                   Private <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                </div>
                <div className="mt-1">
                  <div className="px-2 py-2 text-sm text-gray-900 bg-gray-200/50 rounded-md font-medium flex justify-between items-center cursor-pointer">
                    My workspace <span className="text-gray-500 text-xs">1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="mb-4">
             <div className="text-sm font-medium text-gray-800 mb-2">Responses collected</div>
             <div className="h-1 w-full bg-gray-200 rounded-full mb-2">
               <div className="h-1 bg-gray-300 rounded-full w-[0%]"></div>
             </div>
             <div className="text-xs text-gray-500 mb-3">0 / 10</div>
             <button className="text-xs font-medium border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50">Increase response limit</button>
          </div>
          
          <div className="border border-purple-200 bg-purple-50/30 rounded-lg p-2.5 flex items-center cursor-pointer hover:bg-purple-50 transition-colors group">
            <MessageSquare size={16} className="text-purple-600 mr-3" />
            <span className="text-sm font-medium text-gray-700 flex-1 group-hover:text-purple-900">Ask Typeform AI</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white">
        
        {/* Top Header */}
        <header className="h-[52px] border-b border-gray-200 flex justify-between items-center px-4 bg-white">
           <div className="flex items-center h-full">
             <div className="flex space-x-1">
               <button className="px-4 h-full border-b-2 border-black font-medium text-sm">Forms</button>
               <button className="px-4 h-full text-gray-500 hover:text-black font-medium text-sm flex items-center">
                 <Users size={16} className="mr-2"/> Contacts
               </button>
               <button className="px-4 h-full text-gray-500 hover:text-black font-medium text-sm flex items-center">
                 <Zap size={16} className="mr-2"/> Automations
               </button>
             </div>
           </div>
           <div className="flex items-center space-x-4">
             <button className="text-sm font-medium text-gray-600 hover:text-black flex items-center">
               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
               Integrations
             </button>
             <button className="text-sm font-medium text-gray-600 hover:text-black flex items-center">
               <Diamond size={16} className="mr-2"/> Brand kit
             </button>
             <HelpCircle size={20} className="text-gray-400 hover:text-gray-600 cursor-pointer"/>
             <div className="w-8 h-8 rounded-full bg-[#fce8cc] text-[#b85434] flex items-center justify-center font-bold text-xs cursor-pointer">
               SG
             </div>
           </div>
        </header>

        {/* Promo Banner */}
        <div className="bg-[#f2f8f6] border border-[#a8dbcc] rounded-lg mx-6 mt-6 p-3 flex justify-between items-center">
          <div className="flex items-center text-sm">
            <Diamond size={16} className="text-teal-700 mr-2" />
            <span className="text-gray-800">You can collect <strong>10 form responses</strong> this month for free.</span>
            <button className="ml-4 bg-[#1f7363] text-white px-3 py-1 rounded text-xs font-medium hover:bg-[#155a4d]">Get more responses</button>
          </div>
          <button className="text-gray-400 hover:text-gray-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 overflow-y-auto px-10 py-8">
          
          <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-4">
            <div className="flex items-center">
               <h1 className="text-2xl font-normal text-gray-900 mr-3">My workspace</h1>
               <MoreHorizontal size={20} className="text-gray-400 cursor-pointer mr-4" />
               <button className="text-sm text-gray-600 flex items-center font-medium border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50">
                 <Users size={14} className="mr-2" /> Invite <Diamond size={12} className="ml-2 text-teal-600"/>
               </button>
            </div>
            
            <div className="flex space-x-3">
              <button className="text-sm text-gray-600 flex items-center font-medium border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50">
                <Calendar size={14} className="mr-2" /> Date created <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              <div className="flex border border-gray-200 rounded overflow-hidden">
                <button className="px-3 py-1.5 bg-gray-100 text-gray-800 flex items-center font-medium text-sm">
                  <LayoutList size={14} className="mr-2"/> List
                </button>
                <button className="px-3 py-1.5 bg-white text-gray-500 hover:bg-gray-50 flex items-center font-medium text-sm border-l border-gray-200">
                  <LayoutGrid size={14} className="mr-2"/> Grid
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500 text-center mt-20">Loading workspace...</div>
          ) : (
            <div className="w-full">
              {/* Template Suggestions (Mocked like screenshot) */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <Link href="/builder/new">
                   <div className="border border-purple-200 rounded-lg p-5 bg-white shadow-sm relative group cursor-pointer hover:border-purple-300 h-full">
                     <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                     <div className="flex mb-3">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500 mr-2"><path d="M12 2l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z"></path></svg>
                       <p className="text-sm text-gray-800 pr-6">Create an <strong>Obtain informed consent from subjects before data collection in compliance with ethical standards.</strong></p>
                     </div>
                     <button className="text-xs font-medium border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-700 mt-2">Use this form</button>
                   </div>
                 </Link>
                 
                 <Link href="/builder/new">
                   <div className="border border-purple-200 rounded-lg p-5 bg-white shadow-sm relative group cursor-pointer hover:border-purple-300 h-full">
                     <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                     <div className="flex mb-3">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500 mr-2"><path d="M12 2l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z"></path></svg>
                       <p className="text-sm text-gray-800 pr-6">Create a <strong>Collect detailed feedback from participants to improve future research studies and methodologies.</strong></p>
                     </div>
                     <button className="text-xs font-medium border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 text-gray-700 mt-2">Use this form</button>
                   </div>
                 </Link>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 mb-3 px-4">
                <div className="col-span-6"></div>
                <div className="col-span-1 text-center">Responses</div>
                <div className="col-span-1 text-center">Completed</div>
                <div className="col-span-2 text-center">Updated</div>
                <div className="col-span-2 text-left">Integrations</div>
              </div>
              
              {/* Form List rows */}
              <div className="space-y-2">
                {forms.map(form => (
                  <Link href={`/builder/${form.id}`} key={form.id}>
                    <div className="grid grid-cols-12 gap-4 items-center bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm cursor-pointer transition-shadow">
                      <div className="col-span-6 flex items-center space-x-4">
                         <div className="w-10 h-10 bg-[#c07345] rounded-md flex-shrink-0"></div>
                         <h3 className="font-semibold text-gray-900 text-sm truncate">{form.title || 'Untitled form'}</h3>
                      </div>
                      <div className="col-span-1 text-center text-gray-400 text-sm">-</div>
                      <div className="col-span-1 text-center text-gray-400 text-sm">-</div>
                      <div className="col-span-2 text-center text-gray-600 text-sm">Jul 11, 2026</div>
                      <div className="col-span-2 flex items-center justify-between">
                        <div className="flex space-x-1">
                          <div className="w-6 h-6 border border-gray-200 rounded flex items-center justify-center text-gray-400 bg-gray-50">
                            <LayoutGrid size={12}/>
                          </div>
                        </div>
                        <MoreHorizontal size={18} className="text-gray-400"/>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
