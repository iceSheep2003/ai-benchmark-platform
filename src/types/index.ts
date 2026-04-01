export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type AutoRecoveryStatus = 'none' | 'detecting' | 'restoring' | 'restored';
export type TaskType = 'hardware' | 'llm' | 'accelerator';

export interface WorkflowNode {
  id: string;
  type: 'data' | 'model' | 'resource' | 'eval' | 'export';
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
    versionHash?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface BenchmarkTask {
  id: string;
  name: string;
  type?: TaskType;
  status: TaskStatus;
  createdAt: string;
  createdBy: string;
  createdByAvatar?: string;
  workflowId: string;
  
  resources?: {
    cardModel: string;
    driverVersion: string;
    cudaVersion?: string;
  };
  
  dataLineage?: {
    datasetName: string;
    datasetVersionHash: string;
    modelWeightHash: string;
  };
  
  llmConfig?: {
    model: string;
    version: string;
    capabilities: {
      id: string;
      title: string;
      tests: string[];
      datasets: string[];
    }[];
  };

  acceleratorConfig?: {
    accelerator: string;
    tasks: {
      id: string;
      title: string;
      tests: string[];
      datasets: string[];
    }[];
    offlineTests: {
      id: string;
      title: string;
      enabled: boolean;
      subItems: {
        label: string;
        value: string;
        selected?: string[];
      }[];
    }[];
  };
  
  metrics?: {
    throughput: number;
    latency_p99: number;
    gpu_util: number;
    memory_bandwidth: number;
    timestamp: number;
  }[];
  
  priority?: TaskPriority;
  estimatedStartTime?: string;
  queuePosition?: number;
  resourceRequest?: {
    gpuType: string;
    count: number;
    memoryGB: number;
  };
  resourceUsage?: {
    actualGpuCount: number;
    nodeId: string;
  };
  checkpointConfig?: {
    enabled: boolean;
    intervalSteps: number;
  };
  checkpoints?: Array<{
    id: string;
    step: number;
    timestamp: string;
    filePath: string;
    fileSizeMB: number;
    isValid: boolean;
  }>;
  lastSuccessfulStep?: number;
  failureReason?: string;
  autoRecoveryStatus?: AutoRecoveryStatus;
  comparisonData?: ComparisonData;
  flameGraphData?: FlameGraphNode;
  performanceMetrics?: PerformanceMetrics;
}

export interface ComparisonData {
  taskId: string;
  dimensions: {
    name: string;
    score: number;
    rank: number;
    change?: number;
  }[];
  overallScore: number;
  costPerformanceRatio: number;
  bottlenecks: string[];
  recommendations: string[];
}

export interface PerformanceMetrics {
  taskId: string;
  timestamp: number;
  throughput: number;
  latency_p99: number;
  gpu_util: number;
  memory_bandwidth: number;
  energy_consumption: number;
  cost_per_token: number;
}

export interface OptimizationRecommendation {
  operation: string;
  currentPerformance: number;
  potentialImprovement: number;
  recommendations: string[];
  relatedAssets: AssetReference[];
  estimatedCostSaving?: number;
  implementationComplexity: 'low' | 'medium' | 'high';
}

export interface AssetReference {
  type: 'model' | 'dataset' | 'accelerator';
  id: string;
  name: string;
  reason: string;
}

export interface ComparisonResult {
  taskIdList: string[];
  dimensions: {
    name: string;
    scores: Record<string, number>;
    bottleneckAnalysis?: Record<string, string>;
  }[];
  summary: {
    winner: string;
    costPerformanceRatio: Record<string, number>;
  };
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface RealTimeMetrics {
  throughput: number;
  latency_p99: number;
  gpu_util: number;
  memory_bandwidth: number;
  timestamp: number;
}

export interface FlameGraphNode {
  name: string;
  value: number;
  children?: FlameGraphNode[];
  color?: string;
}

export interface ReportComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  position?: {
    chartId: string;
    x: number;
    y: number;
  };
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface DashboardStats {
  totalTasks: number;
  runningTasks: number;
  successTasks: number;
  failedTasks: number;
  avgThroughput: number;
  avgLatency: number;
}

export interface ClusterNode {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  gpuCount: number;
  gpuUtil: number;
  temperature: number;
  memoryUsage: number;
}

export interface ClusterStats {
  totalGPUs: number;
  availableGPUs: number;
  usedGPUs: number;
  totalMemoryGB: number;
  availableMemoryGB: number;
  usedMemoryGB: number;
  queuedTasks: number;
  avgQueueWaitTime: number;
  gpuUtilization: number;
  memoryUtilization: number;
}

export interface ResourceEstimation {
  recommendedGpuCount: number;
  recommendedMemoryGB: number;
  estimatedDuration: number;
  estimatedCost: number;
  warnings: string[];
  suggestions: string[];
}

export interface ModelAsset {
  id: string;
  name: string;
  params: string;
  architecture: string;
  organization: string;
  quantization: string;
  benchmarks: Array<{
    taskId: string;
    gpuType: string;
    throughput: number;
    latency: number;
    date: string;
    status: 'success' | 'failed';
  }>;
  bestConfig?: {
    gpuType: string;
    gpuCount: number;
    throughput: number;
  };
  usageCount: number;
}

export interface DatasetAsset {
  id: string;
  name: string;
  source: 'huggingface' | 'custom';
  version: string;
  rowCount: number;
  sizeMB: number;
  previewData: any[];
  usageCount: number;
  metadata?: {
    description: string;
    tags: string[];
    language: string;
    license: string;
  };
}

export interface HuggingFaceDataset {
  id: string;
  name: string;
  downloads: number;
  likes: number;
  tags: string[];
}

export interface AcceleratorAsset {
  id: string;
  nodeIp: string;
  gpuModel: string;
  gpuCount: number;
  status: 'idle' | 'busy' | 'error' | 'maintenance';
  performanceStats: {
    avgUtilization: number;
    topModels: string[];
    failureRate: number;
    avgThroughput: number;
  };
  failureHeatmap?: Array<{
    timestamp: string;
    failureCount: number;
  }>;
  relatedTasks?: string[];
}