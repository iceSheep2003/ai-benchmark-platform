import { create } from 'zustand';
import type { BenchmarkTask, ClusterStats, ResourceEstimation, TaskPriority, ComparisonResult, FlameGraphNode, PerformanceMetrics, OptimizationRecommendation } from '../types';
import type { WorkflowDefinition } from '../types/workflow';
import { executeWorkflow as executeWorkflowService, type WorkflowExecutionConfig } from '../services/workflowExecutor';
import { mockTasks, generateMockFlameGraph } from '../mockData/performanceMock';

interface AppState {
  selectedTask: BenchmarkTask | null;
  setSelectedTask: (task: BenchmarkTask | null) => void;
  tasks: BenchmarkTask[];
  setTasks: (tasks: BenchmarkTask[]) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  
  clusterStats: ClusterStats;
  setClusterStats: (stats: ClusterStats) => void;
  
  updateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  updateTaskStatus: (taskId: string, status: BenchmarkTask['status']) => void;
  addTask: (task: BenchmarkTask) => void;
  
  estimateResources: (params: {
    modelSize: number;
    precision: 'FP16' | 'INT8';
    datasetSize: number;
  }) => ResourceEstimation;
  
  resumeFromCheckpoint: (taskId: string, checkpointId: string) => void;
  retryFromScratch: (taskId: string) => void;
  
  workflows: WorkflowDefinition[];
  setWorkflows: (workflows: WorkflowDefinition[]) => void;
  executeWorkflow: (workflow: WorkflowDefinition, config?: WorkflowExecutionConfig) => string | null;
  getWorkflowById: (workflowId: string) => WorkflowDefinition | undefined;
  
  comparisonResults: ComparisonResult[];
  addComparisonResult: (result: ComparisonResult) => void;
  getComparisonForTasks: (taskIds: string[]) => ComparisonResult | null;
  
  flameGraphData: Map<string, FlameGraphNode>;
  setFlameGraphForTask: (taskId: string, data: FlameGraphNode) => void;
  getFlameGraphForTask: (taskId: string) => FlameGraphNode | undefined;
  
  performanceMetrics: Map<string, PerformanceMetrics[]>;
  updatePerformanceMetrics: (taskId: string, metrics: PerformanceMetrics) => void;
  getPerformanceMetricsForTask: (taskId: string) => PerformanceMetrics[];
  
  generateComparison: (taskIds: string[]) => ComparisonResult;
  getOptimizationRecommendations: (taskId: string) => OptimizationRecommendation[];
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedTask: null,
  setSelectedTask: (task) => set({ selectedTask: task }),
  tasks: mockTasks,
  setTasks: (tasks) => set({ tasks }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),
  
  clusterStats: {
    totalGPUs: 64,
    availableGPUs: 48,
    usedGPUs: 16,
    totalMemoryGB: 1024,
    availableMemoryGB: 768,
    usedMemoryGB: 256,
    queuedTasks: 5,
    avgQueueWaitTime: 12,
    gpuUtilization: 25,
    memoryUtilization: 25,
  },
  setClusterStats: (stats) => set({ clusterStats: stats }),
  
