'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Plus, GripVertical, Trash2, Smartphone, MonitorPlay, ChevronDown, Sparkles, X, ChevronRight, HelpCircle, LayoutList, Share2, Diamond } from 'lucide-react';
import { fetchQuestions, createQuestion, updateQuestion, deleteQuestion, reorderQuestions, Question } from '../../../lib/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icon mapper
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'short_text': return <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">-</div>;
    case 'long_text': return <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">≡</div>;
    case 'multiple_choice': return <div className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">A-</div>;
    case 'email': return <div className="w-6 h-6 rounded bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs">@</div>;
    case 'number': return <div className="w-6 h-6 rounded bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-xs">#</div>;
    case 'yes_no': return <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">Y/N</div>;
    case 'rating': return <div className="w-6 h-6 rounded bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">★</div>;
    default: return <div className="w-6 h-6 rounded bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">?</div>;
  }
};

interface SortableQuestionItemProps {
  id: number;
  question: Question;
  index: number;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
}

// --- Sortable Item Component ---
function SortableQuestionItem({ id, question, index, isSelected, onSelect, onDelete }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      onClick={() => onSelect(id)}
      className={`group flex items-center p-2.5 rounded-lg cursor-pointer transition-colors mb-2 border ${
        isSelected 
          ? 'bg-blue-50/50 border-blue-200' 
          : 'bg-white hover:bg-gray-50 border-transparent shadow-[0_1px_3px_rgba(0,0,0,0.05)]'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-black mr-1 flex-shrink-0 text-gray-300">
        <GripVertical size={14} />
      </div>
      <div className="flex-shrink-0 mr-3">
        {getTypeIcon(question.type)}
      </div>
      <div className="flex-1 truncate min-w-0">
        <span className={`text-sm truncate block ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
          {question.title || 'Untitled'}
        </span>
      </div>
      <button onClick={(e) => onDelete(id, e)} className="p-1 flex-shrink-0 ml-1">
        <Trash2 size={14} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

export default function BuilderPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchQuestions(params.id)
      .then(data => {
        setQuestions(data);
        if (data.length > 0) setSelectedQuestionId(data[0].id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleAddQuestion = async (type: string = 'short_text') => {
    try {
      const newQ = await createQuestion(params.id, {
        type: type,
        title: 'New Question',
        order_index: questions.length,
        is_required: false
      });
      setQuestions(prev => [...prev, newQ]);
      setSelectedQuestionId(newQ.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (selectedQuestionId === id) setSelectedQuestionId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSelected = async (updates: Partial<Question>) => {
    if (!selectedQuestionId) return;
    const previousQuestions = [...questions];
    setQuestions(prev => prev.map(q => q.id === selectedQuestionId ? { ...q, ...updates } : q));
    
    try {
      await updateQuestion(selectedQuestionId, updates);
    } catch (err) {
      console.error("Update failed, rolling back", err);
      setQuestions(previousQuestions);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      const newOrder = arrayMove(questions, oldIndex, newIndex);
      
      setQuestions(newOrder);
      try {
        const orderedIds = newOrder.map(q => q.id);
        await reorderQuestions(orderedIds);
      } catch (err) {
        console.error("Failed to reorder questions", err);
      }
    }
  };

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  return (
    <div className="flex h-screen bg-[#f3f3f3] font-sans overflow-hidden">
      
      {/* Top Navigation */}
      <header className="absolute top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-10 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center space-x-2 w-1/3">
           <div className="flex items-center text-sm font-medium text-gray-500 cursor-pointer">
              <LayoutList size={16} className="mr-2"/> Forms <ChevronRight size={14} className="mx-1"/>
           </div>
           <span className="text-sm font-medium text-gray-900">form1</span>
        </div>
        
        <div className="flex space-x-1 justify-center w-1/3">
           <button className="px-4 py-2 bg-gray-100 text-gray-900 font-medium text-sm rounded-md">Content</button>
           <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium text-sm rounded-md">Workflow</button>
           <button className="px-4 py-2 text-gray-600 hover:bg-gray-50 font-medium text-sm rounded-md">Connect</button>
        </div>
        
        <div className="flex items-center justify-end space-x-3 w-1/3">
           <button className="text-gray-900 border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium flex items-center hover:bg-gray-50">
             <Share2 size={14} className="mr-2"/> Share
           </button>
           <button className="bg-[#1f7363] hover:bg-[#155a4d] text-white rounded-md px-4 py-1.5 text-sm font-medium transition-colors">
             View plans
           </button>
           <HelpCircle size={18} className="text-gray-400 cursor-pointer"/>
           <div className="w-8 h-8 rounded-full bg-[#fce8cc] text-[#b85434] flex items-center justify-center font-bold text-xs cursor-pointer">
             SG
           </div>
        </div>
      </header>

      {/* Main Content Area (Below Header) */}
      <div className="flex w-full h-full pt-14">
        
        {/* LEFT SIDEBAR: Pages List */}
        <aside className="w-[280px] bg-[#f9f9f9] border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
             <button className="w-full flex items-center justify-between bg-white border border-gray-200 shadow-sm rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                <span className="flex items-center"><LayoutList size={16} className="mr-2"/> Universal mode</span>
                <ChevronDown size={16} className="text-gray-400"/>
             </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
             <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pages</h3>
             
             {loading ? (
                <div className="text-sm text-gray-500">Loading...</div>
             ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={questions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {questions.map((q, idx) => (
                      <SortableQuestionItem
                        key={q.id}
                        id={q.id}
                        question={q}
                        index={idx}
                        isSelected={selectedQuestionId === q.id}
                        onSelect={setSelectedQuestionId}
                        onDelete={handleDeleteQuestion}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
             )}
             
             <button 
               onClick={() => handleAddQuestion()} 
               className="mt-2 w-full border border-dashed border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-600 hover:text-black hover:border-gray-400 transition flex items-center justify-center bg-white"
             >
               <Plus size={16} className="mr-1"/> Add new question
             </button>
             
             <div className="mt-4 border border-purple-200 bg-purple-50 rounded-lg p-3 cursor-pointer group flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                  <Sparkles size={16} className="text-purple-600 mr-2"/>
                  <span className="text-sm font-medium text-gray-800">Personalize with branching</span>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-black transition-colors"/>
             </div>
             
             <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                   <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Endings</h3>
                   <Plus size={14} className="text-gray-400 cursor-pointer hover:text-black"/>
                </div>
             </div>
          </div>
        </aside>

        {/* CENTER CANVAS */}
        <main className="flex-1 flex flex-col relative">
          
          {/* Canvas Toolbar */}
          <div className="h-12 flex items-center justify-center space-x-6 text-gray-500 absolute top-0 w-full bg-[#f3f3f3] z-0">
             <button className="flex items-center space-x-2 bg-gray-800 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-md z-10 hover:bg-gray-700 transition">
                <Plus size={14}/> <span>Add content</span>
             </button>
             <button className="flex items-center text-sm font-medium hover:text-gray-900"><div className="mr-1">🎨</div> Design</button>
             <div className="h-4 w-px bg-gray-300"></div>
             <MonitorPlay size={16} className="cursor-pointer hover:text-gray-900"/>
             <Smartphone size={16} className="cursor-pointer hover:text-gray-900"/>
          </div>

          <div className="flex-1 flex items-center justify-center p-8 mt-12 relative overflow-hidden">
             
             <div className="w-full max-w-3xl bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] rounded-xl min-h-[450px] p-16 flex flex-col items-center justify-center text-center relative overflow-hidden">
                {selectedQuestion ? (
                  <>
                     <input 
                        type="text" 
                        value={selectedQuestion.title}
                        onChange={(e) => handleUpdateSelected({ title: e.target.value })}
                        placeholder="Your question here..."
                        className="text-3xl font-semibold text-gray-900 text-center w-full outline-none bg-transparent mb-4"
                     />
                     <textarea 
                        value={selectedQuestion.description || ''}
                        onChange={(e) => handleUpdateSelected({ description: e.target.value })}
                        placeholder="Description (optional)"
                        className="text-lg text-gray-500 text-center w-full outline-none bg-transparent resize-none overflow-hidden h-20"
                     />
                     
                     <div className="mt-8">
                        <button className="bg-blue-600 text-white font-bold py-3 px-8 rounded text-lg hover:bg-blue-700 transition-colors shadow-sm">
                          start
                        </button>
                        <p className="text-gray-400 text-xs mt-3 flex items-center justify-center">
                          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          Takes X minutes
                        </p>
                     </div>
                  </>
                ) : (
                  <div className="text-gray-400">Select a question to edit</div>
                )}
             </div>
             
             {/* OpenRouter AI Floating Box */}
             <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-lg bg-white rounded-full shadow-lg border border-purple-200 p-1 flex items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-purple-500">
                  <Sparkles size={20}/>
                </div>
                <input 
                  type="text" 
                  placeholder="Chat to create" 
                  className="flex-1 px-2 py-2 outline-none text-gray-700 bg-transparent"
                />
                <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-purple-600 transition">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
             </div>
             
          </div>
        </main>

        {/* RIGHT SIDEBAR: Settings */}
        {selectedQuestion && (
          <aside className="w-[320px] bg-white border-l border-gray-200 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
             <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center text-sm font-medium text-gray-800 bg-gray-100 px-3 py-1.5 rounded-md w-full justify-between cursor-pointer">
                  <div className="flex items-center">
                    <div className="w-5 h-5 bg-gray-300 rounded mr-2 flex items-center justify-center text-[10px] text-white font-bold">[]</div>
                    {selectedQuestion.type}
                  </div>
                  <ChevronDown size={16} className="text-gray-500"/>
                </div>
             </div>
             
             <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between">
                   <label className="text-sm font-medium text-gray-700 flex items-center">Required <HelpCircle size={14} className="ml-1 text-gray-400"/></label>
                   <div className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${selectedQuestion.is_required ? 'bg-blue-600' : 'bg-gray-300'}`}
                        onClick={() => handleUpdateSelected({ is_required: !selectedQuestion.is_required })}>
                     <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${selectedQuestion.is_required ? 'translate-x-4' : 'translate-x-0'}`}></div>
                   </div>
                </div>
                
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Button</label>
                   <div className="relative">
                     <input 
                       type="text"
                       value="start"
                       className="w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm" 
                       readOnly
                     />
                     <span className="absolute right-2 top-2 text-xs text-gray-400">5/24</span>
                   </div>
                </div>

                <div>
                   <label className="text-sm font-medium text-gray-700 mb-2 flex justify-between items-center">
                     Image or video
                     <button className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"><Plus size={16}/></button>
                   </label>
                </div>

                {/* Dynamic Options based on type */}
                {selectedQuestion.type === 'multiple_choice' && (
                  <div className="pt-4 border-t border-gray-100">
                     <label className="block text-sm font-medium text-gray-700 mb-3">Choices</label>
                     <div className="space-y-2">
                       {(selectedQuestion.settings?.options || []).map((opt, i) => (
                         <div key={i} className="flex items-center space-x-2 group">
                           <input 
                             type="text" 
                             value={opt}
                             onChange={(e) => {
                               const newOptions = [...(selectedQuestion.settings?.options || [])];
                               newOptions[i] = e.target.value;
                               handleUpdateSelected({ settings: { ...selectedQuestion.settings, options: newOptions } });
                             }}
                             className="flex-1 border border-gray-200 rounded p-2 text-sm outline-none focus:border-blue-500 hover:border-gray-300 transition-colors shadow-sm"
                           />
                           <button 
                             onClick={() => {
                               const newOptions = (selectedQuestion.settings?.options || []).filter((_, idx) => idx !== i);
                               handleUpdateSelected({ settings: { ...selectedQuestion.settings, options: newOptions } });
                             }}
                             className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Trash2 size={16} />
                           </button>
                         </div>
                       ))}
                       <button 
                         onClick={() => {
                           const newOptions = [...(selectedQuestion.settings?.options || []), `Choice ${(selectedQuestion.settings?.options?.length || 0) + 1}`];
                           handleUpdateSelected({ settings: { ...selectedQuestion.settings, options: newOptions } });
                         }}
                         className="text-gray-500 text-sm font-medium hover:text-black flex items-center mt-3"
                       >
                         <Plus size={14} className="mr-1" /> Add choice
                       </button>
                     </div>
                  </div>
                )}
             </div>
             
             <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100">
                Comments <span className="ml-2 w-4 h-4 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-[10px]"><Diamond size={10}/></span>
             </div>
          </aside>
        )}
      </div>
    </div>
  );
}
