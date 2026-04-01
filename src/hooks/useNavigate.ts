import { useCallback } from 'react';
import { useAppStore } from '../store/appStore';

export const useNavigate = () => {
  const { setCurrentPage } = useAppStore();

  const navigate = useCallback((page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, [setCurrentPage]);

  return navigate;
};