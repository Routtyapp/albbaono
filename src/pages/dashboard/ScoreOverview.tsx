import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  TextInput,
  Button,
  Progress,
  SimpleGrid,
  Accordion,
  List,
  ThemeIcon,
  Loader,
  Alert,
  Switch,
  NumberInput,
  Divider,
  RingProgress,
  Center,
  Box,
} from '@mantine/core';
import {
  IconSearch,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconBulb,
  IconFileAnalytics,
  IconWorld,
  IconCode,
  IconLink,
  IconFileText,
  IconChartBar,
  IconExternalLink,
  IconFileTypePdf,
  IconHistory,
  IconTrash,
  IconArrowRight,
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
  type CategoryScore,
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

const CATEGORY_ICONS: Record<string, typeof IconCode> = {
  structure: IconFileText,
  schema: IconCode,
  url: IconLink,
  meta: IconFileAnalytics,
  content: IconChartBar,
};

const CATEGORY_LABELS: Record<string, string> = {
  structure: '구조',
  schema: '스키마',
  url: 'URL',
  meta: '메타태그',
  content: '콘텐츠',
};

export function ScoreOverview() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [includeSubpages, setIncludeSubpages] = useState(true);
  const [maxSubpages, setMaxSubpages] = useState<number | ''>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeoScoreResult | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [history, setHistory] = useState<GeoScoreHistoryItem[]>([]);

  useEffect(() => {
    checkGeoScoreHealth()
      .then(() => setServiceAvailable(true))
      .catch(() => setServiceAvailable(false));

    // 히스토리 로드 (API에서)
    getGeoScoreHistory()
      .then(({ scores }) => setHistory(scores))
      .catch((err) => console.error('Failed to load history:', err));
  }, []);

  const handleLoadFromHistory = (item: GeoScoreResult) => {
    // 성과 분석 페이지로 이동 (URL 파라미터로 전달)
    navigate(`/dashboard/score/analysis?url=${encodeURIComponent(item.url)}`);
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
    if (!result) return;

    setIsDownloading(true);
    try {
      const blob = await downloadGeoScorePdf(result);

      // 도메인 추출
      let domain = 'site';
      try {
        const urlObj = new URL(result.url);
        domain = urlObj.hostname.replace(/\./g, '_');
      } catch {}

      // 다운로드 트리거
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `GEO_Score_${domain}_${result.grade}_${result.totalScore}.pdf`;
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
        },
      });
      setResult(data);

      // 분석 결과를 서버에 저장 (히스토리)
      const savedItem = await saveGeoScoreHistory(data);
      // 히스토리 목록 갱신
      setHistory((prev) => [savedItem, ...prev.filter((h) => h.url !== data.url)].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>GEO Score</Title>
          <Text c="dimmed" size="sm">
            AI 검색 엔진 최적화 점수를 측정합니다
          </Text>
        </div>
        {serviceAvailable === false && (
          <Badge color="red" size="lg">
            서버 연결 필요
          </Badge>
        )}
        {serviceAvailable === true && (
          <Badge color="green" size="lg" variant="light">
            서비스 정상
          </Badge>
        )}
      </Group>

      {serviceAvailable === false && (
        <Alert color="yellow" icon={<IconAlertTriangle />}>
          GEO Score 백엔드 서버가 실행되지 않았습니다. <code>server</code> 폴더에서{' '}
          <code>npm install && npm run dev</code>를 실행해주세요.
        </Alert>
      )}

      {/* URL 입력 폼 */}
      <Paper p="lg" radius="md" withBorder>
        <Stack gap="md">
          <TextInput
            label="분석할 URL"
            placeholder="https://example.com"
            leftSection={<IconWorld size={16} />}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            size="md"
            disabled={loading}
          />

          <Group>
            <Switch
              label="서브페이지 포함 분석"
              checked={includeSubpages}
              onChange={(e) => setIncludeSubpages(e.currentTarget.checked)}
              disabled={loading}
            />
            {includeSubpages && (
              <NumberInput
                label="최대 서브페이지 수"
                value={maxSubpages}
                onChange={(val) => setMaxSubpages(val === '' ? '' : Number(val))}
                min={1}
                max={50}
                w={150}
                disabled={loading}
              />
            )}
          </Group>

          <Button
            leftSection={loading ? <Loader size={16} color="white" /> : <IconSearch size={16} />}
            onClick={handleAnalyze}
            disabled={loading || !serviceAvailable}
            size="md"
          >
            {loading ? '분석 중...' : '분석 시작'}
          </Button>
        </Stack>
      </Paper>

      {error && (
        <Alert color="red" icon={<IconX />}>
          {error}
        </Alert>
      )}

      {/* 결과가 없을 때: 소개 및 히스토리 */}
      {!result && !loading && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {/* GEO Score 소개 */}
          <Paper p="lg" radius="md" withBorder>
            <Group gap="xs" mb="md">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconFileAnalytics size={20} />
              </ThemeIcon>
              <Title order={4}>GEO Score란?</Title>
            </Group>
            <Text size="sm" c="dimmed" mb="md">
              웹사이트가 AI 검색 엔진(ChatGPT, Gemini, Perplexity 등)에 얼마나 최적화되어 있는지 측정합니다.
            </Text>
            <Stack gap="xs">
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="teal">
                  <IconFileText size={14} />
                </ThemeIcon>
                <Text size="sm">Structure - HTML 구조, 헤딩 계층</Text>
              </Group>
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="violet">
                  <IconCode size={14} />
                </ThemeIcon>
                <Text size="sm">Schema - 구조화된 데이터 마크업</Text>
              </Group>
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="blue">
                  <IconLink size={14} />
                </ThemeIcon>
                <Text size="sm">URL - URL 구조 및 가독성</Text>
              </Group>
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="orange">
                  <IconFileAnalytics size={14} />
                </ThemeIcon>
                <Text size="sm">Meta - 메타 태그 최적화</Text>
              </Group>
              <Group gap="xs">
                <ThemeIcon size="sm" variant="light" color="pink">
                  <IconChartBar size={14} />
                </ThemeIcon>
                <Text size="sm">Content - 콘텐츠 품질 및 구조</Text>
              </Group>
            </Stack>
          </Paper>

          {/* 최근 분석 히스토리 */}
          <Paper p="lg" radius="md" withBorder>
            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <ThemeIcon size="lg" variant="light" color="gray">
                  <IconHistory size={20} />
                </ThemeIcon>
                <Title order={4}>최근 분석</Title>
              </Group>
              {history.length > 0 && (
                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={<IconTrash size={14} />}
                  onClick={handleClearHistory}
                >
                  전체 삭제
                </Button>
              )}
            </Group>
            {history.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="xs">
                  <Text c="dimmed" size="sm">분석 히스토리가 없습니다</Text>
                  <Text c="dimmed" size="xs">URL을 입력하고 분석을 시작해보세요</Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="xs">
                {history.slice(0, 5).map((item, idx) => (
                  <Paper
                    key={idx}
                    p="sm"
                    withBorder
                    radius="sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleLoadFromHistory(item)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Box style={{ overflow: 'hidden', flex: 1 }}>
                        <Text size="sm" truncate>
                          {(() => {
                            try {
                              return new URL(item.url).hostname;
                            } catch {
                              return item.url;
                            }
                          })()}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(item.analyzedAt).toLocaleDateString('ko-KR')}
                        </Text>
                      </Box>
                      <Group gap="xs">
                        <Badge color={GRADE_COLORS[item.grade]} size="sm">
                          {item.grade}
                        </Badge>
                        <Badge variant="light" size="sm">
                          {item.totalScore}점
                        </Badge>
                        <IconArrowRight size={14} color="gray" />
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </SimpleGrid>
      )}

      {/* 분석 결과 */}
      {result && (
        <Stack gap="lg">
          {/* 종합 점수 */}
          <Paper p="xl" radius="md" withBorder>
            <Group align="flex-start" gap="xl">
              <Center>
                <RingProgress
                  size={160}
                  thickness={12}
                  roundCaps
                  sections={[
                    {
                      value: result.totalScore,
                      color: GRADE_COLORS[result.grade],
                    },
                  ]}
                  label={
                    <Stack align="center" gap={0}>
                      <Text size="xl">
                        {result.totalScore}
                      </Text>
                      <Text size="xs" c="dimmed">
                        / 100
                      </Text>
                    </Stack>
                  }
                />
              </Center>

              <Stack gap="xs" style={{ flex: 1 }}>
                <Group justify="space-between">
                  <Badge size="xl" color={GRADE_COLORS[result.grade]}>
                    Grade {result.grade}
                  </Badge>
                  <Button
                    variant="light"
                    color="red"
                    size="sm"
                    leftSection={<IconFileTypePdf size={16} />}
                    onClick={handleDownloadPdf}
                    loading={isDownloading}
                  >
                    PDF 다운로드
                  </Button>
                </Group>
                <Text size="sm" c="dimmed">
                  분석 시간: {new Date(result.analyzedAt).toLocaleString('ko-KR')}
                </Text>
                <Group gap="xs">
                  <IconExternalLink size={14} />
                  <Text size="sm" c="dimmed">
                    {result.url}
                  </Text>
                </Group>
                <Text size="sm">
                  {result.pages.length}개 페이지 분석 완료
                </Text>
              </Stack>
            </Group>
          </Paper>

          {/* 카테고리별 점수 */}
          <Paper p="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              카테고리별 점수
            </Title>
            <Stack gap="sm">
              {Object.entries(result.categories).map(([key, category]) => (
                <CategoryScoreBar
                  key={key}
                  name={CATEGORY_LABELS[key] || key}
                  category={category}
                  icon={CATEGORY_ICONS[key] || IconChartBar}
                />
              ))}
            </Stack>
          </Paper>

          {/* 상세 분석 */}
          <Paper p="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              상세 분석
            </Title>
            <Accordion>
              {Object.entries(result.categories).map(([key, category]) => (
                <Accordion.Item key={key} value={key}>
                  <Accordion.Control
                    icon={
                      <ThemeIcon
                        color={category.percentage >= 70 ? 'green' : category.percentage >= 50 ? 'yellow' : 'red'}
                        variant="light"
                        size="sm"
                      >
                        {(() => {
                          const Icon = CATEGORY_ICONS[key] || IconChartBar;
                          return <Icon size={14} />;
                        })()}
                      </ThemeIcon>
                    }
                  >
                    {CATEGORY_LABELS[key]} ({category.score}/{category.maxScore}점)
                  </Accordion.Control>
                  <Accordion.Panel>
                    <List spacing="xs" size="sm">
                      {category.items.map((item, idx) => (
                        <List.Item
                          key={idx}
                          icon={
                            <ThemeIcon
                              color={item.passed ? 'green' : 'red'}
                              size={20}
                              radius="xl"
                              variant="light"
                            >
                              {item.passed ? <IconCheck size={12} /> : <IconX size={12} />}
                            </ThemeIcon>
                          }
                        >
                          <Group gap="xs" wrap="nowrap">
                            <Text size="sm">
                              {item.name}
                            </Text>
                            <Badge size="xs" variant="outline">
                              {item.score}/{item.maxScore}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {item.detail}
                          </Text>
                        </List.Item>
                      ))}
                    </List>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Paper>

          {/* 개선 권장사항 */}
          {result.recommendations.length > 0 && (
            <Paper p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                <Group gap="xs">
                  <IconBulb size={20} />
                  개선 권장사항 ({result.recommendations.length})
                </Group>
              </Title>
              <Stack gap="sm">
                {result.recommendations.map((rec, idx) => (
                  <RecommendationCard key={idx} recommendation={rec} />
                ))}
              </Stack>
            </Paper>
          )}

          {/* 페이지별 점수 */}
          {result.pages.length > 1 && (
            <Paper p="lg" radius="md" withBorder>
              <Title order={4} mb="md">
                페이지별 점수
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {result.pages.map((page, idx) => (
                  <Paper key={idx} p="sm" withBorder radius="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Box style={{ overflow: 'hidden', flex: 1 }}>
                        <Text size="sm" truncate>
                          {page.title || '제목 없음'}
                        </Text>
                        <Text size="xs" c="dimmed" truncate>
                          {page.url}
                        </Text>
                      </Box>
                      <Badge size="lg" color={page.scores.total >= 70 ? 'green' : page.scores.total >= 50 ? 'yellow' : 'red'}>
                        {page.scores.total}점
                      </Badge>
                    </Group>
                  </Paper>
                ))}
              </SimpleGrid>
            </Paper>
          )}
        </Stack>
      )}
    </Stack>
  );
}

function CategoryScoreBar({
  name,
  category,
  icon: Icon,
}: {
  name: string;
  category: CategoryScore;
  icon: typeof IconCode;
}) {
  const color =
    category.percentage >= 70 ? 'green' : category.percentage >= 50 ? 'yellow' : 'red';

  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon color={color} variant="light" size="sm">
        <Icon size={14} />
      </ThemeIcon>
      <Text size="sm" w={60}>
        {name}
      </Text>
      <Progress.Root size="lg" style={{ flex: 1 }}>
        <Progress.Section value={category.percentage} color={color}>
          <Progress.Label>{category.percentage}%</Progress.Label>
        </Progress.Section>
      </Progress.Root>
      <Text size="sm" c="dimmed" w={50} ta="right">
        {category.score}/{category.maxScore}
      </Text>
    </Group>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityColor = {
    high: 'red',
    medium: 'yellow',
    low: 'blue',
  }[recommendation.priority];

  const priorityLabel = {
    high: '높음',
    medium: '중간',
    low: '낮음',
  }[recommendation.priority];

  return (
    <Paper p="sm" withBorder radius="sm" bg="gray.0">
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge size="xs" color={priorityColor}>
              {priorityLabel}
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
          💡 {recommendation.suggestion}
        </Text>
      </Stack>
    </Paper>
  );
}
