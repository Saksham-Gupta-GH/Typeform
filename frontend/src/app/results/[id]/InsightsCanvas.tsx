import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Question } from '../../../lib/api';

export function InsightsCanvas({ questions, totalResponses }: { questions: Question[], totalResponses: number }) {
  const nodes: Node[] = useMemo(() => {
    return questions.map((q, i) => ({
      id: q.id.toString(),
      position: { x: 250, y: 50 + (i * 200) },
      data: { 
        label: (
          <div className="flex flex-col gap-1 p-4 bg-white rounded-lg shadow-sm border border-gray-200 min-w-[250px]">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{q.title || 'Untitled'}</span>
            </div>
            <span className="text-xs text-gray-500">{totalResponses} views</span>
          </div>
        )
      },
      type: 'default',
    }));
  }, [questions, totalResponses]);

  const edges: Edge[] = useMemo(() => {
    return questions.slice(0, -1).map((q, i) => ({
      id: `e${q.id}-${questions[i+1].id}`,
      source: q.id.toString(),
      target: questions[i+1].id.toString(),
      type: 'smoothstep',
      label: `↓ Drop-off: 0 (0%)`,
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 12,
      labelBgStyle: { fill: '#fee2e2', color: '#991b1b', fillOpacity: 1 },
      labelStyle: { fill: '#991b1b', fontWeight: 600, fontSize: 10 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
        color: '#d1d5db',
      },
      style: {
        strokeWidth: 2,
        stroke: '#d1d5db',
      },
    }));
  }, [questions]);

  return (
    <div className="w-full h-[600px] bg-[#e8f4f2] rounded-xl overflow-hidden relative">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
