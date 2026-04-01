import { useCallback, useMemo, useState } from 'react';
import { 
  Layout, 
  Button, 
  Space, 
  Typography, 
  Modal, 
  message, 
  Dropdown, 
  Tooltip,
  Spin,
} from 'antd';
import { 
  SaveOutlined, 
  DownloadOutlined, 
  UploadOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  CodeOutlined,
  PlayCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Node,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useOrchestratorStore } from '../store/orchestratorStore';
import { useAppStore } from '../store/appStore';
import { ResourcePanel } from '../components/Sidebar/ResourcePanel';
import { ProblemPanel } from '../components/Diagnostic/ProblemPanel';
import { NodeConfigDrawer } from '../components/Drawer/NodeConfigDrawer';
import { FullCodeEditor } from '../components/Editor/FullCodeEditor';
import { CustomNode } from '../components/Nodes/CustomNode';
import { workflowToFlow, generateNodeId, generateEdgeId } from '../utils/transformers';
import { hasCriticalErrors } from '../utils/validator';
import type { WorkflowNode } from '../types/workflow';
import { estimateWorkflowResources } from '../services/workflowExecutor';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const nodeTypes = {
  custom: CustomNode,
};

export const OrchestrationCenter = () => {
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  
  const {
    workflow,
    viewMode,
    setViewMode,
    updateFromVisual,
    saveVersion,
    undo,
    redo,
    exportWorkflow,
    importWorkflow,
    history,
    historyIndex,
    errors,
    isLoading,
  } = useOrchestratorStore();
  
  const { executeWorkflow, setCurrentPage } = useAppStore();

  const initialNodes = useMemo(() => {
    if (!workflow) return [];
    const { nodes } = workflowToFlow(workflow);
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        nodeType: workflow.nodes.find((n) => n.id === node.id)?.type || 'data_loader',
      },
    }));
  }, [workflow]);

  const initialEdges = useMemo(() => {
    if (!workflow) return [];
    const { edges } = workflowToFlow(workflow);
    return edges;
  }, [workflow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: generateEdgeId(),
        type: 'smoothstep' as any,
        animated: true,
      };
      setEdges((eds) => addEdge(newEdge as any, eds));
    },
    [setEdges]
  );

  const onNodeDragStop = useCallback(() => {
    const workflowNodes = nodes.map((node) => ({
      id: node.id,
      type: (node.data as any).nodeType || 'data_loader',
      position: node.position,
      data: node.data,
    })) as any[];
    
    const workflowEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ? String(edge.label) : undefined,
    })) as any[];
    
    updateFromVisual(workflowNodes, workflowEdges);
  }, [nodes, edges, updateFromVisual]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const workflowNode = workflow?.nodes.find((n) => n.id === node.id);
    if (workflowNode) {
      setSelectedNode(workflowNode);
    }
  }, [workflow]);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    const workflowNode = workflow?.nodes.find((n) => n.id === node.id);
    if (workflowNode) {
      setSelectedNode(workflowNode);
      setConfigDrawerVisible(true);
    }
  }, [workflow]);

  const onNodesDelete = useCallback(() => {
    const workflowNodes = nodes.map((node) => ({
      id: node.id,
      type: (node.data as any).nodeType || 'data_loader',
      position: node.position,
      data: node.data,
    })) as any[];
    
    const workflowEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ? String(edge.label) : undefined,
    })) as any[];
    
    updateFromVisual(workflowNodes, workflowEdges);
  }, [nodes, edges, updateFromVisual]);

  const onEdgesDelete = useCallback(() => {
    const workflowNodes = nodes.map((node) => ({
      id: node.id,
      type: (node.data as any).nodeType || 'data_loader',
      position: node.position,
      data: node.data,
    })) as any[];
    
    const workflowEdges = edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ? String(edge.label) : undefined,
    })) as any[];
    
    updateFromVisual(workflowNodes, workflowEdges);
  }, [nodes, edges, updateFromVisual]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - 320,
        y: event.clientY - 64,
      };

      const newNode: any = {
        id: generateNodeId(),
        type: 'custom',
        position,
        data: {
          label: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          nodeType: type,
          config: {},
          status: 'pending',
        },
      };

      setNodes((nds) => [...nds, newNode]);
      updateFromVisual([...nodes, newNode] as any[], edges as any[]);
    },
    [nodes, edges, setNodes, updateFromVisual]
  );

  const handleSave = useCallback(async () => {
    try {
      await saveVersion('Manual save');
      message.success('Workflow saved successfully');
    } catch (error) {
      message.error('Failed to save workflow');
    }
  }, [saveVersion]);

  const handleExport = useCallback(() => {
    exportWorkflow();
    message.success('Workflow exported successfully');
  }, [exportWorkflow]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const success = await importWorkflow(file);
        if (success) {
          message.success('Workflow imported successfully');
        } else {
          message.error('Failed to import workflow');
        }
      }
    };
    input.click();
  }, [importWorkflow]);

  const handleViewModeChange = useCallback(
    (mode: 'visual' | 'code') => {
      if (mode === 'visual' && hasCriticalErrors(errors)) {
        Modal.warning({
          title: 'Cannot Switch to Visual Mode',
          content: 'Please fix all errors in the code before switching to visual mode.',
          icon: <ExclamationCircleOutlined />,
        });
        return;
      }
      setViewMode(mode);
    },
    [errors, setViewMode]
  );

  const handleExecute = useCallback(() => {
    if (hasCriticalErrors(errors)) {
      Modal.error({
        title: 'Cannot Execute Workflow',
        content: 'Please fix all errors before executing the workflow.',
        icon: <ExclamationCircleOutlined />,
      });
      return;
    }

    if (!workflow) {
      message.error('No workflow to execute');
      return;
    }

    const resourceEst = estimateWorkflowResources(workflow);

    Modal.confirm({
      title: 'Execute Workflow',
      content: (
        <div>
          <p>Are you sure you want to execute this workflow?</p>
          <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <p><strong>Resource Requirements:</strong></p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>GPUs: {resourceEst.gpuCount}</li>
              <li>Memory: {resourceEst.memoryGB} GB</li>
              <li>Estimated Duration: {resourceEst.estimatedDuration} min</li>
            </ul>
            {resourceEst.warnings.length > 0 && (
              <p style={{ color: '#faad14', marginTop: '8px' }}>
                <strong>Warnings:</strong> {resourceEst.warnings.join(', ')}
              </p>
            )}
          </div>
        </div>
      ),
      icon: <PlayCircleOutlined />,
      onOk() {
        const taskId = executeWorkflow(workflow);
        if (taskId) {
          message.success(`Workflow execution started. Task ID: ${taskId}`);
          setCurrentPage('tasks');
        } else {
          message.error('Failed to execute workflow');
        }
      },
    });
  }, [errors, workflow, executeWorkflow, setCurrentPage]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const workflowValid = errors.length === 0;

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#141414',
      }}>
        <Spin size="large" tip="Loading workflow..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#141414' }}>
      <Header
        style={{ 
          backgroundColor: '#1f1f1f', 
          borderBottom: '1px solid #303030',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <Title level={4} style={{ color: '#ffffff', margin: 0 }}>
            Orchestration Center
          </Title>
          {workflow && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {workflow.metadata.name}
            </Text>
          )}
        </Space>

        <Space>
          <Tooltip title="Undo">
            <Button 
              icon={<UndoOutlined />} 
              disabled={!canUndo}
              onClick={undo}
            />
          </Tooltip>
          <Tooltip title="Redo">
            <Button 
              icon={<RedoOutlined />} 
              disabled={!canRedo}
              onClick={redo}
            />
          </Tooltip>

          <Button.Group>
            <Tooltip title="Visual Mode">
              <Button 
                type={viewMode === 'visual' ? 'primary' : 'default'}
                icon={<EyeOutlined />}
                onClick={() => handleViewModeChange('visual')}
              >
                Visual
              </Button>
            </Tooltip>
            <Tooltip title="Code Mode">
              <Button 
                type={viewMode === 'code' ? 'primary' : 'default'}
                icon={<CodeOutlined />}
                onClick={() => handleViewModeChange('code')}
              >
                Code
              </Button>
            </Tooltip>
          </Button.Group>

          <Dropdown
            menu={{
              items: [
                {
                  key: 'save',
                  icon: <SaveOutlined />,
                  label: 'Save',
                  onClick: handleSave,
                },
                {
                  key: 'export',
                  icon: <DownloadOutlined />,
                  label: 'Export',
                  onClick: handleExport,
                },
                {
                  key: 'import',
                  icon: <UploadOutlined />,
                  label: 'Import',
                  onClick: handleImport,
                },
              ],
            }}
          >
            <Button icon={<SaveOutlined />}>
              File
            </Button>
          </Dropdown>

          <Button 
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecute}
            disabled={!workflowValid}
          >
            Execute
          </Button>
        </Space>
      </Header>

      <Layout>
        <ResourcePanel />

        <Content
          style={{ 
            position: 'relative',
            backgroundColor: '#141414',
            overflow: 'hidden',
          }}
        >
          {viewMode === 'visual' ? (
            <div
              style={{ 
                width: '100%', 
                height: '100%',
              }}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onNodesDelete={onNodesDelete}
                onEdgesDelete={onEdgesDelete}
                nodeTypes={nodeTypes}
                fitView
                style={{ backgroundColor: '#141414' }}
              >
                <Background color="#303030" gap={16} />
                <Controls />
                <MiniMap 
                  nodeColor={(node) => {
                    const nodeType = (node.data as any).nodeType;
                    const colors: Record<string, string> = {
                      data_loader: '#1890ff',
                      model_inference: '#52c41a',
                      resource_alloc: '#faad14',
                      evaluator: '#722ed1',
                      reporter: '#eb2f96',
                    };
                    return colors[nodeType] || '#1890ff';
                  }}
                  maskColor="rgba(0, 0, 0, 0.5)"
                />
              </ReactFlow>
            </div>
          ) : (
            <FullCodeEditor />
          )}
        </Content>

        <ProblemPanel />
      </Layout>

      <NodeConfigDrawer
        visible={configDrawerVisible}
        node={selectedNode}
        onClose={() => setConfigDrawerVisible(false)}
      />
    </Layout>
  );
};