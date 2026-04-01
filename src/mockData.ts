import type {
  BenchmarkTask,
  ComparisonResult,
  DashboardStats,
  ClusterNode,
  FlameGraphNode,
  WorkflowNode,
  RealTimeMetrics,
} from './types';

export const mockDashboardStats: DashboardStats = {
  totalTasks: 156,
  runningTasks: 8,
  successTasks: 142,
  failedTasks: 6,
  avgThroughput: 2450.5,
  avgLatency: 12.3,
};

export const mockClusterNodes: ClusterNode[] = [
  {
    id: 'node-1',
    name: 'GPU-Server-01',
    status: 'online',
    gpuCount: 8,
    gpuUtil: 78,
    temperature: 65,
    memoryUsage: 72,
  },
  {
    id: 'node-2',
    name: 'GPU-Server-02',
    status: 'online',
    gpuCount: 8,
    gpuUtil: 85,
    temperature: 68,
    memoryUsage: 80,
  },
  {
    id: 'node-3',
    name: 'GPU-Server-03',
    status: 'warning',
    gpuCount: 8,
    gpuUtil: 92,
    temperature: 75,
    memoryUsage: 88,
  },
  {
    id: 'node-4',
    name: 'GPU-Server-04',
    status: 'offline',
    gpuCount: 8,
    gpuUtil: 0,
    temperature: 0,
    memoryUsage: 0,
  },
];

export const mockTasks: BenchmarkTask[] = [
  {
    id: 'task-001',
    name: 'Llama3-8B on H100',
    status: 'RUNNING',
    createdAt: '2024-03-15T10:30:00Z',
    createdBy: 'Admin User',
    createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    workflowId: 'workflow-001',
    priority: 'P1',
    resources: {
      cardModel: 'NVIDIA H100',
      driverVersion: '535.104',
      cudaVersion: '12.2',
    },
    dataLineage: {
      datasetName: 'MMLU-v2.1',
      datasetVersionHash: 'd4e5f6',
      modelWeightHash: 'a1b2c3',
    },
  },
  {
    id: 'task-002',
    name: 'Llama3-8B on A100',
    status: 'SUCCESS',
    createdAt: '2024-03-15T09:15:00Z',
    createdBy: 'Admin User',
    createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    workflowId: 'workflow-001',
    priority: 'P2',
    resources: {
      cardModel: 'NVIDIA A100',
      driverVersion: '535.104',
      cudaVersion: '12.2',
    },
    dataLineage: {
      datasetName: 'MMLU-v2.1',
      datasetVersionHash: 'd4e5f6',
      modelWeightHash: 'a1b2c3',
    },
  },
  {
    id: 'task-003',
    name: 'Mistral-7B on V100',
    status: 'SUCCESS',
    createdAt: '2024-03-15T08:45:00Z',
    createdBy: 'Admin User',
    createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    workflowId: 'workflow-002',
    priority: 'P2',
    resources: {
      cardModel: 'Huawei 910B',
      driverVersion: '23.0.3',
    },
    dataLineage: {
      datasetName: 'MMLU-v2.1',
      datasetVersionHash: 'd4e5f6',
      modelWeightHash: 'a1b2c3',
    },
  },
  {
    id: 'task-004',
    name: 'Qwen-14B on H100',
    status: 'FAILED',
    createdAt: '2024-03-15T07:30:00Z',
    createdBy: 'Admin User',
    createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    workflowId: 'workflow-002',
    priority: 'P0',
    resources: {
      cardModel: 'NVIDIA H100',
      driverVersion: '535.104',
      cudaVersion: '12.2',
    },
    dataLineage: {
      datasetName: 'GSM8K',
      datasetVersionHash: 'e7f8g9',
      modelWeightHash: 'b2c3d4',
    },
    failureReason: 'Task failed at step 500 due to GPU memory overflow',
    lastSuccessfulStep: 400,
    checkpointConfig: {
      enabled: true,
      intervalSteps: 100,
    },
    checkpoints: [
      {
        id: 'checkpoint_100',
        step: 100,
        timestamp: new Date(Date.now() - 400 * 60000).toISOString(),
        filePath: '/checkpoints/task-004/checkpoint_step_100.pt',
        fileSizeMB: 1500,
        isValid: true,
      },
      {
        id: 'checkpoint_200',
        step: 200,
        timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
        filePath: '/checkpoints/task-004/checkpoint_step_200.pt',
        fileSizeMB: 1800,
        isValid: true,
      },
      {
        id: 'checkpoint_300',
        step: 300,
        timestamp: new Date(Date.now() - 200 * 60000).toISOString(),
        filePath: '/checkpoints/task-004/checkpoint_step_300.pt',
        fileSizeMB: 2100,
        isValid: true,
      },
      {
        id: 'checkpoint_400',
        step: 400,
        timestamp: new Date(Date.now() - 100 * 60000).toISOString(),
        filePath: '/checkpoints/task-004/checkpoint_step_400.pt',
        fileSizeMB: 2400,
        isValid: true,
      },
    ],
  },
  {
    id: 'task-005',
    name: 'Llama3-70B on H100 x8',
    status: 'PENDING',
    createdAt: '2024-03-15T06:15:00Z',
    createdBy: 'Admin User',
    createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    workflowId: 'workflow-004',
    priority: 'P1',
    estimatedStartTime: new Date(Date.now() + 15 * 60000).toISOString(),
    queuePosition: 2,
    resourceRequest: {
      gpuType: 'NVIDIA H100',
      count: 8,
      memoryGB: 640,
    },
    resources: {
      cardModel: 'NVIDIA H100',
      driverVersion: '535.104',
      cudaVersion: '12.2',
    },
    dataLineage: {
      datasetName: 'MMLU-v2.1',
      datasetVersionHash: 'd4e5f6',
      modelWeightHash: 'a1b2c3',
    },
  },
  {
    id: 'task-006',
    name: 'Qwen-72B on A100',
    status: 'PENDING',
    createdAt: '2024-03-15T11:05:00Z',
    createdBy: 'Admin User',
    createdByAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    workflowId: 'workflow-004',
    priority: 'P3',
    estimatedStartTime: new Date(Date.now() + 30 * 60000).toISOString(),
    queuePosition: 5,
    resourceRequest: {
      gpuType: 'NVIDIA A100',
      count: 8,
      memoryGB: 640,
    },
    resources: {
      cardModel: 'NVIDIA A100',
      driverVersion: '535.104',
      cudaVersion: '12.2',
    },
    dataLineage: {
      datasetName: 'GSM8K',
      datasetVersionHash: 'e7f8g9',
      modelWeightHash: 'b2c3d4',
    },
  },
];

