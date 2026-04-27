import type { ConfigTemplate } from '../types/config';

export const mockTemplates: ConfigTemplate[] = [
  {
    id: 'tpl-001',
    name: 'LLM-Baseline-H100',
    description: 'Baseline benchmark configuration for H100 with FP16 precision',
    tags: ['baseline', 'H100', 'FP16'],
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-15T14:30:00Z',
    versions: [
      {
        versionId: 'ver-001-1',
        versionNumber: '1.0',
        content: JSON.stringify({
          type: 'opencompass',
          schema_version: '0.4',
          name: 'LLM-Baseline-H100',
          description: 'Baseline benchmark configuration',
          work_dir: 'outputs/llm-baseline-h100',
          models: [{
            type: 'HuggingFacewithChatTemplate',
            abbr: 'Qwen3',
            path: 'qwen3',
            backend: 'local',
            max_out_len: 2048,
            batch_size: 8,
            run_cfg: { num_gpus: 1 },
            generation_kwargs: { temperature: 0, top_p: 1 },
          }],
          datasets: [{
            abbr: 'mmlu',
            type: 'MMLUDataset',
            capability_ids: ['logic_reasoning'],
            selected_tests: ['logical_deduction'],
            reader_cfg: { test_range: '[:100]' },
            infer_cfg: {
              retriever: { type: 'ZeroRetriever' },
              inferencer: { type: 'GenInferencer' },
              prompt_template: { type: 'PromptTemplate', template: '{question}' },
            },
            eval_cfg: {
              evaluator: { type: 'AccEvaluator' },
            },
          }],
          infer: {
            partitioner: { type: 'NaivePartitioner' },
            runner: { type: 'LocalRunner', max_num_workers: 1 },
            task: { type: 'OpenICLInferTask' },
          },
          eval: {
            partitioner: { type: 'NaivePartitioner' },
            runner: { type: 'LocalRunner', max_num_workers: 1 },
            task: { type: 'OpenICLEvalTask' },
          },
          summarizer: {
            type: 'DefaultSummarizer',
            summary_groups: ['logic_reasoning'],
          },
        }, null, 2),
        format: 'json',
        changeLog: 'Initial version',
        author: 'admin',
        createdAt: '2024-03-10T10:00:00Z',
      },
      {
        versionId: 'ver-001-2',
        versionNumber: '1.1',
        content: JSON.stringify({
          type: 'opencompass',
          schema_version: '0.4',
          name: 'LLM-Baseline-H100',
          description: 'Baseline benchmark configuration',
          work_dir: 'outputs/llm-baseline-h100-v11',
          models: [{
            type: 'HuggingFacewithChatTemplate',
            abbr: 'Qwen3',
            path: 'qwen3',
            backend: 'local',
            max_out_len: 2048,
            batch_size: 16,
            run_cfg: { num_gpus: 1 },
            generation_kwargs: { temperature: 0, top_p: 1 },
          }],
          datasets: [{
            abbr: 'mmlu',
            type: 'MMLUDataset',
            capability_ids: ['logic_reasoning'],
            selected_tests: ['logical_deduction', 'common_sense_reasoning'],
            reader_cfg: { test_range: '[:200]' },
            infer_cfg: {
              retriever: { type: 'ZeroRetriever' },
              inferencer: { type: 'GenInferencer' },
              prompt_template: { type: 'PromptTemplate', template: '{question}' },
            },
            eval_cfg: {
              evaluator: { type: 'AccEvaluator' },
            },
          }],
          infer: {
            partitioner: { type: 'NaivePartitioner' },
            runner: { type: 'LocalRunner', max_num_workers: 2 },
            task: { type: 'OpenICLInferTask' },
          },
          eval: {
            partitioner: { type: 'NaivePartitioner' },
            runner: { type: 'LocalRunner', max_num_workers: 2 },
            task: { type: 'OpenICLEvalTask' },
          },
          summarizer: {
            type: 'DefaultSummarizer',
            summary_groups: ['logic_reasoning'],
          },
        }, null, 2),
        format: 'json',
        changeLog: 'Increased batch_size and worker concurrency',
        author: 'admin',
        createdAt: '2024-03-15T14:30:00Z',
      },
    ],
  },
  {
    id: 'tpl-002',
    name: 'INT8-Optimization-910B',
    description: 'INT8 quantized model benchmark on Huawei 910B',
    tags: ['optimization', '910B', 'INT8'],
    createdAt: '2024-03-12T08:00:00Z',
    updatedAt: '2024-03-14T16:45:00Z',
    versions: [
      {
        versionId: 'ver-002-1',
        versionNumber: '1.0',
        content: JSON.stringify({
          type: 'opencompass',
          schema_version: '0.4',
          name: 'INT8-Optimization-910B',
          description: 'INT8 quantized benchmark',
          work_dir: 'outputs/int8-optimization-910b',
          models: [{
            type: 'HuggingFacewithChatTemplate',
            abbr: 'Qwen2.5-72B-Instruct',
            path: 'qwen2.5-72b-instruct',
            backend: 'local',
            max_out_len: 1024,
            batch_size: 8,
            run_cfg: { num_gpus: 2 },
            generation_kwargs: { temperature: 0, top_p: 1 },
          }],
          datasets: [{
            abbr: 'gsm8k',
            type: 'GSM8KDataset',
            capability_ids: ['logic_reasoning'],
            selected_tests: ['math_problem_solving'],
            reader_cfg: { test_range: '[:500]' },
            infer_cfg: {
              retriever: { type: 'ZeroRetriever' },
              inferencer: { type: 'GenInferencer' },
              prompt_template: { type: 'PromptTemplate', template: '{question}' },
            },
            eval_cfg: {
              evaluator: { type: 'EMEvaluator' },
            },
          }],
          infer: {
            partitioner: { type: 'NaivePartitioner' },
            runner: { type: 'LocalRunner', max_num_workers: 2 },
            task: { type: 'OpenICLInferTask' },
          },
          eval: {
            partitioner: { type: 'NaivePartitioner' },
            runner: { type: 'LocalRunner', max_num_workers: 2 },
            task: { type: 'OpenICLEvalTask' },
          },
          summarizer: {
            type: 'DefaultSummarizer',
            summary_groups: ['logic_reasoning'],
          },
        }, null, 2),
        format: 'json',
        changeLog: 'Initial version with INT8 quantization',
        author: 'admin',
        createdAt: '2024-03-12T08:00:00Z',
      },
    ],
  },
  {
    id: 'tpl-003',
    name: 'Multi-GPU-Training',
    description: 'Training configuration with tensor parallelism',
    tags: ['training', 'multi-gpu', 'A100'],
    createdAt: '2024-03-08T09:00:00Z',
    updatedAt: '2024-03-13T11:20:00Z',
    versions: [
      {
        versionId: 'ver-003-1',
        versionNumber: '1.0',
        content: JSON.stringify({
          type: 'opencompass',
          schema_version: '0.4',
          name: 'Multi-GPU-Training',
          description: 'Multi-GPU benchmark configuration',
          work_dir: 'outputs/multi-gpu-benchmark',
          models: [{
            type: 'HuggingFacewithChatTemplate',
            abbr: 'Qwen3-235B-A2B',
            path: 'qwen3-235b-a2b-thinking-2507',
            backend: 'local',
            max_out_len: 1024,
            batch_size: 4,
            run_cfg: { num_gpus: 4 },
            generation_kwargs: { temperature: 0, top_p: 1 },
          }],
          datasets: [{
            abbr: 'humaneval',
            type: 'HumanEvalDataset',
            capability_ids: ['code_ability'],
            selected_tests: ['code_generation', 'code_debugging'],
            reader_cfg: { test_range: '[:164]' },
            infer_cfg: {
              retriever: { type: 'ZeroRetriever' },
              inferencer: { type: 'GenInferencer' },
              prompt_template: { type: 'PromptTemplate', template: '{question}' },
            },
            eval_cfg: {
              evaluator: { type: 'PassAtKEvaluator' },
            },
          }],
          infer: {
            partitioner: { type: 'NaivePartitioner' },
            runner: { type: 'LocalRunner', max_num_workers: 4 },
            task: { type: 'OpenICLInferTask' },
          },
          eval: {
            partitioner: { type: 'NaivePartitioner' },
            runner: { type: 'LocalRunner', max_num_workers: 4 },
            task: { type: 'OpenICLEvalTask' },
          },
          summarizer: {
            type: 'DefaultSummarizer',
            summary_groups: ['code_ability'],
          },
        }, null, 2),
        format: 'json',
        changeLog: 'Initial multi-GPU benchmark setup',
        author: 'admin',
        createdAt: '2024-03-08T09:00:00Z',
      },
    ],
  },
];

