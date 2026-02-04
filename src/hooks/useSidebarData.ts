import { useState, useEffect, useCallback } from 'react';
import { getBrands, getQueries, getStats, getReports, getSavedInsights, getResultsPaginated } from '../services/api';
import type { Brand, MonitoredQuery, Stats, Report, TestResult } from '../types';
import type { SavedInsight } from '../services/api';

export interface SidebarData {
  // 통계
  stats: Stats | null;
  // 브랜드
  brands: Brand[];
  // 쿼리
  queries: MonitoredQuery[];
  // 리포트
  reports: Report[];
  // 인사이트
  insights: SavedInsight[];
  // 테스트 결과
  results: TestResult[];
  // 로딩 상태
  isLoading: boolean;
  // 에러
  error: string | null;
  // 새로고침
  refresh: () => Promise<void>;
  // 결과 페이지네이션
  resultsHasMore: boolean;
  resultsTotal: number;
  loadMoreResults: () => Promise<void>;
  isLoadingMore: boolean;
}

const RESULTS_PER_PAGE = 20;

export function useSidebarData(): SidebarData {
  const [stats, setStats] = useState<Stats | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [insights, setInsights] = useState<SavedInsight[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 결과 페이지네이션 상태
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsHasMore, setResultsHasMore] = useState(false);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, brandsData, queriesData, reportsData, insightsData, resultsData] = await Promise.all([
        getStats().catch(() => null),
        getBrands().catch(() => ({ brands: [] })),
        getQueries().catch(() => ({ queries: [] })),
        getReports().catch(() => ({ reports: [] })),
        getSavedInsights().catch(() => ({ insights: [] })),
        getResultsPaginated(1, RESULTS_PER_PAGE).catch(() => ({ results: [], total: 0, page: 1, limit: RESULTS_PER_PAGE, hasMore: false })),
      ]);

      if (statsData) setStats(statsData);
      setBrands(brandsData.brands);
      setQueries(queriesData.queries);
      setReports(reportsData.reports);
      setInsights(insightsData.insights);
      setResults(resultsData.results);
      setResultsPage(1);
      setResultsHasMore(resultsData.hasMore);
      setResultsTotal(resultsData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreResults = useCallback(async () => {
    if (isLoadingMore || !resultsHasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = resultsPage + 1;
      const data = await getResultsPaginated(nextPage, RESULTS_PER_PAGE);
      setResults(prev => [...prev, ...data.results]);
      setResultsPage(nextPage);
      setResultsHasMore(data.hasMore);
      setResultsTotal(data.total);
    } catch (err) {
      console.error('Failed to load more results:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, resultsHasMore, resultsPage]);

  useEffect(() => {
    loadData();
  }, []);

  return {
    stats,
    brands,
    queries,
    reports,
    insights,
    results,
    isLoading,
    error,
    refresh: loadData,
    resultsHasMore,
    resultsTotal,
    loadMoreResults,
    isLoadingMore,
  };
}
