export interface AcceleratorCard {
  id: string;
  name: string;
  vendor: string;
  model: string;
  status: 'tested' | 'testing' | 'pending';
  specs: {
    memory: number;
    memoryType: string;
    tdp: number;
    process: string;
    cores: number;
    frequency: string;
    bandwidth: string;
    interconnect: string;
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
  subTaskScores: {
    computePerformance: {
      fp32Performance: { score: number; metric: 'TFLOPS' };
      fp16Performance: { score: number; metric: 'TFLOPS' };
      int8Performance: { score: number; metric: 'TOPS' };
      matrixMultiplication: { score: number; metric: 'TFLOPS' };
    };
    memoryPerformance: {
      memoryBandwidth: { score: number; metric: 'GB/s' };
      memoryLatency: { score: number; metric: 'ns' };
      hbmCapacity: { score: number; metric: 'GB' };
    };
    inferenceSpeed: {
      bertInference: { score: number; metric: 'ms' };
      gptInference: { score: number; metric: 'ms' };
      resnetInference: { score: number; metric: 'ms' };
      batchThroughput: { score: number; metric: 'samples/s' };
    };
    trainingSpeed: {
      bertTraining: { score: number; metric: 'samples/s' };
      gptTraining: { score: number; metric: 'tokens/s' };
      resnetTraining: { score: number; metric: 'images/s' };
      distributedScaling: { score: number; metric: 'efficiency' };
    };
    energyEfficiency: {
      powerConsumption: { score: number; metric: 'W' };
      performancePerWatt: { score: number; metric: 'TFLOPS/W' };
      thermalDesign: { score: number; metric: '°C' };
    };
    costEfficiency: {
      pricePerfRatio: { score: number; metric: 'ratio' };
      tcoEstimate: { score: number; metric: 'USD/year' };
      roiScore: { score: number; metric: 'score' };
    };
  };
  trend: number[];
  capabilities: string[];
  testProgress?: {
    current: number;
    total: number;
    currentTask: string;
    estimatedTime: string;
  };
  testedAt?: string;
  firmware: string;
  driver: string;
  versionHistory?: AcceleratorVersion[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

export interface AcceleratorVersion {
  version: string;
  date: string;
  scores: {
    overall: number;
    computePerformance: number;
    memoryPerformance: number;
    inferenceSpeed: number;
    trainingSpeed: number;
    energyEfficiency: number;
    costEfficiency: number;
  };
  changes: string;
}

export interface AcceleratorComparisonResult {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  creatorId: string;
  
  cards: AcceleratorCard[];
  dimensionWeights: Record<string, number>;
  
  overallAnalysis: {
    bestCard: string;
    worstCard: string;
    summary: string;
  };
  dimensionAnalysis: AcceleratorDimensionAnalysis[];
  advantageAnalysis: AcceleratorAdvantageAnalysis[];
  
  tags: string[];
  category: string;
  isPublic: boolean;
  isStarred: boolean;
  version: number;
}

export interface AcceleratorDimensionAnalysis {
  dimension: string;
  bestCard: string;
  worstCard: string;
  avgScore: number;
  stdDev: number;
  analysis: string;
}

export interface AcceleratorAdvantageAnalysis {
  cardName: string;
  advantages: string[];
  disadvantages: string[];
  recommendedScenarios: string[];
  matchScore: number;
}

export const acceleratorCards: AcceleratorCard[] = [
  {
    id: 'acc-001',
    name: 'NVIDIA H100',
    vendor: 'NVIDIA',
    model: 'H100 SXM5',
    status: 'tested',
    specs: {
      memory: 80,
      memoryType: 'HBM3',
      tdp: 700,
      process: 'TSMC 4N',
      cores: 16896,
      frequency: '1.83 GHz',
      bandwidth: '3.35 TB/s',
      interconnect: 'NVLink 4.0',
    },
    scores: {
      overall: 95,
      computePerformance: 98,
      memoryPerformance: 96,
      inferenceSpeed: 94,
      trainingSpeed: 97,
      energyEfficiency: 85,
      costEfficiency: 72,
    },
    subTaskScores: {
      computePerformance: {
        fp32Performance: { score: 67.0, metric: 'TFLOPS' },
        fp16Performance: { score: 1979.0, metric: 'TFLOPS' },
        int8Performance: { score: 3958.0, metric: 'TOPS' },
        matrixMultiplication: { score: 989.0, metric: 'TFLOPS' },
      },
      memoryPerformance: {
        memoryBandwidth: { score: 3352, metric: 'GB/s' },
        memoryLatency: { score: 45, metric: 'ns' },
        hbmCapacity: { score: 80, metric: 'GB' },
      },
      inferenceSpeed: {
        bertInference: { score: 0.8, metric: 'ms' },
        gptInference: { score: 12.5, metric: 'ms' },
        resnetInference: { score: 0.15, metric: 'ms' },
        batchThroughput: { score: 12500, metric: 'samples/s' },
      },
      trainingSpeed: {
        bertTraining: { score: 8500, metric: 'samples/s' },
        gptTraining: { score: 125000, metric: 'tokens/s' },
        resnetTraining: { score: 15000, metric: 'images/s' },
        distributedScaling: { score: 95, metric: 'efficiency' },
      },
      energyEfficiency: {
        powerConsumption: { score: 700, metric: 'W' },
        performancePerWatt: { score: 2.83, metric: 'TFLOPS/W' },
        thermalDesign: { score: 75, metric: '°C' },
      },
      costEfficiency: {
        pricePerfRatio: { score: 0.85, metric: 'ratio' },
        tcoEstimate: { score: 45000, metric: 'USD/year' },
        roiScore: { score: 78, metric: 'score' },
      },
    },
    trend: [88, 90, 92, 93, 94, 95],
    capabilities: ['FP32', 'FP16', 'INT8', 'Transformer Engine', 'NVLink', 'MIG'],
    testedAt: '2024-03-15 10:00:00',
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
    status: 'tested',
    specs: {
      memory: 80,
      memoryType: 'HBM2e',
      tdp: 400,
      process: 'TSMC 7N',
      cores: 6912,
      frequency: '1.41 GHz',
      bandwidth: '2.04 TB/s',
      interconnect: 'NVLink 3.0',
    },
    scores: {
      overall: 88,
      computePerformance: 85,
      memoryPerformance: 90,
      inferenceSpeed: 86,
      trainingSpeed: 84,
      energyEfficiency: 92,
      costEfficiency: 85,
    },
    subTaskScores: {
      computePerformance: {
        fp32Performance: { score: 19.5, metric: 'TFLOPS' },
        fp16Performance: { score: 624.0, metric: 'TFLOPS' },
        int8Performance: { score: 1248.0, metric: 'TOPS' },
        matrixMultiplication: { score: 312.0, metric: 'TFLOPS' },
      },
      memoryPerformance: {
        memoryBandwidth: { score: 2039, metric: 'GB/s' },
        memoryLatency: { score: 55, metric: 'ns' },
        hbmCapacity: { score: 80, metric: 'GB' },
      },
      inferenceSpeed: {
        bertInference: { score: 1.2, metric: 'ms' },
        gptInference: { score: 18.5, metric: 'ms' },
        resnetInference: { score: 0.25, metric: 'ms' },
        batchThroughput: { score: 8500, metric: 'samples/s' },
      },
      trainingSpeed: {
        bertTraining: { score: 5500, metric: 'samples/s' },
        gptTraining: { score: 85000, metric: 'tokens/s' },
        resnetTraining: { score: 10000, metric: 'images/s' },
        distributedScaling: { score: 92, metric: 'efficiency' },
      },
      energyEfficiency: {
        powerConsumption: { score: 400, metric: 'W' },
        performancePerWatt: { score: 2.16, metric: 'TFLOPS/W' },
        thermalDesign: { score: 68, metric: '°C' },
      },
      costEfficiency: {
        pricePerfRatio: { score: 1.25, metric: 'ratio' },
        tcoEstimate: { score: 28000, metric: 'USD/year' },
        roiScore: { score: 88, metric: 'score' },
      },
    },
    trend: [80, 82, 84, 85, 87, 88],
    capabilities: ['FP32', 'FP16', 'INT8', 'Tensor Core', 'NVLink', 'MIG'],
    testedAt: '2024-03-15 10:00:00',
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
    status: 'tested',
    specs: {
      memory: 192,
      memoryType: 'HBM3',
      tdp: 750,
      process: 'TSMC 5nm',
      cores: 304,
      frequency: '2.1 GHz',
      bandwidth: '5.3 TB/s',
      interconnect: 'Infinity Fabric',
    },
    scores: {
      overall: 90,
      computePerformance: 92,
      memoryPerformance: 98,
      inferenceSpeed: 91,
      trainingSpeed: 89,
      energyEfficiency: 80,
      costEfficiency: 88,
    },
    subTaskScores: {
      computePerformance: {
        fp32Performance: { score: 81.7, metric: 'TFLOPS' },
        fp16Performance: { score: 1307.0, metric: 'TFLOPS' },
        int8Performance: { score: 2614.0, metric: 'TOPS' },
        matrixMultiplication: { score: 653.0, metric: 'TFLOPS' },
      },
      memoryPerformance: {
        memoryBandwidth: { score: 5300, metric: 'GB/s' },
        memoryLatency: { score: 40, metric: 'ns' },
        hbmCapacity: { score: 192, metric: 'GB' },
      },
      inferenceSpeed: {
        bertInference: { score: 0.9, metric: 'ms' },
        gptInference: { score: 14.0, metric: 'ms' },
        resnetInference: { score: 0.18, metric: 'ms' },
        batchThroughput: { score: 11000, metric: 'samples/s' },
      },
      trainingSpeed: {
        bertTraining: { score: 7200, metric: 'samples/s' },
        gptTraining: { score: 105000, metric: 'tokens/s' },
        resnetTraining: { score: 12500, metric: 'images/s' },
        distributedScaling: { score: 88, metric: 'efficiency' },
      },
      energyEfficiency: {
        powerConsumption: { score: 750, metric: 'W' },
        performancePerWatt: { score: 1.74, metric: 'TFLOPS/W' },
        thermalDesign: { score: 78, metric: '°C' },
      },
      costEfficiency: {
        pricePerfRatio: { score: 1.15, metric: 'ratio' },
        tcoEstimate: { score: 32000, metric: 'USD/year' },
        roiScore: { score: 85, metric: 'score' },
      },
    },
    trend: [82, 84, 86, 88, 89, 90],
    capabilities: ['FP32', 'FP16', 'INT8', 'CDNA 3', 'Infinity Fabric', 'ROCm'],
    testedAt: '2024-03-15 10:00:00',
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
    status: 'tested',
    specs: {
      memory: 64,
      memoryType: 'HBM2e',
      tdp: 310,
      process: '7nm+',
      cores: 128,
      frequency: '2.6 GHz',
      bandwidth: '1.6 TB/s',
      interconnect: 'HCCS',
    },
    scores: {
      overall: 82,
      computePerformance: 80,
      memoryPerformance: 78,
      inferenceSpeed: 81,
      trainingSpeed: 79,
      energyEfficiency: 88,
      costEfficiency: 92,
    },
    subTaskScores: {
      computePerformance: {
        fp32Performance: { score: 32.0, metric: 'TFLOPS' },
        fp16Performance: { score: 512.0, metric: 'TFLOPS' },
        int8Performance: { score: 1024.0, metric: 'TOPS' },
        matrixMultiplication: { score: 256.0, metric: 'TFLOPS' },
      },
      memoryPerformance: {
        memoryBandwidth: { score: 1600, metric: 'GB/s' },
        memoryLatency: { score: 60, metric: 'ns' },
        hbmCapacity: { score: 64, metric: 'GB' },
      },
      inferenceSpeed: {
        bertInference: { score: 1.5, metric: 'ms' },
        gptInference: { score: 22.0, metric: 'ms' },
        resnetInference: { score: 0.32, metric: 'ms' },
        batchThroughput: { score: 6500, metric: 'samples/s' },
      },
      trainingSpeed: {
        bertTraining: { score: 4200, metric: 'samples/s' },
        gptTraining: { score: 68000, metric: 'tokens/s' },
        resnetTraining: { score: 8000, metric: 'images/s' },
        distributedScaling: { score: 85, metric: 'efficiency' },
      },
      energyEfficiency: {
        powerConsumption: { score: 310, metric: 'W' },
        performancePerWatt: { score: 1.65, metric: 'TFLOPS/W' },
        thermalDesign: { score: 65, metric: '°C' },
      },
      costEfficiency: {
        pricePerfRatio: { score: 1.45, metric: 'ratio' },
        tcoEstimate: { score: 22000, metric: 'USD/year' },
        roiScore: { score: 92, metric: 'score' },
      },
    },
    trend: [75, 77, 79, 80, 81, 82],
    capabilities: ['FP32', 'FP16', 'INT8', '达芬奇架构', 'HCCS', 'MindSpore'],
    testedAt: '2024-03-15 10:00:00',
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
    status: 'tested',
    specs: {
      memory: 48,
      memoryType: 'HBM2',
      tdp: 250,
      process: '7nm',
      cores: 96,
      frequency: '2.2 GHz',
      bandwidth: '1.2 TB/s',
      interconnect: 'MLU-Link',
    },
    scores: {
      overall: 75,
      computePerformance: 72,
      memoryPerformance: 70,
      inferenceSpeed: 78,
      trainingSpeed: 68,
      energyEfficiency: 85,
      costEfficiency: 90,
    },
    subTaskScores: {
      computePerformance: {
        fp32Performance: { score: 24.0, metric: 'TFLOPS' },
        fp16Performance: { score: 384.0, metric: 'TFLOPS' },
        int8Performance: { score: 768.0, metric: 'TOPS' },
        matrixMultiplication: { score: 192.0, metric: 'TFLOPS' },
      },
      memoryPerformance: {
        memoryBandwidth: { score: 1200, metric: 'GB/s' },
        memoryLatency: { score: 70, metric: 'ns' },
        hbmCapacity: { score: 48, metric: 'GB' },
      },
      inferenceSpeed: {
        bertInference: { score: 1.8, metric: 'ms' },
        gptInference: { score: 28.0, metric: 'ms' },
        resnetInference: { score: 0.45, metric: 'ms' },
        batchThroughput: { score: 5000, metric: 'samples/s' },
      },
      trainingSpeed: {
        bertTraining: { score: 3200, metric: 'samples/s' },
        gptTraining: { score: 52000, metric: 'tokens/s' },
        resnetTraining: { score: 6000, metric: 'images/s' },
        distributedScaling: { score: 80, metric: 'efficiency' },
      },
      energyEfficiency: {
        powerConsumption: { score: 250, metric: 'W' },
        performancePerWatt: { score: 1.54, metric: 'TFLOPS/W' },
        thermalDesign: { score: 62, metric: '°C' },
      },
      costEfficiency: {
        pricePerfRatio: { score: 1.35, metric: 'ratio' },
        tcoEstimate: { score: 18000, metric: 'USD/year' },
        roiScore: { score: 90, metric: 'score' },
      },
    },
    trend: [68, 70, 72, 73, 74, 75],
    capabilities: ['FP32', 'FP16', 'INT8', 'MLU架构', 'MLU-Link', 'BANG'],
    testedAt: '2024-03-15 10:00:00',
    firmware: 'v1.0.0',
    driver: 'CNToolkit 4.0',
    strengths: ['国产自主', '低功耗', '推理优化'],
    weaknesses: ['训练能力弱', '生态待发展'],
    recommendations: ['适合推理场景', '推荐用于边缘部署'],
  },
];

export const acceleratorComparisonResults: AcceleratorComparisonResult[] = [
  {
    id: 'acc-comp-001',
    name: '高端训练卡对比',
    description: 'NVIDIA H100 vs A100 vs AMD MI300X 训练性能对比',
    createdAt: '2024-03-15 10:30:00',
    updatedAt: '2024-03-15 10:30:00',
    createdBy: '张三',
    creatorId: 'user-001',
    cards: [acceleratorCards[0], acceleratorCards[1], acceleratorCards[2]],
    dimensionWeights: {
      computePerformance: 25,
      memoryPerformance: 20,
      inferenceSpeed: 15,
      trainingSpeed: 25,
      energyEfficiency: 10,
      costEfficiency: 5,
    },
    overallAnalysis: {
      bestCard: 'NVIDIA H100',
      worstCard: 'NVIDIA A100',
      summary: 'H100在综合性能上表现最佳，MI300X凭借超大显存在大模型场景有优势，A100性价比最高。',
    },
    dimensionAnalysis: [
      {
        dimension: '计算性能',
        bestCard: 'NVIDIA H100',
        worstCard: 'NVIDIA A100',
        avgScore: 91.7,
        stdDev: 6.5,
        analysis: 'H100在FP16和INT8计算上领先明显，MI300X在FP32上有优势。',
      },
      {
        dimension: '内存性能',
        bestCard: 'AMD MI300X',
        worstCard: 'NVIDIA A100',
        avgScore: 94.7,
        stdDev: 4.0,
        analysis: 'MI300X凭借192GB HBM3显存和5.3TB/s带宽遥遥领先。',
      },
    ],
    advantageAnalysis: [
      {
        cardName: 'NVIDIA H100',
        advantages: ['最强算力', '成熟生态', '软件支持完善'],
        disadvantages: ['功耗高', '价格昂贵'],
        recommendedScenarios: ['大规模训练', 'LLM推理', '高性能计算'],
        matchScore: 95,
      },
      {
        cardName: 'AMD MI300X',
        advantages: ['超大显存', '高带宽', '性价比优'],
        disadvantages: ['生态较新', '软件支持待完善'],
        recommendedScenarios: ['大模型推理', '显存密集型任务'],
        matchScore: 88,
      },
      {
        cardName: 'NVIDIA A100',
        advantages: ['性价比高', '成熟稳定', '生态完善'],
        disadvantages: ['算力相对较低', '带宽受限'],
        recommendedScenarios: ['中小规模训练', '推理部署', '成本敏感场景'],
        matchScore: 85,
      },
    ],
    tags: ['训练性能', '高端卡', '综合对比'],
    category: '训练对比',
    isPublic: false,
    isStarred: true,
    version: 1,
  },
  {
    id: 'acc-comp-002',
    name: '国产加速卡对比',
    description: '华为昇腾910B vs 寒武纪MLU370 国产化方案对比',
    createdAt: '2024-03-14 15:20:00',
    updatedAt: '2024-03-14 15:20:00',
    createdBy: '李四',
    creatorId: 'user-002',
    cards: [acceleratorCards[3], acceleratorCards[4]],
    dimensionWeights: {
      computePerformance: 20,
      memoryPerformance: 15,
      inferenceSpeed: 25,
      trainingSpeed: 15,
      energyEfficiency: 15,
      costEfficiency: 10,
    },
    overallAnalysis: {
      bestCard: '华为昇腾910B',
      worstCard: '寒武纪MLU370',
      summary: '昇腾910B在综合性能上领先，MLU370在推理场景有优势。',
    },
    dimensionAnalysis: [
      {
        dimension: '计算性能',
        bestCard: '华为昇腾910B',
        worstCard: '寒武纪MLU370',
        avgScore: 76.0,
        stdDev: 4.0,
        analysis: '昇腾910B在FP16计算上领先约30%。',
      },
    ],
    advantageAnalysis: [
      {
        cardName: '华为昇腾910B',
        advantages: ['性能更强', '生态更完善', '支持训练'],
        disadvantages: ['功耗稍高', '价格稍高'],
        recommendedScenarios: ['国产化训练', '端侧部署', '推理服务'],
        matchScore: 85,
      },
      {
        cardName: '寒武纪MLU370',
        advantages: ['功耗低', '推理优化', '成本低'],
        disadvantages: ['训练能力弱', '生态待发展'],
        recommendedScenarios: ['推理场景', '边缘部署', '成本敏感场景'],
        matchScore: 78,
      },
    ],
    tags: ['国产化', '推理性能', '成本对比'],
    category: '国产对比',
    isPublic: true,
    isStarred: false,
    version: 1,
  },
];

export const acceleratorTags = [
  '训练性能',
  '推理性能',
  '高端卡',
  '国产化',
  '成本对比',
  '能效对比',
  '内存性能',
  '分布式',
];

export const acceleratorCategories = [
  '训练对比',
  '推理对比',
  '国产对比',
  '能效对比',
  '成本对比',
];

export const vendorOptions = [
  'NVIDIA',
  'AMD',
  '华为',
  '寒武纪',
  '英特尔',
  '壁仞',
  '燧原',
];

export const memoryTypeOptions = [
  'HBM3',
  'HBM2e',
  'HBM2',
  'GDDR6',
  'GDDR6X',
];
