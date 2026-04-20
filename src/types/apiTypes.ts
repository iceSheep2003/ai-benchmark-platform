export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface AcceleratorScores {
  overall: number;
  compute: number;
  memory: number;
  bandwidth: number;
  power_efficiency: number;
  stability?: number;
  compatibility?: number;
}

export interface AcceleratorMetrics {
  fp32_tflops?: number;
  fp16_tflops?: number;
  int8_tops?: number;
  memory_bandwidth_gbps?: number;
  power_consumption_w?: number;
  thermal_design_power_w?: number;
}

export interface AcceleratorSpecifications {
  cuda_cores?: number;
  tensor_cores?: number;
  base_clock_mhz?: number;
  boost_clock_mhz?: number;
  process_nm?: number;
  transistors_billion?: number;
  die_size_mm2?: number;
}

export interface AcceleratorTestSummary {
  total_tests: number;
  successful_tests: number;
  failed_tests: number;
  last_test_at?: string;
}

export interface Accelerator {
  id: string;
  name: string;
  vendor: string;
  model: string;
  memory_gb: number;
  compute_capability?: string;
  architecture?: string;
  status: 'pending' | 'testing' | 'tested';
  scores: AcceleratorScores;
  metrics: AcceleratorMetrics;
  specifications?: AcceleratorSpecifications;
  test_summary?: AcceleratorTestSummary;
  tags?: string[];
  description?: string;
  created_at: string;
  updated_at: string;
  created_by?: User;
}

export interface AcceleratorListParams {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'testing' | 'tested';
  vendor?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAcceleratorRequest {
  name: string;
  vendor: string;
  model: string;
  memory_gb: number;
  compute_capability?: string;
  architecture?: string;
  description?: string;
  specifications?: AcceleratorSpecifications;
  tags?: string[];
}

export interface UpdateAcceleratorRequest {
  name?: string;
  description?: string;
  tags?: string[];
}

export interface ResourceRequest {
  gpu_count: number;
  memory_gb: number;
  node_type?: string;
}

export interface ResourceUsage {
  actual_gpu_count: number;
  node_id: string;
  node_name?: string;
  allocated_at?: string;
}

export interface TestResults {
  throughput?: number;
  throughput_unit?: string;
  latency_p50?: number;
  latency_p99?: number;
  latency_unit?: string;
  errors?: number;
  error_rate?: number;
  gpu_utilization_avg?: number;
  gpu_utilization_max?: number;
  gpu_utilization_min?: number;
  memory_utilization_avg?: number;
  memory_utilization_max?: number;
  memory_utilization_min?: number;
  power_consumption_avg?: number;
  power_consumption_max?: number;
  power_consumption_min?: number;
  temperature_avg?: number;
  temperature_max?: number;
  temperature_min?: number;
}

export interface AcceleratorTest {
  id: string;
  accelerator_id: string;
  accelerator?: Accelerator;
  name: string;
  type: 'performance' | 'power' | 'stability' | 'compatibility';
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  config: Record<string, any>;
  resource_request?: ResourceRequest;
  resource_usage?: ResourceUsage;
  results?: TestResults;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  error_message?: string;
  created_at: string;
  created_by?: User;
}

export interface TestListParams {
  page?: number;
  pageSize?: number;
  status?: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  type?: 'performance' | 'power' | 'stability' | 'compatibility';
}

export interface CreateTestRequest {
  name: string;
  type: 'performance' | 'power' | 'stability' | 'compatibility';
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  config: Record<string, any>;
  resource_request?: ResourceRequest;
}

export interface UpdateTestStatusRequest {
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  message?: string;
}

export interface CancelTestRequest {
  reason?: string;
}

export interface TestMetricsParams {
  start_time?: string;
  end_time?: string;
  interval?: '1s' | '5s' | '10s' | '1m';
}

export interface TestMetricPoint {
  timestamp: string;
  throughput?: number;
  latency_p50?: number;
  latency_p99?: number;
  gpu_utilization?: number;
  memory_utilization?: number;
  power_consumption?: number;
  temperature?: number;
}

export interface ComparisonDimensions {
  [dimension: string]: {
    [acceleratorId: string]: number;
  };
}

export interface ComparisonSummary {
  winner: string;
  winner_name: string;
  cost_performance_ratio: Record<string, number>;
  improvement_percentage: Record<string, number>;
  recommendation?: string;
}

export interface Comparison {
  id: string;
  name: string;
  description?: string;
  accelerator_ids: string[];
  accelerators?: Accelerator[];
  dimensions: ComparisonDimensions;
  summary: ComparisonSummary;
  is_starred: boolean;
  tags?: string[];
  created_at: string;
  updated_at?: string;
  created_by?: User;
}

export interface ComparisonListParams {
  page?: number;
  pageSize?: number;
  is_starred?: boolean;
  created_by_me?: boolean;
  search?: string;
}

export interface CreateComparisonRequest {
  name: string;
  description?: string;
  accelerator_ids: string[];
  comparison_config?: {
    dimensions?: string[];
    metrics?: string[];
    workloads?: string[];
  };
  tags?: string[];
}

export interface TrendDataPoint {
  date: string;
  value: number;
  test_count: number;
}

export interface TrendStatistics {
  avg: number;
  max: number;
  min: number;
  std_dev: number;
}

export interface TrendResponse {
  accelerator_id: string;
  metric_type: string;
  unit: string;
  data_points: TrendDataPoint[];
  statistics: TrendStatistics;
}

export interface TrendParams {
  metric_type: 'throughput' | 'latency' | 'gpu_utilization' | 'memory_utilization' | 'power_consumption';
  start_date?: string;
  end_date?: string;
  interval?: 'day' | 'week' | 'month';
}

export interface WebSocketMessage {
  type: 'metrics_update' | 'status_update' | 'progress_update' | 'error_occurred' | 'test_completed';
  test_id: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface ApiError {
  code: number;
  message: string;
  error?: {
    type: string;
    code?: number;
    details?: string | Record<string, any>;
  };
}
