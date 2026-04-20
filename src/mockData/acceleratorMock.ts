export interface AcceleratorCard {
  id: string;
  name: string;
  vendor: string;
  model: string;
  memory_gb: number;
  compute_capability?: string;
  architecture?: string;
  status: 'pending' | 'testing' | 'tested';
  scores: {
    overall: number;
    compute: number;
    memory: number;
    bandwidth: number;
    power_efficiency: number;
    stability?: number;
    compatibility?: number;
  };
  metrics: {
    fp32_tflops: number;
    fp16_tflops: number;
    int8_tops: number;
    memory_bandwidth_gbps: number;
    power_consumption_w: number;
    thermal_design_power_w?: number;
  };
  specifications: {
    cuda_cores: number;
    tensor_cores: number;
    base_clock_mhz: number;
    boost_clock_mhz: number;
    process_nm: number;
    transistors_billion?: number;
    die_size_mm2?: number;
  };
  test_summary?: {
    total_tests: number;
    successful_tests: number;
    failed_tests: number;
    last_test_at: string;
  };
  tags: string[];
  description?: string;
  created_at: string;
  updated_at?: string;
  created_by?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  trend: number[];
  capabilities: string[];
  firmware?: string;
  driver?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

export interface AcceleratorTest {
  id: string;
  accelerator_id: string;
  accelerator?: {
    id: string;
    name: string;
    vendor: string;
    model: string;
  };
  name: string;
  type: 'performance' | 'power' | 'stability' | 'compatibility';
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  config: {
    test_duration_minutes?: number;
    workload?: string;
    batch_size?: number;
    precision?: string;
    dataset?: string;
    iterations?: number;
    [key: string]: any;
  };
  resource_request?: {
    gpu_count: number;
    memory_gb: number;
    node_type?: string;
  };
  resource_usage?: {
    actual_gpu_count: number;
    node_id: string;
    node_name: string;
    allocated_at: string;
  };
  results?: {
    throughput: number;
    throughput_unit?: string;
    latency_p50: number;
    latency_p99: number;
    latency_unit?: string;
    errors: number;
    error_rate?: number;
    gpu_utilization_avg: number;
    gpu_utilization_max?: number;
    gpu_utilization_min?: number;
    memory_utilization_avg: number;
    memory_utilization_max?: number;
    memory_utilization_min?: number;
    power_consumption_avg: number;
    power_consumption_max?: number;
    power_consumption_min?: number;
    temperature_avg?: number;
    temperature_max?: number;
    temperature_min?: number;
  };
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at?: string;
  created_by?: {
    id: string;
    username: string;
    full_name?: string;
  };
}

export interface AcceleratorComparison {
  id: string;
  name: string;
  description?: string;
  accelerator_ids: string[];
  accelerators?: Array<{
    id: string;
    name: string;
    vendor: string;
    model: string;
    memory_gb: number;
    scores: { overall: number };
  }>;
  dimensions?: Record<string, Record<string, number> & { unit?: string; description?: string }>;
  summary?: {
    winner: string;
    winner_name: string;
    cost_performance_ratio?: Record<string, number>;
    improvement_percentage?: Record<string, number>;
    recommendation?: string;
  };
  comparison_config?: {
    dimensions?: string[];
    metrics?: string[];
    workloads?: string[];
  };
  is_starred: boolean;
  tags: string[];
  created_at: string;
  updated_at?: string;
  created_by?: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AcceleratorTestMetrics {
  timestamp: string;
  throughput: number;
  latency_p50: number;
  latency_p99: number;
  gpu_utilization: number;
  memory_utilization: number;
  power_consumption: number;
  temperature: number;
}

export const acceleratorCards: AcceleratorCard[] = [
  {
    id: 'acc-001',
    name: 'NVIDIA H100',
    vendor: 'NVIDIA',
    model: 'H100 SXM5',
    memory_gb: 80,
    compute_capability: '9.0',
    architecture: 'Hopper',
    status: 'tested',
    scores: {
      overall: 95,
      compute: 98,
      memory: 92,
      bandwidth: 96,
      power_efficiency: 85,
      stability: 94,
      compatibility: 93,
    },
    metrics: {
      fp32_tflops: 67.0,
      fp16_tflops: 1979.0,
      int8_tops: 3958.0,
      memory_bandwidth_gbps: 3352,
      power_consumption_w: 700,
      thermal_design_power_w: 700,
    },
    specifications: {
      cuda_cores: 16896,
      tensor_cores: 528,
      base_clock_mhz: 1095,
      boost_clock_mhz: 1980,
      process_nm: 4,
      transistors_billion: 80,
      die_size_mm2: 814,
    },
    test_summary: {
      total_tests: 15,
      successful_tests: 14,
      failed_tests: 1,
      last_test_at: '2024-03-15T10:30:00Z',
    },
    tags: ['datacenter', 'ai-training', 'inference'],
    description: 'NVIDIA H100 是数据中心级别的 AI 加速卡，基于 Hopper 架构，提供业界领先的性能。',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-03-15T10:30:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
      full_name: 'Admin User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
    trend: [88, 90, 92, 93, 94, 95],
    capabilities: ['FP32', 'FP16', 'INT8', 'Transformer Engine', 'NVLink', 'MIG'],
    firmware: 'v1.0.0',
    driver: 'CUDA 12.2',
    strengths: ['最强算力', '大显存', 'Transformer优化'],
    weaknesses: ['功耗高', '价格昂贵'],
    recommendations: ['适合大规模训练', '推荐用于LLM推理'],
  },
  {
    id: 'acc-002',
    name: 'NVIDIA A100',
    vendor: 'NVIDIA',
    model: 'A100 SXM4',
    memory_gb: 80,
    compute_capability: '8.0',
    architecture: 'Ampere',
    status: 'tested',
    scores: {
      overall: 88,
      compute: 85,
      memory: 88,
      bandwidth: 90,
      power_efficiency: 92,
      stability: 90,
      compatibility: 95,
    },
    metrics: {
      fp32_tflops: 19.5,
      fp16_tflops: 312.0,
      int8_tops: 624.0,
      memory_bandwidth_gbps: 2039,
      power_consumption_w: 400,
      thermal_design_power_w: 400,
    },
    specifications: {
      cuda_cores: 6912,
      tensor_cores: 432,
      base_clock_mhz: 1065,
      boost_clock_mhz: 1410,
      process_nm: 7,
      transistors_billion: 54.2,
      die_size_mm2: 826,
    },
    test_summary: {
      total_tests: 12,
      successful_tests: 12,
      failed_tests: 0,
      last_test_at: '2024-03-14T09:00:00Z',
    },
    tags: ['datacenter', 'ai-training', 'inference'],
    description: 'NVIDIA A100 是数据中心级别的 AI 加速卡，基于 Ampere 架构。',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-03-14T09:00:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
      full_name: 'Admin User',
    },
    trend: [80, 82, 84, 85, 87, 88],
    capabilities: ['FP32', 'FP16', 'INT8', 'Tensor Core', 'NVLink', 'MIG'],
    firmware: 'v1.0.0',
    driver: 'CUDA 12.2',
    strengths: ['性价比高', '成熟稳定', '生态完善'],
    weaknesses: ['算力相对较低', '带宽受限'],
    recommendations: ['适合中小规模训练', '推荐用于推理部署'],
  },
  {
    id: 'acc-003',
    name: 'AMD MI300X',
    vendor: 'AMD',
    model: 'MI300X',
    memory_gb: 192,
    compute_capability: 'CDNA 3',
    architecture: 'CDNA 3',
    status: 'tested',
    scores: {
      overall: 90,
      compute: 92,
      memory: 98,
      bandwidth: 93,
      power_efficiency: 80,
    },
    metrics: {
      fp32_tflops: 81.7,
      fp16_tflops: 1307.0,
      int8_tops: 2614.0,
      memory_bandwidth_gbps: 5300,
      power_consumption_w: 750,
    },
    specifications: {
      cuda_cores: 0,
      tensor_cores: 0,
      base_clock_mhz: 1000,
      boost_clock_mhz: 1500,
      process_nm: 5,
    },
    tags: ['datacenter', 'ai-training', 'inference'],
    description: 'AMD MI300X 是 AMD 最新的数据中心 AI 加速卡。',
    created_at: '2024-01-03T00:00:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
    },
    trend: [82, 84, 86, 88, 89, 90],
    capabilities: ['FP32', 'FP16', 'INT8', 'CDNA 3', 'Infinity Fabric', 'ROCm'],
    firmware: 'v1.0.0',
    driver: 'ROCm 6.0',
    strengths: ['超大显存', '高带宽', '性价比优'],
    weaknesses: ['生态较新', '软件支持待完善'],
    recommendations: ['适合大模型推理', '推荐用于显存密集型任务'],
  },
  {
    id: 'acc-004',
    name: '华为昇腾910B',
    vendor: '华为',
    model: 'Ascend 910B',
    memory_gb: 64,
    compute_capability: 'Da Vinci',
    architecture: 'Da Vinci',
    status: 'tested',
    scores: {
      overall: 82,
      compute: 80,
      memory: 78,
      bandwidth: 75,
      power_efficiency: 88,
    },
    metrics: {
      fp32_tflops: 32.0,
      fp16_tflops: 512.0,
      int8_tops: 1024.0,
      memory_bandwidth_gbps: 1600,
      power_consumption_w: 310,
    },
    specifications: {
      cuda_cores: 0,
      tensor_cores: 0,
      base_clock_mhz: 2000,
      boost_clock_mhz: 2600,
      process_nm: 7,
    },
    tags: ['datacenter', 'ai-training'],
    description: '华为昇腾 910B 是华为自研的 AI 加速卡。',
    created_at: '2024-01-04T00:00:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
    },
    trend: [75, 77, 79, 80, 81, 82],
    capabilities: ['FP32', 'FP16', 'INT8', '达芬奇架构', 'HCCS', 'MindSpore'],
    firmware: 'v1.0.0',
    driver: 'CANN 7.0',
    strengths: ['国产自主', '性价比高', '功耗低'],
    weaknesses: ['生态相对封闭', '软件支持有限'],
    recommendations: ['适合国产化需求', '推荐用于端侧部署'],
  },
  {
    id: 'acc-005',
    name: '寒武纪MLU370',
    vendor: '寒武纪',
    model: 'MLU370-S4',
    memory_gb: 48,
    compute_capability: 'MLU',
    architecture: 'MLU',
    status: 'testing',
    scores: {
      overall: 75,
      compute: 72,
      memory: 70,
      bandwidth: 68,
      power_efficiency: 85,
    },
    metrics: {
      fp32_tflops: 24.0,
      fp16_tflops: 384.0,
      int8_tops: 768.0,
      memory_bandwidth_gbps: 1200,
      power_consumption_w: 250,
    },
    specifications: {
      cuda_cores: 0,
      tensor_cores: 0,
      base_clock_mhz: 1800,
      boost_clock_mhz: 2200,
      process_nm: 7,
    },
    tags: ['datacenter', 'inference'],
    description: '寒武纪 MLU370 是国产 AI 推理加速卡。',
    created_at: '2024-01-05T00:00:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
    },
    trend: [68, 70, 72, 73, 74, 75],
    capabilities: ['FP32', 'FP16', 'INT8', 'MLU架构', 'MLU-Link', 'BANG'],
    firmware: 'v1.0.0',
    driver: 'CNToolkit 4.0',
    strengths: ['国产自主', '低功耗', '推理优化'],
    weaknesses: ['训练能力弱', '生态待发展'],
    recommendations: ['适合推理场景', '推荐用于边缘部署'],
  },
];