  updateTaskPriority: (taskId, priority) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, priority } : task
      ),
    }));
  },
  
  updateTaskStatus: (taskId, status) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status } : task
      ),
    }));
  },
  
  addTask: (task) => {
    set((state) => ({
      tasks: [...state.tasks, task],
    }));
  },
  
  estimateResources: (params) => {
    const { modelSize, precision, datasetSize } = params;
    
    const baseGpuMemory = modelSize * 0.5;
    const precisionMultiplier = precision === 'FP16' ? 1 : 0.5;
    const datasetMultiplier = 1 + (datasetSize / 1000) * 0.1;
    
    const recommendedMemoryGB = Math.ceil(baseGpuMemory * precisionMultiplier * datasetMultiplier);
    const recommendedGpuCount = Math.ceil(recommendedMemoryGB / 40);
    const estimatedDuration = Math.ceil(datasetSize / (recommendedGpuCount * 10));
    const estimatedCost = recommendedGpuCount * estimatedDuration * 0.5;
    
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    if (recommendedMemoryGB > 80) {
      warnings.push('High memory requirement detected');
      suggestions.push('Consider using gradient checkpointing to reduce memory usage');
    }
    
    if (recommendedGpuCount > 8) {
      warnings.push('Large GPU cluster required');
      suggestions.push('Consider model parallelism or pipeline parallelism');
    }
    
    return {
      recommendedGpuCount,
      recommendedMemoryGB,
      estimatedDuration,
      estimatedCost,
      warnings,
      suggestions,
    };
  },
  
  resumeFromCheckpoint: (taskId, checkpointId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'RUNNING',
              autoRecoveryStatus: 'restoring',
              lastSuccessfulStep: task.checkpoints?.find((cp) => cp.id === checkpointId)?.step,
            }
          : task
      ),
    }));
    
    setTimeout(() => {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, autoRecoveryStatus: 'restored' } : task
        ),
      }));
    }, 2000);
  },
  
  retryFromScratch: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'PENDING',
              autoRecoveryStatus: 'none',
              lastSuccessfulStep: undefined,
              failureReason: undefined,
            }
          : task
      ),
    }));
  },
  
  workflows: [],
  setWorkflows: (workflows) => set({ workflows }),
  
  executeWorkflow: (workflow, config = {}) => {
    const result = executeWorkflowService(workflow, config);
    
    if (result.success && result.taskId) {
      const task = createTaskFromWorkflow(workflow, result.taskId, config);
      set((state) => ({
        tasks: [...state.tasks, task],
        workflows: [...state.workflows, workflow],
      }));
      return result.taskId;
    }
    
    return null;
  },
  
  getWorkflowById: (workflowId) => {
    return get().workflows.find((w) => generateWorkflowId(w) === workflowId);
  },
  
  comparisonResults: [],
  addComparisonResult: (result) => {
    set((state) => ({
      comparisonResults: [...state.comparisonResults, result],
    }));
  },
  getComparisonForTasks: (taskIds) => {
    return get().comparisonResults.find((result) => 
      result.taskIdList.length === taskIds.length &&
      result.taskIdList.every((id) => taskIds.includes(id))
    ) || null;
  },
  
  flameGraphData: new Map(
    mockTasks
      .filter(task => task.status === 'SUCCESS')
      .slice(0, 10)
      .map(task => [task.id, generateMockFlameGraph(task.resources?.cardModel || 'NVIDIA H100')])
  ),
  setFlameGraphForTask: (taskId, data) => {
    set((state) => {
      const newFlameGraphData = new Map(state.flameGraphData);
      newFlameGraphData.set(taskId, data);
      return { flameGraphData: newFlameGraphData };
    });
  },
  getFlameGraphForTask: (taskId) => {
    return get().flameGraphData.get(taskId);
  },
  
  performanceMetrics: new Map(
    mockTasks
      .filter(task => task.status === 'SUCCESS')
      .slice(0, 10)
      .map(task => [
        task.id,
        Array.from({ length: 20 }, (_, i) => ({
          taskId: task.id,
          timestamp: Date.now() - (20 - i) * 30000,
          throughput: 100 + Math.random() * 40 - 20,
          latency_p99: 20 + Math.random() * 10 - 5,
          gpu_util: 0.8 + Math.random() * 0.15,
          memory_bandwidth: 750 + Math.random() * 150,
          energy_consumption: 300 + Math.random() * 100,
          cost_per_token: 0.001 + Math.random() * 0.0005,
        }))
      ])
  ),
  updatePerformanceMetrics: (taskId, metrics) => {
    set((state) => {
      const newPerformanceMetrics = new Map(state.performanceMetrics);
      const existing = newPerformanceMetrics.get(taskId) || [];
      newPerformanceMetrics.set(taskId, [...existing, metrics]);
      return { performanceMetrics: newPerformanceMetrics };
    });
  },
  getPerformanceMetricsForTask: (taskId) => {
    return get().performanceMetrics.get(taskId) || [];
  },
  
  generateComparison: (taskIds) => {
    const state = get();
    const tasks = taskIds.map((id) => state.tasks.find((t) => t.id === id)).filter(Boolean) as BenchmarkTask[];
    
    if (tasks.length < 2) {
      throw new Error('At least 2 tasks are required for comparison');
    }
    
    const dimensions = [
      { name: 'Throughput', scores: {} as Record<string, number> },
      { name: 'Latency (p99)', scores: {} as Record<string, number> },
      { name: 'GPU Utilization', scores: {} as Record<string, number> },
      { name: 'Memory Bandwidth', scores: {} as Record<string, number> },
    ];
    
    tasks.forEach((task) => {
      const latestMetrics = task.metrics?.[task.metrics.length - 1];
      dimensions[0].scores[task.id] = latestMetrics?.throughput || 0;
      dimensions[1].scores[task.id] = latestMetrics?.latency_p99 || 0;
      dimensions[2].scores[task.id] = latestMetrics?.gpu_util || 0;
      dimensions[3].scores[task.id] = latestMetrics?.memory_bandwidth || 0;
    });
    
    const costPerformanceRatio: Record<string, number> = {};
    tasks.forEach((task) => {
      const throughput = dimensions[0].scores[task.id];
      const cost = task.resourceRequest?.count || 1;
      costPerformanceRatio[task.id] = throughput / cost;
    });
    
    const winner = Object.entries(costPerformanceRatio).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0];
    
    const result: ComparisonResult = {
      taskIdList: taskIds,
      dimensions,
      summary: {
        winner,
        costPerformanceRatio,
      },
    };
    
    state.addComparisonResult(result);
    return result;
  },
  
  getOptimizationRecommendations: (taskId) => {
    const state = get();
    const task = state.tasks.find((t) => t.id === taskId);
    const flameGraph = state.getFlameGraphForTask(taskId);
    
    if (!task || !flameGraph) {
      return [];
    }
    
    const recommendations: OptimizationRecommendation[] = [];
    const bottlenecks = identifyBottlenecks(flameGraph);
    
    bottlenecks.forEach((bottleneck) => {
      const improvement = estimateImprovement(bottleneck.name, bottleneck.value);
      const relatedAssets = findRelatedAssets(bottleneck.name, task);
      
      recommendations.push({
        operation: bottleneck.name,
        currentPerformance: bottleneck.value,
        potentialImprovement: improvement,
        recommendations: getOptimizationSuggestions(bottleneck.name),
        relatedAssets,
        estimatedCostSaving: improvement * 0.1,
        implementationComplexity: getComplexity(bottleneck.name),
      });
    });
    
    return recommendations.slice(0, 5);
  },
}));

