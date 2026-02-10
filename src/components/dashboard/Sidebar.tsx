import { useState, useEffect, useCallback } from 'react';
import { ActionIcon, Badge, Box, Center, Divider, Group, Loader, Paper, Progress, ScrollArea, Skeleton, Stack, Switch, Text, Tooltip, UnstyledButton } from '@mantine/core';
import {
  IconChartBar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,

  IconFileDescription,
  IconCalendarEvent,
  IconMessageQuestion,
  IconPlayerPlay,
  IconSettings,
  IconTags,
  IconTrophy,
  IconX,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSidebarData, type SidebarData } from '../../hooks/useSidebarData';
import {
  getSchedulerStatus,
  startScheduler,
  stopScheduler,
  runScheduleNow,
  type SchedulerData,
} from '../../services/scheduler';
import { getQueries } from '../../services/queries';
import type { MonitoredQuery } from '../../types';
import { ReportListItem } from '../ui';

const trackerMenuItems = [
  { label: '브랜드', shortLabel: '브랜드', icon: IconTags, path: '/dashboard/brands' },
  { label: '쿼리 운영', shortLabel: '쿼리', icon: IconMessageQuestion, path: '/dashboard/query-ops' },
  { label: '성과 개요', shortLabel: '성과', icon: IconChartBar, path: '/dashboard/performance' },
  { label: '스케줄러', shortLabel: '스케줄', icon: IconCalendarEvent, path: '/dashboard/scheduler' },
  { label: '리포트/인사이트', shortLabel: '리포트', icon: IconFileDescription, path: '/dashboard/reports' },
];

const scoreMenuItems = [
  { label: 'GEO 스코어', shortLabel: '스코어', icon: IconTrophy, path: '/dashboard/score' },
];

function PanelSkeleton() {
  return (
    <Stack gap="sm">
      <Skeleton height={14} width="40%" />
      <Skeleton height={28} width="60%" />
      <Divider />
      <Skeleton height={48} />
      <Skeleton height={48} />
      <Skeleton height={48} />
    </Stack>
  );
}

function StatRow({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <Group justify="space-between">
      <Text size="sm" fw={500}>{label}</Text>
      <Group gap={4}>
        <Text size="sm" fw={600}>{value}</Text>
        {extra ? <Text size="sm" c="dimmed">{extra}</Text> : null}
      </Group>
    </Group>
  );
}

const SCHEDULE_LABELS: Record<string, string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
};

function SchedulerSidebarPanel() {
  const [schedulerData, setSchedulerData] = useState<SchedulerData | null>(null);
  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [runningType, setRunningType] = useState<'daily' | 'weekly' | 'monthly' | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sData, qData] = await Promise.all([getSchedulerStatus(), getQueries()]);
      setSchedulerData(sData);
      setQueries(qData.queries);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    setSchedulerLoading(true);
    try {
      if (schedulerData?.config.enabled) {
        const result = await stopScheduler();
        setSchedulerData(result.status);
      } else {
        const result = await startScheduler();
        setSchedulerData(result.status);
      }
      const fresh = await getSchedulerStatus();
      setSchedulerData(fresh);
    } catch {
      // silent
    } finally {
      setSchedulerLoading(false);
    }
  };

  const handleRunNow = async (type: 'daily' | 'weekly' | 'monthly') => {
    setRunningType(type);
    try {
      await runScheduleNow(type);
      const fresh = await getSchedulerStatus();
      setSchedulerData(fresh);
    } catch {
      // silent
    } finally {
      setRunningType(null);
    }
  };

  const getActiveQueryCount = (frequency: 'daily' | 'weekly' | 'monthly') =>
    queries.filter((q) => q.isActive && q.frequency === frequency).length;

  if (isLoading) return <PanelSkeleton />;
  if (!schedulerData) return <Text size="xs" c="dimmed">스케줄러 데이터 없음</Text>;

  const isEnabled = schedulerData.config.enabled;

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm" fw={600}>자동 스케줄링</Text>
        <Switch
          checked={isEnabled}
          onChange={handleToggle}
          disabled={schedulerLoading}
          size="sm"
        />
      </Group>

      <Divider />

      {(['daily', 'weekly', 'monthly'] as const).map((type) => {
        const count = getActiveQueryCount(type);
        const isRunning = runningType === type;

        return (
          <Stack key={type} gap="xs">
            <Group justify="space-between">
              <Group gap={8}>
                <Text size="sm" fw={500}>{SCHEDULE_LABELS[type]}</Text>
                <Text size="sm" c="dimmed">{count}개</Text>
              </Group>
              <UnstyledButton
                onClick={() => handleRunNow(type)}
                disabled={runningType !== null}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  opacity: runningType !== null && !isRunning ? 0.4 : 1,
                }}
              >
                {isRunning ? <Loader size={14} /> : <IconPlayerPlay size={14} color="var(--mantine-color-dimmed)" />}
                <Text size="sm" c="dimmed" fw={500}>실행</Text>
              </UnstyledButton>
            </Group>
            <Divider />
          </Stack>
        );
      })}
    </Stack>
  );
}

