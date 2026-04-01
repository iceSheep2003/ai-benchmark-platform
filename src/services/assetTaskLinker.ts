import type { ModelAsset, DatasetAsset, AcceleratorAsset } from '../types';

export interface TaskCreationParams {
  sourceType: 'model' | 'dataset' | 'accelerator';
  sourceId: string;
  prefillData?: {
    model?: string;
    dataset?: string;
    targetResource?: string;
  };
}

export const navigateToTaskCreation = (params: TaskCreationParams): string => {
  const queryParams = new URLSearchParams();
  
  queryParams.append('source', params.sourceType);
  queryParams.append('sourceId', params.sourceId);
  
  if (params.prefillData?.model) {
    queryParams.append('model', params.prefillData.model);
  }
  
  if (params.prefillData?.dataset) {
    queryParams.append('dataset', params.prefillData.dataset);
  }
  
  if (params.prefillData?.targetResource) {
    queryParams.append('targetResource', params.prefillData.targetResource);
  }
  
  return `/tasks/create?${queryParams.toString()}`;
};

export const createTaskFromModel = (model: ModelAsset): string => {
  return navigateToTaskCreation({
    sourceType: 'model',
    sourceId: model.id,
    prefillData: {
      model: model.name,
    },
  });
};

export const createTaskFromDataset = (dataset: DatasetAsset): string => {
  return navigateToTaskCreation({
    sourceType: 'dataset',
    sourceId: dataset.id,
    prefillData: {
      dataset: dataset.name,
    },
  });
};

export const createTaskFromAccelerator = (accelerator: AcceleratorAsset): string => {
  return navigateToTaskCreation({
    sourceType: 'accelerator',
    sourceId: accelerator.id,
    prefillData: {
      targetResource: accelerator.nodeIp,
    },
  });
};

export const parseTaskCreationParams = (queryString: string): TaskCreationParams | null => {
  try {
    const params = new URLSearchParams(queryString);
    const source = params.get('source') as 'model' | 'dataset' | 'accelerator' | null;
    const sourceId = params.get('sourceId');
    
    if (!source || !sourceId) {
      return null;
    }
    
    const prefillData: any = {};
    
    const model = params.get('model');
    if (model) prefillData.model = model;
    
    const dataset = params.get('dataset');
    if (dataset) prefillData.dataset = dataset;
    
    const targetResource = params.get('targetResource');
    if (targetResource) prefillData.targetResource = targetResource;
    
    return {
      sourceType: source,
      sourceId,
      prefillData: Object.keys(prefillData).length > 0 ? prefillData : undefined,
    };
  } catch (error) {
    console.error('Failed to parse task creation params:', error);
    return null;
  }
};

export const simulateTaskCompletion = (
  taskId: string,
  modelId?: string,
  acceleratorId?: string,
  results?: {
    throughput: number;
    latency: number;
    status: 'success' | 'failed';
  }
): void => {
  console.log(`Task ${taskId} completed with results:`, results);
  
  if (modelId && results) {
    console.log(`Updating model ${modelId} with new benchmark data`);
  }
  
  if (acceleratorId && results) {
    console.log(`Updating accelerator ${acceleratorId} with performance data`);
  }
};

export const getRelatedTasks = (
  assetId: string
): string[] => {
  const mockTaskMap: Record<string, string[]> = {
    'model-001': ['task-001', 'task-002', 'task-003', 'task-004', 'task-005', 'task-006'],
    'model-002': ['task-007', 'task-008', 'task-009', 'task-010'],
    'model-003': ['task-011', 'task-012', 'task-013'],
    'model-004': ['task-014', 'task-015'],
    'model-005': ['task-016', 'task-017'],
    'dataset-001': ['task-001', 'task-002', 'task-003'],
    'dataset-002': ['task-004'],
    'dataset-003': ['task-005', 'task-006'],
    'dataset-004': ['task-007', 'task-008'],
    'dataset-005': ['task-009', 'task-010'],
    'accel-001': ['task-001', 'task-002', 'task-005'],
    'accel-002': ['task-011', 'task-014'],
    'accel-003': ['task-003', 'task-008', 'task-012'],
    'accel-004': ['task-004'],
    'accel-005': ['task-006', 'task-016'],
    'accel-006': ['task-013', 'task-015'],
    'ds-001': ['task-ds-001-1', 'task-ds-001-2', 'task-ds-001-3'],
    'ds-002': ['task-ds-002-1', 'task-ds-002-2'],
    'ds-003': ['task-ds-003-1', 'task-ds-003-2'],
    'ds-004': ['task-ds-004-1'],
    'ds-005': ['task-ds-005-1', 'task-ds-005-2'],
    'ds-006': ['task-ds-006-1', 'task-ds-006-2'],
    'ds-007': ['task-ds-007-1', 'task-ds-007-2'],
    'ds-008': ['task-ds-008-1'],
    'ds-009': ['task-ds-009-1', 'task-ds-009-2'],
    'ds-010': ['task-ds-010-1'],
    'ds-011': ['task-ds-011-1', 'task-ds-011-2'],
    'ds-012': ['task-ds-012-1'],
    'ds-013': ['task-ds-013-1', 'task-ds-013-2', 'task-ds-013-3'],
    'ds-014': ['task-ds-014-1', 'task-ds-014-2'],
    'ds-015': ['task-ds-015-1', 'task-ds-015-2'],
    'ds-016': ['task-ds-016-1'],
    'ds-017': ['task-ds-017-1', 'task-ds-017-2'],
    'ds-018': ['task-ds-018-1'],
    'ds-019': ['task-ds-019-1', 'task-ds-019-2'],
    'ds-020': ['task-ds-020-1'],
  };
  
  return mockTaskMap[assetId] || [];
};

export const updateAssetUsage = (
  assetId: string,
  assetType: 'model' | 'dataset' | 'accelerator'
): void => {
  console.log(`Incrementing usage count for ${assetType} ${assetId}`);
};

export const getBestHardwareForModel = (model: ModelAsset): string => {
  if (model.bestConfig) {
    return `${model.bestConfig.gpuCount}x ${model.bestConfig.gpuType}`;
  }
  return 'No benchmark data available';
};

export const getPerformanceTrend = (model: ModelAsset) => {
  const successfulBenchmarks = model.benchmarks.filter(b => b.status === 'success');
  
  if (successfulBenchmarks.length === 0) {
    return [];
  }
  
  return successfulBenchmarks
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(benchmark => ({
      date: benchmark.date,
      throughput: benchmark.throughput,
      latency: benchmark.latency,
      gpuType: benchmark.gpuType,
    }));
};

export const getHardwareCompatibility = (model: ModelAsset, accelerator: AcceleratorAsset): boolean => {
  const modelParams = parseInt(model.params);
  const gpuMemoryMap: Record<string, number> = {
    'NVIDIA H100': 80,
    'NVIDIA H800': 80,
    'NVIDIA A100': 80,
    'Huawei 910B': 64,
  };
  
  const gpuMemory = gpuMemoryMap[accelerator.gpuModel] || 80;
  const estimatedMemory = modelParams * 0.5;
  
  return estimatedMemory <= gpuMemory * accelerator.gpuCount;
};