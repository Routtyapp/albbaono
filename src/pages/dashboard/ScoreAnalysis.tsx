import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Title,
  Text,
  Paper,
  Center,
  Group,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Progress,
  Table,
  Button,
  Select,
  Alert,
  Tabs,
  RingProgress,
  Divider,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconChartDots3,
  IconFileTypePdf,
  IconTrash,
  IconRefresh,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconExternalLink,
  IconHistory,
  IconChartBar,
  IconListDetails,
  IconBulb,
} from '@tabler/icons-react';
import {
  downloadGeoScorePdf,
  getGeoScoreHistory,
  clearGeoScoreHistory,
  type GeoScoreHistoryItem,
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

export function ScoreAnalysis() {
  const [searchParams] = useSearchParams();
  const [history, setHistory] = useState<GeoScoreHistoryItem[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  // URL 파라미터가 있으면 해당 URL 선택
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && history.length > 0) {
      const found = history.find((h) => h.url === urlParam);
      if (found) {
        setSelectedUrl(urlParam);
      }
    }
  }, [searchParams, history]);

  const loadHistory = async () => {
    try {
      const { scores } = await getGeoScoreHistory();
      setHistory(scores);

      // URL 파라미터가 없을 때만 첫 번째 항목 선택
      const urlParam = searchParams.get('url');
      if (scores.length > 0 && !urlParam) {
        setSelectedUrl(scores[0].url);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const selectedResult = useMemo(() => {
    if (!selectedUrl) return null;
    return history.find((h) => h.url === selectedUrl) || null;
  }, [history, selectedUrl]);

  const urlOptions = useMemo(() => {
    return history.map((h) => {
      let domain = h.url;
      try {
        const urlObj = new URL(h.url);
        domain = urlObj.hostname;
      } catch {}
      return {
        value: h.url,
        label: `${domain} (${h.grade} - ${h.totalScore}점)`,
      };
    });
  }, [history]);

  const handleDownloadPdf = async () => {
    if (!selectedResult) return;

    setIsDownloading(true);
    setError(null);
    try {
      const blob = await downloadGeoScorePdf(selectedResult);

      let domain = 'site';
      try {
        const urlObj = new URL(selectedResult.url);
        domain = urlObj.hostname.replace(/\./g, '_');
      } catch {}

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GEO_Score_${domain}_${selectedResult.grade}_${selectedResult.totalScore}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 다운로드에 실패했습니다');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearGeoScoreHistory();
      setHistory([]);
      setSelectedUrl(null);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    if (!selectedResult) return [];
    return Object.entries(selectedResult.categories).map(([key, cat]) => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      score: cat.score,
      maxScore: cat.maxScore,
      percentage: cat.percentage,
      passedItems: cat.items.filter((i) => i.passed).length,
      totalItems: cat.items.length,
    }));
  }, [selectedResult]);

  // 권장사항 우선순위별 그룹화
  const recommendationsByPriority = useMemo(() => {
    if (!selectedResult) return { high: [], medium: [], low: [] };
    const recs = selectedResult.recommendations;
    return {
      high: recs.filter((r) => r.priority === 'high'),
      medium: recs.filter((r) => r.priority === 'medium'),
      low: recs.filter((r) => r.priority === 'low'),
    };
  }, [selectedResult]);

  if (history.length === 0) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>성과 분석</Title>
            <Text c="dimmed" size="sm">
              GEO Score의 상세 성과를 분석합니다
            </Text>
          </div>
        </Group>

        <Paper p="xl" radius="md" withBorder>
          <Center py={60}>
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="xl" variant="light" color="blue">
                <IconChartDots3 size={40} />
              </ThemeIcon>
              <Title order={3}>분석 데이터가 없습니다</Title>
              <Text c="dimmed" ta="center" maw={400}>
                GEO Score에서 사이트를 분석하면 이곳에서 상세 성과를 확인할 수 있습니다.
              </Text>
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={loadHistory}
              >
                새로고침
              </Button>
            </Stack>
          </Center>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>성과 분석</Title>
          <Text c="dimmed" size="sm">
            GEO Score의 상세 성과를 분석합니다
          </Text>
        </div>
        <Group gap="sm">
          <Select
            placeholder="분석 결과 선택"
            data={urlOptions}
            value={selectedUrl}
            onChange={setSelectedUrl}
            w={300}
            size="sm"
            leftSection={<IconHistory size={16} />}
          />
          <Button
            variant="light"
            color="red"
            leftSection={<IconFileTypePdf size={16} />}
            onClick={handleDownloadPdf}
            loading={isDownloading}
            disabled={!selectedResult}
          >
            PDF 다운로드
          </Button>
          <Tooltip label="히스토리 삭제">
            <ActionIcon variant="light" color="gray" onClick={handleClearHistory}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {selectedResult && (
        <Stack gap="lg">
          {/* 요약 카드 */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">종합 점수</Text>
                <Badge color={GRADE_COLORS[selectedResult.grade]} size="lg">
                  {selectedResult.grade}
                </Badge>
              </Group>
              <Text size="xl" fw={700}>{selectedResult.totalScore}</Text>
              <Text size="xs" c="dimmed">/ 100점</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">분석 페이지</Text>
              <Text size="xl" fw={700}>{selectedResult.pages.length}</Text>
              <Text size="xs" c="dimmed">개 페이지</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">개선 필요 항목</Text>
              <Text size="xl" fw={700} c="red">{selectedResult.recommendations.length}</Text>
              <Text size="xs" c="dimmed">개 항목</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">분석 일시</Text>
              <Text size="md" fw={500}>
                {new Date(selectedResult.analyzedAt).toLocaleDateString('ko-KR')}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(selectedResult.analyzedAt).toLocaleTimeString('ko-KR')}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* URL 정보 */}
          <Paper p="md" radius="md" withBorder bg="gray.0">
            <Group gap="xs">
              <IconExternalLink size={16} />
              <Text size="sm" fw={500}>{selectedResult.url}</Text>
            </Group>
          </Paper>

          {/* 탭 구성 */}
          <Tabs defaultValue="overview">
            <Tabs.List>
              <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
                개요
              </Tabs.Tab>
              <Tabs.Tab value="details" leftSection={<IconListDetails size={16} />}>
                상세 분석
              </Tabs.Tab>
              <Tabs.Tab value="recommendations" leftSection={<IconBulb size={16} />}>
                권장사항 ({selectedResult.recommendations.length})
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
                      <Paper key={cat.key} p="md" radius="md" bg="gray.1">
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
                              <Text size="sm" fw={700} ta="center">
                                {cat.percentage}%
                              </Text>
                            }
                          />
                          <Text size="sm" fw={600}>{cat.label}</Text>
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
                {selectedResult.pages.length > 1 && (
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
                        {selectedResult.pages.map((page, idx) => (
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
                {Object.entries(selectedResult.categories).map(([key, category]) => (
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
                            <Table.Td fw={500}>{item.name}</Table.Td>
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
                        <Paper key={idx} p="md" bg="gray.1" radius="sm">
                          <Group justify="space-between" mb="xs">
                            <Badge size="xs" variant="outline">
                              {CATEGORY_LABELS[rec.category] || rec.category}
                            </Badge>
                            <Text size="xs" c="green">{rec.impact}</Text>
                          </Group>
                          <Text size="sm" fw={500} mb="xs">{rec.issue}</Text>
                          <Divider my="xs" />
                          <Text size="xs" c="dimmed">{rec.suggestion}</Text>
                        </Paper>
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
                        <Paper key={idx} p="md" bg="gray.1" radius="sm">
                          <Group justify="space-between" mb="xs">
                            <Badge size="xs" variant="outline">
                              {CATEGORY_LABELS[rec.category] || rec.category}
                            </Badge>
                            <Text size="xs" c="green">{rec.impact}</Text>
                          </Group>
                          <Text size="sm" fw={500} mb="xs">{rec.issue}</Text>
                          <Divider my="xs" />
                          <Text size="xs" c="dimmed">{rec.suggestion}</Text>
                        </Paper>
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
                        <Paper key={idx} p="md" bg="gray.1" radius="sm">
                          <Group justify="space-between" mb="xs">
                            <Badge size="xs" variant="outline">
                              {CATEGORY_LABELS[rec.category] || rec.category}
                            </Badge>
                            <Text size="xs" c="green">{rec.impact}</Text>
                          </Group>
                          <Text size="sm" fw={500} mb="xs">{rec.issue}</Text>
                          <Divider my="xs" />
                          <Text size="xs" c="dimmed">{rec.suggestion}</Text>
                        </Paper>
                      ))}
                    </Stack>
                  </Paper>
                )}

                {selectedResult.recommendations.length === 0 && (
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
