'use client';

import React, { useState, useEffect } from 'react';
import { fetchQuestions, fetchResponses, Question, FormSubmission } from '../../../lib/api';
import { BarChart, Users, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResultsDashboard({ params }: { params: { id: string } }) {
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
    const row: any = { id: r.id, submitted_at: new Date(r.submitted_at).toLocaleString() };
    r.answers.forEach((a: any) => {
      row[a.question_id] = a.value;
    });
    return row;
  });

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

        {/* Responses Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Individual Responses</h3>
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
                    <tr key={row.id} className="bg-white border-b hover:bg-gray-50">
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
