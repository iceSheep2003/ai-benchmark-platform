import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import acceleratorService from '../services/acceleratorService';
import {
  Accelerator,
  AcceleratorListParams,
  PaginatedResponse,
} from '../types/apiTypes';

interface UseAcceleratorsResult {
  accelerators: Accelerator[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  fetchAccelerators: (params?: AcceleratorListParams) => Promise<void>;
  refreshAccelerators: () => Promise<void>;
}

export const useAccelerators = (initialParams?: AcceleratorListParams): UseAcceleratorsResult => {
  const [accelerators, setAccelerators] = useState<Accelerator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialParams?.page || 1);
  const [pageSize, setPageSize] = useState(initialParams?.pageSize || 10);
  const [lastParams, setLastParams] = useState<AcceleratorListParams | undefined>(initialParams);

  const fetchAccelerators = useCallback(async (params?: AcceleratorListParams) => {
    setLoading(true);
    setError(null);

    try {
      const requestParams = params || lastParams || {};
      const response = await acceleratorService.getAccelerators(requestParams);

      if (response.code === 200 && response.data) {
        const data = response.data as PaginatedResponse<Accelerator>;
        setAccelerators(data.items);
        setTotal(data.total);
        setPage(data.page);
        setPageSize(data.pageSize);
        setLastParams(requestParams);
      } else {
        setError(response.message || '获取加速卡列表失败');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '网络请求失败';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [lastParams]);

  const refreshAccelerators = useCallback(async () => {
    await fetchAccelerators(lastParams);
  }, [fetchAccelerators, lastParams]);

  useEffect(() => {
    fetchAccelerators(initialParams);
  }, []);

  return {
    accelerators,
    loading,
    error,
    total,
    page,
    pageSize,
    fetchAccelerators,
    refreshAccelerators,
  };
};

interface UseAcceleratorResult {
  accelerator: Accelerator | null;
  loading: boolean;
  error: string | null;
  fetchAccelerator: (id: string) => Promise<void>;
}

export const useAccelerator = (): UseAcceleratorResult => {
  const [accelerator, setAccelerator] = useState<Accelerator | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccelerator = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await acceleratorService.getAccelerator(id);

      if (response.code === 200 && response.data) {
        setAccelerator(response.data);
      } else {
        setError(response.message || '获取加速卡详情失败');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '网络请求失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    accelerator,
    loading,
    error,
    fetchAccelerator,
  };
};

export default useAccelerators;
