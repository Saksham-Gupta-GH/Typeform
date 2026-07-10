'use client';

import React, { useState } from 'react';
import { Settings, LayoutTemplate, Plus, GripVertical, Trash2 } from 'lucide-react';

export default function BuilderPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* LEFT SIDEBAR: Question List */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Questions</h2>
          <button className="text-gray-500 hover:text-black">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Placeholder for Draggable Question List */}
            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md cursor-pointer">
              <GripVertical size={16} className="text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700 truncate flex-1">1. What is your name?</span>
              <Trash2 size={16} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center p-3 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-md cursor-pointer transition-colors">
              <GripVertical size={16} className="text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 truncate flex-1">2. How did you hear about us?</span>
            </div>
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
             <span className="text-sm text-gray-500">Form ID: {params.id}</span>
             <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition">
               Publish
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-gray-100/50">
           {/* LIVE PREVIEW CANVAS */}
           <div className="w-full max-w-3xl bg-white shadow-sm border border-gray-200 rounded-lg p-12 min-h-[400px] flex flex-col justify-center">
              <span className="text-blue-600 font-bold mb-2 text-sm flex items-center">
                1 <span className="ml-2">→</span>
              </span>
              <input 
                type="text" 
                placeholder="What is your name?" 
                className="text-3xl font-semibold text-gray-900 border-none outline-none w-full bg-transparent placeholder-gray-300"
              />
              <p className="text-gray-500 mt-2 text-sm">Please enter your full legal name.</p>
              
              <div className="mt-8">
                <input type="text" placeholder="Type your answer here..." className="w-full border-b border-gray-300 pb-2 text-lg outline-none focus:border-blue-500 transition-colors bg-transparent text-gray-800" disabled/>
              </div>
           </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR: Question Settings (Only show if 'content' tab is active) */}
      {activeTab === 'content' && (
        <aside className="w-72 bg-white border-l border-gray-200 flex flex-col">
           <div className="p-4 border-b border-gray-200 flex items-center">
             <Settings size={18} className="text-gray-500 mr-2" />
             <h2 className="font-semibold text-gray-800">Question Settings</h2>
           </div>
           <div className="p-6 space-y-6 flex-1 overflow-y-auto">
             
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Short Text</option>
                  <option>Long Text</option>
                  <option>Multiple Choice</option>
                  <option>Dropdown</option>
                </select>
             </div>

             <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
             </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={3} 
                  placeholder="Add a description or help text..."
                  className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
             </div>

           </div>
        </aside>
      )}
    </div>
  );
}