const createTaskFromWorkflow = (
  workflow: WorkflowDefinition,
  taskId: string,
  config: WorkflowExecutionConfig
): BenchmarkTask => {
  const modelNode = workflow.nodes.find((node) => node.type === 'model_inference');
  const dataNode = workflow.nodes.find((node) => node.type === 'data_loader');
  const resourceNode = workflow.nodes.find((node) => node.type === 'resource_alloc');

  const modelConfig = modelNode?.data.config || {};
  const dataConfig = dataNode?.data.config || {};
  const resourceConfig = resourceNode?.data.config || {};

  return {
    id: taskId,
    name: `${workflow.metadata.name} - ${new Date().toLocaleDateString()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    createdBy: 'Admin User',
    createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    workflowId: generateWorkflowId(workflow),
    resources: {
      cardModel: modelConfig.modelType || 'NVIDIA H100',
      driverVersion: '535.104',
      cudaVersion: modelConfig.cudaVersion || '12.2',
    },
    dataLineage: {
      datasetName: dataConfig.datasetName || 'Unknown Dataset',
      datasetVersionHash: dataConfig.datasetVersionHash || generateHash(),
      modelWeightHash: modelConfig.modelHash || generateHash(),
    },
    priority: config.priority || 'P2',
    estimatedStartTime: calculateEstimatedStartTime(),
    queuePosition: calculateQueuePosition(),
    resourceRequest: config.resourceRequest || {
      gpuType: resourceConfig.gpuType || 'NVIDIA H100',
      count: resourceConfig.gpuCount || 1,
      memoryGB: resourceConfig.memoryGB || 40,
    },
    checkpointConfig: {
      enabled: workflow.executionConfig.retryCount > 0,
      intervalSteps: 100,
    },
    checkpoints: [],
  };
};

const generateWorkflowId = (workflow: WorkflowDefinition): string => {
  return `workflow-${workflow.metadata.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
};

const generateHash = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

const calculateEstimatedStartTime = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + Math.floor(Math.random() * 30) + 5);
  return now.toISOString();
};

