import type { BenchmarkTask, ClusterStats, ResourceEstimation, TaskPriority } from '../types';

export const simulateResourceEstimation = (params: {
  modelSize: number;
  precision: 'FP16' | 'INT8';
  datasetSize: number;
}): ResourceEstimation => {
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
};

export const simulateClusterStats = (): ClusterStats => {
  return {
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
  };
};

export const simulateTaskFailure = (task: BenchmarkTask): BenchmarkTask => {
  const failedStep = Math.floor(Math.random() * 800) + 200;
  const lastSuccessfulStep = failedStep - 100;

  const checkpoints = Array.from({ length: Math.floor(lastSuccessfulStep / 100) }, (_, i) => ({
    id: `checkpoint_${(i + 1) * 100}`,
    step: (i + 1) * 100,
    timestamp: new Date(Date.now() - (lastSuccessfulStep - (i + 1) * 100) * 60000).toISOString(),
    filePath: `/checkpoints/${task.id}/checkpoint_step_${(i + 1) * 100}.pt`,
    fileSizeMB: Math.floor(Math.random() * 5000) + 1000,
    isValid: true,
  }));

  return {
    ...task,
    status: 'FAILED',
    failureReason: `Task failed at step ${failedStep} due to GPU memory overflow`,
    lastSuccessfulStep,
    checkpoints,
    checkpointConfig: {
      enabled: true,
      intervalSteps: 100,
    },
  };
};

export const simulatePriorityAdjustment = (
  tasks: BenchmarkTask[],
  taskId: string,
  newPriority: TaskPriority
): { updatedTasks: BenchmarkTask[]; newEta: string } => {
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  
  const updatedTasks = tasks.map((task) =>
    task.id === taskId ? { ...task, priority: newPriority } : task
  );

  const pendingTasks = updatedTasks
    .filter((task) => task.status === 'PENDING')
    .sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority || 'P2'] - priorityOrder[b.priority || 'P2'];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const taskIndex = pendingTasks.findIndex((task) => task.id === taskId);
  const queuePosition = taskIndex + 1;
  
  const avgTaskDuration = 30;
  const estimatedWaitMinutes = queuePosition * avgTaskDuration;
  const eta = new Date(Date.now() + estimatedWaitMinutes * 60000).toISOString();

  const tasksWithEta = updatedTasks.map((task) =>
    task.id === taskId
      ? { ...task, estimatedStartTime: eta, queuePosition }
      : task
  );

  return {
    updatedTasks: tasksWithEta,
    newEta: eta,
  };
};

export const simulateCheckpointRecovery = (
  task: BenchmarkTask,
  checkpointId: string
): BenchmarkTask => {
  const checkpoint = task.checkpoints?.find((cp) => cp.id === checkpointId);
  
  if (!checkpoint) {
    return task;
  }

  return {
    ...task,
    status: 'RUNNING',
    autoRecoveryStatus: 'restoring',
    lastSuccessfulStep: checkpoint.step,
  };
};

export const simulateQueueWaitTime = (
  task: BenchmarkTask,
  clusterStats: ClusterStats
): number => {
  if (task.status !== 'PENDING') return 0;

  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const priority = task.priority || 'P2';
  
  const baseWaitTime = clusterStats.avgQueueWaitTime;
  const priorityMultiplier = 1 - priorityOrder[priority] * 0.25;
  const resourceMultiplier = task.resourceRequest?.count || 1;
  
  return Math.ceil(baseWaitTime * priorityMultiplier * resourceMultiplier);
};

export const generateMockCheckpoints = (taskId: string, totalSteps: number = 1000) => {
  return Array.from({ length: Math.floor(totalSteps / 100) }, (_, i) => ({
    id: `checkpoint_${(i + 1) * 100}`,
    step: (i + 1) * 100,
    timestamp: new Date(Date.now() - (totalSteps - (i + 1) * 100) * 60000).toISOString(),
    filePath: `/checkpoints/${taskId}/checkpoint_step_${(i + 1) * 100}.pt`,
    fileSizeMB: Math.floor(Math.random() * 5000) + 1000,
    isValid: true,
  }));
};

export const simulateResourceAvailability = (
  requiredGpuCount: number,
  requiredMemoryGB: number,
  clusterStats: ClusterStats
): { available: boolean; estimatedWaitTime?: number; suggestion?: string } => {
  const gpuAvailable = clusterStats.availableGPUs >= requiredGpuCount;
  const memoryAvailable = clusterStats.availableMemoryGB >= requiredMemoryGB;

  if (gpuAvailable && memoryAvailable) {
    return { available: true };
  }

  const estimatedWaitTime = Math.ceil(
    (clusterStats.queuedTasks + 1) * clusterStats.avgQueueWaitTime
  );

  let suggestion = '';
  if (!gpuAvailable && !memoryAvailable) {
    suggestion = 'Both GPU and memory resources are insufficient. Consider reducing model size or dataset.';
  } else if (!gpuAvailable) {
    suggestion = 'GPU resources are insufficient. Consider reducing GPU count or waiting for resources.';
  } else {
    suggestion = 'Memory resources are insufficient. Consider using gradient checkpointing or reducing batch size.';
  }

  return {
    available: false,
    estimatedWaitTime,
    suggestion,
  };
};