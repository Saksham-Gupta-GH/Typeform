'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Question } from '@/lib/api';

interface LogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  onDeleteNode: (id: number) => void;
  index: number;
}

export default function LogicModal({ isOpen, onClose, question, onDeleteNode, index }: LogicModalProps) {
  if (!isOpen) return null;

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

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 w-24">Always go to</span>
              <select className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-500 bg-white">
                <option>Select...</option>
              </select>
            </div>

            <button className="text-gray-500 text-sm font-medium mt-4 flex items-center gap-1 hover:text-gray-900 transition-colors">
              <span className="text-lg">+</span> Add rule
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button 
            onClick={() => {
              onDeleteNode(question.id);
              onClose();
            }}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
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
              onClick={onClose}
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