export const acceleratorTests: AcceleratorTest[] = [
  {
    id: 'test-001',
    accelerator_id: 'acc-001',
    accelerator: {
      id: 'acc-001',
      name: 'NVIDIA H100',
      vendor: 'NVIDIA',
      model: 'H100 SXM5',
    },
    name: 'H100 性能基准测试',
    type: 'performance',
    status: 'success',
    priority: 'P1',
    config: {
      test_duration_minutes: 60,
      workload: 'resnet50-training',
      batch_size: 256,
      precision: 'FP16',
      dataset: 'ImageNet',
      iterations: 1000,
    },
    resource_request: {
      gpu_count: 1,
      memory_gb: 80,
      node_type: 'high-memory',
    },
    resource_usage: {
      actual_gpu_count: 1,
      node_id: 'node-01',
      node_name: 'gpu-node-01',
      allocated_at: '2024-03-15T10:00:00Z',
    },
    results: {
      throughput: 1500,
      throughput_unit: 'images/sec',
      latency_p50: 15,
      latency_p99: 20,
      latency_unit: 'ms',
      errors: 0,
      error_rate: 0,
      gpu_utilization_avg: 95.5,
      gpu_utilization_max: 98.2,
      gpu_utilization_min: 92.1,
      memory_utilization_avg: 88.2,
      memory_utilization_max: 92.5,
      memory_utilization_min: 85.1,
      power_consumption_avg: 650,
      power_consumption_max: 680,
      power_consumption_min: 620,
      temperature_avg: 75,
      temperature_max: 78,
      temperature_min: 72,
    },
    started_at: '2024-03-15T10:00:00Z',
    completed_at: '2024-03-15T11:00:00Z',
    duration_seconds: 3600,
    created_at: '2024-03-15T09:50:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
      full_name: 'Admin User',
    },
  },
  {
    id: 'test-002',
    accelerator_id: 'acc-001',
    accelerator: {
      id: 'acc-001',
      name: 'NVIDIA H100',
      vendor: 'NVIDIA',
      model: 'H100 SXM5',
    },
    name: 'H100 功耗测试',
    type: 'power',
    status: 'running',
    priority: 'P2',
    config: {
      test_duration_minutes: 30,
      workload: 'bert-inference',
      batch_size: 128,
      precision: 'FP16',
    },
    resource_request: {
      gpu_count: 1,
      memory_gb: 80,
    },
    resource_usage: {
      actual_gpu_count: 1,
      node_id: 'node-02',
      node_name: 'gpu-node-02',
      allocated_at: '2024-03-15T12:00:00Z',
    },
    started_at: '2024-03-15T12:00:00Z',
    created_at: '2024-03-15T11:50:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
    },
  },
  {
    id: 'test-003',
    accelerator_id: 'acc-002',
    accelerator: {
      id: 'acc-002',
      name: 'NVIDIA A100',
      vendor: 'NVIDIA',
      model: 'A100 SXM4',
    },
    name: 'A100 性能基准测试',
    type: 'performance',
    status: 'pending',
    priority: 'P2',
    config: {
      test_duration_minutes: 60,
      workload: 'resnet50-training',
      batch_size: 256,
      precision: 'FP16',
    },
    resource_request: {
      gpu_count: 1,
      memory_gb: 80,
    },
    created_at: '2024-03-15T13:00:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
    },
  },
  {
    id: 'test-004',
    accelerator_id: 'acc-003',
    accelerator: {
      id: 'acc-003',
      name: 'AMD MI300X',
      vendor: 'AMD',
      model: 'MI300X',
    },
    name: 'MI300X 稳定性测试',
    type: 'stability',
    status: 'failed',
    priority: 'P1',
    config: {
      test_duration_minutes: 120,
      workload: 'gpt-training',
      batch_size: 64,
      precision: 'FP16',
      iterations: 500,
    },
    resource_request: {
      gpu_count: 1,
      memory_gb: 192,
    },
    resource_usage: {
      actual_gpu_count: 1,
      node_id: 'node-03',
      node_name: 'gpu-node-03',
      allocated_at: '2024-03-14T08:00:00Z',
    },
    results: {
      throughput: 0,
      latency_p50: 0,
      latency_p99: 0,
      errors: 5,
      error_rate: 1.2,
      gpu_utilization_avg: 45.2,
      memory_utilization_avg: 60.1,
      power_consumption_avg: 720,
    },
    started_at: '2024-03-14T08:00:00Z',
    completed_at: '2024-03-14T09:30:00Z',
    duration_seconds: 5400,
    created_at: '2024-03-14T07:50:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
    },
  },
];

