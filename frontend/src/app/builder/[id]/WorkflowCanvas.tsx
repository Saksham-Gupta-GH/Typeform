import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Question } from '../../../lib/api';
import { TYPE_META } from './page';

export function WorkflowCanvas({ questions }: { questions: Question[] }) {
  const nodes: Node[] = useMemo(() => {
    return questions.map((q, i) => ({
      id: q.id.toString(),
      position: { x: 50 + (i * 250), y: 250 },
      data: { 
        label: (
          <div className="flex flex-col gap-1 p-2 bg-white rounded shadow-sm border border-gray-200 min-w-[150px]">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">{i + 1}</span>
              <span className="text-xs font-semibold text-gray-700 truncate max-w-[100px]">{q.title || 'Untitled'}</span>
            </div>
            <span className="text-[10px] text-gray-400 capitalize">{TYPE_META[q.type]?.label || q.type}</span>
          </div>
        )
      },
      type: 'default',
    }));
  }, [questions]);

  const edges: Edge[] = useMemo(() => {
    return questions.slice(0, -1).map((q, i) => ({
      id: `e${q.id}-${questions[i+1].id}`,
      source: q.id.toString(),
      target: questions[i+1].id.toString(),
      type: 'smoothstep',
      animated: true,
    }));
  }, [questions]);

  return (
    <div className="w-full h-full bg-[#fcfcfc]">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
