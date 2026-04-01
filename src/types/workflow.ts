import type { Node as FlowNode } from '@xyflow/react';

export interface WorkflowDefinition {
  version: string;
  metadata: WorkflowMetadata;
  globals: Record<string, any>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  executionConfig: ExecutionConfig;
}

export interface WorkflowMetadata {
  name: string;
  description: string;
  author: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowNode {
  id: string;
  type: 'data_loader' | 'model_inference' | 'resource_alloc' | 'evaluator' | 'reporter';
  position: { x: number; y: number };
  data: {
    label: string;
    icon?: string;
    config: Record<string, any>;
    status?: 'pending' | 'running' | 'success' | 'failed' | 'warning';
    errorMessage?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ExecutionConfig {
  timeoutSeconds: number;
  retryCount: number;
  parallelism: number;
}

export interface ValidationError {
  id?: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
  line?: number;
}

export interface FlowNodeData extends Record<string, any> {
  label: string;
  icon?: string;
  config: Record<string, any>;
  status?: 'pending' | 'running' | 'success' | 'failed' | 'warning';
  errorMessage?: string;
}

export type CustomFlowNode = FlowNode<FlowNodeData>;

export interface OrchestratorState {
  workflow: WorkflowDefinition | null;
  rawYaml: string;
  viewMode: 'visual' | 'code';
  errors: ValidationError[];
  history: WorkflowDefinition[];
  historyIndex: number;
  selectedNodeId: string | null;
  isDirty: boolean;
  isLoading: boolean;
}

export interface OrchestratorActions {
  setWorkflow: (workflow: WorkflowDefinition) => void;
  setRawYaml: (yaml: string) => void;
  setViewMode: (mode: 'visual' | 'code') => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  updateFromVisual: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  updateFromCode: (yaml: string) => void;
  updateNodeConfig: (nodeId: string, config: Record<string, any>) => void;
  validateWorkflow: () => ValidationError[];
  saveVersion: (changeLog: string) => Promise<void>;
  loadTemplate: (templateId: string) => void;
  undo: () => void;
  redo: () => void;
  exportWorkflow: () => void;
  importWorkflow: (file: File) => Promise<boolean>;
}

export type OrchestratorStore = OrchestratorState & OrchestratorActions;