export const acceleratorComparisons: AcceleratorComparison[] = [
  {
    id: 'comp-001',
    name: 'H100 vs A100 性能对比',
    description: '对比两款数据中心级别加速卡的性能',
    accelerator_ids: ['acc-001', 'acc-002'],
    accelerators: [
      { id: 'acc-001', name: 'NVIDIA H100', vendor: 'NVIDIA', model: 'H100 SXM5', memory_gb: 80, scores: { overall: 95 } },
      { id: 'acc-002', name: 'NVIDIA A100', vendor: 'NVIDIA', model: 'A100 SXM4', memory_gb: 80, scores: { overall: 88 } },
    ],
    dimensions: {
      compute: { 'acc-001': 98, 'acc-002': 85, unit: 'TFLOPS', description: '计算性能' },
      memory: { 'acc-001': 92, 'acc-002': 88, unit: 'GB/s', description: '内存带宽' },
      bandwidth: { 'acc-001': 96, 'acc-002': 90, unit: 'GB/s', description: '数据传输带宽' },
      power_efficiency: { 'acc-001': 85, 'acc-002': 92, unit: 'TFLOPS/W', description: '能效比' },
    },
    summary: {
      winner: 'acc-001',
      winner_name: 'NVIDIA H100',
      cost_performance_ratio: { 'acc-001': 1.2, 'acc-002': 1.0 },
      improvement_percentage: { compute: 15.3, memory: 4.5, bandwidth: 6.7, power_efficiency: -7.6 },
      recommendation: 'H100 在计算性能方面显著领先，适合计算密集型任务；A100 在能效比方面更优，适合对功耗敏感的场景',
    },
    comparison_config: {
      dimensions: ['compute', 'memory', 'bandwidth', 'power_efficiency'],
      metrics: ['throughput', 'latency', 'gpu_utilization'],
      workloads: ['resnet50-training', 'bert-inference'],
    },
    is_starred: true,
    tags: ['performance', 'datacenter'],
    created_at: '2024-03-15T14:00:00Z',
    created_by: {
      id: 'user-001',
      username: 'admin',
      full_name: 'Admin User',
    },
  },
  {
    id: 'comp-002',
    name: '国产加速卡对比',
    description: '华为昇腾910B vs 寒武纪MLU370 国产化方案对比',
    accelerator_ids: ['acc-004', 'acc-005'],
    accelerators: [
      { id: 'acc-004', name: '华为昇腾910B', vendor: '华为', model: 'Ascend 910B', memory_gb: 64, scores: { overall: 82 } },
      { id: 'acc-005', name: '寒武纪MLU370', vendor: '寒武纪', model: 'MLU370-S4', memory_gb: 48, scores: { overall: 75 } },
    ],
    dimensions: {
      compute: { 'acc-004': 80, 'acc-005': 72, unit: 'TFLOPS', description: '计算性能' },
      memory: { 'acc-004': 78, 'acc-005': 70, unit: 'GB/s', description: '内存带宽' },
      bandwidth: { 'acc-004': 75, 'acc-005': 68, unit: 'GB/s', description: '数据传输带宽' },
      power_efficiency: { 'acc-004': 88, 'acc-005': 85, unit: 'TFLOPS/W', description: '能效比' },
    },
    summary: {
      winner: 'acc-004',
      winner_name: '华为昇腾910B',
      cost_performance_ratio: { 'acc-004': 1.1, 'acc-005': 1.0 },
      improvement_percentage: { compute: 11.1, memory: 11.4, bandwidth: 10.3, power_efficiency: 3.5 },
      recommendation: '昇腾910B 在综合性能上领先，MLU370 在功耗方面有优势',
    },
    is_starred: false,
    tags: ['国产化', '推理性能', '成本对比'],
    created_at: '2024-03-14T15:20:00Z',
    created_by: {
      id: 'user-002',
      username: 'tester',
      full_name: 'Test User',
    },
  },
];

