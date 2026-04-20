import api from './api';

export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type AcceleratorBackend = 'huggingface' | 'vllm' | 'lmdeploy';

export type TestCategory =
  | 'chip_basic'
  | 'model_training'
  | 'model_inference'
  | 'model_accuracy'
  | 'ecosystem_compat'
  | 'video_codec';

export interface CreateTaskRequest {
  name: string;
  model_path: string;
  datasets: string[];
  backend: AcceleratorBackend;
  num_gpus: number;
  batch_size: number;
  max_out_len: number;
  priority: string;
}

export interface TaskMetrics {
  throughput: number | null;
  latency_avg_ms: number | null;
  latency_p99_ms: number | null;
  gpu_util_pct: number | null;
  gpu_memory_used_mb: number | null;
  gpu_memory_total_mb: number | null;
  power_watts: number | null;
  temperature_celsius: number | null;
  timestamp: number | null;
}

export interface DatasetScore {
  dataset: string;
  metric: string;
  score: number;
  details: Record<string, unknown>;
}

export interface TaskResult {
  scores: DatasetScore[];
  overall_score: number | null;
  total_time_seconds: number | null;
  peak_gpu_memory_mb: number | null;
  avg_throughput: number | null;
  backend_used: string | null;
  raw_summary: Record<string, unknown>;
}

export interface TaskResponse {
  id: string;
  name: string;
  status: TaskStatus;
  priority: string;
  backend: AcceleratorBackend;
  model_path: string;
  datasets: string[];
  num_gpus: number;
  batch_size: number;
  max_out_len: number;
  work_dir: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: string;
  metrics: TaskMetrics | null;
  result: TaskResult | null;
  error_message: string | null;
  log_tail: string[];
}

export interface GPUInfo {
  index: number;
  name: string;
  memory_total_mb: number;
  memory_used_mb: number;
  memory_free_mb: number;
  utilization_pct: number;
  temperature_celsius: number;
  power_watts: number;
  driver_version: string;
  cuda_version: string;
}

export interface SystemInfo {
  gpus: GPUInfo[];
  gpu_count: number;
  total_gpu_memory_mb: number;
  cpu_count: number;
  hostname: string;
}

export interface TestCaseCatalogItem {
  category: string;
  test_type: string;
  name: string;
  description: string;
  metric: string;
  default_config?: Record<string, unknown>;
}

export interface CreateTestRequest {
  name: string;
  category: TestCategory;
  test_type: string;
  config: Record<string, unknown>;
  num_gpus: number;
  description?: string;
}

export interface TestResultData {
  category: string;
  test_type: string;
  data: Record<string, unknown>;
  summary: string;
}

export interface TestTaskResponse {
  id: string;
  name: string;
  category: string;
  test_type: string;
  config: Record<string, unknown>;
  num_gpus: number;
  description: string | null;
  status: TaskStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  result: TestResultData | null;
  log_tail: string[];
}

export interface CategoryInfo {
  key: string;
  label: string;
}

export const acceleratorTaskApi = {
  create(req: CreateTaskRequest) {
    return api.post<TaskResponse>('/tasks', req);
  },

  list(params?: { status?: TaskStatus; limit?: number; offset?: number }) {
    return api.get<{ total: number; items: TaskResponse[] }>('/tasks', { params });
  },

  get(taskId: string) {
    return api.get<TaskResponse>(`/tasks/${taskId}`);
  },

  cancel(taskId: string) {
    return api.post<TaskResponse>(`/tasks/${taskId}/cancel`);
  },

  delete(taskId: string) {
    return api.delete(`/tasks/${taskId}`);
  },

  getLogs(taskId: string, tail = 100) {
    return api.get<{ task_id: string; lines: string[] }>(`/tasks/${taskId}/logs`, {
      params: { tail },
    });
  },

  getSystemInfo() {
    return api.get<SystemInfo>('/system/gpu-info');
  },

  healthCheck() {
    return api.get<{ status: string }>('/system/health');
  },
};

export const testCaseApi = {
  getCatalog(category?: string) {
    return api.get<{ total: number; items: TestCaseCatalogItem[] }>('/test-cases/catalog', {
      params: category ? { category } : undefined,
    });
  },

  getCategories() {
    return api.get<{ categories: CategoryInfo[] }>('/test-cases/categories');
  },

  create(req: CreateTestRequest) {
    return api.post<TestTaskResponse>('/test-cases', req);
  },

  list(params?: { category?: string; status?: TaskStatus; limit?: number; offset?: number }) {
    return api.get<{ total: number; items: TestTaskResponse[] }>('/test-cases', { params });
  },

  get(taskId: string) {
    return api.get<TestTaskResponse>(`/test-cases/${taskId}`);
  },

  cancel(taskId: string) {
    return api.post<TestTaskResponse>(`/test-cases/${taskId}/cancel`);
  },

  delete(taskId: string) {
    return api.delete(`/test-cases/${taskId}`);
  },

  getLogs(taskId: string, tail = 100) {
    return api.get<{ task_id: string; lines: string[] }>(`/test-cases/${taskId}/logs`, {
      params: { tail },
    });
  },
};
