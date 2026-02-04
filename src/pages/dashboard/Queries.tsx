import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Table,
  Badge,
  Group,
  Button,
  ActionIcon,
  TextInput,
  Select,
  Modal,
  Switch,
  Menu,
  Loader,
  Alert,
  Code,
  ScrollArea,
  Divider,
  Checkbox,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconSearch,
  IconDotsVertical,
  IconTrash,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconBrandOpenai,
  IconSparkles,
  IconLink,
  IconClock,
  IconPlayerPlay,
  IconPlayerStop,
  IconCalendarEvent,
  IconSettings,
} from '@tabler/icons-react';
import { QUERY_CATEGORIES, AI_ENGINES, type MonitoredQuery, type TestResult, type Brand } from '../../data/mockData';
import {
  getQueries,
  addQuery,
  deleteQuery,
  testQuery,
  getResults,
  getBrands,
  updateQueryBrands,
  getSchedulerStatus,
  startScheduler,
  stopScheduler,
  runScheduleNow,
  updateSchedulerConfig,
  type SchedulerData,
} from '../../services/api';
import { QueriesSkeleton } from '../../components/ui';

const frequencyLabels: Record<MonitoredQuery['frequency'], string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
};

const frequencyColors: Record<MonitoredQuery['frequency'], string> = {
  daily: 'blue',
  weekly: 'teal',
  monthly: 'gray',
};