export const acceleratorTestMetrics: AcceleratorTestMetrics[] = Array.from({ length: 60 }, (_, i) => ({
  timestamp: new Date(Date.now() - (60 - i) * 60000).toISOString(),
  throughput: 1450 + Math.random() * 100,
  latency_p50: 14 + Math.random() * 2,
  latency_p99: 18 + Math.random() * 4,
  gpu_utilization: 94 + Math.random() * 3,
  memory_utilization: 86 + Math.random() * 4,
  power_consumption: 640 + Math.random() * 30,
  temperature: 74 + Math.random() * 4,
}));

export const vendorOptions = [
  'NVIDIA',
  'AMD',
  '华为',
  '寒武纪',
  '英特尔',
  '壁仞',
  '燧原',
];

export const testTypeOptions = [
  { value: 'performance', label: '性能测试' },
  { value: 'power', label: '功耗测试' },
  { value: 'stability', label: '稳定性测试' },
  { value: 'compatibility', label: '兼容性测试' },
];

export const testStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '等待中' },
  running: { color: 'processing', text: '运行中' },
  success: { color: 'success', text: '成功' },
  failed: { color: 'error', text: '失败' },
  cancelled: { color: 'warning', text: '已取消' },
};

export interface AcceleratorComparisonResultCard {
  id: string;
  name: string;
  vendor: string;
  model: string;
  specs: {
    memory: number;
    tdp: number;
    cores: number;
    clock: string;
  };
  scores: {
    overall: number;
    computePerformance: number;
    memoryPerformance: number;
    inferenceSpeed: number;
    trainingSpeed: number;
    energyEfficiency: number;
    costEfficiency: number;
  };
  subTaskScores?: Record<string, Record<string, { score: number }>>;
}

