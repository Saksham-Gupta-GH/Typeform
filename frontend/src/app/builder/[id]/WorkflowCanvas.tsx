import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Question } from '../../../lib/api';
import { TYPE_META } from './page';

export function WorkflowCanvas({ 
  questions, 
  selectedId, 
  onNodeClick,
  onPaneClick
}: { 
  questions: Question[],
  selectedId: number | null,
  onNodeClick: (id: number) => void,
  onPaneClick: () => void
}) {
  const nodes: Node[] = useMemo(() => {
    return questions.map((q, i) => {
      const isSelected = selectedId === q.id;
      return {
        id: q.id.toString(),
        position: { x: 50 + (i * 280), y: 250 },
        data: { 
          label: (
            <div className={`flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border ${isSelected ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200'} min-w-[200px] h-[80px]`}>
              <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 text-blue-700 font-semibold text-sm">
                {i + 1}
              </div>
              <div className="flex flex-col items-start flex-1 overflow-hidden">
                <span className="text-sm font-semibold text-gray-700 truncate w-full text-left">{q.title || 'Untitled'}</span>
              </div>
            </div>
          )
        },
        type: 'default',
        style: { padding: 0, border: 'none', background: 'transparent' }
      };
    });
  }, [questions, selectedId]);

  const edges: Edge[] = useMemo(() => {
    return questions.slice(0, -1).map((q, i) => ({
      id: `e${q.id}-${questions[i+1].id}`,
      source: q.id.toString(),
      target: questions[i+1].id.toString(),
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#d1d5db', strokeWidth: 2 }
    }));
  }, [questions]);

  return (
    <div className="w-full h-full bg-[#fcfcfc]">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        fitView 
        onNodeClick={(_, node) => onNodeClick(Number(node.id))}
        onPaneClick={onPaneClick}
      >
        <Background color="#ccc" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
