'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchQuestions, fetchResponses, Question, FormSubmission } from '../../../lib/api';
import { BarChart, Users, Clock, ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';

export default function ResultsDashboard() {
  const params = useParams() as { id: string };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<FormSubmission[]>([]);
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
    
    // Headers
    const headers = ['Submitted At', ...questions.map(q => `"${q.title.replace(/"/g, '""')}"`)];
    
    // Rows
    const rows = tableData.map(row => {
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
        <div className="flex items-center space-x-4">
          <Link href={`/builder/${params.id}`} className="text-gray-500 hover:text-black transition flex items-center">
             <ArrowLeft size={18} className="mr-1"/> Back to Builder
          </Link>
          <h1 className="font-semibold text-lg text-gray-800">Results: Form {params.id}</h1>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
               <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Responses</p>
              <h2 className="text-3xl font-bold text-gray-900">{totalResponses}</h2>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-full">
               <BarChart size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Completion Rate</p>
              <h2 className="text-3xl font-bold text-gray-900">{totalResponses > 0 ? '100%' : '0%'}</h2>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
               <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Average Time</p>
              <h2 className="text-3xl font-bold text-gray-900">--</h2>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {totalResponses > 0 && questions.some(q => ['multiple_choice', 'dropdown', 'yes_no'].includes(q.type)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {questions.map(q => {
              const chartData = getChartData(q);
              if (!chartData) return null;
              return (
                <div key={q.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-4 truncate" title={q.title}>{q.title}</h3>
                  <div className="space-y-4">
                    {chartData.map((data: any, idx: number) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 truncate mr-4">{data.label}</span>
                          <span className="text-gray-500 whitespace-nowrap">{data.count} ({data.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${data.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Responses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Individual Responses</h3>
            {responses.length > 0 && (
              <button 
                onClick={downloadCSV}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <Download size={16} /> Download CSV
              </button>
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
      </main>
    </div>
  );
}