export interface AcceleratorComparisonResultAdvantage {
  cardName: string;
  matchScore: number;
  advantages: string[];
  disadvantages: string[];
  recommendedScenarios: string[];
}

export interface AcceleratorComparisonResult {
  id: string;
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  isStarred: boolean;
  creatorId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  tags: string[];
  cards: AcceleratorComparisonResultCard[];
  overallAnalysis: {
    bestCard: string;
    worstCard: string;
    summary: string;
  };
  advantageAnalysis: AcceleratorComparisonResultAdvantage[];
}

export const acceleratorComparisonResults: AcceleratorComparisonResult[] = [
  {
    id: 'comp-res-001',
    name: 'H100 vs A100 性能对比',
    description: '对比两款数据中心级别加速卡的性能',
    category: '训练对比',
    isPublic: true,
    isStarred: true,
    creatorId: 'user-001',
    createdBy: 'Admin User',
    createdAt: '2024-03-15 14:00:00',
    updatedAt: '2024-03-15 14:00:00',
    version: 1,
    tags: ['performance', 'datacenter'],
    cards: [
      {
        id: 'acc-001',
        name: 'NVIDIA H100',
        vendor: 'NVIDIA',
        model: 'H100 SXM5',
        specs: { memory: 80, tdp: 700, cores: 16896, clock: '1980MHz' },
        scores: { overall: 95, computePerformance: 98, memoryPerformance: 92, inferenceSpeed: 96, trainingSpeed: 97, energyEfficiency: 85, costEfficiency: 78 },
        subTaskScores: {
          computePerformance: { fp32Performance: { score: 97 }, fp16Performance: { score: 99 }, int8Performance: { score: 98 }, matrixMultiplication: { score: 96 } },
          memoryPerformance: { memoryBandwidth: { score: 94 }, memoryLatency: { score: 90 }, hbmCapacity: { score: 92 } },
          inferenceSpeed: { bertInference: { score: 95 }, gptInference: { score: 97 }, resnetInference: { score: 96 }, batchThroughput: { score: 94 } },
          trainingSpeed: { bertTraining: { score: 96 }, gptTraining: { score: 98 }, resnetTraining: { score: 97 }, distributedScaling: { score: 95 } },
          energyEfficiency: { powerConsumption: { score: 72 }, performancePerWatt: { score: 85 }, thermalDesign: { score: 88 } },
          costEfficiency: { pricePerfRatio: { score: 75 }, tcoEstimate: { score: 78 }, roiScore: { score: 80 } },
        },
      },
      {
        id: 'acc-002',
        name: 'NVIDIA A100',
        vendor: 'NVIDIA',
        model: 'A100 SXM4',
        specs: { memory: 80, tdp: 400, cores: 6912, clock: '1410MHz' },
        scores: { overall: 88, computePerformance: 85, memoryPerformance: 88, inferenceSpeed: 82, trainingSpeed: 84, energyEfficiency: 92, costEfficiency: 90 },
        subTaskScores: {
          computePerformance: { fp32Performance: { score: 84 }, fp16Performance: { score: 86 }, int8Performance: { score: 85 }, matrixMultiplication: { score: 83 } },
          memoryPerformance: { memoryBandwidth: { score: 89 }, memoryLatency: { score: 87 }, hbmCapacity: { score: 88 } },
          inferenceSpeed: { bertInference: { score: 81 }, gptInference: { score: 83 }, resnetInference: { score: 82 }, batchThroughput: { score: 80 } },
          trainingSpeed: { bertTraining: { score: 83 }, gptTraining: { score: 85 }, resnetTraining: { score: 84 }, distributedScaling: { score: 82 } },
          energyEfficiency: { powerConsumption: { score: 90 }, performancePerWatt: { score: 93 }, thermalDesign: { score: 91 } },
          costEfficiency: { pricePerfRatio: { score: 88 }, tcoEstimate: { score: 91 }, roiScore: { score: 89 } },
        },
      },
    ],
    overallAnalysis: {
      bestCard: 'NVIDIA H100',
      worstCard: 'NVIDIA A100',
      summary: 'H100 在计算性能、推理速度和训练速度方面显著领先，适合计算密集型任务；A100 在能效比和性价比方面更优，适合对功耗和成本敏感的场景。',
    },
    advantageAnalysis: [
      {
        cardName: 'NVIDIA H100',
        matchScore: 92,
        advantages: ['最强算力', '大显存', 'Transformer优化', 'NVLink高速互联'],
        disadvantages: ['功耗高', '价格昂贵'],
        recommendedScenarios: ['大规模训练', 'LLM推理', '高性能计算'],
      },
      {
        cardName: 'NVIDIA A100',
        matchScore: 85,
        advantages: ['性价比高', '成熟稳定', '生态完善', '功耗低'],
        disadvantages: ['算力相对较低', '带宽受限'],
        recommendedScenarios: ['中小规模训练', '推理部署', '通用计算'],
      },
    ],
  },
  {
    id: 'comp-res-002',
    name: '国产加速卡对比',
    description: '华为昇腾910B vs 寒武纪MLU370 国产化方案对比',
    category: '国产对比',
    isPublic: true,
    isStarred: false,
    creatorId: 'user-002',
    createdBy: 'Test User',
    createdAt: '2024-03-14 15:20:00',
    updatedAt: '2024-03-14 15:20:00',
    version: 1,
    tags: ['国产化', '推理性能', '成本对比'],
    cards: [
      {
        id: 'acc-004',
        name: '华为昇腾910B',
        vendor: '华为',
        model: 'Ascend 910B',
        specs: { memory: 64, tdp: 310, cores: 0, clock: '2600MHz' },
        scores: { overall: 82, computePerformance: 80, memoryPerformance: 78, inferenceSpeed: 75, trainingSpeed: 77, energyEfficiency: 88, costEfficiency: 85 },
        subTaskScores: {
          computePerformance: { fp32Performance: { score: 79 }, fp16Performance: { score: 81 }, int8Performance: { score: 80 }, matrixMultiplication: { score: 78 } },
          memoryPerformance: { memoryBandwidth: { score: 77 }, memoryLatency: { score: 79 }, hbmCapacity: { score: 78 } },
          inferenceSpeed: { bertInference: { score: 74 }, gptInference: { score: 76 }, resnetInference: { score: 75 }, batchThroughput: { score: 73 } },
          trainingSpeed: { bertTraining: { score: 76 }, gptTraining: { score: 78 }, resnetTraining: { score: 77 }, distributedScaling: { score: 75 } },
          energyEfficiency: { powerConsumption: { score: 86 }, performancePerWatt: { score: 89 }, thermalDesign: { score: 87 } },
          costEfficiency: { pricePerfRatio: { score: 84 }, tcoEstimate: { score: 86 }, roiScore: { score: 83 } },
        },
      },
      {
        id: 'acc-005',
        name: '寒武纪MLU370',
        vendor: '寒武纪',
        model: 'MLU370-S4',
        specs: { memory: 48, tdp: 250, cores: 0, clock: '2200MHz' },
        scores: { overall: 75, computePerformance: 72, memoryPerformance: 70, inferenceSpeed: 68, trainingSpeed: 65, energyEfficiency: 85, costEfficiency: 82 },
        subTaskScores: {
          computePerformance: { fp32Performance: { score: 71 }, fp16Performance: { score: 73 }, int8Performance: { score: 72 }, matrixMultiplication: { score: 70 } },
          memoryPerformance: { memoryBandwidth: { score: 69 }, memoryLatency: { score: 71 }, hbmCapacity: { score: 70 } },
          inferenceSpeed: { bertInference: { score: 67 }, gptInference: { score: 69 }, resnetInference: { score: 68 }, batchThroughput: { score: 66 } },
          trainingSpeed: { bertTraining: { score: 64 }, gptTraining: { score: 66 }, resnetTraining: { score: 65 }, distributedScaling: { score: 63 } },
          energyEfficiency: { powerConsumption: { score: 83 }, performancePerWatt: { score: 86 }, thermalDesign: { score: 84 } },
          costEfficiency: { pricePerfRatio: { score: 81 }, tcoEstimate: { score: 83 }, roiScore: { score: 80 } },
        },
      },
    ],
    overallAnalysis: {
      bestCard: '华为昇腾910B',
      worstCard: '寒武纪MLU370',
      summary: '昇腾910B 在综合性能上领先，MLU370 在功耗方面有优势。两者均为国产化方案，适合有自主可控需求的场景。',
    },
    advantageAnalysis: [
      {
        cardName: '华为昇腾910B',
        matchScore: 80,
        advantages: ['国产自主', '性价比高', '功耗低', '训练能力较强'],
        disadvantages: ['生态相对封闭', '软件支持有限'],
        recommendedScenarios: ['国产化需求', '端侧部署', '中小规模训练'],
      },
      {
        cardName: '寒武纪MLU370',
        matchScore: 72,
        advantages: ['国产自主', '低功耗', '推理优化'],
        disadvantages: ['训练能力弱', '生态待发展'],
        recommendedScenarios: ['推理场景', '边缘部署', '低功耗需求'],
      },
    ],
  },
  {
    id: 'comp-res-003',
    name: 'H100 vs MI300X 旗舰对比',
    description: 'NVIDIA H100 与 AMD MI300X 旗舰加速卡全面对比',
    category: '训练对比',
    isPublic: false,
    isStarred: true,
    creatorId: 'user-001',
    createdBy: 'Admin User',
    createdAt: '2024-03-13 10:00:00',
    updatedAt: '2024-03-13 10:00:00',
    version: 2,
    tags: ['旗舰对比', '高性能', '大模型'],
    cards: [
      {
        id: 'acc-001',
        name: 'NVIDIA H100',
        vendor: 'NVIDIA',
        model: 'H100 SXM5',
        specs: { memory: 80, tdp: 700, cores: 16896, clock: '1980MHz' },
        scores: { overall: 95, computePerformance: 98, memoryPerformance: 92, inferenceSpeed: 96, trainingSpeed: 97, energyEfficiency: 85, costEfficiency: 78 },
      },
      {
        id: 'acc-003',
        name: 'AMD MI300X',
        vendor: 'AMD',
        model: 'MI300X',
        specs: { memory: 192, tdp: 750, cores: 0, clock: '1500MHz' },
        scores: { overall: 90, computePerformance: 92, memoryPerformance: 98, inferenceSpeed: 88, trainingSpeed: 90, energyEfficiency: 80, costEfficiency: 85 },
      },
    ],
    overallAnalysis: {
      bestCard: 'NVIDIA H100',
      worstCard: 'AMD MI300X',
      summary: 'H100 在计算性能和训练速度方面领先，MI300X 在显存容量和内存带宽方面优势明显。两者均为旗舰级产品。',
    },
    advantageAnalysis: [
      {
        cardName: 'NVIDIA H100',
        matchScore: 93,
        advantages: ['最强算力', 'CUDA生态', 'Transformer优化'],
        disadvantages: ['显存较小', '功耗高'],
        recommendedScenarios: ['大规模训练', 'LLM推理', '高性能计算'],
      },
      {
        cardName: 'AMD MI300X',
        matchScore: 87,
        advantages: ['超大显存', '高带宽', '性价比优'],
        disadvantages: ['生态较新', '软件支持待完善'],
        recommendedScenarios: ['大模型推理', '显存密集型任务', '高带宽需求'],
      },
    ],
  },
];

export const acceleratorCategories = [
  '训练对比',
  '推理对比',
  '国产对比',
  '能效对比',
  '成本对比',
];

export const acceleratorTags = [
  'performance',
  'datacenter',
  'inference',
  'ai-training',
  '国产化',
  '推理性能',
  '成本对比',
  '旗舰对比',
  '高性能',
  '大模型',
];

export const acceleratorStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '待测试' },
  testing: { color: 'processing', text: '测试中' },
  tested: { color: 'success', text: '已测试' },
};