export function Queries() {
  const [opened, { open, close }] = useDisclosure(false);
  const [resultModalOpened, { open: openResultModal, close: closeResultModal }] = useDisclosure(false);
  const [brandModalOpened, { open: openBrandModal, close: closeBrandModal }] = useDisclosure(false);
  const [schedulerSettingsOpened, { open: openSchedulerSettings, close: closeSchedulerSettings }] = useDisclosure(false);
  const [geminiNoticeOpened, { open: openGeminiNotice, close: closeGeminiNotice }] = useDisclosure(false);

  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrandId, setFilterBrandId] = useState<string | null>(null);
  const [newQuery, setNewQuery] = useState('');
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [newFrequency, setNewFrequency] = useState<string | null>('daily');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingEngine, setTestingEngine] = useState<'gpt' | 'gemini' | null>(null);
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  // 스케줄러 상태
  const [schedulerData, setSchedulerData] = useState<SchedulerData | null>(null);
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [runningScheduleType, setRunningScheduleType] = useState<'daily' | 'weekly' | 'monthly' | null>(null);

  useEffect(() => {
    loadData();
    loadSchedulerData();
  }, []);

  const loadSchedulerData = async () => {
    try {
      const data = await getSchedulerStatus();
      setSchedulerData(data);
    } catch (err) {
      console.error('Failed to load scheduler data:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [queriesData, resultsData, brandsData] = await Promise.all([
        getQueries(),
        getResults(),
        getBrands(),
      ]);
      setQueries(queriesData.queries);
      setResults(resultsData.results);
      setBrands(brandsData.brands);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // 쿼리별 선택된 브랜드의 최신 결과 가져오기
  const getQueryBrandResult = (queryId: string) => {
    const queryResults = results.filter((r) => r.queryId === queryId);
    if (queryResults.length === 0 || !filterBrandId) return null;

    const latestResult = queryResults[0];
    return latestResult.brandResults?.find((br) => br.brandId === filterBrandId) || null;
  };

  const filteredQueries = queries.filter((q) => {
    const matchesSearch = q.query.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = !filterBrandId || q.brandIds?.includes(filterBrandId);
    return matchesSearch && matchesBrand;
  });

  const handleToggleActive = (id: string) => {
    setQueries((prev) =>
      prev.map((q) => (q.id === id ? { ...q, isActive: !q.isActive } : q))
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuery(id);
      setQueries((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete query');
    }
  };

  const handleOpenBrandModal = (query: MonitoredQuery) => {
    setEditingQueryId(query.id);
    setSelectedBrandIds(query.brandIds || []);
    openBrandModal();
  };

  const handleSaveBrands = async () => {
    if (!editingQueryId) return;
    try {
      await updateQueryBrands(editingQueryId, selectedBrandIds);
      setQueries((prev) =>
        prev.map((q) =>
          q.id === editingQueryId ? { ...q, brandIds: selectedBrandIds } : q
        )
      );
      closeBrandModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update brands');
    }
  };

  const toggleBrandSelection = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId)
        ? prev.filter((id) => id !== brandId)
        : [...prev, brandId]
    );
  };

  const handleAddQuery = async () => {
    if (!newQuery || !newCategory) return;

    try {
      const created = await addQuery({
        query: newQuery,
        category: newCategory,
        frequency: newFrequency || 'daily',
      });
      setQueries((prev) => [created, ...prev]);
      setNewQuery('');
      setNewCategory(null);
      setNewFrequency('daily');
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add query');
    }
  };

  const handleTestQuery = async (query: MonitoredQuery, engine: 'gpt' | 'gemini') => {
    setTestingId(query.id);
    setTestingEngine(engine);
    setError(null);

    try {
      const result = await testQuery({
        query: query.query,
        queryId: query.id,
        category: query.category,
        engine,
      });

      setLatestResult(result);
      setResults((prev) => [result, ...prev]);
      setQueries((prev) =>
        prev.map((q) =>
          q.id === query.id ? { ...q, lastTested: result.testedAt } : q
        )
      );
      openResultModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test query');
    } finally {
      setTestingId(null);
      setTestingEngine(null);
    }
  };

  // 스케줄러 핸들러
  const handleToggleScheduler = async () => {
    setSchedulerLoading(true);
    try {
      if (schedulerData?.config.enabled) {
        const result = await stopScheduler();
        setSchedulerData(result.status);
      } else {
        const result = await startScheduler();
        setSchedulerData(result.status);
      }
      await loadSchedulerData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle scheduler');
    } finally {
      setSchedulerLoading(false);
    }
  };

  const handleRunNow = async (type: 'daily' | 'weekly' | 'monthly') => {
    setRunningScheduleType(type);
    setError(null);
    try {
      await runScheduleNow(type);
      await Promise.all([loadData(), loadSchedulerData()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run schedule');
    } finally {
      setRunningScheduleType(null);
    }
  };

  const handleUpdateSchedulerConfig = async (config: Partial<SchedulerData['config']>) => {
    try {
      const result = await updateSchedulerConfig(config);
      setSchedulerData((prev) => prev ? { ...prev, config: result.config } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update config');
    }
  };

  const formatNextSchedule = (isoDate: string | null) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActiveQueryCount = (frequency: 'daily' | 'weekly' | 'monthly') => {
    return queries.filter((q) => q.isActive && q.frequency === frequency).length;
  };

  if (isLoading) {
    return <QueriesSkeleton />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>쿼리 관리</Title>
          <Text c="dimmed" size="sm">
            테스트할 쿼리를 등록하고 ChatGPT/Gemini에서 브랜드 인용 여부를 확인합니다
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          쿼리 추가
        </Button>
      </Group>

      {/* 스케줄러 상태 패널 */}
      {schedulerData && (
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Group>
              <IconCalendarEvent size={20} />
              <Title order={4}>자동 스케줄링</Title>
              {schedulerData.status.isRunning && (
                <Badge color="blue" variant="light" leftSection={<Loader size={10} />}>
                  실행 중: {schedulerData.status.currentTask}
                </Badge>
              )}
            </Group>
            <Group>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={openSchedulerSettings}
                title="스케줄러 설정"
              >
                <IconSettings size={18} />
              </ActionIcon>
              <Switch
                checked={schedulerData.config.enabled}
                onChange={handleToggleScheduler}
                disabled={schedulerLoading}
                label={schedulerData.config.enabled ? '활성화' : '비활성화'}
                size="sm"
              />
            </Group>
          </Group>

          <Group grow>
            {/* Daily */}
            <Paper p="sm" radius="sm" withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>매일</Text>
                  <Badge size="xs" variant="light">{getActiveQueryCount('daily')}개 쿼리</Badge>
                </Group>
                <Group gap="xs">
                  <IconClock size={14} />
                  <Text size="xs" c="dimmed">{schedulerData.config.dailyRunTime}</Text>
                </Group>
                <Text size="xs" c="dimmed">
                  다음: {formatNextSchedule(schedulerData.nextScheduled.daily)}
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  leftSection={runningScheduleType === 'daily' ? <Loader size={12} /> : <IconPlayerPlay size={12} />}
                  onClick={() => handleRunNow('daily')}
                  disabled={runningScheduleType !== null || brands.length === 0}
                >
                  지금 실행
                </Button>
              </Stack>
            </Paper>

            {/* Weekly */}
            <Paper p="sm" radius="sm" withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>매주</Text>
                  <Badge size="xs" variant="light" color="teal">{getActiveQueryCount('weekly')}개 쿼리</Badge>
                </Group>
                <Group gap="xs">
                  <IconClock size={14} />
                  <Text size="xs" c="dimmed">
                    {['일', '월', '화', '수', '목', '금', '토'][schedulerData.config.weeklyRunDay]}요일 {schedulerData.config.weeklyRunTime}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  다음: {formatNextSchedule(schedulerData.nextScheduled.weekly)}
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  leftSection={runningScheduleType === 'weekly' ? <Loader size={12} /> : <IconPlayerPlay size={12} />}
                  onClick={() => handleRunNow('weekly')}
                  disabled={runningScheduleType !== null || brands.length === 0}
                >
                  지금 실행
                </Button>
              </Stack>
            </Paper>

            {/* Monthly */}
            <Paper p="sm" radius="sm" withBorder>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={500}>매월</Text>
                  <Badge size="xs" variant="light" color="gray">{getActiveQueryCount('monthly')}개 쿼리</Badge>
                </Group>
                <Group gap="xs">
                  <IconClock size={14} />
                  <Text size="xs" c="dimmed">
                    {schedulerData.config.monthlyRunDay}일 {schedulerData.config.monthlyRunTime}
                  </Text>
                </Group>
                <Text size="xs" c="dimmed">
                  다음: {formatNextSchedule(schedulerData.nextScheduled.monthly)}
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  leftSection={runningScheduleType === 'monthly' ? <Loader size={12} /> : <IconPlayerPlay size={12} />}
                  onClick={() => handleRunNow('monthly')}
                  disabled={runningScheduleType !== null || brands.length === 0}
                >
                  지금 실행
                </Button>
              </Stack>
            </Paper>
          </Group>

          {/* 최근 히스토리 */}
          {schedulerData.history.length > 0 && (
            <>
              <Divider my="md" />
              <Text size="sm" fw={500} mb="xs">최근 실행 기록</Text>
              <Stack gap="xs">
                {schedulerData.history.slice(0, 3).map((h) => (
                  <Group key={h.id} justify="space-between">
                    <Group gap="xs">
                      <Badge size="xs" color={h.type === 'daily' ? 'blue' : h.type === 'weekly' ? 'teal' : 'gray'}>
                        {h.type === 'daily' ? '매일' : h.type === 'weekly' ? '매주' : '매월'}
                      </Badge>
                      <Text size="xs" c="dimmed">
                        {new Date(h.completedAt).toLocaleString('ko-KR')}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      <Badge size="xs" color="green" variant="light">{h.success} 성공</Badge>
                      {h.failed > 0 && <Badge size="xs" color="red" variant="light">{h.failed} 실패</Badge>}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </>
          )}
        </Paper>
      )}

      {/* 브랜드 등록 안내 */}
      {brands.length === 0 && (
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          먼저 브랜드 설정에서 모니터링할 브랜드를 등록해주세요
        </Alert>
      )}

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="오류"
          color="red"
          withCloseButton
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Paper p="md" radius="md" withBorder>
        <Group mb="md">
          <TextInput
            placeholder="쿼리 검색..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="브랜드 필터"
            data={[
              { value: '', label: '전체 브랜드' },
              ...brands.map((b) => ({ value: b.id, label: b.name })),
            ]}
            value={filterBrandId || ''}
            onChange={(v) => setFilterBrandId(v || null)}
            w={150}
            clearable
          />
          <Button
            variant="subtle"
            leftSection={<IconRefresh size={16} />}
            onClick={loadData}
          >
            새로고침
          </Button>
        </Group>

        {queries.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            등록된 쿼리가 없습니다. 쿼리를 추가해주세요.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>쿼리</Table.Th>
                <Table.Th>카테고리</Table.Th>
                {filterBrandId && <Table.Th ta="center">인용</Table.Th>}
                <Table.Th>테스트 주기</Table.Th>
                <Table.Th>마지막 테스트</Table.Th>
                <Table.Th ta="center">활성화</Table.Th>
                <Table.Th ta="center">작업</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredQueries.map((query) => (
                <Table.Tr key={query.id}>
                  <Table.Td>
                    <Stack gap={4}>
                      <Text size="sm" fw={500}>
                        {query.query}
                      </Text>
                      {query.brandIds && query.brandIds.length > 0 && (
                        <Group gap={4}>
                          {query.brandIds.map((bid) => {
                            const brand = brands.find((b) => b.id === bid);
                            return brand ? (
                              <Badge key={bid} size="xs" variant="outline" color="violet">
                                {brand.name}
                              </Badge>
                            ) : null;
                          })}
                        </Group>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">
                      {query.category}
                    </Badge>
                  </Table.Td>
                  {filterBrandId && (
                    <Table.Td ta="center">
                      {(() => {
                        const brandResult = getQueryBrandResult(query.id);
                        if (!brandResult) return <Text size="xs" c="dimmed">-</Text>;
                        return brandResult.cited ? (
                          <Badge color="teal" size="sm" leftSection={<IconCheck size={10} />}>
                            인용
                          </Badge>
                        ) : (
                          <Badge color="gray" size="sm" leftSection={<IconX size={10} />}>
                            미인용
                          </Badge>
                        );
                      })()}
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Badge
                      color={frequencyColors[query.frequency]}
                      variant="light"
                      size="sm"
                    >
                      {frequencyLabels[query.frequency]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {query.lastTested
                        ? new Date(query.lastTested).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Switch
                      checked={query.isActive}
                      onChange={() => handleToggleActive(query.id)}
                      size="sm"
                    />
                  </Table.Td>
                  <Table.Td ta="center">
                    <Group gap="xs" justify="center">
                      {testingId === query.id && testingEngine === 'gpt' ? (
                        <Loader size="sm" color="teal" />
                      ) : (
                        <ActionIcon
                          variant="light"
                          color="teal"
                          onClick={() => handleTestQuery(query, 'gpt')}
                          disabled={testingId !== null || brands.length === 0}
                          title="ChatGPT에서 테스트"
                        >
                          <IconBrandOpenai size={16} />
                        </ActionIcon>
                      )}
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={openGeminiNotice}
                        title="Gemini에서 테스트"
                      >
                        <IconSparkles size={16} />
                      </ActionIcon>
                      <Menu shadow="md" width={180}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconLink size={14} />}
                            onClick={() => handleOpenBrandModal(query)}
                          >
                            브랜드 연결
                            {query.brandIds && query.brandIds.length > 0 && (
                              <Badge size="xs" ml="xs">{query.brandIds.length}</Badge>
                            )}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDelete(query.id)}
                          >
                            삭제
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {filteredQueries.length === 0 && queries.length > 0 && (
          <Text c="dimmed" ta="center" py="xl">
            검색 결과가 없습니다
          </Text>
        )}
      </Paper>

      {/* 테스트 결과 히스토리 */}
      {results.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>테스트 결과 히스토리</Title>
            <Badge variant="light">{results.length}개 결과</Badge>
          </Group>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>쿼리</Table.Th>
                <Table.Th ta="center">엔진</Table.Th>
                <Table.Th ta="center">브랜드별 인용</Table.Th>
                <Table.Th>테스트 시간</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {results.slice(0, 10).map((result) => (
                <Table.Tr key={result.id}>
                  <Table.Td>
                    <Text size="sm" lineClamp={1}>
                      {result.query}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      color={result.engine === 'gemini' ? 'blue' : 'teal'}
                      variant="light"
                      size="sm"
                    >
                      {AI_ENGINES[result.engine]?.name || result.engine}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" justify="center">
                      {result.brandResults?.map((br) => (
                        <Badge
                          key={br.brandId}
                          color={br.cited ? 'teal' : 'gray'}
                          variant="light"
                          size="sm"
                          leftSection={br.cited ? <IconCheck size={10} /> : <IconX size={10} />}
                        >
                          {br.brandName}
                          {br.rank && ` #${br.rank}`}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {new Date(result.testedAt).toLocaleString('ko-KR')}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {/* 쿼리 추가 모달 */}
      <Modal opened={opened} onClose={close} title="새 쿼리 추가" centered>
        <Stack gap="md">
          <TextInput
            label="쿼리"
            placeholder="예: 임산부 화장품 추천해줘"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            required
          />
          <Select
            label="카테고리"
            placeholder="카테고리 선택"
            data={QUERY_CATEGORIES}
            value={newCategory}
            onChange={setNewCategory}
            required
          />
          <Select
            label="테스트 주기"
            placeholder="주기 선택"
            data={[
              { value: 'daily', label: '매일' },
              { value: 'weekly', label: '매주' },
              { value: 'monthly', label: '매월' },
            ]}
            value={newFrequency}
            onChange={setNewFrequency}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>
              취소
            </Button>
            <Button onClick={handleAddQuery} disabled={!newQuery || !newCategory}>
              추가
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 테스트 결과 상세 모달 */}
      <Modal
        opened={resultModalOpened}
        onClose={closeResultModal}
        title="테스트 결과"
        size="lg"
        centered
      >
        {latestResult && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">
                  쿼리
                </Text>
                <Text fw={500}>{latestResult.query}</Text>
              </div>
              <Badge
                color={latestResult.engine === 'gemini' ? 'blue' : 'teal'}
                variant="filled"
                size="lg"
              >
                {AI_ENGINES[latestResult.engine]?.name || latestResult.engine}
              </Badge>
            </Group>

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                브랜드별 인용 여부
              </Text>
              <Stack gap="xs">
                {latestResult.brandResults?.map((br) => (
                  <Group key={br.brandId} justify="space-between" p="xs" style={{ background: 'var(--mantine-color-gray-1)', borderRadius: 8 }}>
                    <Text fw={500}>{br.brandName}</Text>
                    <Group gap="xs">
                      {br.cited ? (
                        <>
                          <Badge color="teal" leftSection={<IconCheck size={12} />}>
                            인용됨
                          </Badge>
                          {br.rank && (
                            <Badge variant="filled">#{br.rank}</Badge>
                          )}
                        </>
                      ) : (
                        <Badge color="gray" leftSection={<IconX size={12} />}>
                          미인용
                        </Badge>
                      )}
                      {br.competitorMentions && br.competitorMentions.length > 0 && (
                        <Badge color="orange" variant="light" size="sm">
                          경쟁사: {br.competitorMentions.join(', ')}
                        </Badge>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                {AI_ENGINES[latestResult.engine]?.name || latestResult.engine} 응답
              </Text>
              <ScrollArea h={250}>
                <Code block style={{ whiteSpace: 'pre-wrap' }}>
                  {latestResult.fullResponse || latestResult.response}
                </Code>
              </ScrollArea>
            </div>

            <Group justify="flex-end">
              <Button onClick={closeResultModal}>닫기</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* 브랜드 연결 모달 */}
      <Modal
        opened={brandModalOpened}
        onClose={closeBrandModal}
        title="브랜드 연결"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            이 쿼리를 연결할 브랜드를 선택하세요. 연결된 브랜드로 필터링하여 관리할 수 있습니다.
          </Text>

          {brands.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              등록된 브랜드가 없습니다
            </Text>
          ) : (
            <Stack gap="xs">
              {brands.map((brand) => (
                <Checkbox
                  key={brand.id}
                  label={brand.name}
                  checked={selectedBrandIds.includes(brand.id)}
                  onChange={() => toggleBrandSelection(brand.id)}
                />
              ))}
            </Stack>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeBrandModal}>
              취소
            </Button>
            <Button onClick={handleSaveBrands} disabled={brands.length === 0}>
              저장
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 스케줄러 설정 모달 */}
      <Modal
        opened={schedulerSettingsOpened}
        onClose={closeSchedulerSettings}
        title="스케줄러 설정"
        centered
      >
        {schedulerData && (
          <Stack gap="md">
            <Divider label="일일 스케줄" labelPosition="left" />
            <TextInput
              label="실행 시간"
              placeholder="09:00"
              value={schedulerData.config.dailyRunTime}
              onChange={(e) => handleUpdateSchedulerConfig({ dailyRunTime: e.target.value })}
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
                value={String(schedulerData.config.weeklyRunDay)}
                onChange={(v) => handleUpdateSchedulerConfig({ weeklyRunDay: Number(v) })}
              />
              <TextInput
                label="시간"
                placeholder="09:00"
                value={schedulerData.config.weeklyRunTime}
                onChange={(e) => handleUpdateSchedulerConfig({ weeklyRunTime: e.target.value })}
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
                value={String(schedulerData.config.monthlyRunDay)}
                onChange={(v) => handleUpdateSchedulerConfig({ monthlyRunDay: Number(v) })}
              />
              <TextInput
                label="시간"
                placeholder="09:00"
                value={schedulerData.config.monthlyRunTime}
                onChange={(e) => handleUpdateSchedulerConfig({ monthlyRunTime: e.target.value })}
              />
            </Group>

            <Divider label="실행 설정" labelPosition="left" />
            <Select
              label="기본 AI 엔진"
              data={[
                { value: 'gpt', label: 'ChatGPT' },
                { value: 'gemini', label: 'Gemini' },
              ]}
              value={schedulerData.config.defaultEngine}
              onChange={(v) => handleUpdateSchedulerConfig({ defaultEngine: v as 'gpt' | 'gemini' })}
            />

            <Group justify="flex-end" mt="md">
              <Button onClick={closeSchedulerSettings}>닫기</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Gemini 지원 예정 안내 모달 */}
      <Modal
        opened={geminiNoticeOpened}
        onClose={closeGeminiNotice}
        title="Gemini 테스트"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Group>
            <IconSparkles size={24} color="var(--mantine-color-blue-5)" />
            <Text fw={500}>추후 지원 예정입니다</Text>
          </Group>
          <Text size="sm" c="dimmed">
            Gemini API 연동 기능은 현재 개발 중이며, 곧 지원될 예정입니다.
          </Text>
          <Group justify="flex-end">
            <Button onClick={closeGeminiNotice}>확인</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