function getExpandedPanel(
  pathname: string,
  tab: string | null,
  data: SidebarData,
  options?: {
    onSelectResult?: (id: string) => void;
    selectedResultId?: string | null;
    onSelectReport?: (id: string) => void;
    selectedReportId?: string | null;
  },
): { title: string; content: ReactNode } {
  const { stats, brands, queries, reports, insights, results, isLoading, resultsTotal, reportsTotalCount, reportsHasMore, isLoadingMoreReports } = data;

  if (isLoading) {
    return { title: '로딩 중', content: <PanelSkeleton /> };
  }

  // 온보딩 진행 상태 표시
  const setupComplete = brands.length > 0 && queries.length > 0 && results.length > 0;
  const setupSteps = [brands.length > 0, queries.length > 0, results.length > 0];
  const setupDone = setupSteps.filter(Boolean).length;

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/performance')) {
    if (tab === 'visibility') {
      // 쿼리별 최신 결과 매핑: queryId → 최신 result
      const latestByQuery = new Map<string, typeof results[number]>();
      for (const r of results) {
        if (r.queryId && !latestByQuery.has(r.queryId)) {
          latestByQuery.set(r.queryId, r);
        }
      }

      // 테스트된 쿼리 목록 (최신 결과가 있는 쿼리)
      const testedQueries = queries.filter((q) => latestByQuery.has(q.id));
      // 아직 테스트되지 않은 쿼리
      const untestedQueries = queries.filter((q) => !latestByQuery.has(q.id));

      return {
        title: 'AI 가시성',
        content: (
          <Stack gap="xs">
            <StatRow label="Citation Rate" value={`${stats?.citationRate ?? 0}%`} />
            <Divider />
            <StatRow label="인용 / 전체" value={`${stats?.citedCount ?? 0} / ${stats?.totalTests ?? 0}`} />
            <Divider />
            {testedQueries.length === 0 ? (
              <Text size="xs" c="dimmed">테스트된 쿼리가 없습니다. 쿼리 운영에서 테스트를 실행하세요.</Text>
            ) : (
              <Stack gap={4}>
                {testedQueries.map((q) => {
                  const latestResult = latestByQuery.get(q.id)!;
                  const isSelected = options?.selectedResultId === latestResult.id;
                  return (
                    <UnstyledButton
                      key={q.id}
                      onClick={() => options?.onSelectResult?.(latestResult.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        borderRadius: 8,
                        padding: '6px 8px',
                        backgroundColor: isSelected ? 'var(--mantine-color-brand-0)' : 'transparent',
                        border: isSelected ? '1px solid var(--mantine-color-brand-3)' : '1px solid transparent',
                      }}
                    >
                      <Text size="xs" fw={isSelected ? 600 : 400} lineClamp={1}>{q.query}</Text>
                      <Group gap={4} mt={2}>
                        <Badge size="xs" color={latestResult.engine === 'gpt' ? 'teal' : 'blue'} variant="light">
                          {latestResult.engine === 'gpt' ? 'GPT' : 'Gemini'}
                        </Badge>
                        <Badge size="xs" color={latestResult.cited ? 'teal' : 'gray'} variant="light"
                          leftSection={latestResult.cited ? <IconCheck size={8} /> : <IconX size={8} />}
                        >
                          {latestResult.cited ? '인용' : '미인용'}
                        </Badge>
                        <Text size="10px" c="dimmed">
                          {new Date(latestResult.testedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            )}
            {untestedQueries.length > 0 && (
              <>
                <Divider label={`미테스트 쿼리 (${untestedQueries.length})`} labelPosition="left" />
                <Stack gap={4}>
                  {untestedQueries.map((q) => (
                    <Paper key={q.id} p="6px 8px" radius={8} style={{ opacity: 0.6 }}>
                      <Text size="xs" c="dimmed" lineClamp={1}>{q.query}</Text>
                      <Text size="10px" c="dimmed">테스트 필요</Text>
                    </Paper>
                  ))}
                </Stack>
              </>
            )}
          </Stack>
        ),
      };
    }
    return {
      title: '개요',
      content: (
        <Stack gap="xs">
          {!setupComplete && (
            <>
              <Group justify="space-between">
                <Text size="sm" fw={500}>시작하기</Text>
                <Text size="sm" c="dimmed">{setupDone}/3</Text>
              </Group>
              <Stack gap="xs">
                {([
                  { done: brands.length > 0, label: '브랜드 등록' },
                  { done: queries.length > 0, label: '쿼리 추가' },
                  { done: results.length > 0, label: '테스트 실행' },
                ] as const).map((step) => (
                  <Group key={step.label} gap={8}>
                    {step.done
                      ? <IconCheck size={14} color="var(--mantine-color-teal-5)" />
                      : <Box w={14} h={14} style={{ borderRadius: '50%', border: '1.5px solid var(--mantine-color-gray-4)' }} />
                    }
                    <Text size="sm" c={step.done ? undefined : 'dimmed'}>{step.label}</Text>
                  </Group>
                ))}
              </Stack>
              <Divider />
            </>
          )}
          <StatRow label="인용률" value={`${stats?.citationRate ?? 0}%`} />
          <Divider />
          <StatRow label="총 테스트 수" value={`${stats?.totalTests ?? 0}`} />
          <Divider />
          <StatRow label="활성 브랜드 수" value={`${brands.length}`} />
          <Divider />
        </Stack>
      ),
    };
  }

  if (pathname.startsWith('/dashboard/query-ops') || pathname.startsWith('/dashboard/queries')) {
    return {
      title: '쿼리 운영',
      content: (
        <Stack gap="xs">
          <StatRow label="쿼리 수" value={`${queries.length}`} />
          <Divider />
          <StatRow label="결과 수" value={`${results.length}`} extra={`/ ${resultsTotal}`} />
          <Divider />
        </Stack>
      ),
    };
  }

  if (pathname.startsWith('/dashboard/scheduler')) {
    return {
      title: '스케줄러',
      content: <SchedulerSidebarPanel />,
    };
  }

  if (pathname.startsWith('/dashboard/reports') || pathname.startsWith('/dashboard/insights')) {
    if (tab === 'insights' || pathname.startsWith('/dashboard/insights')) {
      return {
        title: '인사이트',
        content: (
          <Stack gap="xs">
            <StatRow label="저장된 인사이트" value={`${insights.length}`} />
            <Divider />
            {brands.length === 0 && (
              <>
                <Text size="sm" c="dimmed">
                  인사이트 분석을 시작하려면 먼저 브랜드를 등록하세요
                </Text>
                <Divider />
              </>
            )}
          </Stack>
        ),
      };
    }
    return {
      title: '리포트',
      content: (
        <Stack gap="xs">
          <StatRow label="리포트 수" value={`${reportsTotalCount}`} />
          <Divider />
          {(stats?.totalTests ?? 0) < 5 && (
            <>
              <Group justify="space-between">
                <Text size="sm" fw={500}>리포트 생성 조건</Text>
                <Text size="sm" c="dimmed">{stats?.totalTests ?? 0}/5</Text>
              </Group>
              <Progress value={((stats?.totalTests ?? 0) / 5) * 100} size="sm" radius="xl" />
              <Text size="sm" c="dimmed">
                {5 - (stats?.totalTests ?? 0)}개 더 테스트 필요
              </Text>
              <Divider />
            </>
          )}
          {reports.length > 0 && (
            <>
              <Text size="sm" fw={500}>목록 ({reportsTotalCount})</Text>
              <Stack gap={4}>
                {reports.map((report) => (
                  <ReportListItem
                    key={report.id}
                    report={report}
                    isSelected={options?.selectedReportId === report.id}
                    onClick={() => options?.onSelectReport?.(report.id)}
                    compact
                  />
                ))}
                {isLoadingMoreReports && (
                  <Center py="xs">
                    <Loader size="xs" />
                  </Center>
                )}
                {reportsHasMore && !isLoadingMoreReports && (
                  <Box data-report-sentinel style={{ height: 1 }} />
                )}
              </Stack>
            </>
          )}
        </Stack>
      ),
    };
  }

  if (pathname.startsWith('/dashboard/brands')) {
    return {
      title: '브랜드',
      content: (
        <Stack gap="xs">
          <StatRow label="브랜드 수" value={`${brands.length}`} />
          <Divider />
        </Stack>
      ),
    };
  }

  if (pathname.startsWith('/dashboard/score')) {
    if (tab === 'technical' || pathname.startsWith('/dashboard/score/analysis')) {
      return { title: '스코어 기술분석', content: <Text size="sm" c="dimmed">기술 분석 보기</Text> };
    }
    if (tab === 'competitors' || pathname.startsWith('/dashboard/score/competitors')) {
      return { title: '스코어 경쟁사', content: <Text size="sm" c="dimmed">경쟁사 비교 보기</Text> };
    }
    return { title: 'GEO 스코어', content: <Text size="sm" c="dimmed">스코어 개요 보기</Text> };
  }

  return {
    title: '개요',
    content: (
      <Stack gap="xs">
        <StatRow label="인용률" value={`${stats?.citationRate ?? 0}%`} />
        <Divider />
      </Stack>
    ),
  };
}

export type SidebarPosition = 'left' | 'right';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  position: SidebarPosition;
  onSettingsOpen: () => void;
}

function IconMenu({
  onToggle,
  collapsed,
  navigate,
  pathname,
  position,
  onSettingsOpen,
  dotPath,
}: {
  onToggle: () => void;
  collapsed: boolean;
  navigate: (path: string) => void;
  pathname: string;
  position: SidebarPosition;
  onSettingsOpen: () => void;
  dotPath?: string | null;
}) {
  const expandIcon = position === 'right' ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />;
  const collapseIcon = position === 'right' ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />;
  const tooltipPosition = position === 'right' ? 'left' : 'right';

  return (
    <Stack gap={0} align="center" h="100%" py="xs">
      <Box mb="md">
        <Tooltip label={collapsed ? '메뉴 펼치기' : '메뉴 접기'} position={tooltipPosition} withArrow>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onToggle}>
            {collapsed ? expandIcon : collapseIcon}
          </ActionIcon>
        </Tooltip>
      </Box>

      {trackerMenuItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        const showDot = dotPath === item.path;
        return (
          <UnstyledButton
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 48, height: 64, position: 'relative' }}
          >
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: isActive ? 'var(--mantine-color-brand-1)' : 'transparent',
                position: 'relative',
              }}
            >
              <item.icon size={20} stroke={1.5} color={isActive ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-gray-7)'} />
              {showDot && (
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--mantine-color-blue-5)',
                    border: '2px solid var(--mantine-color-body)',
                  }}
                />
              )}
            </Box>
            <Text size="12px" mt={4} c={isActive ? 'brand.6' : 'gray.7'} fw={isActive ? 600 : 400}>
              {item.shortLabel}
            </Text>
          </UnstyledButton>
        );
      })}

      <Divider w="80%" my="xs" />

      {scoreMenuItems.map((item) => {
        const isActive = pathname.startsWith(item.path);
        return (
          <UnstyledButton
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 48, height: 64 }}
          >
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: isActive ? 'var(--mantine-color-brand-1)' : 'transparent',
              }}
            >
              <item.icon size={20} stroke={1.5} color={isActive ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-gray-7)'} />
            </Box>
            <Text size="12px" mt={4} c={isActive ? 'brand.6' : 'gray.7'} fw={isActive ? 600 : 400}>
              {item.shortLabel}
            </Text>
          </UnstyledButton>
        );
      })}

      {/* Spacer to push settings to bottom */}
      <Box style={{ flex: 1 }} />

      <Divider w="80%" my="xs" />

      <UnstyledButton
        onClick={onSettingsOpen}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 48, height: 64 }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))' }}>
          <IconSettings size={20} stroke={1.5} color="var(--mantine-color-gray-7)" />
        </Box>
        <Text size="12px" mt={4} c="gray.7">설정</Text>
      </UnstyledButton>
    </Stack>
  );
}

