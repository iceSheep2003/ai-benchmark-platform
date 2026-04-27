export interface SelectedAcceleratorTaskInput {
  id: string;
  title: string;
  tests: string[];
  datasets: string[];
}

export interface SelectedOfflineTestInput {
  id: string;
  title: string;
  enabled: boolean;
  subItems: {
    label: string;
    value: string;
    selected?: string[];
  }[];
}

export interface AcceleratorConfigBuildInput {
  taskName: string;
  accelerator: string;
  tasks: SelectedAcceleratorTaskInput[];
  offlineTests: SelectedOfflineTestInput[];
}

const TEST_METRIC_MAP: Record<string, string> = {
  training_throughput: 'throughput',
  inference_latency: 'latency',
  memory_utilization: 'memory_utilization',
  peak_power: 'peak_power',
  avg_power: 'avg_power',
  temperature: 'temperature',
  long_running: 'stability',
  stress_test: 'stability',
  framework_compatibility: 'compatibility',
  driver_compatibility: 'compatibility',
  system_compatibility: 'compatibility',
  fp32_precision: 'precision',
  fp16_precision: 'precision',
  bf16_precision: 'precision',
  int8_precision: 'precision',
};

export const buildAcceleratorBenchmarkConfig = ({
  taskName,
  accelerator,
  tasks,
  offlineTests,
}: AcceleratorConfigBuildInput) => {
  const selectedMetrics = Array.from(
    new Set(
      tasks.flatMap((task) => task.tests).map((test) => TEST_METRIC_MAP[test] || test)
    )
  );

  return {
    type: 'opencompass-accelerator',
    schema_version: '0.1',
    name: taskName,
    work_dir: `outputs/${taskName.replace(/\s+/g, '_').toLowerCase()}`,
    accelerator: {
      card_model: accelerator,
      driver_version: '535.104',
      runtime: 'cuda',
      cuda_version: '12.2',
    },
    workloads: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      tests: task.tests,
      datasets: task.datasets,
      infer_cfg: {
        runner: 'LocalRunner',
        batch_size: 1,
      },
      eval_cfg: {
        metrics: task.tests.map((test) => TEST_METRIC_MAP[test] || test),
      },
    })),
    offline_checks: offlineTests
      .filter((test) => test.enabled)
      .map((test) => ({
        id: test.id,
        title: test.title,
        dimensions: test.subItems.map((item) => ({
          key: item.value,
          label: item.label,
          selected: item.selected || [],
        })),
      })),
    execution: {
      runner: 'LocalRunner',
      partitioner: 'NaivePartitioner',
      max_num_workers: 1,
      retry: 1,
    },
    summarizer: {
      type: 'DefaultSummarizer',
      metrics: selectedMetrics,
    },
  };
};
