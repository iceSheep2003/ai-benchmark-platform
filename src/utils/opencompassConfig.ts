export interface SelectedCapabilityInput {
  id: string;
  title: string;
  tests: string[];
  datasets: string[];
}

export interface OpenCompassConfigBuildInput {
  taskName: string;
  model: string;
  version: string;
  capabilities: SelectedCapabilityInput[];
}

const MODEL_META: Record<string, { name: string; backend: 'local' | 'api'; type: string }> = {
  qwen: { name: 'Qwen', backend: 'local', type: 'HuggingFacewithChatTemplate' },
  deepseek: { name: 'DeepSeek', backend: 'local', type: 'HuggingFacewithChatTemplate' },
  gpt4: { name: 'OpenAI', backend: 'api', type: 'OpenAI' },
  doubao: { name: 'Doubao', backend: 'api', type: 'OpenAI' },
  ernie: { name: 'ERNIE', backend: 'api', type: 'OpenAI' },
};

const resolveModelMeta = (model: string) => {
  const key = model.toLowerCase();
  if (MODEL_META[key]) {
    return MODEL_META[key];
  }
  if (key.includes('gpt') || key.includes('doubao') || key.includes('ernie') || key.includes('claude')) {
    return { name: model, backend: 'api' as const, type: 'OpenAI' };
  }
  if (key.includes('qwen') || key.includes('deepseek') || key.includes('llama')) {
    return { name: model, backend: 'local' as const, type: 'HuggingFacewithChatTemplate' };
  }
  return { name: model, backend: 'local' as const, type: 'HuggingFacewithChatTemplate' };
};

const DATASET_META: Record<string, { type: string; inferencer: string; evaluator: string }> = {
  mmlu: { type: 'MMLUDataset', inferencer: 'GenInferencer', evaluator: 'AccEvaluator' },
  gsm8k: { type: 'GSM8KDataset', inferencer: 'GenInferencer', evaluator: 'EMEvaluator' },
  humaneval: { type: 'HumanEvalDataset', inferencer: 'GenInferencer', evaluator: 'PassAtKEvaluator' },
  mbpp: { type: 'MBPPDataset', inferencer: 'GenInferencer', evaluator: 'PassAtKEvaluator' },
  boolq: { type: 'BoolQDataset', inferencer: 'PPLInferencer', evaluator: 'AccEvaluator' },
  squad: { type: 'SQuADDataset', inferencer: 'GenInferencer', evaluator: 'F1ScoreEvaluator' },
  xnli: { type: 'XNLIDataset', inferencer: 'PPLInferencer', evaluator: 'AccEvaluator' },
};

const DEFAULT_DATASET_META = {
  type: 'GenericGenerationDataset',
  inferencer: 'GenInferencer',
  evaluator: 'AccEvaluator',
};

const normalizeDatasetSelection = (capabilities: SelectedCapabilityInput[]) => {
  const map = new Map<string, { capabilityIds: string[]; tests: string[] }>();

  capabilities.forEach((cap) => {
    const datasets = cap.datasets.length > 0 ? cap.datasets : [`${cap.id}_default`];
    datasets.forEach((dataset) => {
      const existing = map.get(dataset) || { capabilityIds: [], tests: [] };
      map.set(dataset, {
        capabilityIds: Array.from(new Set([...existing.capabilityIds, cap.id])),
        tests: Array.from(new Set([...existing.tests, ...cap.tests])),
      });
    });
  });

  return Array.from(map.entries()).map(([datasetAbbr, meta]) => ({
    datasetAbbr,
    ...meta,
  }));
};

export const buildOpenCompassLikeConfig = ({
  taskName,
  model,
  version,
  capabilities,
}: OpenCompassConfigBuildInput) => {
  const modelMeta = resolveModelMeta(model);
  const datasetSelections = normalizeDatasetSelection(capabilities);
  const hasApiModel = modelMeta.backend === 'api';

  return {
    type: 'opencompass',
    schema_version: '0.4',
    name: taskName,
    work_dir: `outputs/${taskName.replace(/\s+/g, '_').toLowerCase()}`,
    models: [
      {
        type: modelMeta.type,
        abbr: `${modelMeta.name}-${version}`,
        path: version,
        backend: modelMeta.backend,
        max_out_len: 2048,
        batch_size: hasApiModel ? 1 : 8,
        run_cfg: {
          num_gpus: hasApiModel ? 0 : 1,
        },
        generation_kwargs: {
          temperature: 0,
          top_p: 1,
        },
      },
    ],
    datasets: datasetSelections.map((selection) => {
      const dsMeta = DATASET_META[selection.datasetAbbr] || DEFAULT_DATASET_META;
      return {
        abbr: selection.datasetAbbr,
        type: dsMeta.type,
        capability_ids: selection.capabilityIds,
        selected_tests: selection.tests,
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
            type: dsMeta.inferencer,
          },
        },
        eval_cfg: {
          evaluator: {
            type: dsMeta.evaluator,
          },
        },
      };
    }),
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
      summary_groups: capabilities.map((cap) => cap.id),
    },
  };
};
