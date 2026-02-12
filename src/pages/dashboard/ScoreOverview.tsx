import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Text,
  Paper,
  Group,
  Badge,
  TextInput,
  Button,
  ActionIcon,
  Progress,
  SimpleGrid,
  ThemeIcon,
  Alert,
  Switch,
  NumberInput,
  Divider,
  RingProgress,
  Center,
  Box,
  Title,
  Tabs,
  Table,
  Tooltip,
  Select,
} from '@mantine/core';
import {
  IconSearch,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconBulb,
  IconWorld,
  IconChartBar,
  IconExternalLink,
  IconFileTypePdf,
  IconArrowRight,
  IconListDetails,
  IconHistory,
  IconTrash,
} from '@tabler/icons-react';
import {
  analyzeGeoScore,
  checkGeoScoreHealth,
  downloadGeoScorePdf,
  getGeoScoreHistory,
  saveGeoScoreHistory,
  clearGeoScoreHistory,
  type GeoScoreResult,
  type GeoScoreHistoryItem,
  type Recommendation,
} from '../../services/api';

const GRADE_COLORS: Record<string, string> = {
  'A+': 'teal',
  A: 'green',
  'B+': 'lime',
  B: 'yellow',
  'C+': 'orange',
  C: 'orange',
  D: 'red',
  F: 'red',
};

const CATEGORY_LABELS: Record<string, string> = {
  structure: '구조',
  schema: '스키마',
  url: 'URL',
  meta: '메타태그',
  content: '콘텐츠',
};

