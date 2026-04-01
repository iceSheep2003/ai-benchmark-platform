import React, { useMemo } from 'react';
import { Card, Tag, Progress, Space, Tooltip } from 'antd';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTaskStreamStore } from '../../store/taskStreamStore';

const NODE_TYPES = {
  data_loader: { label: 'Data Loader', color: '#1890ff', icon: '📊' },
  model_inference: { label: 'Model Inference', color: '#52c41a', icon: '🤖' },
  resource_alloc: { label: 'Resource Allocation', color: '#faad14', icon: '⚡' },
  evaluator: { label: 'Evaluator', color: '#722ed1', icon: '📈' },
  reporter: { label: 'Reporter', color: '#eb2f96', icon: '📝' },
};

interface RuntimeFlowProps {
  taskId?: string;
}

const RuntimeNode: React.FC<NodeProps> = ({ data }) => {
  const { runtimeNodes } = useTaskStreamStore();
  const nodeStatus = runtimeNodes.find((n) => n.nodeId === data.id);

  const nodeType = NODE_TYPES[data.type as keyof typeof NODE_TYPES] || NODE_TYPES.data_loader;
  const status = nodeStatus?.status || 'pending';
  const progress = nodeStatus?.progress || 0;
  const elapsedTime = nodeStatus?.elapsedTime || 0;

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return <Tag color="processing">Running</Tag>;
      case 'completed':
        return <Tag color="success">Completed</Tag>;
      case 'failed':
        return <Tag color="error">Failed</Tag>;
      default:
        return <Tag>Pending</Tag>;
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        border: `2px solid ${status === 'running' ? '#52c41a' : status === 'failed' ? '#ff4d4f' : '#303030'}`,
        backgroundColor: '#1f1f1f',
        minWidth: '200px',
        boxShadow: status === 'running' ? '0 0 10px rgba(82, 196, 26, 0.3)' : 'none',
        animation: status === 'running' ? 'pulse 2s infinite' : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#1890ff' }} />
      
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{nodeType.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
              {nodeType.label}
            </div>
            <div style={{ color: '#999', fontSize: '12px' }}>{String(data.id)}</div>
          </div>
        </div>

        <div style={{ width: '100%' }}>
          {getStatusBadge()}
        </div>

        {status === 'running' && (
          <div style={{ width: '100%' }}>
            <Progress
              percent={progress}
              strokeColor="#52c41a"
              trailColor="#303030"
              size="small"
              showInfo={false}
            />
            <div style={{ color: '#999', fontSize: '11px', marginTop: '4px' }}>
              Progress: {progress.toFixed(0)}% | Elapsed: {elapsedTime.toFixed(1)}s
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div style={{ color: '#52c41a', fontSize: '12px' }}>
            ✓ Completed in {elapsedTime.toFixed(1)}s
          </div>
        )}

        {status === 'failed' && nodeStatus?.error && (
          <Tooltip title={nodeStatus.error}>
            <div style={{ 
              color: '#ff4d4f', 
              fontSize: '11px', 
              padding: '4px 8px',
              backgroundColor: 'rgba(255, 77, 79, 0.1)',
              borderRadius: '4px',
              border: '1px solid #ff4d4f',
            }}>
              ⚠️ {nodeStatus.error}
            </div>
          </Tooltip>
        )}
      </Space>

      <Handle type="source" position={Position.Bottom} style={{ background: '#52c41a' }} />
    </div>
  );
};

export const RuntimeFlow: React.FC<RuntimeFlowProps> = () => {
  const { runtimeNodes } = useTaskStreamStore();

  const nodes = useMemo(() => {
    return [
      {
        id: 'data_loader',
        type: 'custom',
        position: { x: 250, y: 50 },
        data: { id: 'data_loader', type: 'data_loader' },
      },
      {
        id: 'model_inference',
        type: 'custom',
        position: { x: 250, y: 200 },
        data: { id: 'model_inference', type: 'model_inference' },
      },
      {
        id: 'resource_alloc',
        type: 'custom',
        position: { x: 50, y: 200 },
        data: { id: 'resource_alloc', type: 'resource_alloc' },
      },
      {
        id: 'evaluator',
        type: 'custom',
        position: { x: 250, y: 350 },
        data: { id: 'evaluator', type: 'evaluator' },
      },
      {
        id: 'reporter',
        type: 'custom',
        position: { x: 250, y: 500 },
        data: { id: 'reporter', type: 'reporter' },
      },
    ];
  }, []);

  const edges = useMemo(() => {
    return [
      {
        id: 'e1',
        source: 'data_loader',
        target: 'model_inference',
        animated: runtimeNodes.some((n) => n.nodeId === 'data_loader' && n.status === 'running'),
      },
      {
        id: 'e2',
        source: 'resource_alloc',
        target: 'model_inference',
        animated: runtimeNodes.some((n) => n.nodeId === 'resource_alloc' && n.status === 'running'),
      },
      {
        id: 'e3',
        source: 'model_inference',
        target: 'evaluator',
        animated: runtimeNodes.some((n) => n.nodeId === 'model_inference' && n.status === 'running'),
      },
      {
        id: 'e4',
        source: 'evaluator',
        target: 'reporter',
        animated: runtimeNodes.some((n) => n.nodeId === 'evaluator' && n.status === 'running'),
      },
    ];
  }, [runtimeNodes]);

  const nodeTypes = {
    custom: RuntimeNode,
  };

  return (
    <Card title="Runtime Topology">
      <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          style={{ backgroundColor: '#141414' }}
        >
          <Background color="#303030" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const nodeStatus = runtimeNodes.find((n) => n.nodeId === node.id);
              if (!nodeStatus) return '#999';
              if (nodeStatus.status === 'running') return '#52c41a';
              if (nodeStatus.status === 'completed') return '#1890ff';
              if (nodeStatus.status === 'failed') return '#ff4d4f';
              return '#999';
            }}
            maskColor="rgba(0, 0, 0, 0.5)"
          />
        </ReactFlow>
      </div>
    </Card>
  );
};
