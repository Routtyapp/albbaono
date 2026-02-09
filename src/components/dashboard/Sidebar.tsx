import { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ActionIcon, Badge, Box, Button, Center, Divider, Group, Loader, Modal, Paper, ScrollArea, SegmentedControl, Skeleton, Stack, Switch, Text, Tooltip, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconChartBar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFileDescription,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
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

const trackerMenuItems = [
  { label: '성과 개요', shortLabel: '성과', icon: IconChartBar, path: '/dashboard/performance' },
  { label: '쿼리 운영', shortLabel: '쿼리', icon: IconMessageQuestion, path: '/dashboard/query-ops' },
  { label: '스케줄러', shortLabel: '스케줄', icon: IconCalendarEvent, path: '/dashboard/scheduler' },
  { label: '리포트/인사이트', shortLabel: '리포트', icon: IconFileDescription, path: '/dashboard/reports' },
  { label: '브랜드', shortLabel: '브랜드', icon: IconTags, path: '/dashboard/brands' },
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

function StatCard({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <Paper p="xs" withBorder radius="md">
      <Text size="xs" c="dimmed" mb={2}>{label}</Text>
      <Group justify="space-between" align="end">
        <Text size="sm" fw={600}>{value}</Text>
        {extra ? <Text size="xs" c="dimmed">{extra}</Text> : null}
      </Group>
    </Paper>
  );
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const SCHEDULE_COLORS: Record<string, string> = {
  daily: 'blue',
  weekly: 'teal',
  monthly: 'violet',
};

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

  const formatNextSchedule = (isoDate: string | null) => {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return <PanelSkeleton />;
  if (!schedulerData) return <Text size="xs" c="dimmed">스케줄러 데이터 없음</Text>;

  const isEnabled = schedulerData.config.enabled;

  return (
    <Stack gap="sm">
      <Paper p="xs" withBorder radius="md">
        <Group justify="space-between">
          <Text size="xs" fw={600}>자동 스케줄링</Text>
          <Switch
            checked={isEnabled}
            onChange={handleToggle}
            disabled={schedulerLoading}
            size="xs"
          />
        </Group>
        {schedulerData.status.isRunning && (
          <Badge size="xs" color="blue" variant="light" leftSection={<Loader size={8} />} mt={4}>
            실행 중
          </Badge>
        )}
        <Text size="10px" c="dimmed" mt={4}>
          {isEnabled ? '활성화됨' : '비활성화됨'}
        </Text>
      </Paper>

      {(['daily', 'weekly', 'monthly'] as const).map((type) => {
        const count = getActiveQueryCount(type);
        const next = schedulerData.nextScheduled[type];
        const isRunning = runningType === type;
        let timeLabel = '';
        if (type === 'daily') timeLabel = schedulerData.config.dailyRunTime;
        else if (type === 'weekly') timeLabel = `${DAY_NAMES[schedulerData.config.weeklyRunDay]}요일 ${schedulerData.config.weeklyRunTime}`;
        else timeLabel = `${schedulerData.config.monthlyRunDay}일 ${schedulerData.config.monthlyRunTime}`;

        return (
          <Paper key={type} p="xs" withBorder radius="md" style={{ borderLeft: `3px solid var(--mantine-color-${SCHEDULE_COLORS[type]}-5)` }}>
            <Group justify="space-between" mb={4}>
              <Group gap={6}>
                <Box w={6} h={6} style={{ borderRadius: '50%', backgroundColor: `var(--mantine-color-${SCHEDULE_COLORS[type]}-5)` }} />
                <Text size="xs" fw={600}>{SCHEDULE_LABELS[type]}</Text>
              </Group>
              <Badge size="xs" variant="light" color={SCHEDULE_COLORS[type]}>{count}개</Badge>
            </Group>
            <Group gap={4} mb={4}>
              <IconClock size={10} color="var(--mantine-color-dimmed)" />
              <Text size="10px" c="dimmed">{timeLabel}</Text>
            </Group>
            <Text size="10px" c={isEnabled ? undefined : 'dimmed'} mb={4}>
              다음: {isEnabled ? formatNextSchedule(next) : '-'}
            </Text>
            <Button
              size="compact-xs"
              variant="light"
              color={SCHEDULE_COLORS[type]}
              fullWidth
              leftSection={isRunning ? <Loader size={10} /> : <IconPlayerPlay size={10} />}
              onClick={() => handleRunNow(type)}
              disabled={runningType !== null}
            >
              지금 실행
            </Button>
          </Paper>
        );
      })}
    </Stack>
  );
}

function getExpandedPanel(
  pathname: string,
  tab: string | null,
  data: SidebarData,
  options?: { onSelectResult?: (id: string) => void; selectedResultId?: string | null },
): { title: string; content: ReactNode } {
  const { stats, brands, queries, reports, insights, results, isLoading, resultsTotal } = data;

  if (isLoading) {
    return { title: '로딩 중', content: <PanelSkeleton /> };
  }

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
          <Stack gap="sm">
            <StatCard label="Citation Rate" value={`${stats?.citationRate ?? 0}%`} />
            <StatCard label="인용 / 전체" value={`${stats?.citedCount ?? 0} / ${stats?.totalTests ?? 0}`} />
            <Divider label={`테스트된 쿼리 (${testedQueries.length})`} labelPosition="left" />
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
        <Stack gap="sm">
          <StatCard label="인용률" value={`${stats?.citationRate ?? 0}%`} />
          <StatCard label="총 테스트 수" value={`${stats?.totalTests ?? 0}`} />
          <StatCard label="활성 브랜드 수" value={`${brands.length}`} />
        </Stack>
      ),
    };
  }

  if (pathname.startsWith('/dashboard/query-ops') || pathname.startsWith('/dashboard/queries')) {
    return {
      title: '쿼리 운영',
      content: (
        <Stack gap="sm">
          <StatCard label="쿼리 수" value={`${queries.length}`} />
          <StatCard label="결과 수" value={`${results.length}`} extra={`전체 ${resultsTotal}`} />
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
          <Stack gap="sm">
            <StatCard label="저장된 인사이트" value={`${insights.length}`} />
          </Stack>
        ),
      };
    }
    return {
      title: '리포트',
      content: (
        <Stack gap="sm">
          <StatCard label="리포트 수" value={`${reports.length}`} />
        </Stack>
      ),
    };
  }

  if (pathname.startsWith('/dashboard/brands')) {
    return {
      title: '브랜드',
      content: (
        <Stack gap="sm">
          <StatCard label="브랜드 수" value={`${brands.length}`} />
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
      <Stack gap="sm">
        <StatCard label="인용률" value={`${stats?.citationRate ?? 0}%`} />
      </Stack>
    ),
  };
}

