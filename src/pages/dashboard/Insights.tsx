import { useState, useEffect } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
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
  Tooltip,
  Select,
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
import type { Brand } from '../../data/mockData';
import { IconTrash, IconHistory, IconFileTypePdf, IconDownload } from '@tabler/icons-react';

const PRIORITY_COLORS = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
};

const PRIORITY_LABELS = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

const IMPORTANCE_ICONS = {
  high: IconFlame,
  medium: IconStar,
  low: IconInfoCircle,
};

export function Insights() {
  const [insights, setInsights] = useState<SavedInsight | null>(null);
  const [savedInsights, setSavedInsights] = useState<SavedInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  // 브랜드 및 저장된 인사이트 로드
  useEffect(() => {
    getBrands()
      .then((data) => {
        setBrands(data.brands);
        if (data.brands.length > 0) {
          setSelectedBrandId(data.brands[0].id);
        }
      })
      .catch(() => setBrands([]));

    loadSavedInsights();
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
      // 목록 새로고침
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
      // 리포트 PDF처럼 데이터를 명시적으로 구성
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

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>AI 인사이트</Title>
          <Text c="dimmed" size="sm">
            AI 응답 패턴을 분석하여 공략 포인트를 도출합니다
          </Text>
        </div>
        <Group>
          <Select
            placeholder="브랜드 선택"
            data={brands.map((b) => ({ value: b.id, label: b.name }))}
            value={selectedBrandId}
            onChange={setSelectedBrandId}
            w={180}
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

      {/* 저장된 인사이트 기록 */}
      {savedInsights.length > 0 && (
        <Paper p="md" radius="md" withBorder>
          <Group gap="xs" mb="sm">
            <IconHistory size={18} />
            <Text fw={600} size="sm">저장된 분석 기록</Text>
            <Badge size="sm" variant="light">{savedInsights.length}개</Badge>
          </Group>
          <Group gap="xs" style={{ flexWrap: 'wrap' }}>
            {savedInsights.slice(0, 10).map((item) => (
              <Badge
                key={item.id}
                size="lg"
                variant={selectedInsightId === item.id ? 'filled' : 'light'}
                color={selectedInsightId === item.id ? 'violet' : 'gray'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedInsightId(item.id)}
                rightSection={
                  <IconTrash
                    size={14}
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                  />
                }
              >
                {item.brandName} · {new Date(item.metadata?.analyzedAt || '').toLocaleDateString('ko-KR')}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}

      {!insights && !isLoading && (
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
            </Stack>
          </Center>
        </Paper>
      )}

      {insights && (
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
              <Text size="xl" fw={700}>{insights.metadata?.totalResponses ?? 0}</Text>
              <Text size="xs" c="dimmed">개 응답 분석</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">인용 성공</Text>
                <ThemeIcon color="green" variant="light" size="sm">
                  <IconCircleCheck size={14} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700}>{insights.metadata?.citedResponses ?? 0}</Text>
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
              <Text size="xl" fw={700}>{insights.commonKeywords?.length || 0}</Text>
              <Text size="xs" c="dimmed">개 발견</Text>
            </Paper>

            <Paper p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">액션 아이템</Text>
                <ThemeIcon color="orange" variant="light" size="sm">
                  <IconChecklist size={14} />
                </ThemeIcon>
              </Group>
              <Text size="xl" fw={700}>{insights.actionableInsights?.length || 0}</Text>
              <Text size="xs" c="dimmed">개 제안</Text>
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
                  <Title order={4} mb="md">
                    AI가 자주 언급하는 핵심 키워드
                  </Title>
                  <Text size="sm" c="dimmed" mb="lg">
                    다양한 쿼리에서 AI가 공통적으로 중요하게 다루는 요소들입니다.
                    이 키워드들을 콘텐츠에 포함하면 AI 인용 확률이 높아집니다.
                  </Text>

                  {insights.commonKeywords && insights.commonKeywords.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
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

                      <Text size="sm" fw={500} mb="sm">중요 요소:</Text>
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
                {/* 인용 성공 패턴 */}
                <Paper p="lg" radius="md" withBorder>
                  <Group gap="xs" mb="md">
                    <ThemeIcon color="green" variant="light">
                      <IconCircleCheck size={18} />
                    </ThemeIcon>
                    <Title order={4}>인용 성공 패턴</Title>
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

                {/* 인용 실패 패턴 */}
                <Paper p="lg" radius="md" withBorder>
                  <Group gap="xs" mb="md">
                    <ThemeIcon color="red" variant="light">
                      <IconCircleX size={18} />
                    </ThemeIcon>
                    <Title order={4}>인용 실패 패턴</Title>
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

              {/* 콘텐츠 갭 */}
              {insights.contentGaps && insights.contentGaps.length > 0 && (
                <Paper p="lg" radius="md" withBorder mt="md">
                  <Group gap="xs" mb="md">
                    <ThemeIcon color="orange" variant="light">
                      <IconAlertTriangle size={18} />
                    </ThemeIcon>
                    <Title order={4}>콘텐츠 보강 영역</Title>
                  </Group>

                  <Stack gap="sm">
                    {insights.contentGaps.map((gap, idx) => (
                      <Paper key={idx} p="md" bg="gray.1" radius="sm">
                        <Group justify="space-between" mb="xs">
                          <Text size="sm" fw={600}>{gap.area}</Text>
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
      )}
    </Stack>
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

      <Text size="lg" fw={700} mb="xs">
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
            <Text size="lg" fw={600}>{insight.title}</Text>
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
