import { useState, useEffect, useMemo } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Button,
  Badge,
  Box,
  Select,
  Modal,
  TextInput,
  Divider,
  Grid,
  Table,
  Alert,
  Timeline,
  Indicator,
  Center,
  ThemeIcon,
  Switch,
  Checkbox,
  ActionIcon,
  Loader,
  Pagination,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconClock,
  IconSettings,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconRefresh,
  IconHistory,
  IconArrowRight,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import {
  getSchedulerStatus,
  updateSchedulerConfig,
  type SchedulerData,
  type SchedulerHistory,
} from '../../services/scheduler';
import { getQueries, updateQueryFrequency, updateQueryActive } from '../../services/queries';
import { getBrands } from '../../services/brands';
import type { MonitoredQuery, Brand } from '../../types';
import { SchedulerSkeleton } from '../../components/ui';

const PAGE_SIZE = 10;

dayjs.locale('ko');

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

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
];

export function SchedulerPage() {
  const [schedulerData, setSchedulerData] = useState<SchedulerData | null>(null);
  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterFrequency, setFilterFrequency] = useState<string | null>(null);
  const [filterBrandId, setFilterBrandId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkFrequency, setBulkFrequency] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  useBodyScrollLock(settingsOpened);
  const [schedulerDraft, setSchedulerDraft] = useState<SchedulerData['config'] | null>(null);
  const [schedulerSaving, setSchedulerSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sData, qData, bData] = await Promise.all([
        getSchedulerStatus(),
        getQueries(),
        getBrands(),
      ]);
      setSchedulerData(sData);
      setQueries(qData.queries);
      setBrands(bData.brands);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // Query scheduling handlers
  const handleChangeFrequency = async (queryId: string, frequency: 'daily' | 'weekly' | 'monthly') => {
    const prev = queries.find((q) => q.id === queryId);
    if (!prev || prev.frequency === frequency) return;
    setQueries((qs) => qs.map((q) => (q.id === queryId ? { ...q, frequency } : q)));
    try {
      await updateQueryFrequency(queryId, frequency);
    } catch (err) {
      setQueries((qs) => qs.map((q) => (q.id === queryId ? { ...q, frequency: prev.frequency } : q)));
      setError(err instanceof Error ? err.message : '주기 변경 실패');
    }
  };

  const handleToggleActive = async (queryId: string) => {
    const prev = queries.find((q) => q.id === queryId);
    if (!prev) return;
    const nextActive = !prev.isActive;
    setQueries((qs) => qs.map((q) => (q.id === queryId ? { ...q, isActive: nextActive } : q)));
    try {
      await updateQueryActive(queryId, nextActive);
    } catch (err) {
      setQueries((qs) => qs.map((q) => (q.id === queryId ? { ...q, isActive: prev.isActive } : q)));
      setError(err instanceof Error ? err.message : '상태 변경 실패');
    }
  };

  const handleBulkChangeFrequency = async () => {
    if (!bulkFrequency || selectedIds.size === 0) return;
    const freq = bulkFrequency as 'daily' | 'weekly' | 'monthly';
    const ids = Array.from(selectedIds);
    const prevQueries = [...queries];
    setQueries((qs) => qs.map((q) => (ids.includes(q.id) ? { ...q, frequency: freq } : q)));
    try {
      await Promise.all(ids.map((id) => updateQueryFrequency(id, freq)));
    } catch (err) {
      setQueries(prevQueries);
      setError(err instanceof Error ? err.message : '일괄 주기 변경 실패');
    }
    setSelectedIds(new Set());
    setBulkFrequency(null);
  };

  // Settings handlers
  const handleOpenSettings = () => {
    if (schedulerData) setSchedulerDraft({ ...schedulerData.config });
    openSettings();
  };

  const updateDraft = (patch: Partial<SchedulerData['config']>) => {
    setSchedulerDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSaveConfig = async () => {
    if (!schedulerDraft || !schedulerData) return;
    setSchedulerSaving(true);
    try {
      const result = await updateSchedulerConfig(schedulerDraft);
      setSchedulerData((prev) => (prev ? { ...prev, config: result.config } : null));
      const fresh = await getSchedulerStatus();
      setSchedulerData(fresh);
      closeSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정 저장 실패');
    } finally {
      setSchedulerSaving(false);
    }
  };

  // Filtered queries
  const filteredQueries = useMemo(() => {
    let result = queries;
    if (filterFrequency) result = result.filter((q) => q.frequency === filterFrequency);
    if (filterBrandId) result = result.filter((q) => q.brandIds?.includes(filterBrandId));
    return result;
  }, [queries, filterFrequency, filterBrandId]);

  const totalPages = Math.max(1, Math.ceil(filteredQueries.length / PAGE_SIZE));
  const pagedQueries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredQueries.slice(start, start + PAGE_SIZE);
  }, [filteredQueries, page]);

  // 필터 변경 시 페이지 리셋
  useEffect(() => { setPage(1); }, [filterFrequency, filterBrandId]);

  // Query count per frequency
  const frequencyCounts = useMemo(() => ({
    daily: queries.filter((q) => q.frequency === 'daily').length,
    weekly: queries.filter((q) => q.frequency === 'weekly').length,
    monthly: queries.filter((q) => q.frequency === 'monthly').length,
    dailyActive: queries.filter((q) => q.frequency === 'daily' && q.isActive).length,
    weeklyActive: queries.filter((q) => q.frequency === 'weekly' && q.isActive).length,
    monthlyActive: queries.filter((q) => q.frequency === 'monthly' && q.isActive).length,
  }), [queries]);

  // Calendar helpers
  const scheduledDatesMap = useMemo(() => {
    if (!schedulerData) return new Map<string, 'daily' | 'weekly' | 'monthly'>();
    const map = new Map<string, 'daily' | 'weekly' | 'monthly'>();
    const today = dayjs();
    const end = today.add(2, 'month').endOf('month');

    let cursor = today.add(1, 'day');
    while (cursor.isBefore(end)) {
      const key = cursor.format('YYYY-MM-DD');
      if (!map.has(key)) map.set(key, 'daily');
      cursor = cursor.add(1, 'day');
    }

    const { weeklyRunDay } = schedulerData.config;
    cursor = today.add(1, 'day');
    while (cursor.isBefore(end)) {
      if (cursor.day() === weeklyRunDay) {
        map.set(cursor.format('YYYY-MM-DD'), 'weekly');
      }
      cursor = cursor.add(1, 'day');
    }

    const { monthlyRunDay } = schedulerData.config;
    for (let m = today.month(); m <= today.month() + 3; m++) {
      const d = today.year(today.year()).month(m).date(Math.min(monthlyRunDay, today.month(m).daysInMonth()));
      if (d.isAfter(today) && d.isBefore(end)) {
        map.set(d.format('YYYY-MM-DD'), 'monthly');
      }
    }

    return map;
  }, [schedulerData]);

  const historyByDate = useMemo(() => {
    if (!schedulerData) return new Map<string, SchedulerHistory[]>();
    const map = new Map<string, SchedulerHistory[]>();
    for (const h of schedulerData.history) {
      const key = dayjs(h.completedAt).format('YYYY-MM-DD');
      const arr = map.get(key) || [];
      arr.push(h);
      map.set(key, arr);
    }
    return map;
  }, [schedulerData]);

  const selectedDateHistory = useMemo(() => {
    if (!selectedDate) return [];
    const key = dayjs(selectedDate).format('YYYY-MM-DD');
    return historyByDate.get(key) || [];
  }, [selectedDate, historyByDate]);

  // Select all
  const toggleSelectAll = () => {
    const pageIds = pagedQueries.map((q) => q.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => { const next = new Set(prev); pageIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); pageIds.forEach((id) => next.add(id)); return next; });
    }
  };

  if (isLoading) {
    return <SchedulerSkeleton />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>쿼리 스케줄 관리</Title>
          <Text c="dimmed" size="sm">쿼리별 실행 주기를 설정하고 스케줄을 관리합니다</Text>
        </div>
        <Group>
          <Button variant="subtle" leftSection={<IconSettings size={16} />} onClick={handleOpenSettings}>실행 설정</Button>
          <Button variant="subtle" leftSection={<IconRefresh size={16} />} onClick={loadData}>새로고침</Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="오류" color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Frequency summary cards */}
      <Grid>
        {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
          <Grid.Col key={freq} span={{ base: 12, sm: 4 }}>
            <Paper
              p="md"
              radius="md"
              withBorder
              style={{
                borderLeft: `3px solid var(--mantine-color-${SCHEDULE_COLORS[freq]}-5)`,
                cursor: 'pointer',
                backgroundColor: filterFrequency === freq ? `var(--mantine-color-${SCHEDULE_COLORS[freq]}-0)` : undefined,
              }}
              onClick={() => setFilterFrequency(filterFrequency === freq ? null : freq)}
            >
              <Group justify="space-between">
                <Group gap="xs">
                  <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: `var(--mantine-color-${SCHEDULE_COLORS[freq]}-5)` }} />
                  <Text size="sm" fw={600}>{SCHEDULE_LABELS[freq]}</Text>
                </Group>
                <Badge size="sm" variant="light" color={SCHEDULE_COLORS[freq]}>
                  {frequencyCounts[`${freq}Active` as keyof typeof frequencyCounts]} / {frequencyCounts[freq]}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={4}>
                활성 {frequencyCounts[`${freq}Active` as keyof typeof frequencyCounts]}개 쿼리가 스케줄됨
              </Text>
              {schedulerData && (
                <Group gap={4} mt={4}>
                  <IconClock size={12} color="var(--mantine-color-dimmed)" />
                  <Text size="xs" c="dimmed">
                    {freq === 'daily' && schedulerData.config.dailyRunTime}
                    {freq === 'weekly' && `${DAY_NAMES[schedulerData.config.weeklyRunDay]}요일 ${schedulerData.config.weeklyRunTime}`}
                    {freq === 'monthly' && `${schedulerData.config.monthlyRunDay}일 ${schedulerData.config.monthlyRunTime}`}
                  </Text>
                </Group>
              )}
            </Paper>
          </Grid.Col>
        ))}
      </Grid>

      <Grid>
        {/* Query scheduling table */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <Title order={4}>쿼리 스케줄</Title>
                <Badge variant="light" size="sm">{filteredQueries.length}개</Badge>
              </Group>
              <Group gap="xs">
                <Select
                  placeholder="브랜드"
                  data={brands.map((b) => ({ value: b.id, label: b.name }))}
                  value={filterBrandId}
                  onChange={setFilterBrandId}
                  size="xs"
                  w={120}
                  clearable
                />
                {(filterFrequency || filterBrandId) && (
                  <Button variant="subtle" size="xs" onClick={() => { setFilterFrequency(null); setFilterBrandId(null); }}>
                    필터 해제
                  </Button>
                )}
              </Group>
            </Group>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <Paper p="xs" mb="md" radius="md" style={{ background: 'var(--mantine-color-blue-0)' }}>
                <Group justify="space-between">
                  <Text size="sm" fw={500}>{selectedIds.size}개 선택됨</Text>
                  <Group gap="xs">
                    <Select
                      placeholder="주기 변경"
                      data={FREQUENCY_OPTIONS}
                      value={bulkFrequency}
                      onChange={setBulkFrequency}
                      size="xs"
                      w={100}
                    />
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconArrowRight size={12} />}
                      onClick={handleBulkChangeFrequency}
                      disabled={!bulkFrequency}
                    >
                      적용
                    </Button>
                    <Button size="xs" variant="subtle" onClick={() => setSelectedIds(new Set())}>해제</Button>
                  </Group>
                </Group>
              </Paper>
            )}

            {queries.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size={60} variant="light" color="gray" radius="xl">
                    <IconCalendarEvent size={30} />
                  </ThemeIcon>
                  <Text fw={500} c="dimmed">등록된 쿼리가 없습니다</Text>
                  <Text size="sm" c="dimmed" ta="center" maw={360}>
                    쿼리 운영 페이지에서 쿼리를 추가하면 여기서 스케줄을 관리할 수 있습니다.
                  </Text>
                </Stack>
              </Center>
            ) : filteredQueries.length === 0 ? (
              <Center py="xl">
                <Text c="dimmed">해당 조건의 쿼리가 없습니다</Text>
              </Center>
            ) : (
              <>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th w={40}>
                        <Checkbox
                          checked={selectedIds.size === pagedQueries.length && pagedQueries.length > 0}
                          indeterminate={selectedIds.size > 0 && selectedIds.size < pagedQueries.length}
                          onChange={toggleSelectAll}
                          size="xs"
                        />
                      </Table.Th>
                      <Table.Th>쿼리</Table.Th>
                      <Table.Th>브랜드</Table.Th>
                      <Table.Th w={120}>실행 주기</Table.Th>
                      <Table.Th ta="center" w={80}>활성</Table.Th>
                      <Table.Th>마지막 실행</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pagedQueries.map((query) => (
                      <Table.Tr key={query.id} style={{ opacity: query.isActive ? 1 : 0.5 }}>
                        <Table.Td>
                          <Checkbox
                            checked={selectedIds.has(query.id)}
                            onChange={() => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(query.id)) next.delete(query.id);
                                else next.add(query.id);
                                return next;
                              });
                            }}
                            size="xs"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500} lineClamp={1}>{query.query}</Text>
                        </Table.Td>
                        <Table.Td>
                          {query.brandIds && query.brandIds.length > 0 ? (
                            <Group gap={4} wrap="wrap">
                              {query.brandIds.map((bid) => {
                                const brand = brands.find((b) => b.id === bid);
                                return brand ? (
                                  <Badge key={bid} size="xs" variant="outline" color="violet">{brand.name}</Badge>
                                ) : null;
                              })}
                            </Group>
                          ) : (
                            <Text size="xs" c="dimmed">-</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Select
                            data={FREQUENCY_OPTIONS}
                            value={query.frequency}
                            onChange={(v) => v && handleChangeFrequency(query.id, v as 'daily' | 'weekly' | 'monthly')}
                            size="xs"
                            variant="unstyled"
                            styles={{
                              input: {
                                fontWeight: 600,
                                fontSize: 'var(--mantine-font-size-xs)',
                                color: `var(--mantine-color-${SCHEDULE_COLORS[query.frequency]}-6)`,
                              },
                            }}
                          />
                        </Table.Td>
                        <Table.Td ta="center">
                          <Switch
                            checked={query.isActive}
                            onChange={() => handleToggleActive(query.id)}
                            size="xs"
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {query.lastTested
                              ? new Date(query.lastTested).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : '-'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                {totalPages > 1 && (
                  <Group justify="center" mt="md">
                    <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
                  </Group>
                )}
              </>
            )}
          </Paper>
        </Grid.Col>

        {/* Calendar */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Paper p="md" radius="md" withBorder>
              <Stack gap="md">
                <Calendar
                  locale="ko"
                  firstDayOfWeek={0}
                  size="md"
                  highlightToday
                  styles={{
                    calendarHeader: { maxWidth: '100%' },
                    month: { width: '100%' },
                    monthRow: { width: '100%' },
                    monthCell: { textAlign: 'center' },
                    day: { width: '100%' },
                  }}
                  getDayProps={(date) => ({
                    onClick: () => setSelectedDate(date),
                    selected: selectedDate ? dayjs(date).isSame(dayjs(selectedDate), 'day') : false,
                  })}
                  renderDay={(date) => {
                    const day = dayjs(date).date();
                    const key = dayjs(date).format('YYYY-MM-DD');
                    const hasHistory = historyByDate.has(key);
                    const isFutureScheduled = scheduledDatesMap.has(key);

                    if (hasHistory) {
                      const entries = historyByDate.get(key)!;
                      const hasFailed = entries.some((e) => e.failed > 0);
                      return (
                        <Indicator size={6} color={hasFailed ? 'red' : 'green'} offset={-2}>
                          <div>{day}</div>
                        </Indicator>
                      );
                    }

                    if (isFutureScheduled && dayjs(date).isAfter(dayjs(), 'day')) {
                      return (
                        <Indicator size={6} color="blue" offset={-2}>
                          <div>{day}</div>
                        </Indicator>
                      );
                    }

                    return <div>{day}</div>;
                  }}
                />
                <Group gap="lg">
                  <Group gap={6}>
                    <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-green-5)' }} />
                    <Text size="xs" c="dimmed">성공</Text>
                  </Group>
                  <Group gap={6}>
                    <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-red-5)' }} />
                    <Text size="xs" c="dimmed">실패</Text>
                  </Group>
                  <Group gap={6}>
                    <Box w={8} h={8} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-blue-5)' }} />
                    <Text size="xs" c="dimmed">예정</Text>
                  </Group>
                </Group>
              </Stack>
            </Paper>

            {/* Selected date history */}
            {selectedDate && (
              <Paper p="md" radius="md" withBorder>
                <Text size="sm" fw={600} mb="sm">
                  {dayjs(selectedDate).format('M월 D일')} 실행 기록
                </Text>
                {selectedDateHistory.length === 0 ? (
                  <Text size="xs" c="dimmed">실행 기록 없음</Text>
                ) : (
                  <Timeline active={selectedDateHistory.length - 1} bulletSize={20} lineWidth={2}>
                    {selectedDateHistory.map((h) => (
                      <Timeline.Item
                        key={h.id}
                        bullet={h.failed > 0 ? <IconX size={12} /> : <IconCheck size={12} />}
                        color={h.failed > 0 ? 'red' : 'green'}
                        title={
                          <Group gap="xs">
                            <Badge size="xs" color={SCHEDULE_COLORS[h.type]}>
                              {SCHEDULE_LABELS[h.type]}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {dayjs(h.completedAt).format('HH:mm')}
                            </Text>
                          </Group>
                        }
                      >
                        <Text size="xs" c="dimmed">
                          {h.queriesProcessed}개 처리 / {h.success} 성공 / {h.failed} 실패
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                )}
              </Paper>
            )}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* Full history table */}
      {schedulerData && schedulerData.history.length > 0 ? (
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>전체 실행 이력</Title>
            <Badge variant="light">{schedulerData.history.length}건</Badge>
          </Group>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>유형</Table.Th>
                <Table.Th>시작</Table.Th>
                <Table.Th>완료</Table.Th>
                <Table.Th ta="center">처리</Table.Th>
                <Table.Th ta="center">성공</Table.Th>
                <Table.Th ta="center">실패</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {schedulerData.history.map((h) => (
                <Table.Tr key={h.id}>
                  <Table.Td>
                    <Badge size="sm" color={SCHEDULE_COLORS[h.type]}>
                      {SCHEDULE_LABELS[h.type]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{new Date(h.startedAt).toLocaleString('ko-KR')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{new Date(h.completedAt).toLocaleString('ko-KR')}</Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Text size="sm">{h.queriesProcessed}</Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge size="sm" color="green" variant="light">{h.success}</Badge>
                  </Table.Td>
                  <Table.Td ta="center">
                    {h.failed > 0 ? (
                      <Badge size="sm" color="red" variant="light">{h.failed}</Badge>
                    ) : (
                      <Text size="sm" c="dimmed">0</Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      ) : (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size={60} variant="light" color="gray" radius="xl">
                <IconHistory size={30} />
              </ThemeIcon>
              <Text fw={500} c="dimmed">아직 실행 이력이 없습니다</Text>
              <Text size="sm" c="dimmed" ta="center" maw={360}>
                사이드바에서 스케줄러를 활성화하고 "지금 실행" 버튼을 눌러 테스트를 실행해보세요.
              </Text>
            </Stack>
          </Center>
        </Paper>
      )}

      {/* Settings modal */}
      <Modal opened={settingsOpened} onClose={closeSettings} title="스케줄러 실행 설정" centered lockScroll={false}>
        {schedulerDraft && (
          <Stack gap="md">
            <Divider label="일일 스케줄" labelPosition="left" />
            <TextInput
              label="실행 시간"
              placeholder="09:00"
              value={schedulerDraft.dailyRunTime}
              onChange={(e) => updateDraft({ dailyRunTime: e.target.value })}
              description="HH:mm 형식 (예: 09:00)"
            />

            <Divider label="주간 스케줄" labelPosition="left" />
            <Group grow>
              <Select
                label="요일"
                data={[
                  { value: '0', label: '일요일' },
                  { value: '1', label: '월요일' },
                  { value: '2', label: '화요일' },
                  { value: '3', label: '수요일' },
                  { value: '4', label: '목요일' },
                  { value: '5', label: '금요일' },
                  { value: '6', label: '토요일' },
                ]}
                value={String(schedulerDraft.weeklyRunDay)}
                onChange={(v) => updateDraft({ weeklyRunDay: Number(v) })}
              />
              <TextInput
                label="시간"
                placeholder="09:00"
                value={schedulerDraft.weeklyRunTime}
                onChange={(e) => updateDraft({ weeklyRunTime: e.target.value })}
              />
            </Group>

            <Divider label="월간 스케줄" labelPosition="left" />
            <Group grow>
              <Select
                label="날짜"
                data={Array.from({ length: 28 }, (_, i) => ({
                  value: String(i + 1),
                  label: `${i + 1}일`,
                }))}
                value={String(schedulerDraft.monthlyRunDay)}
                onChange={(v) => updateDraft({ monthlyRunDay: Number(v) })}
              />
              <TextInput
                label="시간"
                placeholder="09:00"
                value={schedulerDraft.monthlyRunTime}
                onChange={(e) => updateDraft({ monthlyRunTime: e.target.value })}
              />
            </Group>

            <Divider label="실행 설정" labelPosition="left" />
            <Select
              label="기본 AI 엔진"
              data={[
                { value: 'gpt', label: 'ChatGPT' },
                { value: 'gemini', label: 'Gemini' },
              ]}
              value={schedulerDraft.defaultEngine}
              onChange={(v) => updateDraft({ defaultEngine: v as 'gpt' | 'gemini' })}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeSettings}>취소</Button>
              <Button onClick={handleSaveConfig} loading={schedulerSaving}>저장</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
