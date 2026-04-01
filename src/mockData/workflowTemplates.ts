import type { WorkflowDefinition } from '../types/workflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  workflow: WorkflowDefinition;
}

export const mockWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'template_llm_training',
    name: 'LLM Training Template',
    description: 'Complete workflow for training large language models with data loading, resource allocation, model inference, evaluation, and reporting',
    category: 'Training',
    tags: ['LLM', 'Training', 'GPU'],
    workflow: {
      version: '1.0',
      metadata: {
        name: 'LLM Training Workflow',
        description: 'Complete LLM training pipeline with evaluation',
        author: 'System',
        tags: ['training', 'llm', 'gpu'],
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      },
      globals: {
        batch_size: 32,
        learning_rate: 0.001,
        max_epochs: 10,
      },
      nodes: [
        {
          id: 'node_1',
          type: 'data_loader',
          position: { x: 100, y: 100 },
          data: {
            label: 'Data Loader',
            icon: 'database',
            config: {
              datasetName: 'wikitext-103',
              batchSize: 32,
              shuffle: true,
              numWorkers: 4,
              prefetchFactor: 2,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_2',
          type: 'resource_alloc',
          position: { x: 400, y: 100 },
          data: {
            label: 'Resource Allocation',
            icon: 'cluster',
            config: {
              cardModel: 'NVIDIA A100',
              gpuCount: 4,
              memoryLimit: 80,
              cpuCount: 32,
              enableMixedPrecision: true,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_3',
          type: 'model_inference',
          position: { x: 700, y: 100 },
          data: {
            label: 'Model Training',
            icon: 'code',
            config: {
              modelName: 'gpt-2-medium',
              precision: 'FP16',
              temperature: 0.7,
              maxTokens: 1024,
              estimatedMinutes: 120,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_4',
          type: 'evaluator',
          position: { x: 1000, y: 100 },
          data: {
            label: 'Model Evaluation',
            icon: 'check-circle',
            config: {
              metrics: ['perplexity', 'loss', 'accuracy'],
              validationDataset: 'wikitext-103-test',
              checkpointPath: '/checkpoints/best.pt',
            },
            status: 'pending',
          },
        },
        {
          id: 'node_5',
          type: 'reporter',
          position: { x: 1300, y: 100 },
          data: {
            label: 'Report Generator',
            icon: 'file-text',
            config: {
              format: 'JSON',
              outputPath: '/reports/training_results.json',
              includeCharts: true,
              exportMetrics: true,
            },
            status: 'pending',
          },
        },
      ],
      edges: [
        {
          id: 'edge_1',
          source: 'node_1',
          target: 'node_2',
          label: 'data',
        },
        {
          id: 'edge_2',
          source: 'node_2',
          target: 'node_3',
          label: 'resources',
        },
        {
          id: 'edge_3',
          source: 'node_3',
          target: 'node_4',
          label: 'model',
        },
        {
          id: 'edge_4',
          source: 'node_4',
          target: 'node_5',
          label: 'results',
        },
      ],
      executionConfig: {
        timeoutSeconds: 7200,
        retryCount: 3,
        parallelism: 2,
      },
    },
  },
  {
    id: 'template_inference_benchmark',
    name: 'Inference Benchmark Template',
    description: 'Benchmark workflow for model inference performance testing with multiple precision modes',
    category: 'Benchmark',
    tags: ['Inference', 'Benchmark', 'Performance'],
    workflow: {
      version: '1.0',
      metadata: {
        name: 'Inference Benchmark Workflow',
        description: 'Multi-precision inference benchmarking',
        author: 'System',
        tags: ['inference', 'benchmark', 'performance'],
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
      },
      globals: {
        input_size: 512,
        num_iterations: 100,
      },
      nodes: [
        {
          id: 'node_1',
          type: 'data_loader',
          position: { x: 100, y: 200 },
          data: {
            label: 'Test Data Loader',
            icon: 'database',
            config: {
              datasetName: 'synthetic-test-data',
              batchSize: 1,
              inputSize: 512,
              numSamples: 1000,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_2',
          type: 'resource_alloc',
          position: { x: 400, y: 100 },
          data: {
            label: 'FP16 Resources',
            icon: 'cluster',
            config: {
              cardModel: 'NVIDIA V100',
              gpuCount: 2,
              memoryLimit: 32,
              enableMixedPrecision: true,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_3',
          type: 'resource_alloc',
          position: { x: 400, y: 300 },
          data: {
            label: 'INT8 Resources',
            icon: 'cluster',
            config: {
              cardModel: 'NVIDIA V100',
              gpuCount: 2,
              memoryLimit: 32,
              enableMixedPrecision: false,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_4',
          type: 'model_inference',
          position: { x: 700, y: 100 },
          data: {
            label: 'FP16 Inference',
            icon: 'code',
            config: {
              modelName: 'bert-base-uncased',
              precision: 'FP16',
              temperature: 1.0,
              maxTokens: 512,
              estimatedMinutes: 30,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_5',
          type: 'model_inference',
          position: { x: 700, y: 300 },
          data: {
            label: 'INT8 Inference',
            icon: 'code',
            config: {
              modelName: 'bert-base-uncased',
              precision: 'INT8',
              temperature: 1.0,
              maxTokens: 512,
              estimatedMinutes: 30,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_6',
          type: 'evaluator',
          position: { x: 1000, y: 200 },
          data: {
            label: 'Performance Evaluator',
            icon: 'check-circle',
            config: {
              metrics: ['latency', 'throughput', 'accuracy', 'memory_usage'],
              baselinePath: '/baselines/standard.json',
              tolerancePercent: 5,
            },
            status: 'pending',
          },
        },
        {
          id: 'node_7',
          type: 'reporter',
          position: { x: 1300, y: 200 },
          data: {
            label: 'Benchmark Report',
            icon: 'file-text',
            config: {
              format: 'YAML',
              outputPath: '/reports/benchmark_results.yaml',
              includeCharts: true,
              exportMetrics: true,
              generateComparison: true,
            },
            status: 'pending',
          },
        },
      ],
      edges: [
        {
          id: 'edge_1',
          source: 'node_1',
          target: 'node_4',
          label: 'test_data',
        },
        {
          id: 'edge_2',
          source: 'node_1',
          target: 'node_5',
          label: 'test_data',
        },
        {
          id: 'edge_3',
          source: 'node_2',
          target: 'node_4',
          label: 'resources',
        },
        {
          id: 'edge_4',
          source: 'node_3',
          target: 'node_5',
          label: 'resources',
        },
        {
          id: 'edge_5',
          source: 'node_4',
          target: 'node_6',
          label: 'fp16_results',
        },
        {
          id: 'edge_6',
          source: 'node_5',
          target: 'node_6',
          label: 'int8_results',
        },
        {
          id: 'edge_7',
          source: 'node_6',
          target: 'node_7',
          label: 'evaluation',
        },
      ],
      executionConfig: {
        timeoutSeconds: 3600,
        retryCount: 2,
        parallelism: 4,
      },
    },
  },
];