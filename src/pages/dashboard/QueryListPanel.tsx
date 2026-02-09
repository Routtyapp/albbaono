import { useState, useEffect, useMemo } from 'react';
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
  Grid,
  Card,
  SegmentedControl,
  Textarea,
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
  IconList,
  IconLayoutGrid,
  IconSortAscending,
  IconDatabase,
  IconActivity,
  IconCalendarStats,
  IconTags,
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
import { getResults } from '../../services/results';
import { getBrands } from '../../services/brands';
import { MetricCard, QueriesSkeleton, SetupGuide } from '../../components/ui';

type SortField = 'createdAt' | 'lastTested' | 'query';
type ViewMode = 'table' | 'card';

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
  useBodyScrollLock(opened || resultModalOpened || brandModalOpened || geminiNoticeOpened);

  const [queries, setQueries] = useState<MonitoredQuery[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrandId, setFilterBrandId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterFrequency, setFilterFrequency] = useState<string | null>(null);

  // Sort
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('table');

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

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

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
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats
  const todayTestCount = useMemo(() => {
    const today = new Date().toDateString();
    return results.filter((r) => new Date(r.testedAt).toDateString() === today).length;
  }, [results]);

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
      const matchesCategory = !filterCategory || q.category === filterCategory;
      const matchesFrequency = !filterFrequency || q.frequency === filterFrequency;
      return matchesSearch && matchesBrand && matchesCategory && matchesFrequency;
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
  }, [queries, searchQuery, filterBrandId, filterCategory, filterFrequency, sortField, sortAsc]);

  const getQueryBrandResult = (queryId: string) => {
    const queryResults = results.filter((r) => r.queryId === queryId);
    if (queryResults.length === 0 || !filterBrandId) return null;
    return queryResults[0].brandResults?.find((br) => br.brandId === filterBrandId) || null;
  };

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
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
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
      setError(err instanceof Error ? err.message : '쿼리 추가 실패');
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
        prev.map((q) => (q.id === query.id ? { ...q, lastTested: result.testedAt } : q))
      );
      openResultModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : '테스트 실패');
    } finally {
      setTestingId(null);
      setTestingEngine(null);
    }
  };

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQueries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQueries.map((q) => q.id)));
    }
  };

  const handleBulkToggleActive = async (active: boolean) => {
    const ids = Array.from(selectedIds);
    setQueries((prev) => prev.map((q) => (ids.includes(q.id) ? { ...q, isActive: active } : q)));
    try {
      await Promise.all(ids.map((id) => updateQueryActive(id, active)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '일괄 작업 실패');
      loadData();
    }
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => deleteQuery(id)));
      setQueries((prev) => prev.filter((q) => !ids.includes(q.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : '일괄 삭제 실패');
      loadData();
    }
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return <QueriesSkeleton />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>쿼리 관리</Title>
          <Text c="dimmed" size="sm">테스트할 쿼리를 등록하고 ChatGPT/Gemini에서 브랜드 인용 여부를 확인합니다</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>쿼리 추가</Button>
      </Group>

      {/* Metric cards */}
      <Grid>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <MetricCard title="전체 쿼리" value={queries.length} icon={<IconDatabase size={20} />} color="brand" />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <MetricCard title="활성 쿼리" value={queries.filter((q) => q.isActive).length} icon={<IconActivity size={20} />} color="teal" />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <MetricCard title="오늘 테스트" value={todayTestCount} icon={<IconCalendarStats size={20} />} color="blue" />
        </Grid.Col>
        <Grid.Col span={{ base: 6, sm: 3 }}>
          <MetricCard title="연결 브랜드" value={linkedBrandCount} icon={<IconTags size={20} />} color="violet" />
        </Grid.Col>
      </Grid>

      {brands.length === 0 && (
        <SetupGuide
          brandsCount={brands.length}
          queriesCount={queries.length}
          resultsCount={results.length}
        />
      )}

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="오류" color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters + view toggle */}
      <Paper p="md" radius="md" withBorder>
        <Group mb="md" justify="space-between">
          <Group>
            <TextInput
              placeholder="쿼리 검색..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              w={200}
            />
            <Select
              placeholder="브랜드 필터"
              data={[{ value: '', label: '전체 브랜드' }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
              value={filterBrandId || ''}
              onChange={(v) => setFilterBrandId(v || null)}
              w={140}
              clearable
            />
            <Select
              placeholder="카테고리"
              data={[{ value: '', label: '전체 카테고리' }, ...QUERY_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]}
              value={filterCategory || ''}
              onChange={(v) => setFilterCategory(v || null)}
              w={140}
              clearable
            />
            <Select
              placeholder="주기"
              data={[
                { value: '', label: '전체 주기' },
                { value: 'daily', label: '매일' },
                { value: 'weekly', label: '매주' },
                { value: 'monthly', label: '매월' },
              ]}
              value={filterFrequency || ''}
              onChange={(v) => setFilterFrequency(v || null)}
              w={120}
              clearable
            />
          </Group>
          <Group>
            <Menu shadow="md" width={160}>
              <Menu.Target>
                <Button variant="subtle" size="sm" leftSection={<IconSortAscending size={16} />}>정렬</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => { setSortField('createdAt'); setSortAsc(false); }}>생성일 (최신)</Menu.Item>
                <Menu.Item onClick={() => { setSortField('createdAt'); setSortAsc(true); }}>생성일 (오래된)</Menu.Item>
                <Menu.Item onClick={() => { setSortField('lastTested'); setSortAsc(false); }}>최근 테스트</Menu.Item>
                <Menu.Item onClick={() => { setSortField('query'); setSortAsc(true); }}>이름 (가나다)</Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <SegmentedControl
              size="xs"
              value={viewMode}
              onChange={(v) => setViewMode(v as ViewMode)}
              data={[
                { value: 'table', label: <IconList size={16} /> },
                { value: 'card', label: <IconLayoutGrid size={16} /> },
              ]}
            />
            <Button variant="subtle" leftSection={<IconRefresh size={16} />} onClick={loadData} size="sm">새로고침</Button>
          </Group>
        </Group>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <Group mb="md" p="xs" style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 8 }}>
            <Text size="sm" fw={500}>{selectedIds.size}개 선택됨</Text>
            <Button size="xs" variant="light" color="teal" onClick={() => handleBulkToggleActive(true)}>일괄 활성화</Button>
            <Button size="xs" variant="light" color="gray" onClick={() => handleBulkToggleActive(false)}>일괄 비활성화</Button>
            <Button size="xs" variant="light" color="red" onClick={handleBulkDelete}>일괄 삭제</Button>
            <Button size="xs" variant="subtle" onClick={() => setSelectedIds(new Set())}>선택 해제</Button>
          </Group>
        )}

        {queries.length === 0 ? (
          brands.length > 0 ? (
            <Paper p="xl" radius="md" withBorder>
              <Stack align="center" gap="md">
                <IconPlus size={40} stroke={1.5} color="gray" />
                <Text fw={500}>등록된 쿼리가 없습니다</Text>
                <Text size="sm" c="dimmed" ta="center">
                  AI에게 테스트할 질문을 추가하면 브랜드 인용 여부를 자동으로 분석합니다.
                </Text>
                <Button leftSection={<IconPlus size={16} />} onClick={open}>
                  첫 쿼리 추가하기
                </Button>
              </Stack>
            </Paper>
          ) : (
            <SetupGuide
              brandsCount={brands.length}
              queriesCount={queries.length}
              resultsCount={results.length}
            />
          )
        ) : viewMode === 'table' ? (
          /* Table view */
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={40}>
                  <Checkbox
                    checked={selectedIds.size === filteredQueries.length && filteredQueries.length > 0}
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredQueries.length}
                    onChange={toggleSelectAll}
                    size="xs"
                  />
                </Table.Th>
                <Table.Th>쿼리</Table.Th>
                <Table.Th>카테고리</Table.Th>
                {filterBrandId && <Table.Th ta="center">인용</Table.Th>}
                <Table.Th>주기</Table.Th>
                <Table.Th>마지막 테스트</Table.Th>
                <Table.Th ta="center">활성화</Table.Th>
                <Table.Th ta="center">작업</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredQueries.map((query) => (
                <Table.Tr key={query.id}>
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
                    <Stack gap={4}>
                      <Text size="sm" fw={500}>{query.query}</Text>
                      {query.brandIds && query.brandIds.length > 0 && (
                        <Group gap={4}>
                          {query.brandIds.map((bid) => {
                            const brand = brands.find((b) => b.id === bid);
                            return brand ? (
                              <Badge key={bid} size="xs" variant="outline" color="violet">{brand.name}</Badge>
                            ) : null;
                          })}
                        </Group>
                      )}
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">{query.category}</Badge>
                  </Table.Td>
                  {filterBrandId && (
                    <Table.Td ta="center">
                      {(() => {
                        const brandResult = getQueryBrandResult(query.id);
                        if (!brandResult) return <Text size="xs" c="dimmed">-</Text>;
                        return brandResult.cited ? (
                          <Badge color="teal" size="sm" leftSection={<IconCheck size={10} />}>인용</Badge>
                        ) : (
                          <Badge color="gray" size="sm" leftSection={<IconX size={10} />}>미인용</Badge>
                        );
                      })()}
                    </Table.Td>
                  )}
                  <Table.Td>
                    <Badge color={frequencyColors[query.frequency]} variant="light" size="sm">
                      {frequencyLabels[query.frequency]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {query.lastTested
                        ? new Date(query.lastTested).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </Text>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Switch checked={query.isActive} onChange={() => handleToggleActive(query.id)} size="sm" />
                  </Table.Td>
                  <Table.Td ta="center">
                    <Group gap="xs" justify="center">
                      {testingId === query.id && testingEngine === 'gpt' ? (
                        <Loader size="sm" color="teal" />
                      ) : (
                        <ActionIcon variant="light" color="teal" onClick={() => handleTestQuery(query, 'gpt')} disabled={testingId !== null} title="ChatGPT에서 테스트">
                          <IconBrandOpenai size={16} />
                        </ActionIcon>
                      )}
                      <ActionIcon variant="light" color="blue" onClick={openGeminiNotice} title="Gemini에서 테스트">
                        <IconSparkles size={16} />
                      </ActionIcon>
                      <Menu shadow="md" width={180}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={16} /></ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconLink size={14} />} onClick={() => handleOpenBrandModal(query)}>
                            브랜드 연결
                            {query.brandIds && query.brandIds.length > 0 && <Badge size="xs" ml="xs">{query.brandIds.length}</Badge>}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(query.id)}>삭제</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          /* Card view */
          <Grid>
            {filteredQueries.map((query) => (
              <Grid.Col key={query.id} span={{ base: 12, sm: 6, lg: 4 }}>
                <Card withBorder radius="md" padding="md">
                  <Group justify="space-between" mb="xs">
                    <Badge variant="light" size="sm">{query.category}</Badge>
                    <Badge color={frequencyColors[query.frequency]} variant="light" size="sm">
                      {frequencyLabels[query.frequency]}
                    </Badge>
                  </Group>
                  <Text size="sm" fw={500} lineClamp={2} mb="xs">{query.query}</Text>
                  {query.brandIds && query.brandIds.length > 0 && (
                    <Group gap={4} mb="xs">
                      {query.brandIds.map((bid) => {
                        const brand = brands.find((b) => b.id === bid);
                        return brand ? <Badge key={bid} size="xs" variant="outline" color="violet">{brand.name}</Badge> : null;
                      })}
                    </Group>
                  )}
                  <Text size="xs" c="dimmed" mb="sm">
                    마지막 테스트: {query.lastTested
                      ? new Date(query.lastTested).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '-'}
                  </Text>
                  <Divider mb="sm" />
                  <Group justify="space-between">
                    <Switch checked={query.isActive} onChange={() => handleToggleActive(query.id)} size="sm" label={query.isActive ? '활성' : '비활성'} />
                    <Group gap="xs">
                      {testingId === query.id && testingEngine === 'gpt' ? (
                        <Loader size="sm" color="teal" />
                      ) : (
                        <ActionIcon variant="light" color="teal" onClick={() => handleTestQuery(query, 'gpt')} disabled={testingId !== null} size="sm">
                          <IconBrandOpenai size={14} />
                        </ActionIcon>
                      )}
                      <ActionIcon variant="light" color="blue" onClick={openGeminiNotice} size="sm">
                        <IconSparkles size={14} />
                      </ActionIcon>
                      <Menu shadow="md" width={180}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray" size="sm"><IconDotsVertical size={14} /></ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconLink size={14} />} onClick={() => handleOpenBrandModal(query)}>브랜드 연결</Menu.Item>
                          <Menu.Divider />
                          <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDelete(query.id)}>삭제</Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}

        {filteredQueries.length === 0 && queries.length > 0 && (
          <Text c="dimmed" ta="center" py="xl">검색 결과가 없습니다</Text>
        )}
      </Paper>

      {/* Add query modal */}
      <Modal opened={opened} onClose={close} title="새 쿼리 추가" centered size="md" lockScroll={false}>
        <Stack gap="md">
          <Textarea
            label="쿼리"
            placeholder="한 줄에 하나씩 입력하면 여러 쿼리를 동시에 추가할 수 있습니다"
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
              <Text size="sm" fw={500}>브랜드 연결 (선택)</Text>
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

      {/* Test result detail modal */}
      <Modal opened={resultModalOpened} onClose={closeResultModal} title="테스트 결과" size="lg" centered lockScroll={false}>
        {latestResult && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">쿼리</Text>
                <Text fw={500}>{latestResult.query}</Text>
              </div>
              <Badge color={latestResult.engine === 'gemini' ? 'blue' : 'teal'} variant="filled" size="lg">
                {AI_ENGINES.find((e) => e.value === latestResult.engine)?.label || latestResult.engine}
              </Badge>
            </Group>
            <div>
              <Text size="sm" c="dimmed" mb="xs">브랜드별 인용 여부</Text>
              <Stack gap="xs">
                {latestResult.brandResults?.map((br) => (
                  <Group key={br.brandId} justify="space-between" p="xs" style={{ background: 'var(--mantine-color-gray-1)', borderRadius: 8 }}>
                    <Text fw={500}>{br.brandName}</Text>
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

      {/* Brand link modal */}
      <Modal opened={brandModalOpened} onClose={closeBrandModal} title="브랜드 연결" centered lockScroll={false}>
        <Stack gap="md">
          <Text size="sm" c="dimmed">이 쿼리를 연결할 브랜드를 선택하세요.</Text>
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
            <Text fw={500}>추후 지원 예정입니다</Text>
          </Group>
          <Text size="sm" c="dimmed">Gemini API 연동 기능은 현재 개발 중이며, 곧 지원될 예정입니다.</Text>
          <Group justify="flex-end">
            <Button onClick={closeGeminiNotice}>확인</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