export const mockComparisonResult: ComparisonResult = {
  taskIdList: ['task-002', 'task-003'],
  dimensions: [
    {
      name: 'Reasoning',
      scores: {
        'task-002': 85.2,
        'task-003': 82.1,
      },
      bottleneckAnalysis: {
        'task-002': 'None',
        'task-003': 'Memory bandwidth limited',
      },
    },
    {
      name: 'LongContext',
      scores: {
        'task-002': 78.5,
        'task-003': 65.3,
      },
      bottleneckAnalysis: {
        'task-002': 'None',
        'task-003': 'PagedAttention optimization needed',
      },
    },
    {
      name: 'Throughput',
      scores: {
        'task-002': 92.1,
        'task-003': 88.7,
      },
    },
    {
      name: 'Latency',
      scores: {
        'task-002': 88.4,
        'task-003': 85.2,
      },
    },
    {
      name: 'EnergyEfficiency',
      scores: {
        'task-002': 75.6,
        'task-003': 82.3,
      },
    },
  ],
  summary: {
    winner: 'task-002',
    costPerformanceRatio: {
      'task-002': 1.15,
      'task-003': 1.08,
    },
  },
};

export const mockFlameGraphData: FlameGraphNode = {
  name: 'Total',
  value: 1000,
  children: [
    {
      name: 'Data Loading',
      value: 150,
      color: '#ff6b6b',
      children: [
        { name: 'Disk I/O', value: 100, color: '#ee5a5a' },
        { name: 'Preprocessing', value: 50, color: '#ff6b6b' },
      ],
    },
    {
      name: 'PCIe Transfer',
      value: 200,
      color: '#feca57',
      children: [
        { name: 'Host to Device', value: 120, color: '#f9b234' },
        { name: 'Device to Host', value: 80, color: '#feca57' },
      ],
    },
    {
      name: 'Kernel Execution',
      value: 550,
      color: '#48dbfb',
      children: [
        { name: 'Attention', value: 200, color: '#0abde3' },
        { name: 'FFN', value: 180, color: '#48dbfb' },
        { name: 'LayerNorm', value: 100, color: '#5f9ea0' },
        { name: 'Activation', value: 70, color: '#00ced1' },
      ],
    },
    {
      name: 'Post-processing',
      value: 100,
      color: '#1dd1a1',
      children: [
        { name: 'Tokenization', value: 60, color: '#10ac84' },
        { name: 'Output formatting', value: 40, color: '#1dd1a1' },
      ],
    },
  ],
};

export const mockWorkflowNodes: WorkflowNode[] = [
  {
    id: 'node-1',
    type: 'data',
    position: { x: 100, y: 100 },
    data: {
      label: 'Data Source',
      config: {
        dataset: 'MMLU-v2.1',
        batchSize: 32,
      },
      versionHash: 'd4e5f6',
    },
  },
  {
    id: 'node-2',
    type: 'model',
    position: { x: 350, y: 100 },
    data: {
      label: 'Model',
      config: {
        modelName: 'Llama3-8B',
        precision: 'FP16',
      },
      versionHash: 'a1b2c3',
    },
  },
  {
    id: 'node-3',
    type: 'resource',
    position: { x: 600, y: 100 },
    data: {
      label: 'GPU Resource',
      config: {
        cardModel: 'NVIDIA H100',
        gpuCount: 1,
        memoryLimit: '80GB',
      },
    },
  },
  {
    id: 'node-4',
    type: 'eval',
    position: { x: 850, y: 100 },
    data: {
      label: 'Evaluation',
      config: {
        metrics: ['accuracy', 'throughput', 'latency'],
      },
    },
  },
  {
    id: 'node-5',
    type: 'export',
    position: { x: 1100, y: 100 },
    data: {
      label: 'Export Report',
      config: {
        format: 'pdf',
        includeCharts: true,
      },
    },
  },
];

export function generateMockMetrics(count: number = 100): RealTimeMetrics[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: now - (count - i) * 1000,
    throughput: 2000 + Math.random() * 1000,
    latency_p99: 8 + Math.random() * 8,
    gpu_util: 60 + Math.random() * 35,
    memory_bandwidth: 400 + Math.random() * 600,
  }));
}