export function Sidebar({ collapsed, onToggle, position, onSettingsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const sidebarData = useSidebarData();

  // 온보딩 진행 상태에 따른 dot 표시 대상 경로
  const onboardingDotPath = (() => {
    const brands = sidebarData.brands;
    const queries = sidebarData.queries;
    const results = sidebarData.results;
    if (brands.length === 0) return '/dashboard/brands';
    if (queries.length === 0) return '/dashboard/query-ops';
    if (results.length === 0) return '/dashboard/query-ops';
    return null;
  })();
  const handleSelectResult = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('resultId', id);
    setSearchParams(next);
  };

  const handleSelectReport = useCallback((id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('reportId', id);
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  // 리포트 무한스크롤 Observer
  useEffect(() => {
    if (collapsed) return;
    const isReportPage = location.pathname.startsWith('/dashboard/reports');
    if (!isReportPage || !sidebarData.reportsHasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && sidebarData.reportsHasMore && !sidebarData.isLoadingMoreReports) {
          sidebarData.loadMoreReports();
        }
      },
      { threshold: 0.1 },
    );

    // sentinel을 DOM에서 찾기
    const sentinel = document.querySelector('[data-report-sentinel]');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [collapsed, location.pathname, sidebarData.reportsHasMore, sidebarData.isLoadingMoreReports, sidebarData.loadMoreReports, sidebarData.reports.length]);

  const { title, content } = getExpandedPanel(location.pathname, searchParams.get('tab'), sidebarData, {
    onSelectResult: handleSelectResult,
    selectedResultId: searchParams.get('resultId'),
    onSelectReport: handleSelectReport,
    selectedReportId: searchParams.get('reportId'),
  });
  const panelBorderStyle = position === 'right' ? { borderRight: '1px solid var(--mantine-color-default-border)' } : { borderLeft: '1px solid var(--mantine-color-default-border)' };

  if (collapsed) {
    return (
      <>
        <Box h="100%" px={8}>
          <IconMenu
            onToggle={onToggle}
            collapsed={collapsed}
            navigate={navigate}
            pathname={location.pathname}
            position={position}
            onSettingsOpen={onSettingsOpen}
            dotPath={onboardingDotPath}
          />
        </Box>
      </>
    );
  }

  const detailPanel = (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', ...panelBorderStyle }}>
      <Box p="md" pb={48}>
        <Text size="lg" fw={700}>{title}</Text>
      </Box>
      <ScrollArea flex={1} px="md" pb="md">
        {content}
      </ScrollArea>
    </Box>
  );

  const iconMenu = (
    <Box w={64} style={{ flexShrink: 0 }}>
      <IconMenu
        onToggle={onToggle}
        collapsed={collapsed}
        navigate={navigate}
        pathname={location.pathname}
        position={position}
        onSettingsOpen={onSettingsOpen}
        dotPath={onboardingDotPath}
      />
    </Box>
  );

  return (
    <>
      <Group gap={0} h="100%" wrap="nowrap" align="stretch">
        {position === 'right' ? (
          <>
            {detailPanel}
            {iconMenu}
          </>
        ) : (
          <>
            {iconMenu}
            {detailPanel}
          </>
        )}
      </Group>
    </>
  );
}
