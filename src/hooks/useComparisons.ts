import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import acceleratorService from '../services/acceleratorService';
import {
  Comparison,
  ComparisonListParams,
  PaginatedResponse,
  CreateComparisonRequest,
} from '../types/apiTypes';

interface UseComparisonsResult {
  comparisons: Comparison[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  fetchComparisons: (params?: ComparisonListParams) => Promise<void>;
  refreshComparisons: () => Promise<void>;
  starComparison: (id: string) => Promise<void>;
  unstarComparison: (id: string) => Promise<void>;
  deleteComparison: (id: string) => Promise<void>;
}

export const useComparisons = (initialParams?: ComparisonListParams): UseComparisonsResult => {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialParams?.page || 1);
  const [pageSize, setPageSize] = useState(initialParams?.pageSize || 10);
  const [lastParams, setLastParams] = useState<ComparisonListParams | undefined>(initialParams);

  const fetchComparisons = useCallback(async (params?: ComparisonListParams) => {
    setLoading(true);
    setError(null);

    try {
      const requestParams = params || lastParams || {};
      const response = await acceleratorService.getComparisons(requestParams);

      if (response.code === 200 && response.data) {
        const data = response.data as PaginatedResponse<Comparison>;
        setComparisons(data.items);
        setTotal(data.total);
        setPage(data.page);
        setPageSize(data.pageSize);
        setLastParams(requestParams);
      } else {
        setError(response.message || '获取对比列表失败');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '网络请求失败';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [lastParams]);

  const refreshComparisons = useCallback(async () => {
    await fetchComparisons(lastParams);
  }, [fetchComparisons, lastParams]);

  const starComparison = useCallback(async (id: string) => {
    try {
      const response = await acceleratorService.starComparison(id);
      if (response.code === 200) {
        message.success('收藏成功');
        await refreshComparisons();
      } else {
        message.error(response.message || '收藏失败');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '收藏失败');
    }
  }, [refreshComparisons]);

  const unstarComparison = useCallback(async (id: string) => {
    try {
      const response = await acceleratorService.unstarComparison(id);
      if (response.code === 200) {
        message.success('取消收藏成功');
        await refreshComparisons();
      } else {
        message.error(response.message || '取消收藏失败');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '取消收藏失败');
    }
  }, [refreshComparisons]);

  const deleteComparison = useCallback(async (id: string) => {
    try {
      const response = await acceleratorService.deleteComparison(id);
      if (response.code === 200) {
        message.success('删除成功');
        await refreshComparisons();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || '删除失败');
    }
  }, [refreshComparisons]);

  useEffect(() => {
    fetchComparisons(initialParams);
  }, []);

  return {
    comparisons,
    loading,
    error,
    total,
    page,
    pageSize,
    fetchComparisons,
    refreshComparisons,
    starComparison,
    unstarComparison,
    deleteComparison,
  };
};

interface UseComparisonResult {
  comparison: Comparison | null;
  loading: boolean;
  error: string | null;
  fetchComparison: (id: string) => Promise<void>;
  createComparison: (data: CreateComparisonRequest) => Promise<Comparison | null>;
}

export const useComparison = (): UseComparisonResult => {
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await acceleratorService.getComparison(id);

      if (response.code === 200 && response.data) {
        setComparison(response.data);
      } else {
        setError(response.message || '获取对比详情失败');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '网络请求失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createComparison = useCallback(async (data: CreateComparisonRequest): Promise<Comparison | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await acceleratorService.createComparison(data);

      if (response.code === 201 && response.data) {
        message.success('创建对比分析成功');
        return response.data;
      } else {
        setError(response.message || '创建对比分析失败');
        message.error(response.message || '创建对比分析失败');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '网络请求失败';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    comparison,
    loading,
    error,
    fetchComparison,
    createComparison,
  };
};

export default useComparisons;
