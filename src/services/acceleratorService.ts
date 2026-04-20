import apiClient from './apiClient';
import {
  ApiResponse,
  PaginatedResponse,
  Accelerator,
  AcceleratorListParams,
  CreateAcceleratorRequest,
  UpdateAcceleratorRequest,
  AcceleratorTest,
  TestListParams,
  CreateTestRequest,
  UpdateTestStatusRequest,
  CancelTestRequest,
  TestMetricsParams,
  TestMetricPoint,
  Comparison,
  ComparisonListParams,
  CreateComparisonRequest,
  TrendParams,
  TrendResponse,
} from '../types/apiTypes';

export const acceleratorService = {
  async getAccelerators(params?: AcceleratorListParams): Promise<ApiResponse<PaginatedResponse<Accelerator>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.vendor) queryParams.append('vendor', params.vendor);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    return apiClient.get<PaginatedResponse<Accelerator>>(`/accelerators?${queryParams.toString()}`);
  },

  async getAccelerator(id: string): Promise<ApiResponse<Accelerator>> {
    return apiClient.get<Accelerator>(`/accelerators/${id}`);
  },

  async createAccelerator(data: CreateAcceleratorRequest): Promise<ApiResponse<Accelerator>> {
    return apiClient.post<Accelerator>('/accelerators', data);
  },

  async updateAccelerator(id: string, data: UpdateAcceleratorRequest): Promise<ApiResponse<Accelerator>> {
    return apiClient.put<Accelerator>(`/accelerators/${id}`, data);
  },

  async deleteAccelerator(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/accelerators/${id}`);
  },

  async getAcceleratorTests(
    acceleratorId: string,
    params?: TestListParams
  ): Promise<ApiResponse<PaginatedResponse<AcceleratorTest>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    return apiClient.get<PaginatedResponse<AcceleratorTest>>(
      `/accelerators/${acceleratorId}/tests?${queryParams.toString()}`
    );
  },

  async createTest(acceleratorId: string, data: CreateTestRequest): Promise<ApiResponse<AcceleratorTest>> {
    return apiClient.post<AcceleratorTest>(`/accelerators/${acceleratorId}/tests`, data);
  },

  async getTest(testId: string): Promise<ApiResponse<AcceleratorTest>> {
    return apiClient.get<AcceleratorTest>(`/tests/${testId}`);
  },

  async updateTestStatus(testId: string, data: UpdateTestStatusRequest): Promise<ApiResponse<AcceleratorTest>> {
    return apiClient.patch<AcceleratorTest>(`/tests/${testId}/status`, data);
  },

  async cancelTest(testId: string, data?: CancelTestRequest): Promise<ApiResponse<AcceleratorTest>> {
    return apiClient.post<AcceleratorTest>(`/tests/${testId}/cancel`, data);
  },

  async getTestMetrics(testId: string, params?: TestMetricsParams): Promise<ApiResponse<TestMetricPoint[]>> {
    const queryParams = new URLSearchParams();
    
    if (params?.start_time) queryParams.append('start_time', params.start_time);
    if (params?.end_time) queryParams.append('end_time', params.end_time);
    if (params?.interval) queryParams.append('interval', params.interval);
    
    return apiClient.get<TestMetricPoint[]>(`/tests/${testId}/metrics?${queryParams.toString()}`);
  },

  async getAcceleratorTrend(
    acceleratorId: string,
    params: TrendParams
  ): Promise<ApiResponse<TrendResponse>> {
    const queryParams = new URLSearchParams();
    
    queryParams.append('metric_type', params.metric_type);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.interval) queryParams.append('interval', params.interval);
    
    return apiClient.get<TrendResponse>(
      `/accelerators/${acceleratorId}/metrics/trend?${queryParams.toString()}`
    );
  },

  async getComparisons(params?: ComparisonListParams): Promise<ApiResponse<PaginatedResponse<Comparison>>> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.is_starred !== undefined) queryParams.append('is_starred', params.is_starred.toString());
    if (params?.created_by_me !== undefined) queryParams.append('created_by_me', params.created_by_me.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    return apiClient.get<PaginatedResponse<Comparison>>(`/comparisons?${queryParams.toString()}`);
  },

  async getComparison(id: string): Promise<ApiResponse<Comparison>> {
    return apiClient.get<Comparison>(`/comparisons/${id}`);
  },

  async createComparison(data: CreateComparisonRequest): Promise<ApiResponse<Comparison>> {
    return apiClient.post<Comparison>('/comparisons', data);
  },

  async starComparison(id: string): Promise<ApiResponse<Comparison>> {
    return apiClient.post<Comparison>(`/comparisons/${id}/star`);
  },

  async unstarComparison(id: string): Promise<ApiResponse<Comparison>> {
    return apiClient.delete<Comparison>(`/comparisons/${id}/star`);
  },

  async deleteComparison(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/comparisons/${id}`);
  },
};

export default acceleratorService;
