import type { BenchmarkTask, FlameGraphNode, PerformanceMetrics, ComparisonResult } from '../types';

export const generateMockTasks = (): BenchmarkTask[] => {
  const tasks: BenchmarkTask[] = [];
  const models = ['Llama-2-7B', 'Llama-2-13B', 'Mistral-7B', 'GPT-J-6B'];
  const datasets = ['Wikipedia', 'BookCorpus', 'CommonCrawl', 'C4'];
  const accelerators = ['NVIDIA H100', 'NVIDIA A100', 'NVIDIA V100', 'NVIDIA RTX 4090'];
  const users = [
    { name: 'Admin User', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' },
    { name: 'Developer A', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DevA' },
    { name: 'Researcher B', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ResB' },
    { name: 'Engineer C', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EngC' },
  ];
  
  const llmModels = ['GPT-4', 'Claude-3', 'Gemini-Pro', 'Qwen-72B', 'Baichuan2-13B'];
  const llmCapabilities = [
    { id: 'language_understanding', title: '语言理解', tests: ['reading_comprehension', 'semantic_analysis'] },
    { id: 'logic_reasoning', title: '逻辑推理', tests: ['math_problem_solving', 'logical_deduction'] },
    { id: 'text_generation', title: '文本生成', tests: ['text_generation', 'creative_expression'] },
    { id: 'knowledge_qa', title: '知识问答', tests: ['fact_qa', 'knowledge_reasoning'] },
    { id: 'code_ability', title: '代码能力', tests: ['code_generation', 'code_understanding'] },
    { id: 'multilingual_ability', title: '多语言能力', tests: ['multilingual_understanding', 'machine_translation'] },
  ];
  
  for (let i = 0; i < 12; i++) {
    const model = models[i % models.length];
    const dataset = datasets[i % datasets.length];
    const accelerator = accelerators[i % accelerators.length];
    const user = users[i % users.length];
    const status: BenchmarkTask['status'] = i < 8 ? 'SUCCESS' : (i < 10 ? 'RUNNING' : 'PENDING');
    
    const baseThroughput = accelerator === 'NVIDIA H100' ? 120 : 
                        accelerator === 'NVIDIA A100' ? 90 :
                        accelerator === 'NVIDIA V100' ? 60 : 30;
    
    const baseLatency = accelerator === 'NVIDIA H100' ? 15 :
                      accelerator === 'NVIDIA A100' ? 20 :
                      accelerator === 'NVIDIA V100' ? 30 : 50;
    
    const metrics = status === 'SUCCESS' ? Array.from({ length: 10 }, (_, j) => ({
      timestamp: Date.now() - (10 - j) * 60000,
      throughput: baseThroughput + Math.random() * 20 - 10,
      latency_p99: baseLatency + Math.random() * 10 - 5,
      gpu_util: 0.85 + Math.random() * 0.1,
      memory_bandwidth: 800 + Math.random() * 200,
    })) : undefined;
    
    tasks.push({
      id: `task-${i + 1}`,
      name: `${model} on ${dataset} - ${accelerator}`,
      type: 'hardware',
      status,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      createdBy: user.name,
      createdByAvatar: user.avatar,
      workflowId: `workflow-${model.toLowerCase().replace(/-/g, '')}`,
      resources: {
        cardModel: accelerator,
        driverVersion: '535.104',
        cudaVersion: '12.2',
      },
      dataLineage: {
        datasetName: dataset,
        datasetVersionHash: `hash-${dataset.toLowerCase()}-${Math.random().toString(36).substring(2, 10)}`,
        modelWeightHash: `hash-${model.toLowerCase().replace(/-/g, '')}-${Math.random().toString(36).substring(2, 10)}`,
      },
      priority: i < 3 ? 'P0' : i < 6 ? 'P1' : 'P2',
      estimatedStartTime: new Date(Date.now() - i * 3600000 + 300000).toISOString(),
      queuePosition: i + 1,
      resourceRequest: {
        gpuType: accelerator,
        count: accelerator === 'NVIDIA H100' ? 4 : accelerator === 'NVIDIA A100' ? 2 : 1,
        memoryGB: accelerator === 'NVIDIA H100' ? 80 : accelerator === 'NVIDIA A100' ? 40 : 20,
      },
      checkpointConfig: {
        enabled: true,
        intervalSteps: 100,
      },
      checkpoints: status === 'SUCCESS' ? Array.from({ length: 5 }, (_, j) => ({
        id: `checkpoint-${i}-${j}`,
        step: (j + 1) * 100,
        timestamp: new Date(Date.now() - i * 3600000 + (j + 1) * 600000).toISOString(),
        filePath: `/checkpoints/task-${i + 1}/checkpoint_step_${(j + 1) * 100}.pt`,
        fileSizeMB: Math.floor(Math.random() * 5000) + 1000,
        isValid: true,
      })) : [],
      metrics,
      flameGraphData: status === 'SUCCESS' ? generateMockFlameGraph(accelerator) : undefined,
    });
  }
  
  for (let i = 12; i < 20; i++) {
    const llmModel = llmModels[i % llmModels.length];
    const user = users[i % users.length];
    const status: BenchmarkTask['status'] = i < 16 ? 'SUCCESS' : (i < 18 ? 'RUNNING' : 'PENDING');
    
    const selectedCapabilities = llmCapabilities.slice(0, 2 + (i % 3));
    
    tasks.push({
      id: `task-${i + 1}`,
      name: `${llmModel} 综合能力评测`,
      type: 'llm',
      status,
      createdAt: new Date(Date.now() - (i - 12) * 3600000).toISOString(),
      createdBy: user.name,
      createdByAvatar: user.avatar,
      workflowId: 'llm-evaluation',
      llmConfig: {
        model: llmModel,
        version: 'v1.0',
        capabilities: selectedCapabilities.map(cap => ({
          id: cap.id,
          title: cap.title,
          tests: cap.tests,
          datasets: ['dataset1', 'dataset2']
        }))
      },
      priority: i < 14 ? 'P0' : i < 16 ? 'P1' : 'P2',
      estimatedStartTime: new Date(Date.now() - (i - 12) * 3600000 + 300000).toISOString(),
      queuePosition: i - 11,
    });
  }
  
  const acceleratorModels = [
    { id: 'nvidia-a100', name: 'NVIDIA A100', icon: '🟢' },
    { id: 'nvidia-v100', name: 'NVIDIA V100', icon: '🟢' },
    { id: 'nvidia-h100', name: 'NVIDIA H100', icon: '🟢' },
    { id: 'huawei-910b', name: '华为昇腾 910B', icon: '🔴' },
    { id: 'hygon-k100', name: '海光 K100', icon: '🔵' },
    { id: 'maxx-c500', name: '沐曦 C500', icon: '🟡' },
    { id: 'maxx-c650', name: '沐曦 C650', icon: '🟡' },
    { id: 'kunlun-480', name: '昆仑芯 480', icon: '🟣' },
  ];
  
  const taskDimensions = [
    {
      id: 'performance',
      title: '性能测试',
      tests: ['training_throughput', 'inference_latency', 'memory_utilization'],
      datasets: ['deepspark_multi', 'mnist', 'imagenet'],
    },
    {
      id: 'power',
      title: '功耗测试',
      tests: ['peak_power', 'avg_power', 'temperature'],
      datasets: ['mlperf', 'specpower'],
    },
    {
      id: 'stability',
      title: '稳定性测试',
      tests: ['long_running', 'stress_test'],
      datasets: ['deepspark_stability'],
    },
    {
      id: 'compatibility',
      title: '兼容性测试',
      tests: ['framework_compatibility', 'driver_compatibility', 'system_compatibility'],
      datasets: ['pytorch_compat', 'tensorflow_compat', 'mindspore_compat'],
    },
    {
      id: 'precision',
      title: '精度测试',
      tests: ['fp32_precision', 'fp16_precision', 'bf16_precision', 'int8_precision'],
      datasets: ['precision_benchmark', 'mlperf_precision'],
    },
  ];
  
  const offlineTests = [
    {
      id: 'functional',
      title: '功能测试',
      enabled: true,
      subItems: [
        { label: '深度学习框架支持', value: 'framework_support', selected: ['PyTorch', 'TensorFlow'] },
        { label: '算子库支持', value: 'operator_support', selected: ['CUDA'] },
      ],
    },
    {
      id: 'compatibility',
      title: '兼容性测试',
      enabled: true,
      subItems: [
        { label: '操作系统', value: 'os', selected: ['Ubuntu 20.04', 'Ubuntu 22.04'] },
        { label: '驱动版本', value: 'driver', selected: ['535.x'] },
      ],
    },
    {
      id: 'reliability',
      title: '可靠性测试',
      enabled: false,
      subItems: [
        { label: '故障类型', value: 'fault_type', selected: ['内存错误', '计算错误'] },
        { label: '恢复策略', value: 'recovery', selected: ['自动重启'] },
      ],
    },
  ];
  
  for (let i = 20; i < 30; i++) {
    const accelerator = acceleratorModels[i % acceleratorModels.length];
    const user = users[i % users.length];
    const status: BenchmarkTask['status'] = i < 24 ? 'SUCCESS' : (i < 27 ? 'RUNNING' : 'PENDING');
    
    const selectedTaskDimensions = taskDimensions.slice(0, 2 + (i % 3));
    const selectedOfflineTests = offlineTests.slice(0, 1 + (i % 2));
    
    tasks.push({
      id: `task-${i + 1}`,
      name: `${accelerator.name} 综合性能评测`,
      type: 'accelerator',
      status,
      createdAt: new Date(Date.now() - (i - 20) * 3600000).toISOString(),
      createdBy: user.name,
      createdByAvatar: user.avatar,
      workflowId: 'accelerator-evaluation',
      resources: {
        cardModel: accelerator.id,
        driverVersion: '535.104',
        cudaVersion: '12.2',
      },
      acceleratorConfig: {
        accelerator: accelerator.id,
        tasks: selectedTaskDimensions.map(dim => ({
          id: dim.id,
          title: dim.title,
          tests: dim.tests,
          datasets: dim.datasets,
        })),
        offlineTests: selectedOfflineTests.map(test => ({
          id: test.id,
          title: test.title,
          enabled: test.enabled,
          subItems: test.subItems,
        })),
      },
    });
  }
  
  return tasks;
};

export const generateMockFlameGraph = (accelerator: string): FlameGraphNode => {
  const baseTime = accelerator === 'NVIDIA H100' ? 1000 :
                  accelerator === 'NVIDIA A100' ? 1200 :
                  accelerator === 'NVIDIA V100' ? 1500 : 2000;
  
  return {
    name: 'Total Execution',
    value: baseTime,
    color: '#ff6b6b',
    children: [
      {
        name: 'Data Loading',
        value: baseTime * 0.15,
        color: '#feca57',
        children: [
          {
            name: 'File I/O',
            value: baseTime * 0.08,
            color: '#48dbfb',
          },
          {
            name: 'Preprocessing',
            value: baseTime * 0.07,
            color: '#1dd1a1',
          },
        ],
      },
      {
        name: 'Model Inference',
        value: baseTime * 0.75,
        color: '#5f9ea0',
        children: [
          {
            name: 'Attention Layers',
            value: baseTime * 0.35,
            color: '#ff9ff3',
            children: [
              {
                name: 'QKV Projection',
                value: baseTime * 0.12,
                color: '#54a0ff',
              },
              {
                name: 'Attention Computation',
                value: baseTime * 0.18,
                color: '#5f27cd',
              },
              {
                name: 'Output Projection',
                value: baseTime * 0.05,
                color: '#00d2d3',
              },
            ],
          },
          {
            name: 'Feed-Forward Networks',
            value: baseTime * 0.25,
            color: '#ff6b6b',
            children: [
              {
                name: 'Linear Transformations',
                value: baseTime * 0.15,
                color: '#ee5a24',
              },
              {
                name: 'Activation Functions',
                value: baseTime * 0.10,
                color: '#f79f1f',
              },
            ],
          },
          {
            name: 'Layer Normalization',
            value: baseTime * 0.15,
            color: '#c8d6e5',
          },
        ],
      },
      {
        name: 'Post-processing',
        value: baseTime * 0.10,
        color: '#a29bfe',
        children: [
          {
            name: 'Output Formatting',
            value: baseTime * 0.05,
            color: '#6c5ce7',
          },
          {
            name: 'Tokenization',
            value: baseTime * 0.05,
            color: '#00cec9',
          },
        ],
      },
    ],
  };
};

export const generateMockComparisonResult = (taskIds: string[]): ComparisonResult => {
  const dimensions = [
    { name: 'Throughput', scores: {} as Record<string, number> },
    { name: 'Latency (p99)', scores: {} as Record<string, number> },
    { name: 'GPU Utilization', scores: {} as Record<string, number> },
    { name: 'Memory Bandwidth', scores: {} as Record<string, number> },
  ];
  
  taskIds.forEach((taskId, index) => {
    const acceleratorIndex = index % 4;
    const baseThroughput = acceleratorIndex === 0 ? 120 : 
                        acceleratorIndex === 1 ? 90 :
                        acceleratorIndex === 2 ? 60 : 30;
    
    const baseLatency = acceleratorIndex === 0 ? 15 :
                      acceleratorIndex === 1 ? 20 :
                      acceleratorIndex === 2 ? 30 : 50;
    
    dimensions[0].scores[taskId] = baseThroughput + Math.random() * 20 - 10;
    dimensions[1].scores[taskId] = baseLatency + Math.random() * 10 - 5;
    dimensions[2].scores[taskId] = 0.85 + Math.random() * 0.1;
    dimensions[3].scores[taskId] = 800 + Math.random() * 200;
  });
  
  const costPerformanceRatio: Record<string, number> = {};
  taskIds.forEach((taskId, index) => {
    const throughput = dimensions[0].scores[taskId];
    const cost = index % 4 === 0 ? 4 : index % 4 === 1 ? 2 : index % 4 === 2 ? 1 : 0.5;
    costPerformanceRatio[taskId] = throughput / cost;
  });
  
  const winner = Object.entries(costPerformanceRatio).reduce((a, b) => 
    b[1] > a[1] ? b : a
  )[0];
  
  return {
    taskIdList: taskIds,
    dimensions,
    summary: {
      winner,
      costPerformanceRatio,
    },
  };
};

export const generateMockPerformanceMetrics = (taskId: string): PerformanceMetrics[] => {
  return Array.from({ length: 20 }, (_, i) => ({
    taskId,
    timestamp: Date.now() - (20 - i) * 30000,
    throughput: 100 + Math.random() * 40 - 20,
    latency_p99: 20 + Math.random() * 10 - 5,
    gpu_util: 0.8 + Math.random() * 0.15,
    memory_bandwidth: 750 + Math.random() * 150,
    energy_consumption: 300 + Math.random() * 100,
    cost_per_token: 0.001 + Math.random() * 0.0005,
  }));
};

export const mockTasks = generateMockTasks();
export const mockFlameGraphData = generateMockFlameGraph('NVIDIA H100');
export const mockComparisonResult = generateMockComparisonResult(
  mockTasks.slice(0, 4).map(t => t.id)
);