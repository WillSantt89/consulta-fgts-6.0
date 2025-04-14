import { useState, useEffect } from 'react';
import { BatchItem } from '../types';

export const useApiData = (url: string) => {
  const [apiData, setApiData] = useState<BatchItem[]>([]);
  const [apiDataLoading, setApiDataLoading] = useState<boolean>(true);
  const [apiDataError, setApiDataError] = useState<string | null>(null);

  const fetchApiData = async () => {
    setApiDataLoading(true);
    setApiDataError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch API data: ${response.status} ${response.statusText}`);
      }
      const data: BatchItem[] = await response.json();
      setApiData(data);
    } catch (error: any) {
      setApiDataError(error.message);
    } finally {
      setApiDataLoading(false);
    }
  };

  useEffect(() => {
    fetchApiData();
  }, [url]);

  return { apiData, apiDataLoading, apiDataError, fetchApiData };
};
