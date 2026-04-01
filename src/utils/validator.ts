import type { WorkflowDefinition, ValidationError } from '../types/workflow';
import { detectCycles, detectIsolatedNodes } from './transformers';

/**
 * 验证工作流定义的完整性和正确性
 * @param workflow - 工作流定义对象
 * @returns 验证错误列表
 */
export function validateWorkflowDefinition(workflow: WorkflowDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    const cycles = detectCycles(workflow.nodes, workflow.edges);
    cycles.forEach((nodeId) => {
      errors.push({
        id: nodeId,
        path: `edges`,
        message: `Node "${nodeId}" is part of a circular dependency`,
        severity: 'error',
      });
    });

    const isolatedNodes = detectIsolatedNodes(workflow.nodes, workflow.edges);
    isolatedNodes.forEach((nodeId) => {
      errors.push({
        id: nodeId,
        path: `nodes`,
        message: `Node "${nodeId}" is isolated (no connections)`,
        severity: 'warning',
      });
    });

    if (workflow.nodes.length === 0) {
      errors.push({
        path: 'nodes',
        message: 'Workflow must contain at least one node',
        severity: 'warning',
      });
    }

    workflow.nodes.forEach((node, index) => {
      const nodeErrors = validateNode(node, index);
      errors.push(...nodeErrors);
    });

    workflow.edges.forEach((edge, index) => {
      const edgeErrors = validateEdge(edge, index, workflow);
      errors.push(...edgeErrors);
    });

    const resourceErrors = validateResources(workflow);
    errors.push(...resourceErrors);

    const executionConfigErrors = validateExecutionConfig(workflow.executionConfig);
    errors.push(...executionConfigErrors);

  } catch (error) {
    errors.push({
      path: '',
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
    });
  }

  return errors;
}

/**
 * 验证单个节点的配置
 * @param node - 节点对象
 * @param index - 节点索引
 * @returns 验证错误列表
 */
function validateNode(node: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!node.id) {
    errors.push({
      path: `nodes[${index}].id`,
      message: 'Node ID is required',
      severity: 'error',
    });
  }

  if (!node.type) {
    errors.push({
      path: `nodes[${index}].type`,
      message: 'Node type is required',
      severity: 'error',
    });
  } else if (
    !['data_loader', 'model_inference', 'resource_alloc', 'evaluator', 'reporter'].includes(node.type)
  ) {
    errors.push({
      path: `nodes[${index}].type`,
      message: `Invalid node type: ${node.type}`,
      severity: 'error',
    });
  }

  if (!node.position) {
    errors.push({
      path: `nodes[${index}].position`,
      message: 'Node position is required',
      severity: 'error',
    });
  } else {
    if (typeof node.position.x !== 'number' || node.position.x < 0) {
      errors.push({
        path: `nodes[${index}].position.x`,
        message: 'Invalid X position',
        severity: 'error',
      });
    }
    if (typeof node.position.y !== 'number' || node.position.y < 0) {
      errors.push({
        path: `nodes[${index}].position.y`,
        message: 'Invalid Y position',
        severity: 'error',
      });
    }
  }

  if (!node.data || !node.data.label) {
    errors.push({
      path: `nodes[${index}].data.label`,
      message: 'Node label is required',
      severity: 'error',
    });
  }

  if (!node.data || !node.data.config) {
    errors.push({
      path: `nodes[${index}].data.config`,
      message: 'Node config is required',
      severity: 'error',
    });
  } else {
    const configErrors = validateNodeConfig(node.type, node.data.config, index);
    errors.push(...configErrors);
  }

  return errors;
}

/**
 * 根据节点类型验证配置参数
 * @param nodeType - 节点类型
 * @param config - 配置对象
 * @param nodeIndex - 节点索引
 * @returns 验证错误列表
 */