export function ScoreOverview() {
  const [url, setUrl] = useState('');
  const [includeSubpages, setIncludeSubpages] = useState(true);
  const [maxSubpages, setMaxSubpages] = useState<number | ''>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeoScoreResult | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState<GeoScoreHistoryItem[]>([]);
  // 히스토리에서 선택한 결과를 보여주는 모드
  const [selectedHistoryUrl, setSelectedHistoryUrl] = useState<string | null>(null);

  useEffect(() => {
    checkGeoScoreHealth()
      .then(() => setServiceAvailable(true))
      .catch(() => setServiceAvailable(false));

    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { scores } = await getGeoScoreHistory();
      setHistory(scores);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  // 현재 표시할 결과 (새 분석 결과 or 히스토리에서 선택한 결과)
  const displayResult = useMemo(() => {
    if (result) return result;
    if (selectedHistoryUrl) {
      return history.find((h) => h.url === selectedHistoryUrl) || null;
    }
    return null;
  }, [result, selectedHistoryUrl, history]);

  const handleLoadFromHistory = (item: GeoScoreHistoryItem) => {
    setResult(null);
    setSelectedHistoryUrl(item.url);
  };

  const handleClearHistory = async () => {
    try {
      await clearGeoScoreHistory();
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleDownloadPdf = async () => {
    if (!displayResult) return;

    setIsDownloading(true);
    try {
      const blob = await downloadGeoScorePdf(displayResult);

      let domain = 'site';
      try {
        const urlObj = new URL(displayResult.url);
        domain = urlObj.hostname.replace(/\./g, '_');
      } catch {}

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `GEO_Score_${domain}_${displayResult.grade}_${displayResult.totalScore}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 다운로드에 실패했습니다');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedHistoryUrl(null);

    try {
      const data = await analyzeGeoScore({
        url: url.trim(),
        options: {
          includeSubpages,
          maxSubpages: typeof maxSubpages === 'number' ? maxSubpages : 10,
        },
      });
      setResult(data);

      const savedItem = await saveGeoScoreHistory(data);
      setHistory((prev) => [savedItem, ...prev.filter((h) => h.url !== data.url)].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    if (!displayResult) return [];
    return Object.entries(displayResult.categories).map(([key, cat]) => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      score: cat.score,
      maxScore: cat.maxScore,
      percentage: cat.percentage,
      passedItems: cat.items.filter((i) => i.passed).length,
      totalItems: cat.items.length,
    }));
  }, [displayResult]);

  // 권장사항 우선순위별 그룹화
  const recommendationsByPriority = useMemo(() => {
    if (!displayResult) return { high: [], medium: [], low: [] };
    const recs = displayResult.recommendations;
    return {
      high: recs.filter((r) => r.priority === 'high'),
      medium: recs.filter((r) => r.priority === 'medium'),
      low: recs.filter((r) => r.priority === 'low'),
    };
  }, [displayResult]);

  // 히스토리 셀렉트 옵션
  const historySelectOptions = useMemo(() => {
    return history.map((h) => {
      let domain = h.url;
      try {
        domain = new URL(h.url).hostname;
      } catch {}
      return {
        value: h.url,
        label: `${domain} (${h.grade} - ${h.totalScore}점)`,
      };
    });
  }, [history]);

  // 결과 없고 로딩 아닐 때: 중앙 배치 히어로 스타일
  if (!displayResult && !loading) {
    return (
      <Stack gap="lg">
        {serviceAvailable === false && (
          <Alert color="yellow" icon={<IconAlertTriangle />}>
            GEO Score 분석 서버에 연결할 수 없습니다.
          </Alert>
        )}

        {error && (
          <Alert color="red" icon={<IconX />} withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Center style={{ minHeight: 'calc(100vh - 300px)' }}>
          <Stack align="center" gap="xl" w="100%" maw={640} px="md">
            <Text size="xl" ta="center" c="dimmed">
              웹사이트의 AI 최적화 점수를 분석하세요
            </Text>

            <Box w="100%">
              <TextInput
                placeholder="https://example.com"
                leftSection={<IconWorld size={18} />}
                rightSection={
                  <ActionIcon
                    variant="filled"
                    radius="xl"
                    size="md"
                    onClick={handleAnalyze}
                    disabled={loading || !serviceAvailable || !url.trim()}
                    loading={loading}
                  >
                    <IconSearch size={16} />
                  </ActionIcon>
                }
                rightSectionWidth={42}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && url.trim()) handleAnalyze();
                }}
                size="lg"
                radius="xl"
                disabled={loading}
                styles={{
                  input: {
                    border: '1px solid var(--mantine-color-default-border)',
                    backgroundColor: 'var(--mantine-color-body)',
                  },
                }}
              />

              <Group justify="center" mt="sm" gap="xs">
                <Switch
                  label="서브페이지 포함"
                  checked={includeSubpages}
                  onChange={(e) => setIncludeSubpages(e.currentTarget.checked)}
                  size="xs"
                />
                {includeSubpages && (
                  <NumberInput
                    value={maxSubpages}
                    onChange={(val) => setMaxSubpages(val === '' ? '' : Number(val))}
                    min={1}
                    max={50}
                    w={80}
                    size="xs"
                    suffix="페이지"
                  />
                )}
              </Group>
            </Box>

            {/* 최근 분석 히스토리 */}
            {history.length > 0 && (
              <Box w="100%">
                <Group justify="space-between" mb="xs">
                  <Text size="xs" c="dimmed">최근 분석</Text>
                  <Button
                    variant="subtle"
                    color="red"
                    size="compact-xs"
                    onClick={handleClearHistory}
                  >
                    전체 삭제
                  </Button>
                </Group>
                <Stack gap={6}>
                  {history.slice(0, 5).map((item, idx) => (
                    <Paper
                      key={idx}
                      p="xs"
                      withBorder
                      radius="sm"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleLoadFromHistory(item)}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Box style={{ overflow: 'hidden', flex: 1 }}>
                          <Text size="sm" truncate>
                            {(() => {
                              try { return new URL(item.url).hostname; } catch { return item.url; }
                            })()}
                          </Text>
                        </Box>
                        <Group gap="xs" wrap="nowrap">
                          <Badge color={GRADE_COLORS[item.grade]} size="xs">
                            {item.grade}
                          </Badge>
                          <Badge variant="light" size="xs">
                            {item.totalScore}점
                          </Badge>
                          <IconArrowRight size={12} color="gray" />
                        </Group>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </Center>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      {/* 입력 바 (결과가 있을 때는 상단 고정) */}
      <Box>
        <TextInput
          placeholder="https://example.com"
          leftSection={<IconWorld size={18} />}
          rightSection={
            <ActionIcon
              variant="filled"
              radius="xl"
              size="md"
              onClick={handleAnalyze}
              disabled={loading || !serviceAvailable || !url.trim()}
              loading={loading}
            >
              <IconSearch size={16} />
            </ActionIcon>
          }
          rightSectionWidth={42}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && url.trim()) handleAnalyze();
          }}
          size="md"
          radius="xl"
          disabled={loading}
          styles={{
            input: {
              border: '1px solid var(--mantine-color-default-border)',
              backgroundColor: 'var(--mantine-color-body)',
            },
          }}
        />
      </Box>

      {error && (
        <Alert color="red" icon={<IconX />} withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 분석 결과 */}
      {displayResult && (
        <Stack gap="lg">
          {/* 요약 카드 */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">종합 점수</Text>
                <Badge color={GRADE_COLORS[displayResult.grade]} size="lg">
                  {displayResult.grade}
                </Badge>
              </Group>
              <Text size="xl">{displayResult.totalScore}</Text>
              <Text size="xs" c="dimmed">/ 100점</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">분석 페이지</Text>
              <Text size="xl">{displayResult.pages.length}</Text>
              <Text size="xs" c="dimmed">개 페이지</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">개선 필요 항목</Text>
              <Text size="xl" c="red">{displayResult.recommendations.length}</Text>
              <Text size="xs" c="dimmed">개 항목</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">분석 일시</Text>
              <Text size="md">
                {new Date(displayResult.analyzedAt).toLocaleDateString('ko-KR')}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(displayResult.analyzedAt).toLocaleTimeString('ko-KR')}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* URL 정보 + 액션 */}
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs" style={{ overflow: 'hidden', flex: 1 }}>
                <IconExternalLink size={16} />
                <Text size="sm" truncate>{displayResult.url}</Text>
              </Group>
              <Group gap="sm" wrap="nowrap">
                {history.length > 1 && (
                  <Select
                    placeholder="다른 분석 결과 보기"
                    data={historySelectOptions}
                    value={selectedHistoryUrl || displayResult.url}
                    onChange={(val) => {
                      if (val) {
                        setResult(null);
                        setSelectedHistoryUrl(val);
                      }
                    }}
                    w={240}
                    size="xs"
                    leftSection={<IconHistory size={14} />}
                  />
                )}
                <Button
                  variant="light"
                  color="red"
                  size="xs"
                  leftSection={<IconFileTypePdf size={14} />}
                  onClick={handleDownloadPdf}
                  loading={isDownloading}
                >
                  PDF
                </Button>
                <Tooltip label="히스토리 삭제">
                  <ActionIcon variant="light" color="gray" size="sm" onClick={handleClearHistory}>
                    <IconTrash size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Group>
          </Paper>

          {/* 탭: 개요 / 상세 분석 / 권장사항 */}
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
                개요
              </Tabs.Tab>
              <Tabs.Tab value="details" leftSection={<IconListDetails size={16} />}>
                상세 분석
              </Tabs.Tab>
              <Tabs.Tab value="recommendations" leftSection={<IconBulb size={16} />}>
                권장사항 ({displayResult.recommendations.length})
              </Tabs.Tab>
            </Tabs.List>

            {/* 개요 탭 */}
            <Tabs.Panel value="overview" pt="md">
              <Stack gap="md">
                {/* 카테고리별 점수 */}
                <Paper p="lg" radius="md" withBorder>
                  <Title order={4} mb="md">카테고리별 점수</Title>
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
                    {categoryStats.map((cat) => (
                      <Paper key={cat.key} p="md" radius="md" bg="var(--mantine-color-default-hover)">
                        <Stack align="center" gap="xs">
                          <RingProgress
                            size={80}
                            thickness={8}
                            roundCaps
                            sections={[
                              {
                                value: cat.percentage,
                                color: cat.percentage >= 70 ? 'green' : cat.percentage >= 50 ? 'yellow' : 'red',
                              },
                            ]}
                            label={
                              <Text size="sm" ta="center">
                                {cat.percentage}%
                              </Text>
                            }
                          />
                          <Text size="sm">{cat.label}</Text>
                          <Text size="xs" c="dimmed">
                            {cat.score}/{cat.maxScore}점
                          </Text>
                        </Stack>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Paper>

                {/* 항목별 통과율 */}
                <Paper p="lg" radius="md" withBorder>
                  <Title order={4} mb="md">항목별 통과율</Title>
                  <Stack gap="sm">
                    {categoryStats.map((cat) => (
                      <Group key={cat.key} gap="sm" wrap="nowrap">
                        <Text size="sm" w={80}>{cat.label}</Text>
                        <Progress.Root size="lg" style={{ flex: 1 }}>
                          <Progress.Section
                            value={(cat.passedItems / cat.totalItems) * 100}
                            color="green"
                          >
                            <Progress.Label>
                              {cat.passedItems}/{cat.totalItems} 통과
                            </Progress.Label>
                          </Progress.Section>
                        </Progress.Root>
                        <Badge
                          color={cat.passedItems === cat.totalItems ? 'green' : 'yellow'}
                          variant="light"
                          w={60}
                        >
                          {Math.round((cat.passedItems / cat.totalItems) * 100)}%
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                </Paper>

                {/* 페이지별 점수 */}
                {displayResult.pages.length > 1 && (
                  <Paper p="lg" radius="md" withBorder>
                    <Title order={4} mb="md">페이지별 점수</Title>
                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>페이지</Table.Th>
                          <Table.Th ta="center">구조</Table.Th>
                          <Table.Th ta="center">스키마</Table.Th>
                          <Table.Th ta="center">URL</Table.Th>
                          <Table.Th ta="center">메타</Table.Th>
                          <Table.Th ta="center">콘텐츠</Table.Th>
                          <Table.Th ta="center">총점</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {displayResult.pages.map((page, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td maw={200}>
                              <Text size="sm" lineClamp={1}>
                                {page.title || '제목 없음'}
                              </Text>
                            </Table.Td>
                            <Table.Td ta="center">{page.scores.structure}</Table.Td>
                            <Table.Td ta="center">{page.scores.schema}</Table.Td>
                            <Table.Td ta="center">{page.scores.url}</Table.Td>
                            <Table.Td ta="center">{page.scores.meta}</Table.Td>
                            <Table.Td ta="center">{page.scores.content}</Table.Td>
                            <Table.Td ta="center">
                              <Badge
                                color={page.scores.total >= 70 ? 'green' : page.scores.total >= 50 ? 'yellow' : 'red'}
                              >
                                {page.scores.total}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                )}
              </Stack>
            </Tabs.Panel>

            {/* 상세 분석 탭 */}
            <Tabs.Panel value="details" pt="md">
              <Stack gap="md">
                {Object.entries(displayResult.categories).map(([key, category]) => (
                  <Paper key={key} p="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="md">
                      <Group gap="xs">
                        <Title order={4}>{CATEGORY_LABELS[key] || key}</Title>
                        <Badge
                          color={category.percentage >= 70 ? 'green' : category.percentage >= 50 ? 'yellow' : 'red'}
                        >
                          {category.percentage}%
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {category.score}/{category.maxScore}점
                      </Text>
                    </Group>

                    <Table striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>항목</Table.Th>
                          <Table.Th ta="center">점수</Table.Th>
                          <Table.Th ta="center">결과</Table.Th>
                          <Table.Th>상세</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {category.items.map((item, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td>{item.name}</Table.Td>
                            <Table.Td ta="center">
                              {item.score}/{item.maxScore}
                            </Table.Td>
                            <Table.Td ta="center">
                              <ThemeIcon
                                color={item.passed ? 'green' : 'red'}
                                size="sm"
                                radius="xl"
                                variant="light"
                              >
                                {item.passed ? <IconCheck size={12} /> : <IconX size={12} />}
                              </ThemeIcon>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs" c="dimmed">{item.detail}</Text>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                ))}
              </Stack>
            </Tabs.Panel>

            {/* 권장사항 탭 */}
            <Tabs.Panel value="recommendations" pt="md">
              <Stack gap="md">
                {recommendationsByPriority.high.length > 0 && (
                  <Paper p="lg" radius="md" withBorder>
                    <Group gap="xs" mb="md">
                      <Badge color="red" size="lg">높은 우선순위</Badge>
                      <Text size="sm" c="dimmed">즉시 개선이 필요합니다</Text>
                    </Group>
                    <Stack gap="sm">
                      {recommendationsByPriority.high.map((rec, idx) => (
                        <RecommendationCard key={idx} recommendation={rec} />
                      ))}
                    </Stack>
                  </Paper>
                )}

                {recommendationsByPriority.medium.length > 0 && (
                  <Paper p="lg" radius="md" withBorder>
                    <Group gap="xs" mb="md">
                      <Badge color="yellow" size="lg">중간 우선순위</Badge>
                      <Text size="sm" c="dimmed">개선하면 좋습니다</Text>
                    </Group>
                    <Stack gap="sm">
                      {recommendationsByPriority.medium.map((rec, idx) => (
                        <RecommendationCard key={idx} recommendation={rec} />
                      ))}
                    </Stack>
                  </Paper>
                )}

                {recommendationsByPriority.low.length > 0 && (
                  <Paper p="lg" radius="md" withBorder>
                    <Group gap="xs" mb="md">
                      <Badge color="blue" size="lg">낮은 우선순위</Badge>
                      <Text size="sm" c="dimmed">추가로 고려할 사항입니다</Text>
                    </Group>
                    <Stack gap="sm">
                      {recommendationsByPriority.low.map((rec, idx) => (
                        <RecommendationCard key={idx} recommendation={rec} />
                      ))}
                    </Stack>
                  </Paper>
                )}

                {displayResult.recommendations.length === 0 && (
                  <Paper p="xl" radius="md" withBorder>
                    <Center py={40}>
                      <Stack align="center" gap="md">
                        <ThemeIcon size={60} radius="xl" variant="light" color="green">
                          <IconCheck size={30} />
                        </ThemeIcon>
                        <Title order={4}>모든 항목이 양호합니다!</Title>
                        <Text c="dimmed" ta="center">
                          현재 사이트는 GEO 최적화가 잘 되어 있습니다.
                        </Text>
                      </Stack>
                    </Center>
                  </Paper>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </Stack>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityColor = {
    high: 'red',
    medium: 'yellow',
    low: 'blue',
  }[recommendation.priority];

  return (
    <Paper p="md" radius="sm" bg="var(--mantine-color-default-hover)">
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge size="xs" color={priorityColor}>
              {{
                high: '높음',
                medium: '중간',
                low: '낮음',
              }[recommendation.priority]}
            </Badge>
            <Badge size="xs" variant="outline">
              {CATEGORY_LABELS[recommendation.category] || recommendation.category}
            </Badge>
          </Group>
          <Text size="xs" c="green">
            {recommendation.impact}
          </Text>
        </Group>
        <Text size="sm">
          {recommendation.issue}
        </Text>
        <Divider />
        <Text size="xs" c="dimmed">
          {recommendation.suggestion}
        </Text>
      </Stack>
    </Paper>
  );
}
