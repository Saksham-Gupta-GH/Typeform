import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, Position, Handle, BaseEdge, getSmoothStepPath, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Question } from '../../../lib/api';
import { Trash2, Plus } from 'lucide-react';

const InsertEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={() => (data as any)?.onInsert()}
            className="w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-500 hover:shadow-sm transition-all z-50 cursor-pointer"
            title="Insert question here"
          >
            <Plus size={14} strokeWidth={2.5} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const edgeTypes = {
  insertEdge: InsertEdge,
};

export function WorkflowCanvas({ 
  questions, 
  selectedId, 
  onNodeClick,
  onPaneClick,
  onLogicClick,
  onInsertQuestion,
  onDeleteQuestion,
  onPushQuestion
}: { 
  questions: Question[],
  selectedId: number | null,
  onNodeClick: (id: number) => void,
  onPaneClick: () => void,
  onLogicClick: (id: number) => void,
  onInsertQuestion: (index: number) => void,
  onDeleteQuestion: (id: number) => void,
  onPushQuestion: () => void
}) {
  const nodes: Node[] = useMemo(() => {
    const qNodes = questions.map((q, i) => {
      const isSelected = selectedId === q.id;
      return {
        id: q.id.toString(),
        position: { x: 50 + (i * 320), y: 250 },
        data: { 
          label: (
            <div className={`group relative flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border ${isSelected ? 'border-gray-900 ring-1 ring-gray-900' : 'border-gray-200'} w-[240px] h-[80px]`}>
              <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 text-blue-700 font-semibold text-sm">
                {i + 1}
              </div>
              <div className="flex flex-col items-start flex-1 overflow-hidden pr-6">
                <span className="text-sm font-semibold text-gray-700 truncate w-full text-left">{q.title || 'Untitled'}</span>
              </div>
              
              <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuestion(q.id);
                  }}
                  className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-100 transition-colors border border-red-100"
                  title="Delete question"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onLogicClick(q.id);
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-800 transition-colors z-10"
                title="Logic"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
              </button>
            </div>
          )
        },
        type: 'default',
        style: { padding: 0, border: 'none', background: 'transparent' }
      };
    });

    const pushNode = {
      id: 'push-node',
      position: { x: 50 + (questions.length * 320), y: 250 },
      data: {
        label: (
          <div 
            onClick={(e) => { e.stopPropagation(); onPushQuestion(); }}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-transparent border-2 border-dashed border-gray-300 rounded-xl w-[240px] h-[80px] cursor-pointer hover:border-gray-500 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
              <Plus size={16} /> Add question
            </div>
          </div>
        )
      },
      type: 'default',
      style: { padding: 0, border: 'none', background: 'transparent' }
    };

    return [...qNodes, pushNode];
  }, [questions, selectedId, onLogicClick, onDeleteQuestion, onPushQuestion]);

  const edges: Edge[] = useMemo(() => {
    const qEdges: Edge[] = questions.slice(0, -1).map((q, i) => ({
      id: `e${q.id}-${questions[i+1].id}`,
      source: q.id.toString(),
      target: questions[i+1].id.toString(),
      type: 'insertEdge',
      data: {
        onInsert: () => onInsertQuestion(i + 1)
      },
      animated: true,
      style: { stroke: '#d1d5db', strokeWidth: 2 }
    }));

    if (questions.length > 0) {
      qEdges.push({
        id: `e${questions[questions.length - 1].id}-push`,
        source: questions[questions.length - 1].id.toString(),
        target: 'push-node',
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#d1d5db', strokeWidth: 2 }
      });
    }

    return qEdges;
  }, [questions, onInsertQuestion]);

  return (
    <div className="w-full h-full bg-[#fcfcfc]">
      <ReactFlow 
        nodes={nodes} 
        edges={edges}
        edgeTypes={edgeTypes}
        fitView 
        onNodeClick={(_, node) => {
          if (node.id !== 'push-node') onNodeClick(Number(node.id));
        }}
        onPaneClick={onPaneClick}
      >
        <Background color="#ccc" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