const calculateQueuePosition = (): number => {
  return Math.floor(Math.random() * 10) + 1;
};

const identifyBottlenecks = (flameGraph: any): any[] => {
  const bottlenecks: any[] = [];
  
  const traverse = (node: any) => {
    if (node.children && node.children.length > 0) {
      const childrenSum = node.children.reduce((sum: number, child: any) => sum + child.value, 0);
      if (childrenSum / node.value < 0.8) {
        bottlenecks.push(node);
      }
      node.children.forEach(traverse);
    }
  };
  
  traverse(flameGraph);
  return bottlenecks.sort((a, b) => b.value - a.value).slice(0, 5);
};

const estimateImprovement = (operationName: string, currentValue: number): number => {
  const improvementFactors: Record<string, number> = {
    'PCIe Transfer': 0.3,
    'Data Loading': 0.25,
    'Attention': 0.2,
    'FFN': 0.15,
    'LayerNorm': 0.1,
  };
  
  return currentValue * (improvementFactors[operationName] || 0.15);
};

const findRelatedAssets = (operationName: string, task: BenchmarkTask): any[] => {
  const assets: any[] = [];
  
  if (operationName.includes('Attention') || operationName.includes('FFN')) {
    assets.push({
      type: 'model',
      id: task.workflowId,
      name: task.dataLineage?.datasetName || 'Unknown Dataset',
      reason: 'Model architecture affects these operations',
    });
  }
  
  if (operationName.includes('Data Loading')) {
    assets.push({
      type: 'dataset',
      id: task.dataLineage?.datasetVersionHash || 'Unknown',
      name: task.dataLineage?.datasetName || 'Unknown Dataset',
      reason: 'Dataset format affects loading performance',
    });
  }
  
  assets.push({
    type: 'accelerator',
    id: task.resources?.cardModel || 'Unknown',
    name: task.resources?.cardModel || 'Unknown',
    reason: 'Hardware capabilities affect all operations',
  });
  
  return assets;
};

const getOptimizationSuggestions = (operationName: string): string[] => {
  const suggestions: Record<string, string[]> = {
    'PCIe Transfer': [
      'Consider using Zero-Copy optimization',
      'Use pinned memory for faster transfers',
      'Batch data transfers when possible',
    ],
    'Data Loading': [
      'Optimize data preprocessing pipeline',
      'Implement data prefetching',
      'Use parallel data loading',
    ],
    'Attention': [
      'Consider using Flash Attention',
      'Explore PagedAttention for better memory efficiency',
      'Implement attention caching',
    ],
    'FFN': [
      'Explore kernel fusion opportunities',
      'Consider quantization techniques',
      'Use optimized matrix multiplication kernels',
    ],
    'LayerNorm': [
      'Consider using optimized implementations',
      'Explore fused operations',
      'Use layer normalization variants',
    ],
  };
  
  return suggestions[operationName] || [
    'Profile this operation further',
    'Check for optimization opportunities',
    'Consider hardware-specific optimizations',
  ];
};

const getComplexity = (operationName: string): 'low' | 'medium' | 'high' => {
  const complexityMap: Record<string, 'low' | 'medium' | 'high'> = {
    'PCIe Transfer': 'low',
    'Data Loading': 'medium',
    'Attention': 'high',
    'FFN': 'high',
    'LayerNorm': 'low',
  };
  
  return complexityMap[operationName] || 'medium';
};