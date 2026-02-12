import { useState, useEffect, useMemo, useCallback } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
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
  Textarea,
  Pagination,
  UnstyledButton,
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
  IconInfoCircle,
  IconRefresh,
  IconBrandOpenai,
  IconSparkles,
  IconLink,
  IconSortAscending,
  IconDatabase,
  IconActivity,
  IconCalendarStats,
  IconTags,
  IconPlayerPlay,
  IconHistory,
} from '@tabler/icons-react';
import { QUERY_CATEGORIES, AI_ENGINES, type MonitoredQuery, type TestResult, type Brand } from '../../types';
import {
  getQueries,
  addQuery,
  deleteQuery,
  testQuery,
  updateQueryActive,
  updateQueryBrands,
} from '../../services/queries';
import { getResultsByQuery, type PaginatedResults } from '../../services/results';
import { getBrands } from '../../services/brands';
import { QueriesSkeleton, SetupGuide } from '../../components/ui';
import { QUERY_TEMPLATES, applyTemplate } from '../../utils/queryTemplates';

type SortField = 'createdAt' | 'lastTested' | 'query';

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

export function QueryListPanel() {
  const [opened, { open, close }] = useDisclosure(false);
  const [resultModalOpened, { open: openResultModal, close: closeResultModal }] = useDisclosure(false);
  const [brandModalOpened, { open: openBrandModal, close: closeBrandModal }] = useDisclosure(false);
  const [geminiNoticeOpened, { open: openGeminiNotice, close: closeGeminiNotice }] = useDisclosure(false);
  const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  useBodyScrollLock(opened || resultModalOpened || brandModalOpened || geminiNoticeOpened || helpOpened || detailOpened);

  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected query for detail panel
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);

  // Right panel: query results
  const [queryResults, setQueryResults] = useState<PaginatedResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);

  // Left panel pagination
  const [listPage, setListPage] = useState(1);
  const LIST_PAGE_SIZE = 15;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrandId, setFilterBrandId] = useState<string | null>(null);

  // Sort
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Add query form
  const [newQueryText, setNewQueryText] = useState('');
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [newFrequency, setNewFrequency] = useState<string | null>('daily');
  const [newBrandIds, setNewBrandIds] = useState<string[]>([]);

  // Test
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingEngine, setTestingEngine] = useState<'gpt' | 'gemini' | null>(null);
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);

  // Brand modal
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);

  // Detail modal for result
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [queriesData, brandsData] = await Promise.all([
        getQueries(),
        getBrands(),
      ]);
      setQueries(queriesData.queries);
      setBrands(brandsData.brands);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // Load results for selected query
  const loadQueryResults = useCallback(async (queryId: string, page = 1) => {
    setResultsLoading(true);
    try {
      const data = await getResultsByQuery(queryId, page, 10);
      setQueryResults(data);
    } catch {
      setQueryResults(null);
    } finally {
      setResultsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedQueryId) {
      setResultsPage(1);
      loadQueryResults(selectedQueryId, 1);
    } else {
      setQueryResults(null);
    }
  }, [selectedQueryId, loadQueryResults]);

  useEffect(() => {
    if (selectedQueryId && resultsPage > 1) {
      loadQueryResults(selectedQueryId, resultsPage);
    }
  }, [resultsPage, selectedQueryId, loadQueryResults]);

  // Auto-select first query
  useEffect(() => {
    if (queries.length > 0 && !selectedQueryId) {
      setSelectedQueryId(queries[0].id);
    }
  }, [queries, selectedQueryId]);

  // Stats
  const linkedBrandCount = useMemo(() => {
    const brandSet = new Set<string>();
    queries.forEach((q) => q.brandIds?.forEach((b) => brandSet.add(b)));
    return brandSet.size;
  }, [queries]);

  // Filtered & sorted queries
  const filteredQueries = useMemo(() => {
    let filtered = queries.filter((q) => {
      const matchesSearch = q.query.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = !filterBrandId || q.brandIds?.includes(filterBrandId);
      return matchesSearch && matchesBrand;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'query') {
        cmp = a.query.localeCompare(b.query);
      } else if (sortField === 'createdAt') {
        cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortField === 'lastTested') {
        const aTime = a.lastTested ? new Date(a.lastTested).getTime() : 0;
        const bTime = b.lastTested ? new Date(b.lastTested).getTime() : 0;
        cmp = bTime - aTime;
      }
      return sortAsc ? -cmp : cmp;
    });

    return filtered;
  }, [queries, searchQuery, filterBrandId, sortField, sortAsc]);

  // Reset list page when filters change
  useEffect(() => {
    setListPage(1);
  }, [searchQuery, filterBrandId, sortField, sortAsc]);

  const listTotalPages = Math.ceil(filteredQueries.length / LIST_PAGE_SIZE);
  const paginatedQueries = filteredQueries.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);

  const selectedQuery = queries.find((q) => q.id === selectedQueryId) || null;

  // Handlers
  const handleToggleActive = async (id: string) => {
    const current = queries.find((q) => q.id === id);
    if (!current) return;
    const nextIsActive = !current.isActive;
    setQueries((prev) => prev.map((q) => (q.id === id ? { ...q, isActive: nextIsActive } : q)));
    try {
      await updateQueryActive(id, nextIsActive);
    } catch (err) {
      setQueries((prev) => prev.map((q) => (q.id === id ? { ...q, isActive: current.isActive } : q)));
      setError(err instanceof Error ? err.message : '상태 변경 실패');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQuery(id);
      setQueries((prev) => prev.filter((q) => q.id !== id));
      if (selectedQueryId === id) {
        const remaining = queries.filter((q) => q.id !== id);
        setSelectedQueryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
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
        prev.map((q) => (q.id === editingQueryId ? { ...q, brandIds: selectedBrandIds } : q))
      );
      closeBrandModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '브랜드 연결 실패');
    }
  };

  const toggleBrandSelection = (brandId: string) => {
    setSelectedBrandIds((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
  };

  const handleAddQuery = async () => {
    if (!newQueryText.trim() || !newCategory) return;
    const lines = newQueryText.split('\n').map((l) => l.trim()).filter(Boolean);
    try {
      for (const line of lines) {
        const created = await addQuery({
          query: line,
          category: newCategory,
          frequency: newFrequency || 'daily',
        });
        if (newBrandIds.length > 0) {
          await updateQueryBrands(created.id, newBrandIds);
          created.brandIds = newBrandIds;
        }
        setQueries((prev) => [created, ...prev]);
      }
      setNewQueryText('');
      setNewCategory(null);
      setNewFrequency('daily');
      setNewBrandIds([]);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : '질문 추가 실패');
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
      setQueries((prev) =>
        prev.map((q) => (q.id === query.id ? { ...q, lastTested: result.testedAt } : q))
      );
      // Refresh right panel results if this query is selected
      if (selectedQueryId === query.id) {
        loadQueryResults(query.id, 1);
        setResultsPage(1);
      }
      openResultModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '테스트 실패');
    } finally {
      setTestingId(null);
      setTestingEngine(null);
    }
  };

  const handleResultRowClick = (result: TestResult) => {
    setSelectedResult(result);
    openDetail();
  };

  const totalPages = queryResults ? Math.ceil(queryResults.total / queryResults.limit) : 1;

  if (isLoading) {
    return <QueriesSkeleton />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>질문 관리</Title>
          <Text c="dimmed" size="sm">질문을 선택하면 테스트 이력과 결과를 확인할 수 있습니다</Text>
        </div>
        <Group gap="xs">
          <Button leftSection={<IconPlus size={16} />} onClick={open}>질문 추가</Button>
          <ActionIcon variant="light" color="gray" size="lg" onClick={openHelp} title="도움말">
            <IconInfoCircle size={18} />
          </ActionIcon>
        </Group>
      </Group>

      {/* Metric summary */}
      <Group gap="sm">
        <Badge variant="light" color="brand" size="lg" leftSection={<IconDatabase size={14} />}>
          전체 질문 {queries.length}
        </Badge>
        <Badge variant="light" color="teal" size="lg" leftSection={<IconActivity size={14} />}>
          활성 {queries.filter((q) => q.isActive).length}
        </Badge>
        <Badge variant="light" color="violet" size="lg" leftSection={<IconTags size={14} />}>
          연결 브랜드 {linkedBrandCount}
        </Badge>
      </Group>

      {brands.length === 0 && queries.length > 0 && (
        <Alert icon={<IconTags size={16} />} color="blue" variant="light">
          먼저 브랜드를 등록하면 질문 테스트 시 인용 여부를 자동 분석합니다.{' '}
          <Button component="a" href="/dashboard/brands" variant="subtle" size="compact-xs" color="blue">
            브랜드 등록하기
          </Button>
        </Alert>
      )}
      {brands.length === 0 && queries.length === 0 && (
        <SetupGuide brandsCount={brands.length} queriesCount={queries.length} resultsCount={0} />
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="오류" color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {queries.length === 0 && brands.length > 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <IconPlus size={40} stroke={1.5} color="var(--mantine-color-brand-5)" />
            <Text>등록된 질문이 없습니다</Text>
            <Text size="sm" c="dimmed" ta="center">
              AI에게 테스트할 질문을 추가하면 브랜드 인용 여부를 자동으로 분석합니다.
            </Text>
            <Stack gap="xs" align="center">
              <Text size="xs" c="dimmed">추천 질문 템플릿으로 빠르게 시작하세요</Text>
              <Group gap="xs" justify="center">
                {QUERY_TEMPLATES.slice(0, 4).map((t) => {
                  const firstBrand = brands[0]?.name || '브랜드';
                  const firstCompetitor = brands[0]?.competitors?.[0];
                  return (
                    <Button
                      key={t.id}
                      variant="light"
                      size="xs"
                      radius="xl"
                      onClick={() => {
                        setNewQueryText(applyTemplate(t.template, firstBrand, firstCompetitor));
                        setNewCategory(t.category);
                        open();
                      }}
                    >
                      {applyTemplate(t.template, firstBrand, firstCompetitor)}
                    </Button>
                  );
                })}
              </Group>
            </Stack>
            <Button leftSection={<IconPlus size={16} />} onClick={open}>
              직접 질문 추가하기
            </Button>
          </Stack>
        </Paper>
      ) : queries.length > 0 && (
        /* Master-Detail Layout */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--mantine-spacing-md)', alignItems: 'start' }} className="query-grid">
          {/* Left: Query List */}
          <Paper p="xs" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', maxHeight: 600 }}>
            {/* Search & Filter */}
            <Stack gap="xs" p="xs" pb={0}>
              <TextInput
                placeholder="질문 검색..."
                leftSection={<IconSearch size={14} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="xs"
              />
              <Group gap="xs">
                <Select
                  placeholder="브랜드"
                  data={[{ value: '', label: '전체' }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
                  value={filterBrandId || ''}
                  onChange={(v) => setFilterBrandId(v || null)}
                  size="xs"
                  clearable
                  style={{ flex: 1 }}
                />
                <Menu shadow="md" width={160}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" color="gray" size="sm" title="정렬">
                      <IconSortAscending size={14} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item onClick={() => { setSortField('createdAt'); setSortAsc(false); }}>생성일 (최신)</Menu.Item>
                    <Menu.Item onClick={() => { setSortField('createdAt'); setSortAsc(true); }}>생성일 (오래된)</Menu.Item>
                    <Menu.Item onClick={() => { setSortField('lastTested'); setSortAsc(false); }}>최근 테스트</Menu.Item>
                    <Menu.Item onClick={() => { setSortField('query'); setSortAsc(true); }}>이름 (가나다)</Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Stack>

            <Group justify="space-between" px="xs" py={6}>
              <Text size="xs" c="dimmed">{filteredQueries.length}개 질문</Text>
              <ActionIcon variant="subtle" color="gray" size="xs" onClick={loadData} title="새로고침">
                <IconRefresh size={12} />
              </ActionIcon>
            </Group>

            {/* Query items */}
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
                      {!query.isActive && (
                        <Badge size="xs" variant="light" color="gray" mt={4}>비활성</Badge>
                      )}
                    </UnstyledButton>
                  );
                })}
                {filteredQueries.length === 0 && (
                  <Text c="dimmed" ta="center" py="md" size="sm">검색 결과 없음</Text>
                )}
              </Stack>
            </div>

            {listTotalPages > 1 && (
              <Group justify="center" py="xs">
                <Pagination value={listPage} onChange={setListPage} total={listTotalPages} size="xs" />
              </Group>
            )}
          </Paper>

          {/* Right: Detail + History */}
          <Paper p={{ base: 'md', sm: 'xl' }} radius="md" withBorder>
            {selectedQuery ? (
              <Stack gap="lg">
                {/* Query Info Header */}
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="lg" fw={600}>{selectedQuery.query}</Text>
                    <Group gap="xs" mt="xs" wrap="wrap">
                      <Badge variant="light" size="sm">{selectedQuery.category}</Badge>
                      <Badge color={frequencyColors[selectedQuery.frequency]} variant="light" size="sm">
                        {frequencyLabels[selectedQuery.frequency]}
                      </Badge>
                      <Switch
                        checked={selectedQuery.isActive}
                        onChange={() => handleToggleActive(selectedQuery.id)}
                        size="xs"
                        label={selectedQuery.isActive ? '활성' : '비활성'}
                        styles={{ label: { fontSize: 'var(--mantine-font-size-xs)' } }}
                      />
                    </Group>
                    {selectedQuery.brandIds && selectedQuery.brandIds.length > 0 && (
                      <Group gap={4} mt="xs">
                        <Text size="xs" c="dimmed">연결 브랜드:</Text>
                        {selectedQuery.brandIds.map((bid) => {
                          const brand = brands.find((b) => b.id === bid);
                          return brand ? (
                            <Badge key={bid} size="xs" variant="outline" color="violet">{brand.name}</Badge>
                          ) : null;
                        })}
                      </Group>
                    )}
                    {selectedQuery.lastTested && (
                      <Text size="xs" c="dimmed" mt={4}>
                        <IconCalendarStats size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        마지막 테스트: {new Date(selectedQuery.lastTested).toLocaleString('ko-KR')}
                      </Text>
                    )}
                  </div>
                  <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                    {testingId === selectedQuery.id && testingEngine === 'gpt' ? (
                      <Loader size="sm" color="teal" />
                    ) : (
                      <Button
                        variant="light"
                        color="teal"
                        size="xs"
                        leftSection={<IconBrandOpenai size={14} />}
                        onClick={() => handleTestQuery(selectedQuery, 'gpt')}
                        disabled={testingId !== null}
                      >
                        ChatGPT
                      </Button>
                    )}
                    <Button
                      variant="light"
                      color="blue"
                      size="xs"
                      leftSection={<IconSparkles size={14} />}
                      onClick={openGeminiNotice}
                    >
                      Gemini
                    </Button>
                    <Menu shadow="md" width={180}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconLink size={14} />} onClick={() => handleOpenBrandModal(selectedQuery)}>
                          브랜드 연결
                          {selectedQuery.brandIds && selectedQuery.brandIds.length > 0 && <Badge size="xs" ml="xs">{selectedQuery.brandIds.length}</Badge>}
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(selectedQuery.id)}>삭제</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Group>

                <Divider />

                {/* Test History */}
                <div>
                  <Group justify="space-between" mb="sm">
                    <Group gap="xs">
                      <IconHistory size={16} color="var(--mantine-color-dimmed)" />
                      <Text size="sm" fw={600}>테스트 이력</Text>
                      {queryResults && (
                        <Badge size="xs" variant="light" color="gray">{queryResults.total}건</Badge>
                      )}
                    </Group>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={() => selectedQueryId && loadQueryResults(selectedQueryId, resultsPage)}
                      title="새로고침"
                    >
                      <IconRefresh size={14} />
                    </ActionIcon>
                  </Group>

                  {resultsLoading ? (
                    <Group justify="center" py="xl"><Loader size="sm" /></Group>
                  ) : !queryResults || queryResults.results.length === 0 ? (
                    <Paper p="lg" radius="md" withBorder style={{ textAlign: 'center' }}>
                      <IconPlayerPlay size={32} stroke={1.5} color="var(--mantine-color-dimmed)" />
                      <Text size="sm" c="dimmed" mt="xs">아직 테스트 결과가 없습니다</Text>
                      <Text size="xs" c="dimmed">위의 ChatGPT 또는 Gemini 버튼으로 테스트를 실행하세요</Text>
                    </Paper>
                  ) : (
                    <>
                      <ScrollArea type="auto">
                      <Table striped highlightOnHover style={{ minWidth: 400 }}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th ta="center">엔진</Table.Th>
                            <Table.Th ta="center">브랜드별 인용</Table.Th>
                            <Table.Th>테스트 시간</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {queryResults.results.map((result) => (
                            <Table.Tr
                              key={result.id}
                              onClick={() => handleResultRowClick(result)}
                              style={{ cursor: 'pointer' }}
                            >
                              <Table.Td ta="center">
                                <Badge
                                  color={result.engine === 'gemini' ? 'blue' : 'teal'}
                                  variant="light"
                                  size="sm"
                                >
                                  {AI_ENGINES.find((e) => e.value === result.engine)?.label || result.engine}
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
                                  {(!result.brandResults || result.brandResults.length === 0) && (
                                    <Text size="xs" c="dimmed">-</Text>
                                  )}
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" c="dimmed">
                                  {new Date(result.testedAt).toLocaleString('ko-KR', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                  })}
                                </Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                      </ScrollArea>

                      {totalPages > 1 && (
                        <Group justify="center" mt="md">
                          <Pagination value={resultsPage} onChange={setResultsPage} total={totalPages} size="sm" />
                        </Group>
                      )}
                    </>
                  )}
                </div>
              </Stack>
            ) : (
              <Stack align="center" justify="center" gap="md" style={{ minHeight: 400 }}>
                <IconSearch size={40} stroke={1.5} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed">좌측에서 질문을 선택하세요</Text>
                <Text size="sm" c="dimmed" ta="center">
                  질문을 선택하면 테스트 이력과 상세 결과를 확인할 수 있습니다
                </Text>
              </Stack>
            )}
          </Paper>
        </div>
      )}

      {/* Add query modal */}
      <Modal opened={opened} onClose={close} title="새 질문 추가" centered size="md" lockScroll={false}>
        <Stack gap="md">
          <Textarea
            label="질문"
            placeholder="한 줄에 하나씩 입력하면 여러 질문을 동시에 추가할 수 있습니다"
            value={newQueryText}
            onChange={(e) => setNewQueryText(e.target.value)}
            required
            minRows={3}
            autosize
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
          {brands.length > 0 && (
            <>
              <Text size="sm">브랜드 연결 (선택)</Text>
              <Stack gap="xs">
                {brands.map((brand) => (
                  <Checkbox
                    key={brand.id}
                    label={brand.name}
                    checked={newBrandIds.includes(brand.id)}
                    onChange={() => {
                      setNewBrandIds((prev) =>
                        prev.includes(brand.id) ? prev.filter((id) => id !== brand.id) : [...prev, brand.id]
                      );
                    }}
                  />
                ))}
              </Stack>
            </>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={close}>취소</Button>
            <Button onClick={handleAddQuery} disabled={!newQueryText.trim() || !newCategory}>추가</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Test result modal (after running test) */}
      <Modal opened={resultModalOpened} onClose={closeResultModal} title="테스트 결과" size="lg" centered lockScroll={false}>
        {latestResult && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">질문</Text>
                <Text>{latestResult.query}</Text>
              </div>
              <Badge color={latestResult.engine === 'gemini' ? 'blue' : 'teal'} variant="filled" size="lg">
                {AI_ENGINES.find((e) => e.value === latestResult.engine)?.label || latestResult.engine}
              </Badge>
            </Group>
            <div>
              <Text size="sm" c="dimmed" mb="xs">브랜드별 인용 여부</Text>
              <Stack gap="xs">
                {latestResult.brandResults?.map((br) => (
                  <Group key={br.brandId} justify="space-between" p="xs" style={{ background: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))', borderRadius: 8 }}>
                    <Text>{br.brandName}</Text>
                    <Group gap="xs">
                      {br.cited ? (
                        <>
                          <Badge color="teal" leftSection={<IconCheck size={12} />}>인용됨</Badge>
                          {br.rank && <Badge variant="filled">#{br.rank}</Badge>}
                        </>
                      ) : (
                        <Badge color="gray" leftSection={<IconX size={12} />}>미인용</Badge>
                      )}
                      {br.competitorMentions && br.competitorMentions.length > 0 && (
                        <Badge color="orange" variant="light" size="sm">경쟁사: {br.competitorMentions.join(', ')}</Badge>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </div>
            <Divider />
            <div>
              <Text size="sm" c="dimmed" mb="xs">
                {AI_ENGINES.find((e) => e.value === latestResult.engine)?.label || latestResult.engine} 응답
              </Text>
              <ScrollArea h={250}>
                <Code block style={{ whiteSpace: 'pre-wrap' }}>{latestResult.fullResponse || latestResult.response}</Code>
              </ScrollArea>
            </div>
            <Group justify="flex-end">
              <Button onClick={closeResultModal}>닫기</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Result detail modal (from history table click) */}
      <Modal opened={detailOpened} onClose={closeDetail} title="테스트 결과 상세" size="lg" centered lockScroll={false}>
        {selectedResult && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">질문</Text>
                <Text>{selectedResult.query}</Text>
              </div>
              <Badge color={selectedResult.engine === 'gemini' ? 'blue' : 'teal'} variant="filled" size="lg">
                {AI_ENGINES.find((e) => e.value === selectedResult.engine)?.label || selectedResult.engine}
              </Badge>
            </Group>
            <div>
              <Text size="sm" c="dimmed" mb="xs">브랜드별 인용 여부</Text>
              <Stack gap="xs">
                {selectedResult.brandResults?.map((br) => (
                  <Group key={br.brandId} justify="space-between" p="xs" style={{ background: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))', borderRadius: 8 }}>
                    <Text>{br.brandName}</Text>
                    <Group gap="xs">
                      {br.cited ? (
                        <>
                          <Badge color="teal" leftSection={<IconCheck size={12} />}>인용됨</Badge>
                          {br.rank && <Badge variant="filled">#{br.rank}</Badge>}
                        </>
                      ) : (
                        <Badge color="gray" leftSection={<IconX size={12} />}>미인용</Badge>
                      )}
                      {br.competitorMentions && br.competitorMentions.length > 0 && (
                        <Badge color="orange" variant="light" size="sm">경쟁사: {br.competitorMentions.join(', ')}</Badge>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </div>
            <Divider />
            <div>
              <Text size="sm" c="dimmed" mb="xs">
                {AI_ENGINES.find((e) => e.value === selectedResult.engine)?.label || selectedResult.engine} 응답
              </Text>
              <ScrollArea h={250}>
                <Code block style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedResult.fullResponse || selectedResult.response}
                </Code>
              </ScrollArea>
            </div>
            <Group justify="flex-end">
              <Button onClick={closeDetail}>닫기</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Brand link modal */}
      <Modal opened={brandModalOpened} onClose={closeBrandModal} title="브랜드 연결" centered lockScroll={false}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">이 질문을 연결할 브랜드를 선택하세요.</Text>
          {brands.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">등록된 브랜드가 없습니다</Text>
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
            <Button variant="subtle" onClick={closeBrandModal}>취소</Button>
            <Button onClick={handleSaveBrands} disabled={brands.length === 0}>저장</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Gemini notice modal */}
      <Modal opened={geminiNoticeOpened} onClose={closeGeminiNotice} title="Gemini 테스트" centered size="sm" lockScroll={false}>
        <Stack gap="md">
          <Group>
            <IconSparkles size={24} color="var(--mantine-color-blue-5)" />
            <Text>추후 지원 예정입니다</Text>
          </Group>
          <Text size="sm" c="dimmed">Gemini API 연동 기능은 현재 개발 중이며, 곧 지원될 예정입니다.</Text>
          <Group justify="flex-end">
            <Button onClick={closeGeminiNotice}>확인</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Help modal */}
      <Modal opened={helpOpened} onClose={closeHelp} title="질문 관리 도움말" centered size="md" lockScroll={false}>
        <Stack gap="lg">
          <div>
            <Group gap="xs" mb="xs">
              <IconLink size={18} color="var(--mantine-color-violet-5)" />
              <Text fw={600}>브랜드 연결</Text>
            </Group>
            <Text size="sm" c="dimmed">
              질문에 브랜드를 연결하면 AI 응답에서 해당 브랜드가 언급(인용)되었는지를 자동으로 분석합니다.
              여러 브랜드를 연결할 수 있으며, 테스트 결과에서 브랜드별 인용 여부, 인용 순위, 경쟁사 언급 현황을 확인할 수 있습니다.
            </Text>
          </div>
          <Divider />
          <div>
            <Group gap="xs" mb="xs">
              <IconActivity size={18} color="var(--mantine-color-teal-5)" />
              <Text fw={600}>활성화</Text>
            </Group>
            <Text size="sm" c="dimmed">
              활성화된 질문만 자동 스케줄 테스트 대상에 포함됩니다.
              비활성화하면 질문은 목록에 남아있지만 설정된 주기(매일/매주/매월)에 따른 자동 테스트에서 제외됩니다.
              수동 테스트는 활성화 여부와 관계없이 언제든 실행할 수 있습니다.
            </Text>
          </div>
          <Group justify="flex-end" mt="sm">
            <Button onClick={closeHelp}>확인</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
