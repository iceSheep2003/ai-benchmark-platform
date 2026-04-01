import * as yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '../types/workflow';
import type { Node as FlowNode, Edge as FlowEdge } from '@xyflow/react';

/**
 * 将 WorkflowDefinition 转换为 YAML 字符串
 * @param workflow - 工作流定义对象
 * @returns YAML 格式的字符串
 */
export function workflowToYaml(workflow: WorkflowDefinition): string {
  try {
    return yaml.dump(workflow, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false,
    });
  } catch (error) {
    console.error('Failed to convert workflow to YAML:', error);
    throw new Error('Failed to serialize workflow to YAML');
  }
}

/**
 * 将 YAML 字符串解析为 WorkflowDefinition
 * @param yamlString - YAML 格式的字符串
 * @returns 解析后的工作流定义对象
 * @throws 如果 YAML 语法错误，抛出异常
 */
export function yamlToWorkflow(yamlString: string): WorkflowDefinition {
  try {
    const parsed = yaml.load(yamlString) as WorkflowDefinition;
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid workflow structure');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse YAML:', error);
    throw new Error('Failed to parse YAML: Invalid syntax or structure');
  }
}

/**
 * 将 WorkflowDefinition 的 nodes 和 edges 转换为 React Flow 格式
 * @param workflow - 工作流定义对象
 * @returns React Flow 的 nodes 和 edges 数组
 */
export function workflowToFlow(workflow: WorkflowDefinition): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  try {
    const nodes: FlowNode[] = workflow.nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        label: node.data.label,
        icon: node.data.icon,
        config: node.data.config || {},
        status: node.data.status || 'pending',
        errorMessage: node.data.errorMessage,
      },
    }));

    const edges: FlowEdge[] = workflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: true,
    }));

    return { nodes, edges };
  } catch (error) {
    console.error('Failed to convert workflow to flow:', error);
    throw new Error('Failed to convert workflow to visual flow');
  }
}

/**
 * 将 React Flow 的 nodes 和 edges 转换回 WorkflowDefinition 格式
 * @param flowNodes - React Flow 的节点数组
 * @param flowEdges - React Flow 的边数组
 * @param currentWorkflow - 当前的工作流定义（保留 metadata 和 globals）
 * @returns 更新后的工作流定义对象
 */
export function flowToWorkflow(
  flowNodes: FlowNode[],
  flowEdges: FlowEdge[],
  currentWorkflow: WorkflowDefinition
): WorkflowDefinition {
  try {
    const nodes: WorkflowNode[] = flowNodes.map((node) => ({
      id: node.id,
      type: (node.data.nodeType as any) || 'data_loader',
      position: node.position,
      data: {
        label: (node.data.label as string) || 'Untitled',
        icon: node.data.icon as string | undefined,
        config: node.data.config || {},
        status: (node.data.status as any) || 'pending',
        errorMessage: node.data.errorMessage as string | undefined,
      },
    }));

    const edges: WorkflowEdge[] = flowEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label ? String(edge.label) : undefined,
    }));

    return {
      ...currentWorkflow,
      nodes,
      edges,
      metadata: {
        ...currentWorkflow.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to convert flow to workflow:', error);
    throw new Error('Failed to convert visual flow to workflow definition');
  }
}

/**
 * 检测工作流中的循环依赖
 * @param nodes - 节点数组
 * @param edges - 边数组
 * @returns 包含循环的节点 ID 数组
 */
export function detectCycles(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const adjacencyList = new Map<string, string[]>();
  
  edges.forEach((edge) => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[] = [];

  function dfs(nodeId: string) {
    if (!nodeIds.has(nodeId)) return;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        cycles.push(neighbor);
      }
    }

    recursionStack.delete(nodeId);
  }

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return Array.from(new Set(cycles));
}

/**
 * 检测孤立节点（没有输入和输出的节点）
 * @param nodes - 节点数组
 * @param edges - 边数组
 * @returns 孤立节点 ID 数组
 */
export function detectIsolatedNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string[] {
  const connectedNodeIds = new Set<string>();
  
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  return nodes
    .filter((node) => !connectedNodeIds.has(node.id))
    .map((node) => node.id);
}

/**
 * 计算工作流的总资源需求
 * @param workflow - 工作流定义对象
 * @returns 资源需求对象
 */
export function calculateResourceRequirements(workflow: WorkflowDefinition): {
  totalGPUs: number;
  estimatedMemoryGB: number;
  estimatedDurationMinutes: number;
} {
  let totalGPUs = 0;
  let estimatedMemoryGB = 0;
  let estimatedDurationMinutes = 0;

  workflow.nodes.forEach((node) => {
    const config = node.data.config;
    
    if (node.type === 'resource_alloc') {
      totalGPUs += config.gpuCount || 0;
      estimatedMemoryGB += config.memoryLimit || 0;
    }
    
    if (node.type === 'model_inference') {
      estimatedDurationMinutes += config.estimatedMinutes || 0;
    }
  });

  return {
    totalGPUs,
    estimatedMemoryGB,
    estimatedDurationMinutes,
  };
}

/**
 * 生成新的节点 ID
 * @returns 唯一的节点 ID
 */
export function generateNodeId(): string {
  return `node_${uuidv4()}`;
}

/**
 * 生成新的边 ID
 * @returns 唯一的边 ID
 */
export function generateEdgeId(): string {
  return `edge_${uuidv4()}`;
}

/**
 * 深度克隆工作流定义
 * @param workflow - 工作流定义对象
 * @returns 克隆后的工作流定义
 */
export function cloneWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
  return JSON.parse(JSON.stringify(workflow));
}

/**
 * 验证节点配置的完整性
 * @param node - 节点对象
 * @returns 是否有效
 */
export function validateNodeConfig(node: WorkflowNode): boolean {
  if (!node.id || !node.type || !node.data) {
    return false;
  }

  if (!node.data.label || typeof node.data.label !== 'string') {
    return false;
  }

  if (!node.data.config || typeof node.data.config !== 'object') {
    return false;
  }

  return true;
}

/**
 * 格式化工作流 YAML 字符串
 * @param yamlString - YAML 格式的字符串
 * @returns 格式化后的 YAML 字符串
 */
export function formatWorkflowYaml(yamlString: string): string {
  try {
    const workflow = yamlToWorkflow(yamlString);
    return workflowToYaml(workflow);
  } catch (error) {
    return yamlString;
  }
}