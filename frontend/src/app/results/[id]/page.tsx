'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchQuestions, fetchResponses, Question, FormSubmission } from '../../../lib/api';
import AuthHeader from '@/components/AuthHeader';
import { BarChart, Users, Clock, ArrowLeft, Download, Diamond, Calendar, Filter, LayoutList, ArrowUp, ArrowDown, LineChart, Search, Quote } from 'lucide-react';
import Link from 'next/link';
import { InsightsCanvas } from './InsightsCanvas';

export default function ResultsDashboard() {
  const params = useParams() as { id: string };
  const [activeTab, setActiveTab] = useState<'insights' | 'summary' | 'responses'>('insights');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<FormSubmission[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetchQuestions(params.id),
      fetchResponses(params.id)
    ])
    .then(([qs, resps]) => {
      setQuestions(qs);
      setResponses(resps);
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (error) return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;

  // Calculate some basic stats
  const totalResponses = responses.length;
  
  // Format answers for table
  const tableData = responses.map(r => {
    const row: Record<string | number, string | number | boolean> = { id: r.id, submitted_at: new Date(r.submitted_at).toLocaleString() };
    r.answers.forEach((a) => {
      row[a.question_id] = a.value;
    });
    return row;
  });

  const downloadCSV = () => {
    if (responses.length === 0) return;
    
    // Filter tableData if there are selected rows
    const dataToDownload = selectedRows.size > 0 
      ? tableData.filter(row => selectedRows.has(row.id as number))
      : tableData;
    
    // Headers
    const headers = ['Submitted At', ...questions.map(q => `"${q.title.replace(/"/g, '""')}"`)];
    
    // Rows
    const rows = dataToDownload.map(row => {
      return [
        `"${String(row.submitted_at).replace(/"/g, '""')}"`,
        ...questions.map(q => {
          const val = row[q.id];
          return val !== undefined ? `"${String(val).replace(/"/g, '""')}"` : '""';
        })
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `form_${params.id}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChartData = (question: Question) => {
    if (!['multiple_choice', 'dropdown', 'yes_no'].includes(question.type)) return null;
    
    const counts: Record<string, number> = {};
    responses.forEach(r => {
      const answer = r.answers.find(a => a.question_id === question.id);
      if (answer && answer.value !== null && answer.value !== undefined) {
        counts[String(answer.value)] = (counts[String(answer.value)] || 0) + 1;
      }
    });

    const options = question.type === 'yes_no' ? ['Yes', 'No'] : (question.settings?.options || []);
    
    return options.map((opt: string) => ({
      label: opt,
      count: counts[opt] || 0,
      percentage: totalResponses > 0 ? Math.round(((counts[opt] || 0) / totalResponses) * 100) : 0
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 w-1/3">
          <Link href={`/builder/${params.id}`} className="text-gray-500 hover:text-black transition flex items-center text-sm font-medium">
             <ArrowLeft size={16} className="mr-1.5"/> Forms
          </Link>
        </div>
        
        <div className="hidden md:flex gap-4 justify-center w-1/3">
          <Link href={`/builder/${params.id}`} className="text-sm font-medium text-gray-500 hover:text-gray-900 px-1 py-1 transition-colors">Content</Link>
          <button className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 px-1 py-1">Results</button>
        </div>
        
        <div className="flex items-center justify-end gap-3 w-1/3">
          <button className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors hidden sm:block">
            View plans
          </button>
          <AuthHeader />
        </div>
      </header>

      {/* Sub-tabs */}
      <div className="bg-white border-b border-gray-200 px-8 flex items-center gap-6">
        <button className="text-sm font-medium text-teal-700 px-1 py-4 flex items-center gap-1.5 opacity-50 cursor-not-allowed">
          Smart Insights <Diamond size={14}/>
        </button>
        <button onClick={() => setActiveTab('insights')} className={`text-sm font-medium px-1 py-4 ${activeTab === 'insights' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Insights</button>
        <button onClick={() => setActiveTab('summary')} className={`text-sm font-medium px-1 py-4 ${activeTab === 'summary' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Summary</button>
        <button onClick={() => setActiveTab('responses')} className={`text-sm font-medium px-1 py-4 ${activeTab === 'responses' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>Responses</button>
      </div>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        
        {activeTab === 'insights' && (
          <div className="flex flex-col gap-8">
            {/* Top Stats */}
            <div className="flex gap-12 border-b border-gray-200 pb-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Views</p>
                <p className="text-3xl font-light">{totalResponses}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Starts</p>
                <p className="text-3xl font-light">{totalResponses}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Submissions</p>
                <p className="text-3xl font-light">{totalResponses}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Completion rate</p>
                <p className="text-3xl font-light">{totalResponses > 0 ? '100%' : '0%'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Time to complete</p>
                <p className="text-3xl font-light">00:10</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-12">
              <div className="w-1/3">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Question-by-question insights</h2>
                <p className="text-gray-500 mb-6">See where people abandon your form—the first step to improving your questions so you get more responses.</p>
                <button className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2 rounded flex items-center gap-2">
                  <Diamond size={16}/> Upgrade plan
                </button>
              </div>
              <div className="w-2/3">
                <InsightsCanvas questions={questions} totalResponses={totalResponses} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">Summary</h2>
              <div className="flex items-center gap-4 text-gray-500">
                <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50"><Calendar size={14}/> All time</button>
                <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded text-sm hover:bg-gray-50"><Filter size={14}/> Filters</button>
                <div className="h-6 w-px bg-gray-200 mx-2"></div>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded p-1">
                  <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700" title="List view"><LayoutList size={16}/></button>
                  <button className="p-1.5 hover:bg-gray-200 rounded" title="Up"><ArrowUp size={16}/></button>
                  <button className="p-1.5 hover:bg-gray-200 rounded" title="Down"><ArrowDown size={16}/></button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm font-bold" title="Numbers">#</button>
                  <button className="p-1.5 hover:bg-gray-200 rounded text-sm font-bold" title="Percentages">%</button>
                </div>
              </div>
            </div>

            {questions.map((q, index) => {
              const qResponses = responses.map(r => r.answers.find(a => a.question_id === q.id)?.value).filter(Boolean);
              const isChartType = ['multiple_choice', 'dropdown', 'yes_no'].includes(q.type);
              
              return (
                <div key={q.id} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-medium text-gray-900 flex items-center gap-3">
                      <div className="flex items-center justify-center bg-blue-100 text-blue-700 font-semibold text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                      {q.title}
                    </h3>
                    <p className="text-sm text-gray-500 ml-10">
                      {qResponses.length} out of {totalResponses} people answered this question.
                    </p>
                  </div>

                  <div className="ml-10 mt-2">
                    {isChartType ? (
                      <div>
                        <div className="flex gap-2 mb-6">
                          <button className="px-4 py-1.5 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">Overview</button>
                          <button className="px-4 py-1.5 text-gray-500 hover:bg-gray-50 text-sm font-medium rounded-full flex items-center gap-1"><LineChart size={14}/> Trends</button>
                        </div>
                        <div className="flex items-end gap-2 h-40 border-b border-gray-200 pb-2">
                          {getChartData(q)?.map((data: any, idx: number) => (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-2 relative group">
                              <span className="text-xs text-purple-600 font-medium">{data.count}</span>
                              <div 
                                className="w-full bg-[#d8b4e2] rounded-t-sm transition-all hover:bg-[#c99ad6]" 
                                style={{ height: `${Math.max(data.percentage, 1)}%` }}
                              ></div>
                              <span className="absolute -bottom-6 text-xs text-gray-500 whitespace-nowrap truncate max-w-full px-1">{data.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                              type="text" 
                              placeholder="Search responses" 
                              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                            />
                          </div>
                          <span className="text-sm text-gray-500">{qResponses.length} result{qResponses.length !== 1 && 's'}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          {qResponses.map((val, i) => (
                            <div key={i} className="p-4 border border-gray-200 rounded-xl">
                              <Quote className="text-gray-300 mb-2" size={20} />
                              <p className="text-gray-800 mb-4">{String(val)}</p>
                              <p className="text-xs text-gray-400">Just now</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Individual Responses</h3>
              {responses.length > 0 && (
                <div className="flex items-center gap-3">
                  {selectedRows.size > 0 && (
                    <span className="text-sm text-gray-500">
                      {selectedRows.size} selected
                    </span>
                  )}
                  <button 
                    onClick={downloadCSV}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
                  >
                    <Download size={16} /> Download CSV
                  </button>
                </div>
              )}
            </div>
            {responses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No responses yet. Share your form to start collecting data.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 w-10">
                        <input 
                          type="checkbox"
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          checked={selectedRows.size === tableData.length && tableData.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(new Set(tableData.map(r => r.id as number)));
                            } else {
                              setSelectedRows(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 whitespace-nowrap">Submitted At</th>
                      {questions.map(q => (
                        <th key={q.id} className="px-6 py-3 whitespace-nowrap">
                          {q.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, i) => (
                      <tr key={String(row.id)} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox"
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            checked={selectedRows.has(row.id as number)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRows);
                              if (e.target.checked) {
                                newSelected.add(row.id as number);
                              } else {
                                newSelected.delete(row.id as number);
                              }
                              setSelectedRows(newSelected);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {row.submitted_at}
                        </td>
                        {questions.map(q => (
                          <td key={q.id} className="px-6 py-4 truncate max-w-xs">
                            {row[q.id] !== undefined ? String(row[q.id]) : '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
