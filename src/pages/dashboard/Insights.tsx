import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Box,
  Button,
  Center,
  Loader,
  Alert,
  SimpleGrid,
  ThemeIcon,
  Tabs,
  List,
  Divider,
  Card,
  Grid,
  Tooltip,
  Select,
  ScrollArea,
} from '@mantine/core';
import {
  IconBulb,
  IconTarget,
  IconTrendingUp,
  IconAlertCircle,
  IconRefresh,
  IconSparkles,
  IconChartBar,
  IconChecklist,
  IconBrain,
  IconRocket,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconArrowRight,
  IconFlame,
  IconStar,
  IconInfoCircle,
  IconCircleFilled,
  IconSelect,
} from '@tabler/icons-react';
import {
  getAIInsights,
  getBrands,
  getSavedInsights,
  deleteInsight,
  downloadInsightsPdf,
  type SavedInsight,
  type KeywordInsight,
  type ActionableInsight,
} from '../../services/api';
import type { Brand } from '../../types';
import { IconTrash, IconFileTypePdf, IconDownload, IconCheck, IconTags } from '@tabler/icons-react';
import { InsightsSkeleton } from '../../components/ui';
import { useNavigate } from 'react-router-dom';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

const IMPORTANCE_ICONS: Record<string, typeof IconFlame> = {
  high: IconFlame,
  medium: IconStar,
  low: IconInfoCircle,
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function Insights() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<SavedInsight | null>(null);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  // 브랜드 및 저장된 인사이트 로드
  useEffect(() => {
    Promise.all([
      getBrands()
        .then((data) => {
          setBrands(data.brands);
          if (data.brands.length > 0) {
            setSelectedBrandId(data.brands[0].id);
          }
        })
        .catch(() => setBrands([])),
      loadSavedInsights(),
    ]).finally(() => setIsInitialLoading(false));
  }, []);

  const loadSavedInsights = async () => {
    try {
      const data = await getSavedInsights();
      setSavedInsights(data.insights || []);
    } catch {
      setSavedInsights([]);
    }
  };

  // 저장된 인사이트 선택 시
  useEffect(() => {
    if (selectedInsightId) {
      const found = savedInsights.find((i) => i.id === selectedInsightId);
      if (found) {
        setInsights(found);
      }
    }
  }, [selectedInsightId, savedInsights]);

  // 첫 인사이트 자동 선택
  useEffect(() => {
    if (savedInsights.length > 0 && !selectedInsightId) {
      setSelectedInsightId(savedInsights[0].id);
    }
  }, [savedInsights, selectedInsightId]);

  // 분석 요약 파생 데이터
  const analysisSummary = useMemo(() => {
    if (!insights) return null;
    const total = insights.metadata?.totalResponses || 0;
    const cited = insights.metadata?.citedResponses || 0;
    const rate = total > 0 ? Math.round((cited / total) * 100) : 0;
    const keywordCount = insights.commonKeywords?.length || 0;
    const highPriorityCount = (insights.actionableInsights || []).filter(
      (a) => a.priority === 'high'
    ).length;
    return { rate, keywordCount, highPriorityCount };
  }, [insights]);

  // 액션 큐: priority 순 정렬, 상위 5개
  const actionQueue = useMemo(() => {
    if (!insights?.actionableInsights) return [];
    return [...insights.actionableInsights]
      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2))
      .slice(0, 5);
  }, [insights]);

  const handleAnalyze = async () => {
    if (!selectedBrandId) {
      setError('분석할 브랜드를 선택해주세요');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSelectedInsightId(null);
    try {
      const result = await getAIInsights(selectedBrandId);
      setInsights(result);
      await loadSavedInsights();
      setSelectedInsightId(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteInsight(id);
      setSavedInsights((prev) => prev.filter((i) => i.id !== id));
      if (selectedInsightId === id) {
        setSelectedInsightId(null);
        setInsights(null);
      }
    } catch {
      setError('삭제에 실패했습니다');
    }
  };

  const handleDownloadPdf = async () => {
    if (!insights) return;

    setIsPdfLoading(true);
    setError(null);

    try {
      const pdfData = {
        id: insights.id,
        brandId: insights.brandId,
        brandName: insights.brandName,
        commonKeywords: (insights.commonKeywords || []).map((kw) => ({
          keyword: kw.keyword,
          count: kw.count,
          importance: kw.importance,
          description: kw.description,
        })),
        categoryInsights: (insights.categoryInsights || []).map((cat) => ({
          category: cat.category,
          keyFactors: cat.keyFactors || [],
          recommendation: cat.recommendation,
        })),
        citationPatterns: {
          citedPatterns: insights.citationPatterns?.citedPatterns || [],
          uncitedPatterns: insights.citationPatterns?.uncitedPatterns || [],
        },
        actionableInsights: (insights.actionableInsights || []).map((action) => ({
          title: action.title,
          description: action.description,
          priority: action.priority,
          actionItems: action.actionItems || [],
        })),
        contentGaps: (insights.contentGaps || []).map((gap) => ({
          area: gap.area,
          currentState: gap.currentState,
          recommendation: gap.recommendation,
        })),
        metadata: {
          analyzedAt: insights.metadata?.analyzedAt || new Date().toISOString(),
          totalResponses: insights.metadata?.totalResponses || 0,
          citedResponses: insights.metadata?.citedResponses || 0,
          categories: insights.metadata?.categories || [],
        },
      };

      const blob = await downloadInsightsPdf(pdfData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date(insights.metadata.analyzedAt).toISOString().split('T')[0];
      a.download = `AI_Insights_${insights.brandName}_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF 생성 중 오류가 발생했습니다');
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (isInitialLoading) {
    return <InsightsSkeleton />;
  }

  const showHeroEmpty = savedInsights.length === 0 && !insights && !isLoading;

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>AI 인사이트</Title>
          <Text c="dimmed" size="sm">
            AI 응답 패턴을 분석하여 공략 포인트를 도출합니다
          </Text>
        </div>
        <Group wrap="wrap">
          <Select
            placeholder="브랜드 선택"
            data={brands.map((b) => ({ value: b.id, label: b.name }))}
            value={selectedBrandId}
            onChange={setSelectedBrandId}
            w={{ base: 140, sm: 180 }}
            disabled={isLoading}
          />
          <Button
            leftSection={isLoading ? <Loader size={16} color="white" /> : <IconBrain size={16} />}
            onClick={handleAnalyze}
            loading={isLoading}
            disabled={!selectedBrandId}
            variant="gradient"
            gradient={{ from: 'violet', to: 'grape' }}
          >
            {isLoading ? '분석 중...' : 'AI 분석 시작'}
          </Button>
          {insights && (
            <Tooltip label="PDF 보고서 다운로드">
              <Button
                leftSection={isPdfLoading ? <Loader size={16} color="white" /> : <IconFileTypePdf size={16} />}
                onClick={handleDownloadPdf}
                loading={isPdfLoading}
                variant="light"
                color="grape"
              >
                PDF 다운로드
              </Button>
            </Tooltip>
          )}
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" onClose={() => setError(null)} withCloseButton>
          {error}
        </Alert>
      )}

      {showHeroEmpty ? (
        <Paper p="xl" radius="md" withBorder>
          <Center py={60}>
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
                <IconSparkles size={40} />
              </ThemeIcon>
              <Title order={3}>AI 응답 패턴 분석</Title>
              <Text c="dimmed" ta="center" maw={500}>
                축적된 AI 응답 데이터를 분석하여 공통적으로 등장하는 키워드,
                중요 요소, 그리고 실행 가능한 인사이트를 도출합니다.
              </Text>
              <Group gap="xs" mt="md">
                <Badge variant="light" color="violet">공략 키워드</Badge>
                <Badge variant="light" color="grape">카테고리별 인사이트</Badge>
                <Badge variant="light" color="pink">인용 패턴 분석</Badge>
              </Group>

              {/* 전제조건 체크리스트 */}
              <Paper p="md" radius="md" withBorder w="100%" maw={400} mt="md">
                <Text size="sm" mb="sm">시작 전 체크리스트</Text>
                <Stack gap="xs">
                  <Group gap="sm">
                    <ThemeIcon
                      size={20}
                      radius="xl"
                      variant="light"
                      color={brands.length > 0 ? 'teal' : 'gray'}
                    >
                      {brands.length > 0 ? <IconCheck size={12} /> : <Box w={12} h={12} style={{ borderRadius: '50%', border: '2px solid var(--mantine-color-gray-4)' }} />}
                    </ThemeIcon>
                    <Text size="sm" c={brands.length > 0 ? undefined : 'dimmed'}>
                      브랜드 등록 {brands.length > 0 ? `(${brands.length}개 등록됨)` : '(필수)'}
                    </Text>
                  </Group>
                  <Group gap="sm">
                    <ThemeIcon size={20} radius="xl" variant="light" color="blue">
                      <IconInfoCircle size={12} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed">
                      테스트 데이터가 많을수록 정확한 인사이트를 제공합니다
                    </Text>
                  </Group>
                </Stack>
              </Paper>

              {brands.length === 0 ? (
                <Stack align="center" gap="xs" mt="sm">
                  <Button
                    size="lg"
                    leftSection={<IconTags size={20} />}
                    onClick={() => navigate('/dashboard/brands')}
                    variant="light"
                    color="violet"
                  >
                    먼저 브랜드 등록하기
                  </Button>
                  <Tooltip label="먼저 브랜드를 등록해주세요" withArrow>
                    <Button
                      size="lg"
                      leftSection={<IconRocket size={20} />}
                      variant="gradient"
                      gradient={{ from: 'violet', to: 'grape' }}
                      disabled
                      data-disabled
                      style={{ pointerEvents: 'all' }}
                    >
                      분석 시작하기
                    </Button>
                  </Tooltip>
                </Stack>
              ) : (
                <Button
                  mt="lg"
                  size="lg"
                  leftSection={<IconRocket size={20} />}
                  onClick={handleAnalyze}
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                >
                  분석 시작하기
                </Button>
              )}
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Grid>
          {/* 좌측: 분석 요약 + 액션 큐 + 저장된 분석 목록 */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="md" withBorder h="100%">
              <Stack gap="md">
                {/* 분석 요약 */}
                {analysisSummary && (
                  <>
                    <div>
                      <Text size="xs" c="dimmed" mb="xs">분석 요약</Text>
                      <Stack gap={6}>
                        <Group gap="xs" wrap="nowrap">
                          <ThemeIcon
                            size={20}
                            variant="light"
                            radius="xl"
                            color={analysisSummary.rate >= 70 ? 'teal' : analysisSummary.rate >= 40 ? 'yellow' : 'red'}
                          >
                            <IconCircleCheck size={12} />
                          </ThemeIcon>
                          <Text size="xs" style={{ flex: 1 }}>인용 성공률</Text>
                          <Badge
                            size="sm"
                            variant="light"
                            color={analysisSummary.rate >= 70 ? 'teal' : analysisSummary.rate >= 40 ? 'yellow' : 'red'}
                          >
                            {analysisSummary.rate}%
                          </Badge>
                        </Group>
                        <Group gap="xs" wrap="nowrap">
                          <ThemeIcon size={20} variant="light" radius="xl" color="violet">
                            <IconTarget size={12} />
                          </ThemeIcon>
                          <Text size="xs" style={{ flex: 1 }}>공략 키워드</Text>
                          <Badge size="sm" variant="light" color="violet">
                            {analysisSummary.keywordCount}개
                          </Badge>
                        </Group>
                        <Group gap="xs" wrap="nowrap">
                          <ThemeIcon size={20} variant="light" radius="xl" color="red">
                            <IconFlame size={12} />
                          </ThemeIcon>
                          <Text size="xs" style={{ flex: 1 }}>우선 액션</Text>
                          <Badge size="sm" variant="light" color="red">
                            {analysisSummary.highPriorityCount}개
                          </Badge>
                        </Group>
                      </Stack>
                    </div>
                    <Divider />
                  </>
                )}

                {/* 액션 큐 */}
                {actionQueue.length > 0 && (
                  <>
                    <div>
                      <Text size="xs" c="dimmed" mb="xs">액션 큐</Text>
                      <Stack gap={6}>
                        {actionQueue.map((action, idx) => (
                          <Group key={idx} gap="xs" wrap="nowrap">
                            <IconCircleFilled
                              size={8}
                              color={`var(--mantine-color-${PRIORITY_COLORS[action.priority]}-filled)`}
                              style={{ flexShrink: 0 }}
                            />
                            <Text size="xs" truncate style={{ flex: 1 }}>
                              {action.title}
                            </Text>
                            <Badge size="xs" variant="light" color={PRIORITY_COLORS[action.priority]}>
                              {PRIORITY_LABELS[action.priority]}
                            </Badge>
                          </Group>
                        ))}
                      </Stack>
                    </div>
                    <Divider />
                  </>
                )}

                {/* 저장된 분석 목록 */}
                <div>
                  <Text mb="sm" size="sm" c="dimmed">
                    저장된 분석 ({savedInsights.length})
                  </Text>
                  <ScrollArea.Autosize mah={analysisSummary || actionQueue.length > 0 ? 300 : 500}>
                    <Stack gap="xs">
                      {savedInsights.length > 0 ? (
                        savedInsights.map((item) => (
                          <InsightListItem
                            key={item.id}
                            insight={item}
                            isSelected={selectedInsightId === item.id}
                            onClick={() => setSelectedInsightId(item.id)}
                            onDelete={() => handleDelete(item.id)}
                          />
                        ))
                      ) : (
                        <Text size="xs" c="dimmed" ta="center" py="md">
                          저장된 분석이 없습니다
                        </Text>
                      )}
                    </Stack>
                  </ScrollArea.Autosize>
                </div>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* 우측: 상세 패널 */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            {insights ? (
              <Stack gap="lg">
                {/* 메타데이터 요약 */}
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
                  <Paper p="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" c="dimmed">분석 응답 수</Text>
                      <ThemeIcon color="blue" variant="light" size="sm">
                        <IconChartBar size={14} />
                      </ThemeIcon>
                    </Group>
                    <Group gap={4} align="baseline">
                      <Text size="xl">{insights.metadata?.totalResponses ?? 0}</Text>
                      <Text size="xs" c="dimmed">개</Text>
                    </Group>
                    <Text size="xs" c="dimmed">응답 분석</Text>
                  </Paper>

                  <Paper p="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" c="dimmed">인용 성공</Text>
                      <ThemeIcon color="green" variant="light" size="sm">
                        <IconCircleCheck size={14} />
                      </ThemeIcon>
                    </Group>
                    <Text size="xl">{insights.metadata?.citedResponses ?? 0}</Text>
                    <Text size="xs" c="dimmed">
                      ({insights.metadata?.totalResponses ? Math.round((insights.metadata.citedResponses / insights.metadata.totalResponses) * 100) : 0}%)
                    </Text>
                  </Paper>

                  <Paper p="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" c="dimmed">공략 키워드</Text>
                      <ThemeIcon color="violet" variant="light" size="sm">
                        <IconTarget size={14} />
                      </ThemeIcon>
                    </Group>
                    <Group gap={4} align="baseline">
                      <Text size="xl">{insights.commonKeywords?.length || 0}</Text>
                      <Text size="xs" c="dimmed">개</Text>
                    </Group>
                    <Text size="xs" c="dimmed">발견</Text>
                  </Paper>

                  <Paper p="lg" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" c="dimmed">액션 아이템</Text>
                      <ThemeIcon color="orange" variant="light" size="sm">
                        <IconChecklist size={14} />
                      </ThemeIcon>
                    </Group>
                    <Group gap={4} align="baseline">
                      <Text size="xl">{insights.actionableInsights?.length || 0}</Text>
                      <Text size="xs" c="dimmed">개</Text>
                    </Group>
                    <Text size="xs" c="dimmed">제안</Text>
                  </Paper>
                </SimpleGrid>

                {/* 탭 구성 */}
                <Tabs defaultValue="keywords">
                  <Tabs.List>
                    <Tabs.Tab value="keywords" leftSection={<IconTarget size={16} />}>
                      공략 키워드
                    </Tabs.Tab>
                    <Tabs.Tab value="categories" leftSection={<IconChartBar size={16} />}>
                      카테고리별
                    </Tabs.Tab>
                    <Tabs.Tab value="patterns" leftSection={<IconTrendingUp size={16} />}>
                      인용 패턴
                    </Tabs.Tab>
                    <Tabs.Tab value="actions" leftSection={<IconBulb size={16} />}>
                      실행 가이드
                    </Tabs.Tab>
                  </Tabs.List>

                  {/* 공략 키워드 탭 */}
                  <Tabs.Panel value="keywords" pt="md">
                    <Stack gap="md">
                      <Paper p="lg" radius="md" withBorder>
                        <Text fw={600} size="sm" mb="md">
                          AI가 자주 언급하는 핵심 키워드
                        </Text>
                        <Text size="sm" c="dimmed" mb="lg">
                          다양한 질문에서 AI가 공통적으로 중요하게 다루는 요소들입니다.
                          이 키워드들을 콘텐츠에 포함하면 AI 인용 확률이 높아집니다.
                        </Text>

                        {insights.commonKeywords && insights.commonKeywords.length > 0 ? (
                          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            {insights.commonKeywords.map((kw, idx) => (
                              <KeywordCard key={idx} keyword={kw} rank={idx + 1} />
                            ))}
                          </SimpleGrid>
                        ) : (
                          <Center py="xl">
                            <Text c="dimmed">키워드 데이터가 없습니다</Text>
                          </Center>
                        )}
                      </Paper>
                    </Stack>
                  </Tabs.Panel>

                  {/* 카테고리별 인사이트 탭 */}
                  <Tabs.Panel value="categories" pt="md">
                    <Stack gap="md">
                      {insights.categoryInsights && insights.categoryInsights.length > 0 ? (
                        insights.categoryInsights.map((cat, idx) => (
                          <Paper key={idx} p="lg" radius="md" withBorder>
                            <Group justify="space-between" mb="md">
                              <Group gap="xs">
                                <Badge size="lg" variant="light" color="grape">
                                  {cat.category}
                                </Badge>
                              </Group>
                            </Group>

                            <Text size="sm" mb="sm">중요 요소:</Text>
                            <Group gap="xs" mb="md">
                              {cat.keyFactors?.map((factor, i) => (
                                <Badge key={i} variant="outline" color="violet">
                                  {factor}
                                </Badge>
                              ))}
                            </Group>

                            <Divider my="sm" />

                            <Group gap="xs">
                              <ThemeIcon color="green" variant="light" size="sm">
                                <IconBulb size={14} />
                              </ThemeIcon>
                              <Text size="sm" c="dimmed" style={{ flex: 1 }}>
                                {cat.recommendation}
                              </Text>
                            </Group>
                          </Paper>
                        ))
                      ) : (
                        <Paper p="xl" radius="md" withBorder>
                          <Center py="xl">
                            <Text c="dimmed">카테고리별 인사이트가 없습니다</Text>
                          </Center>
                        </Paper>
                      )}
                    </Stack>
                  </Tabs.Panel>

                  {/* 인용 패턴 탭 */}
                  <Tabs.Panel value="patterns" pt="md">
                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                      <Paper p="lg" radius="md" withBorder>
                        <Group gap="xs" mb="md">
                          <ThemeIcon color="green" variant="light">
                            <IconCircleCheck size={18} />
                          </ThemeIcon>
                          <Text fw={600} size="sm">인용 성공 패턴</Text>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md">
                          브랜드가 인용된 응답에서 발견되는 공통 특징
                        </Text>

                        {Array.isArray(insights.citationPatterns?.citedPatterns) && insights.citationPatterns.citedPatterns.length > 0 ? (
                          <List
                            spacing="sm"
                            icon={
                              <ThemeIcon color="green" size={20} radius="xl" variant="light">
                                <IconCircleCheck size={12} />
                              </ThemeIcon>
                            }
                          >
                            {insights.citationPatterns.citedPatterns.map((pattern, idx) => (
                              <List.Item key={idx}>
                                <Text size="sm">{typeof pattern === 'string' ? pattern : JSON.stringify(pattern)}</Text>
                              </List.Item>
                            ))}
                          </List>
                        ) : (
                          <Text size="sm" c="dimmed">패턴 데이터가 없습니다</Text>
                        )}
                      </Paper>

                      <Paper p="lg" radius="md" withBorder>
                        <Group gap="xs" mb="md">
                          <ThemeIcon color="red" variant="light">
                            <IconCircleX size={18} />
                          </ThemeIcon>
                          <Text fw={600} size="sm">인용 실패 패턴</Text>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md">
                          브랜드가 인용되지 않은 응답에서 발견되는 특징
                        </Text>

                        {insights.citationPatterns?.uncitedPatterns?.length > 0 ? (
                          <List
                            spacing="sm"
                            icon={
                              <ThemeIcon color="red" size={20} radius="xl" variant="light">
                                <IconAlertTriangle size={12} />
                              </ThemeIcon>
                            }
                          >
                            {insights.citationPatterns.uncitedPatterns.map((pattern, idx) => (
                              <List.Item key={idx}>
                                <Text size="sm">{pattern}</Text>
                              </List.Item>
                            ))}
                          </List>
                        ) : (
                          <Text size="sm" c="dimmed">패턴 데이터가 없습니다</Text>
                        )}
                      </Paper>
                    </SimpleGrid>

                    {insights.contentGaps && insights.contentGaps.length > 0 && (
                      <Paper p="lg" radius="md" withBorder mt="md">
                        <Group gap="xs" mb="md">
                          <ThemeIcon color="orange" variant="light">
                            <IconAlertTriangle size={18} />
                          </ThemeIcon>
                          <Text fw={600} size="sm">콘텐츠 보강 영역</Text>
                        </Group>

                        <Stack gap="sm">
                          {insights.contentGaps.map((gap, idx) => (
                            <Paper key={idx} p="md" bg="gray.1" radius="sm">
                              <Group justify="space-between" mb="xs">
                                <Text size="sm">{gap.area}</Text>
                              </Group>
                              <Text size="xs" c="dimmed" mb="xs">
                                현재: {gap.currentState}
                              </Text>
                              <Group gap="xs">
                                <IconArrowRight size={14} color="var(--mantine-color-green-6)" />
                                <Text size="xs" c="green">{gap.recommendation}</Text>
                              </Group>
                            </Paper>
                          ))}
                        </Stack>
                      </Paper>
                    )}
                  </Tabs.Panel>

                  {/* 실행 가이드 탭 */}
                  <Tabs.Panel value="actions" pt="md">
                    <Stack gap="md">
                      {insights.actionableInsights && insights.actionableInsights.length > 0 ? (
                        insights.actionableInsights.map((insight, idx) => (
                          <ActionCard key={idx} insight={insight} index={idx + 1} />
                        ))
                      ) : (
                        <Paper p="xl" radius="md" withBorder>
                          <Center py="xl">
                            <Text c="dimmed">실행 가이드가 없습니다</Text>
                          </Center>
                        </Paper>
                      )}
                    </Stack>
                  </Tabs.Panel>
                </Tabs>

                {/* 분석 시간 및 다운로드 */}
                <Paper p="sm" radius="md" bg="gray.0">
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      분석 시간: {new Date(insights.metadata.analyzedAt).toLocaleString('ko-KR')}
                    </Text>
                    <Group gap="xs">
                      <Button
                        variant="light"
                        size="xs"
                        color="grape"
                        leftSection={<IconDownload size={14} />}
                        onClick={handleDownloadPdf}
                        loading={isPdfLoading}
                      >
                        PDF 보고서
                      </Button>
                      <Button
                        variant="subtle"
                        size="xs"
                        leftSection={<IconRefresh size={14} />}
                        onClick={handleAnalyze}
                        loading={isLoading}
                      >
                        다시 분석
                      </Button>
                    </Group>
                  </Group>
                </Paper>
              </Stack>
            ) : (
              <Paper p="xl" radius="md" withBorder h="100%">
                <Center h={400}>
                  <Stack align="center" gap="md">
                    <IconSelect size={48} stroke={1.5} color="gray" />
                    <Text c="dimmed">좌측 목록에서 인사이트를 선택하세요</Text>
                  </Stack>
                </Center>
              </Paper>
            )}
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}

// InsightListItem 인라인 컴포넌트
function InsightListItem({
  insight,
  isSelected,
  onClick,
  onDelete,
}: {
  insight: SavedInsight;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const citationRate = insight.metadata?.totalResponses
    ? Math.round((insight.metadata.citedResponses / insight.metadata.totalResponses) * 100)
    : 0;

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--mantine-color-violet-light)' : undefined,
        borderColor: isSelected ? 'var(--mantine-color-violet-filled)' : undefined,
        transition: 'all 0.15s ease',
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: 'var(--mantine-color-violet-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconBrain size={18} stroke={1.5} color="var(--mantine-color-violet-filled)" />
          </Box>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text size="sm" truncate>
              {insight.brandName}
            </Text>
            <Text size="xs" c="dimmed">
              {new Date(insight.metadata?.analyzedAt || '').toLocaleDateString('ko-KR')}
            </Text>
          </Stack>
        </Group>
        <Group gap={4} wrap="nowrap">
          <Badge
            variant="light"
            color={citationRate >= 70 ? 'green' : citationRate >= 40 ? 'yellow' : 'red'}
            size="sm"
          >
            {citationRate}%
          </Badge>
          <IconTrash
            size={14}
            color="var(--mantine-color-gray-5)"
            style={{ cursor: 'pointer', flexShrink: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
        </Group>
      </Group>
    </Paper>
  );
}

// 키워드 카드 컴포넌트
function KeywordCard({ keyword, rank }: { keyword: KeywordInsight; rank: number }) {
  const ImportanceIcon = IMPORTANCE_ICONS[keyword.importance] || IconInfoCircle;

  return (
    <Card padding="md" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Badge
          size="lg"
          variant="gradient"
          gradient={{
            from: keyword.importance === 'high' ? 'red' : keyword.importance === 'medium' ? 'orange' : 'blue',
            to: keyword.importance === 'high' ? 'orange' : keyword.importance === 'medium' ? 'yellow' : 'cyan',
          }}
        >
          #{rank}
        </Badge>
        <Tooltip label={`중요도: ${PRIORITY_LABELS[keyword.importance]}`}>
          <ThemeIcon
            color={PRIORITY_COLORS[keyword.importance]}
            variant="light"
            size="sm"
          >
            <ImportanceIcon size={14} />
          </ThemeIcon>
        </Tooltip>
      </Group>

      <Text size="lg" mb="xs">
        {keyword.keyword}
      </Text>

      <Group gap="xs" mb="sm">
        <Badge size="xs" variant="outline">
          등장 빈도: {keyword.count}회
        </Badge>
      </Group>

      <Text size="xs" c="dimmed">
        {keyword.description}
      </Text>
    </Card>
  );
}

// 액션 카드 컴포넌트
function ActionCard({ insight, index }: { insight: ActionableInsight; index: number }) {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="sm">
          <ThemeIcon
            size="lg"
            radius="xl"
            variant="gradient"
            gradient={{
              from: insight.priority === 'high' ? 'red' : insight.priority === 'medium' ? 'orange' : 'blue',
              to: insight.priority === 'high' ? 'orange' : insight.priority === 'medium' ? 'yellow' : 'cyan',
            }}
          >
            {index}
          </ThemeIcon>
          <div>
            <Text size="lg">{insight.title}</Text>
            <Badge size="xs" color={PRIORITY_COLORS[insight.priority]} variant="light">
              우선순위: {PRIORITY_LABELS[insight.priority]}
            </Badge>
          </div>
        </Group>
      </Group>

      <Text size="sm" c="dimmed" mb="md">
        {insight.description}
      </Text>

      <Divider my="sm" label="실행 항목" labelPosition="left" />

      <List
        spacing="xs"
        icon={
          <ThemeIcon color="green" size={18} radius="xl" variant="light">
            <IconArrowRight size={10} />
          </ThemeIcon>
        }
      >
        {insight.actionItems?.map((item, idx) => (
          <List.Item key={idx}>
            <Text size="sm">{item}</Text>
          </List.Item>
        ))}
      </List>
    </Paper>
  );
}