function validateNodeConfig(nodeType: string, config: any, nodeIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!config || typeof config !== 'object') {
    return errors;
  }

  switch (nodeType) {
    case 'data_loader':
      if (!config.datasetName) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.datasetName`,
          message: 'Dataset name is required for data loader node',
          severity: 'error',
        });
      }
      if (config.batchSize && (config.batchSize < 1 || config.batchSize > 1024)) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.batchSize`,
          message: 'Batch size must be between 1 and 1024',
          severity: 'error',
        });
      }
      break;

    case 'model_inference':
      if (!config.modelName) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.modelName`,
          message: 'Model name is required for inference node',
          severity: 'error',
        });
      }
      if (config.precision && !['FP16', 'FP32', 'INT8', 'INT4'].includes(config.precision)) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.precision`,
          message: 'Invalid precision. Must be FP16, FP32, INT8, or INT4',
          severity: 'error',
        });
      }
      if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.temperature`,
          message: 'Temperature must be between 0 and 2',
          severity: 'error',
        });
      }
      break;

    case 'resource_alloc':
      if (!config.cardModel) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.cardModel`,
          message: 'Card model is required for resource allocation node',
          severity: 'error',
        });
      }
      if (config.gpuCount && (config.gpuCount < 1 || config.gpuCount > 8)) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.gpuCount`,
          message: 'GPU count must be between 1 and 8',
          severity: 'error',
        });
      }
      if (config.memoryLimit && (config.memoryLimit < 1 || config.memoryLimit > 192)) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.memoryLimit`,
          message: 'Memory limit must be between 1 and 192 GB',
          severity: 'error',
        });
      }
      break;

    case 'evaluator':
      if (!config.metrics || !Array.isArray(config.metrics) || config.metrics.length === 0) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.metrics`,
          message: 'At least one metric is required for evaluator node',
          severity: 'error',
        });
      }
      break;

    case 'reporter':
      if (!config.format) {
        errors.push({
          path: `nodes[${nodeIndex}].data.config.format`,
          message: 'Export format is required for reporter node',
          severity: 'error',
        });
      }
      break;
  }

  return errors;
}

/**
 * 验证边的配置
 * @param edge - 边对象
 * @param index - 边索引
 * @param workflow - 工作流定义
 * @returns 验证错误列表
 */
function validateEdge(edge: any, index: number, workflow: WorkflowDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!edge.id) {
    errors.push({
      path: `edges[${index}].id`,
      message: 'Edge ID is required',
      severity: 'error',
    });
  }

  if (!edge.source) {
    errors.push({
      path: `edges[${index}].source`,
      message: 'Edge source is required',
      severity: 'error',
    });
  }

  if (!edge.target) {
    errors.push({
      path: `edges[${index}].target`,
      message: 'Edge target is required',
      severity: 'error',
    });
  }

  const sourceExists = workflow.nodes.some((node) => node.id === edge.source);
  const targetExists = workflow.nodes.some((node) => node.id === edge.target);

  if (edge.source && !sourceExists) {
    errors.push({
      path: `edges[${index}].source`,
      message: `Source node "${edge.source}" does not exist`,
      severity: 'error',
    });
  }

  if (edge.target && !targetExists) {
    errors.push({
      path: `edges[${index}].target`,
      message: `Target node "${edge.target}" does not exist`,
      severity: 'error',
    });
  }

  if (edge.source === edge.target) {
    errors.push({
      path: `edges[${index}]`,
      message: 'Edge cannot connect a node to itself',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * 验证资源配置
 * @param workflow - 工作流定义
 * @returns 验证错误列表
 */
function validateResources(workflow: WorkflowDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  let totalGPUs = 0;
  let totalMemory = 0;

  workflow.nodes.forEach((node) => {
    if (node.type === 'resource_alloc' && node.data.config) {
      const config = node.data.config;
      totalGPUs += config.gpuCount || 0;
      totalMemory += config.memoryLimit || 0;
    }
  });

  if (totalGPUs > 32) {
    errors.push({
      path: 'resources',
      message: `Total GPU count (${totalGPUs}) exceeds cluster limit (32)`,
      severity: 'error',
    });
  }

  if (totalMemory > 512) {
    errors.push({
      path: 'resources',
      message: `Total memory (${totalMemory}GB) exceeds cluster limit (512GB)`,
      severity: 'error',
    });
  }

  return errors;
}

/**
 * 验证执行配置
 * @param executionConfig - 执行配置对象
 * @returns 验证错误列表
 */
function validateExecutionConfig(executionConfig: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!executionConfig) {
    return errors;
  }

  if (executionConfig.timeoutSeconds && (executionConfig.timeoutSeconds < 1 || executionConfig.timeoutSeconds > 86400)) {
    errors.push({
      path: 'executionConfig.timeoutSeconds',
      message: 'Timeout must be between 1 and 86400 seconds',
      severity: 'error',
    });
  }

  if (executionConfig.retryCount && (executionConfig.retryCount < 0 || executionConfig.retryCount > 10)) {
    errors.push({
      path: 'executionConfig.retryCount',
      message: 'Retry count must be between 0 and 10',
      severity: 'error',
    });
  }

  if (executionConfig.parallelism && (executionConfig.parallelism < 1 || executionConfig.parallelism > 100)) {
    errors.push({
      path: 'executionConfig.parallelism',
      message: 'Parallelism must be between 1 and 100',
      severity: 'error',
    });
  }

  return errors;
}

/**
 * 检查是否有严重错误
 * @param errors - 验证错误列表
 * @returns 是否有严重错误
 */
export function hasCriticalErrors(errors: ValidationError[]): boolean {
  return errors.some((error) => error.severity === 'error');
}

/**
 * 获取节点相关的错误
 * @param errors - 验证错误列表
 * @param nodeId - 节点 ID
 * @returns 该节点的错误列表
 */
export function getNodeErrors(errors: ValidationError[], nodeId: string): ValidationError[] {
  return errors.filter((error) => error.id === nodeId);
}