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
  Table,
  Alert,
  Timeline,
  Indicator,
  Center,
  ThemeIcon,
  Switch,
  Pagination,
  UnstyledButton,
  ScrollArea,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCalendarEvent,
  IconSettings,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconRefresh,
  IconHistory,
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

const LIST_PAGE_SIZE = 15;

dayjs.locale('ko');

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
  const [filterFrequency, setFilterFrequency] = useState<string | null>(null);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [listPage, setListPage] = useState(1);

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
    if (!filterFrequency) return queries;
    return queries.filter((q) => q.frequency === filterFrequency);
  }, [queries, filterFrequency]);

  useEffect(() => { setListPage(1); }, [filterFrequency]);

  const listTotalPages = Math.ceil(filteredQueries.length / LIST_PAGE_SIZE);
  const paginatedQueries = filteredQueries.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);

  // Auto-select first
  useEffect(() => {
    if (queries.length > 0 && !selectedQueryId) {
      setSelectedQueryId(queries[0].id);
    }
  }, [queries, selectedQueryId]);

  const selectedQuery = queries.find((q) => q.id === selectedQueryId) || null;

  // Frequency counts
  const frequencyCounts = useMemo(() => ({
    daily: queries.filter((q) => q.frequency === 'daily').length,
    dailyActive: queries.filter((q) => q.frequency === 'daily' && q.isActive).length,
    weekly: queries.filter((q) => q.frequency === 'weekly').length,
    weeklyActive: queries.filter((q) => q.frequency === 'weekly' && q.isActive).length,
    monthly: queries.filter((q) => q.frequency === 'monthly').length,
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

  if (isLoading) {
    return <SchedulerSkeleton />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>질문 예약</Title>
          <Text c="dimmed" size="sm">질문별 자동 테스트 주기를 설정하고 실행 이력을 확인합니다</Text>
        </div>
        <Group>
          <Button variant="subtle" leftSection={<IconSettings size={16} />} onClick={handleOpenSettings}>실행 설정</Button>
          <Button variant="subtle" leftSection={<IconRefresh size={16} />} onClick={loadData}>새로고침</Button>
        </Group>
      </Group>

      {/* Frequency summary badges */}
      <Group gap="sm">
        {(['daily', 'weekly', 'monthly'] as const).map((freq) => {
          const isActive = filterFrequency === freq;
          return (
            <Badge
              key={freq}
              variant={isActive ? 'filled' : 'light'}
              color={SCHEDULE_COLORS[freq]}
              size="lg"
              style={{ cursor: 'pointer' }}
              onClick={() => setFilterFrequency(isActive ? null : freq)}
            >
              {SCHEDULE_LABELS[freq]} {frequencyCounts[`${freq}Active` as keyof typeof frequencyCounts]}/{frequencyCounts[freq as keyof typeof frequencyCounts]}
            </Badge>
          );
        })}
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="오류" color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {queries.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size={60} variant="light" color="gray" radius="xl">
                <IconCalendarEvent size={30} />
              </ThemeIcon>
              <Text c="dimmed">등록된 질문이 없습니다</Text>
              <Text size="sm" c="dimmed" ta="center" maw={360}>
                질문 관리 탭에서 질문을 추가하면 여기서 스케줄을 관리할 수 있습니다.
              </Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--mantine-spacing-md)', alignItems: 'start' }} className="scheduler-grid">
          {/* Left: Query list */}
          <Paper p="xs" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', maxHeight: 600 }}>
            <Group justify="space-between" px="xs" py={6}>
              <Text size="xs" c="dimmed">{filteredQueries.length}개 질문</Text>
              {filterFrequency && (
                <Badge size="xs" variant="light" color={SCHEDULE_COLORS[filterFrequency]}>
                  {SCHEDULE_LABELS[filterFrequency]}
                </Badge>
              )}
            </Group>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <Stack gap={2}>
                {paginatedQueries.map((query) => {
                  const isSelected = selectedQueryId === query.id;
                  return (
                    <UnstyledButton
                      key={query.id}
                      onClick={() => setSelectedQueryId(query.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--mantine-radius-sm)',
                        backgroundColor: isSelected
                          ? 'light-dark(var(--mantine-color-brand-0), var(--mantine-color-brand-9))'
                          : 'transparent',
                        opacity: query.isActive ? 1 : 0.5,
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <Text
                        size="sm"
                        fw={isSelected ? 600 : 400}
                        c={isSelected ? 'brand' : undefined}
                        truncate
                      >
                        {query.query}
                      </Text>
                      <Group gap={4} mt={2}>
                        <Badge size="xs" variant="light" color={SCHEDULE_COLORS[query.frequency]}>
                          {SCHEDULE_LABELS[query.frequency]}
                        </Badge>
                        {!query.isActive && (
                          <Badge size="xs" variant="light" color="gray">비활성</Badge>
                        )}
                      </Group>
                    </UnstyledButton>
                  );
                })}
                {filteredQueries.length === 0 && (
                  <Text c="dimmed" ta="center" py="md" size="sm">해당 조건의 질문 없음</Text>
                )}
              </Stack>
            </div>

            {listTotalPages > 1 && (
              <Group justify="center" py="xs">
                <Pagination value={listPage} onChange={setListPage} total={listTotalPages} size="xs" />
              </Group>
            )}
          </Paper>

          {/* Right: Detail panel */}
          <Paper p={{ base: 'md', sm: 'xl' }} radius="md" withBorder>
            {selectedQuery ? (
              <Stack gap="lg">
                {/* Query info */}
                <Stack gap="xs">
                  <div>
                    <Text size="lg" fw={600}>{selectedQuery.query}</Text>
                    <Group gap="xs" mt="xs" wrap="wrap">
                      <Badge variant="light" size="sm">{selectedQuery.category}</Badge>
                      {selectedQuery.brandIds && selectedQuery.brandIds.length > 0 && selectedQuery.brandIds.map((bid) => {
                        const brand = brands.find((b) => b.id === bid);
                        return brand ? (
                          <Badge key={bid} size="xs" variant="outline" color="violet">{brand.name}</Badge>
                        ) : null;
                      })}
                    </Group>
                    {selectedQuery.lastTested && (
                      <Text size="xs" c="dimmed" mt={4}>
                        마지막 실행: {new Date(selectedQuery.lastTested).toLocaleString('ko-KR')}
                      </Text>
                    )}
                  </div>
                  <Switch
                    checked={selectedQuery.isActive}
                    onChange={() => handleToggleActive(selectedQuery.id)}
                    size="sm"
                    label={selectedQuery.isActive ? '활성' : '비활성'}
                    styles={{ label: { fontSize: 'var(--mantine-font-size-xs)' } }}
                  />
                </Stack>

                {/* Frequency setting */}
                <Paper p="md" radius="md" withBorder>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>실행 주기</Text>
                    <Select
                      data={FREQUENCY_OPTIONS}
                      value={selectedQuery.frequency}
                      onChange={(v) => v && handleChangeFrequency(selectedQuery.id, v as 'daily' | 'weekly' | 'monthly')}
                      size="xs"
                      w={100}
                    />
                  </Group>
                </Paper>

                <Divider />

                {/* Calendar */}
                <div>
                  <Text size="sm" fw={600} mb="sm">실행 캘린더</Text>
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
                      onClick: () => setSelectedDate(new Date(date)),
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
                  <Group gap="lg" mt="xs">
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

                  {/* Selected date history */}
                  {selectedDate && (
                    <Paper p="sm" radius="md" withBorder mt="sm">
                      <Text size="sm" fw={500} mb="xs">
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
                                  <Badge size="xs" color={SCHEDULE_COLORS[h.type]}>{SCHEDULE_LABELS[h.type]}</Badge>
                                  <Text size="xs" c="dimmed">{dayjs(h.completedAt).format('HH:mm')}</Text>
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
                </div>

                <Divider />

                {/* Recent execution history */}
                <div>
                  <Group justify="space-between" mb="sm">
                    <Group gap="xs">
                      <IconHistory size={16} color="var(--mantine-color-dimmed)" />
                      <Text size="sm" fw={600}>최근 실행 이력</Text>
                    </Group>
                    {schedulerData && (
                      <Badge size="xs" variant="light" color="gray">{schedulerData.history.length}건</Badge>
                    )}
                  </Group>

                  {!schedulerData || schedulerData.history.length === 0 ? (
                    <Paper p="lg" radius="md" withBorder style={{ textAlign: 'center' }}>
                      <ThemeIcon size={32} variant="light" color="gray" radius="xl" mx="auto">
                        <IconHistory size={18} />
                      </ThemeIcon>
                      <Text size="sm" c="dimmed" mt="xs">아직 실행 이력이 없습니다</Text>
                    </Paper>
                  ) : (
                    <ScrollArea type="auto">
                    <Table striped highlightOnHover style={{ minWidth: 400 }}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>유형</Table.Th>
                          <Table.Th>완료 시간</Table.Th>
                          <Table.Th ta="center">처리</Table.Th>
                          <Table.Th ta="center">성공</Table.Th>
                          <Table.Th ta="center">실패</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {schedulerData.history.slice(0, 10).map((h) => (
                          <Table.Tr key={h.id}>
                            <Table.Td>
                              <Badge size="sm" color={SCHEDULE_COLORS[h.type]}>{SCHEDULE_LABELS[h.type]}</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs" c="dimmed">
                                {new Date(h.completedAt).toLocaleString('ko-KR', {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                })}
                              </Text>
                            </Table.Td>
                            <Table.Td ta="center"><Text size="sm">{h.queriesProcessed}</Text></Table.Td>
                            <Table.Td ta="center"><Badge size="sm" color="green" variant="light">{h.success}</Badge></Table.Td>
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
                    </ScrollArea>
                  )}
                </div>
              </Stack>
            ) : (
              <Stack align="center" justify="center" gap="md" style={{ minHeight: 400 }}>
                <IconCalendarEvent size={40} stroke={1.5} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed">좌측에서 질문을 선택하세요</Text>
              </Stack>
            )}
          </Paper>
        </div>
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
