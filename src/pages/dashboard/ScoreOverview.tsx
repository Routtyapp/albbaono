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
  IconListDetails,
  IconClipboard,
} from '@tabler/icons-react';
import {
  analyzeGeoScore,
  checkGeoScoreHealth,
  downloadGeoScorePdf,
  type GeoScoreResult,
  type Recommendation,
  type SiteType,
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

const SITE_TYPE_OPTIONS = [
  { value: 'general', label: '일반 (모든 스키마 평가)' },
  { value: 'ecommerce', label: '쇼핑몰 (Product, FAQ, Review)' },
  { value: 'blog', label: '블로그 (FAQ, HowTo)' },
  { value: 'corporate', label: '기업/서비스 (FAQ)' },
  { value: 'portfolio', label: '포트폴리오 (스키마 면제)' },
];

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
  const [siteType, setSiteType] = useState<SiteType>('general');
  const [copiedBrief, setCopiedBrief] = useState<'developer' | 'marketer' | null>(null);

  useEffect(() => {
    checkGeoScoreHealth()
      .then(() => setServiceAvailable(true))
      .catch(() => setServiceAvailable(false));
  }, []);

  const handleDownloadPdf = async () => {
    if (!result) return;

    setIsDownloading(true);
    try {
      const blob = await downloadGeoScorePdf(result);

      let domain = 'site';
      try {
        const urlObj = new URL(result.url);
        domain = urlObj.hostname.replace(/\./g, '_');
      } catch {}

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `GEO_Score_${domain}_${result.grade}_${result.totalScore}.pdf`;
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

    try {
      const data = await analyzeGeoScore({
        url: url.trim(),
        options: {
          includeSubpages,
          maxSubpages: typeof maxSubpages === 'number' ? maxSubpages : 10,
          siteType,
        },
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리별 통계
  const categoryStats = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.categories).map(([key, cat]) => ({
      key,
      label: CATEGORY_LABELS[key] || key,
      score: cat.score,
      maxScore: cat.maxScore,
      percentage: cat.percentage,
      passedItems: cat.items.filter((i) => i.passed).length,
      totalItems: cat.items.length,
    }));
  }, [result]);

  // 권장사항 우선순위별 그룹화
  const recommendationsByPriority = useMemo(() => {
    if (!result) return { high: [], medium: [], low: [] };
    const recs = result.recommendations;
    return {
      high: recs.filter((r) => r.priority === 'high'),
      medium: recs.filter((r) => r.priority === 'medium'),
      low: recs.filter((r) => r.priority === 'low'),
    };
  }, [result]);

  const ROLE_CATEGORIES: Record<'developer' | 'marketer', string[]> = {
    developer: ['structure', 'schema', 'url'],
    marketer: ['meta', 'content'],
  };

  const ROLE_LABELS: Record<'developer' | 'marketer', string> = {
    developer: '개발자',
    marketer: '마케터',
  };

  const PRIORITY_LABELS: Record<string, { emoji: string; label: string }> = {
    high: { emoji: '🔴', label: '높은 우선순위' },
    medium: { emoji: '🟡', label: '중간 우선순위' },
    low: { emoji: '🟢', label: '낮은 우선순위' },
  };

  const generateBrief = async (role: 'developer' | 'marketer') => {
    if (!result) return;

    const categories = ROLE_CATEGORIES[role];
    const recs = result.recommendations.filter((r) =>
      categories.includes(r.category)
    );

    const date = new Date(result.analyzedAt).toLocaleDateString('ko-KR');
    const lines: string[] = [
      `📋 GEO 스코어 개선 요청서 (${ROLE_LABELS[role]}용)`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `🔗 분석 URL: ${result.url}`,
      `📊 현재 점수: ${result.totalScore}점 (${result.grade}등급)`,
      `📅 분석일: ${date}`,
      '',
    ];

    if (recs.length === 0) {
      lines.push('✅ 모든 항목이 양호합니다. 추가 개선이 필요하지 않습니다.');
    } else {
      const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      for (const priority of priorities) {
        const group = recs.filter((r) => r.priority === priority);
        if (group.length === 0) continue;

        const { emoji, label } = PRIORITY_LABELS[priority];
        lines.push(`${emoji} ${label}`);
        lines.push('──────────────');
        group.forEach((rec, idx) => {
          const catLabel = CATEGORY_LABELS[rec.category] || rec.category;
          lines.push(`${idx + 1}. [${catLabel}] ${rec.issue}`);
          lines.push(`   → ${rec.suggestion}`);
          lines.push(`   💡 예상 효과: ${rec.impact}`);
          lines.push('');
        });
      }
    }

    await navigator.clipboard.writeText(lines.join('\n'));
    setCopiedBrief(role);
    setTimeout(() => setCopiedBrief(null), 2000);
  };

  // 결과 없고 로딩 아닐 때: 중앙 배치 히어로 스타일
  if (!result && !loading) {
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

        <Center style={{ minHeight: 'calc(100vh - 120px)' }}>
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
              <Select
                value={siteType}
                onChange={(val) => setSiteType((val as SiteType) || 'general')}
                data={SITE_TYPE_OPTIONS}
                size="xs"
                w={260}
                mt={4}
                label="사이트 유형"
                styles={{ label: { fontSize: 11, color: 'var(--mantine-color-dimmed)' } }}
              />
            </Box>

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
      {result && (
        <Stack gap="lg">
          {/* 요약 카드 */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">종합 점수</Text>
                <Badge color={GRADE_COLORS[result.grade]} size="lg">
                  {result.grade}
                </Badge>
              </Group>
              <Text size="xl">{result.totalScore}</Text>
              <Text size="xs" c="dimmed">/ 100점</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">분석 페이지</Text>
              <Text size="xl">{result.pages.length}</Text>
              <Text size="xs" c="dimmed">개 페이지</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">개선 필요 항목</Text>
              <Text size="xl" c="red">{result.recommendations.length}</Text>
              <Text size="xs" c="dimmed">개 항목</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Text size="sm" c="dimmed" mb="xs">분석 일시</Text>
              <Text size="md">
                {new Date(result.analyzedAt).toLocaleDateString('ko-KR')}
              </Text>
              <Text size="xs" c="dimmed">
                {new Date(result.analyzedAt).toLocaleTimeString('ko-KR')}
              </Text>
            </Paper>
          </SimpleGrid>

          {/* URL 정보 + 액션 */}
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs" style={{ overflow: 'hidden', flex: 1 }}>
                <IconExternalLink size={16} />
                <Text size="sm" truncate>{result.url}</Text>
              </Group>
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
                권장사항 ({result.recommendations.length})
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
                {result.pages.length > 1 && (
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
                        {result.pages.map((page, idx) => (
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
                {Object.entries(result.categories).map(([key, category]) => (
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
                <Group gap="sm">
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={copiedBrief === 'developer' ? <IconCheck size={14} /> : <IconClipboard size={14} />}
                    color={copiedBrief === 'developer' ? 'green' : 'blue'}
                    onClick={() => generateBrief('developer')}
                  >
                    {copiedBrief === 'developer' ? '복사됨!' : '개발자용 요청서 복사'}
                  </Button>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={copiedBrief === 'marketer' ? <IconCheck size={14} /> : <IconClipboard size={14} />}
                    color={copiedBrief === 'marketer' ? 'green' : 'violet'}
                    onClick={() => generateBrief('marketer')}
                  >
                    {copiedBrief === 'marketer' ? '복사됨!' : '마케터용 요청서 복사'}
                  </Button>
                </Group>

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

                {result.recommendations.length === 0 && (
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
