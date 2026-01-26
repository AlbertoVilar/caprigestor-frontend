// src/hooks/useFarms.ts
import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext';
import type { PaginatedResponse } from '../types/api';
import type { GoatFarmFullResponse } from '../types/farmTypes';

interface UseFarmsOptions {
  page?: number;
  size?: number;
  search?: string;
  autoLoad?: boolean;
}

interface UseFarmsReturn {
  farms: GoatFarmFullResponse[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  totalElements: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  loadFarms: () => Promise<void>;
  searchFarms: (searchTerm: string) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFarms = (options: UseFarmsOptions = {}): UseFarmsReturn => {
  const {
    page = 0,
    size = 10,
    search = '',
    autoLoad = true
  } = options;

  const { farmService } = useApi();
  const [farms, setFarms] = useState<GoatFarmFullResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(page);
  const [searchTerm, setSearchTerm] = useState(search);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadFarms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: PaginatedResponse<GoatFarmFullResponse> = await farmService.getFarms(
        currentPage,
        size,
        searchTerm || undefined
      );
      
      setFarms(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar fazendas');
      setFarms([]);
    } finally {
      setLoading(false);
    }
  }, [farmService, currentPage, size, searchTerm]);

  const searchFarms = useCallback(async (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(0); // Reset to first page when searching
  }, []);

  const goToPage = useCallback(async (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  const refresh = useCallback(async () => {
    await loadFarms();
  }, [loadFarms]);

  // Load farms when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadFarms();
    }
  }, [loadFarms, autoLoad]);

  // Update current page when search term changes
  useEffect(() => {
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  }, [searchTerm]);

  return {
    farms,
    loading,
    error,
    totalPages,
    totalElements,
    currentPage,
    hasNextPage: currentPage < totalPages - 1,
    hasPreviousPage: currentPage > 0,
    loadFarms,
    searchFarms,
    goToPage,
    refresh,
  };
};