export const defaultTemplateContent = JSON.stringify({
  type: 'opencompass',
  schema_version: '0.4',
  name: 'New Configuration',
  description: '',
  work_dir: 'outputs/new-configuration',
  models: [{
    type: 'HuggingFacewithChatTemplate',
    abbr: 'Qwen3',
    path: 'qwen3',
    backend: 'local',
    max_out_len: 2048,
    batch_size: 8,
    run_cfg: {
      num_gpus: 1,
    },
    generation_kwargs: {
      temperature: 0,
      top_p: 1,
    },
  }],
  datasets: [{
    abbr: 'mmlu',
    type: 'MMLUDataset',
    capability_ids: ['logic_reasoning'],
    selected_tests: ['logical_deduction'],
    reader_cfg: {
      test_range: '[:100]',
    },
    infer_cfg: {
      prompt_template: {
        type: 'PromptTemplate',
        template: '{question}',
      },
      retriever: {
        type: 'ZeroRetriever',
      },
      inferencer: {
        type: 'GenInferencer',
      },
    },
    eval_cfg: {
      evaluator: {
        type: 'AccEvaluator',
      },
    },
  }],
  infer: {
    partitioner: {
      type: 'NaivePartitioner',
    },
    runner: {
      type: 'LocalRunner',
      max_num_workers: 1,
    },
    task: {
      type: 'OpenICLInferTask',
    },
  },
  eval: {
    partitioner: {
      type: 'NaivePartitioner',
    },
    runner: {
      type: 'LocalRunner',
      max_num_workers: 1,
    },
    task: {
      type: 'OpenICLEvalTask',
    },
  },
  summarizer: {
    type: 'DefaultSummarizer',
    summary_groups: ['logic_reasoning'],
  },
}, null, 2);