export type SidebarPosition = 'left' | 'right';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  position: SidebarPosition;
  onPositionChange: (position: SidebarPosition) => void;
}

function IconMenu({
  onToggle,
  collapsed,
  navigate,
  pathname,
  position,
  onSettingsOpen,
}: {
  onToggle: () => void;
  collapsed: boolean;
  navigate: (path: string) => void;
  pathname: string;
  position: SidebarPosition;
  onSettingsOpen: () => void;
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

      <Divider w="80%" my="xs" />

      <Tooltip label="설정" position={tooltipPosition} withArrow>
        <UnstyledButton
          onClick={onSettingsOpen}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}
        >
          <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--mantine-color-gray-1)' }}>
            <IconSettings size={20} stroke={1.5} color="var(--mantine-color-gray-7)" />
          </Box>
        </UnstyledButton>
      </Tooltip>
    </Stack>
  );
}

export function Sidebar({ collapsed, onToggle, position, onPositionChange }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  useBodyScrollLock(settingsOpened);
  const sidebarData = useSidebarData();

  const handleSelectResult = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('resultId', id);
    setSearchParams(next);
  };

  const { title, content } = getExpandedPanel(location.pathname, searchParams.get('tab'), sidebarData, {
    onSelectResult: handleSelectResult,
    selectedResultId: searchParams.get('resultId'),
  });
  const panelBorderStyle = position === 'right' ? { borderRight: '1px solid var(--mantine-color-gray-2)' } : { borderLeft: '1px solid var(--mantine-color-gray-2)' };

  const settingsModal = (
    <Modal opened={settingsOpened} onClose={closeSettings} title={<Text fw={600}>설정</Text>} centered size="sm" lockScroll={false}>
      <Stack gap="md">
        <Box>
          <Text size="sm" fw={500} mb="xs">사이드바 위치</Text>
          <SegmentedControl
            value={position}
            onChange={(value) => onPositionChange(value as SidebarPosition)}
            fullWidth
            data={[
              {
                value: 'left',
                label: (
                  <Center>
                    <Group gap={8}>
                      <IconLayoutSidebarLeftCollapse size={16} />
                      <span>왼쪽</span>
                    </Group>
                  </Center>
                ),
              },
              {
                value: 'right',
                label: (
                  <Center>
                    <Group gap={8}>
                      <IconLayoutSidebarRightCollapse size={16} />
                      <span>오른쪽</span>
                    </Group>
                  </Center>
                ),
              },
            ]}
          />
        </Box>
        {searchParams.get('resultId') ? (
          <Paper withBorder p="xs" radius="md">
            <Group justify="space-between">
              <Text size="xs" c="dimmed">선택된 결과</Text>
              <Badge size="xs" variant="light">{searchParams.get('resultId')}</Badge>
            </Group>
            <Group mt="xs" justify="flex-end">
              <ActionIcon size="sm" variant="subtle" onClick={() => handleSelectResult('')}>
                <IconSettings size={12} />
              </ActionIcon>
            </Group>
          </Paper>
        ) : null}
      </Stack>
    </Modal>
  );

  if (collapsed) {
    return (
      <>
        {settingsModal}
        <Box h="100%" px={8}>
          <IconMenu
            onToggle={onToggle}
            collapsed={collapsed}
            navigate={navigate}
            pathname={location.pathname}
            position={position}
            onSettingsOpen={openSettings}
          />
        </Box>
      </>
    );
  }

  const detailPanel = (
    <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', ...panelBorderStyle }}>
      <Box p="md" pb="sm">
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
        onSettingsOpen={openSettings}
      />
    </Box>
  );

  return (
    <>
      {settingsModal}
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
