import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Center,
  Group,
  Loader,
  Paper,
  Progress,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Badge,
  Anchor,
  Code,
  ScrollArea,
  Image,
} from '@mantine/core';
import {
  IconTags,
  IconMessageQuestion,
  IconPlayerPlay,
  IconCheck,
  IconArrowLeft,
  IconArrowRight,
  IconSparkles,
  IconChartBar,
  IconFileDescription,
  IconTrophy,
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { addBrand } from '../../services/brands';
import { addQuery, updateQueryBrands, testQuery } from '../../services/queries';
import { updateOnboardingStep } from '../../services/onboarding';
import { QUERY_TEMPLATES, applyTemplate } from '../../utils/queryTemplates';
import { QUERY_CATEGORIES } from '../../types';

const STEP_COUNT = 4;

interface CreatedBrand {
  id: string;
  name: string;
  competitors: string[];
}

function renderLinkifiedText(text: string) {
  const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (!part) return null;
    if (/^https?:\/\//.test(part)) {
      const match = part.match(/^(https?:\/\/[^\s<>"']*?)([),.;!?]*)$/);
      const url = match?.[1] || part;
      const trailing = match?.[2] || '';
      return (
        <span key={`url-${index}`}>
          <Anchor href={url} target="_blank" rel="noreferrer" style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}>
            {url}
          </Anchor>
          {trailing}
        </span>
      );
    }
    return <span key={`txt-${index}`}>{part}</span>;
  });
}

export function OnboardingWizard() {
  const { user, checkAuth } = useAuth();
  const [step, setStep] = useState(user?.onboarding_step ?? 0);

  // Step 1 state
  const [brandName, setBrandName] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [marketingPoints, setMarketingPoints] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState('');
  const [createdBrand, setCreatedBrand] = useState<CreatedBrand | null>(null);

  // Step 2 state
  const [queryText, setQueryText] = useState('');
  const [queryCategory, setQueryCategory] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [createdQueryId, setCreatedQueryId] = useState<string | null>(null);

  // Step 3 state
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');
  const [testResult, setTestResult] = useState<{
    cited: boolean;
    fullResponse: string;
    brandResults?: Array<{ brandName: string; cited: boolean; rank: number | null }>;
  } | null>(null);

  const greeting = user?.name ? `${user.name}님, 환영합니다!` : '환영합니다!';
  const progressPercent = (step / (STEP_COUNT - 1)) * 100;

  const updateStep = useCallback(async (newStep: number) => {
    try {
      await updateOnboardingStep(newStep);
    } catch {
      // silent — local state is source of truth during wizard
    }
  }, []);

  const handleSkip = async () => {
    await updateOnboardingStep(3);
    await checkAuth();
  };

  // Step 1: Register brand
  const handleAddBrand = async () => {
    if (!brandName.trim()) return;
    setBrandLoading(true);
    setBrandError('');
    try {
      const brand = await addBrand({
        name: brandName.trim(),
        competitors,
        marketingPoints,
        keywords,
      });
      setCreatedBrand({ id: brand.id, name: brand.name, competitors: brand.competitors || [] });
      await updateStep(1);
      setStep(2);
    } catch (err) {
      setBrandError(err instanceof Error ? err.message : '브랜드 등록에 실패했습니다.');
    } finally {
      setBrandLoading(false);
    }
  };

  // Step 2: Add query
  const handleAddQuery = async () => {
    if (!queryText.trim() || !queryCategory) return;
    setQueryLoading(true);
    setQueryError('');
    try {
      const q = await addQuery({
        query: queryText.trim(),
        category: queryCategory,
        frequency: 'daily',
      });
      if (createdBrand) {
        await updateQueryBrands(q.id, [createdBrand.id]);
      }
      setCreatedQueryId(q.id);
      await updateStep(2);
      setStep(3);
      // auto-trigger test
      handleTestQuery(q.id, queryText.trim(), queryCategory);
    } catch (err) {
      setQueryError(err instanceof Error ? err.message : '질문 추가에 실패했습니다.');
      setQueryLoading(false);
    }
  };

  // Step 3: Test query
  const handleTestQuery = async (queryId: string, query: string, category: string) => {
    setTestLoading(true);
    setTestError('');
    try {
      const result = await testQuery({
        query,
        queryId,
        category,
        engine: 'gpt',
      });
      setTestResult({
        cited: result.cited,
        fullResponse: result.fullResponse || result.response,
        brandResults: result.brandResults?.map((br) => ({
          brandName: br.brandName,
          cited: br.cited,
          rank: br.rank,
        })),
      });
    } catch (err) {
      setTestError(err instanceof Error ? err.message : '테스트에 실패했습니다.');
    } finally {
      setTestLoading(false);
    }
  };

  // Step 3: Finish
  const handleFinish = async () => {
    await updateOnboardingStep(3);
    await checkAuth();
  };

  // Template chip click
  const handleTemplateClick = (templateStr: string, category: string) => {
    if (!createdBrand) return;
    const firstCompetitor = createdBrand.competitors[0];
    const applied = applyTemplate(templateStr, createdBrand.name, firstCompetitor);
    setQueryText(applied);
    setQueryCategory(category);
  };

  return (
    <Center mih="calc(100vh - 100px)">
      <Box w="100%" maw={640} px="md">
        {/* Progress bar */}
        <Progress value={progressPercent} size="sm" radius="xl" mb="xl" color="brand" />

        <Paper radius="lg" p="xl" withBorder shadow="md">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <Stack gap="xl">
              <Center>
                <Image
                  src="/YeogiJeogiFontLogo (1).png"
                  alt="여기저기"
                  h={32}
                  w="auto"
                  fit="contain"
                />
              </Center>
              <Stack gap="xs" align="center">
                <Title order={2} ta="center">{greeting}</Title>
                <Text c="dimmed" ta="center" size="lg">
                  AI가 당신의 브랜드를 추천하고 있나요?
                </Text>
              </Stack>

              <Text size="sm" c="dimmed" ta="center">
                여기저기는 ChatGPT 등 AI 검색에서 브랜드 인용 여부를 추적하고,
                성과를 분석하여 AI 가시성을 높이는 데 도움을 줍니다.
              </Text>

              <Stack gap="sm">
                <Text size="xs" c="dimmed" mb={-4}>3단계로 시작해 보세요</Text>
                <Group gap="sm" align="flex-start">
                  <ThemeIcon size={36} radius="md" variant="light" color="teal">
                    <IconTags size={18} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm">1. 브랜드 등록</Text>
                    <Text size="xs" c="dimmed">추적할 브랜드명, 경쟁사, 키워드를 등록합니다</Text>
                  </Box>
                </Group>
                <Group gap="sm" align="flex-start">
                  <ThemeIcon size={36} radius="md" variant="light" color="blue">
                    <IconMessageQuestion size={18} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm">2. 질문 추가</Text>
                    <Text size="xs" c="dimmed">AI에게 물어볼 질문을 작성합니다</Text>
                  </Box>
                </Group>
                <Group gap="sm" align="flex-start">
                  <ThemeIcon size={36} radius="md" variant="light" color="grape">
                    <IconPlayerPlay size={18} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="sm">3. 테스트 실행</Text>
                    <Text size="xs" c="dimmed">ChatGPT에 질문을 보내 브랜드 인용 결과를 확인합니다</Text>
                  </Box>
                </Group>
              </Stack>

              <Stack gap="xs">
                <Button
                  size="lg"
                  fullWidth
                  rightSection={<IconArrowRight size={18} />}
                  onClick={() => setStep(1)}
                >
                  시작하기
                </Button>
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  fullWidth
                  onClick={handleSkip}
                >
                  건너뛰기
                </Button>
              </Stack>
            </Stack>
          )}

          {/* Step 1: Brand registration */}
          {step === 1 && (
            <Stack gap="lg">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="teal">
                  <IconTags size={20} />
                </ThemeIcon>
                <div>
                  <Text size="lg">브랜드 등록</Text>
                  <Text size="xs" c="dimmed">약 30초</Text>
                </div>
              </Group>

              <Text size="sm" c="dimmed">
                AI 응답에서 추적할 브랜드를 등록하세요. 경쟁사·마케팅 포인트·키워드는 나중에 추가할 수도 있습니다.
              </Text>

              <TextInput
                label="브랜드명"
                placeholder="예: OpenAI, Claude"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                size="md"
              />

              <TagsInput
                label="경쟁사 브랜드"
                placeholder="경쟁사 입력 후 Enter"
                description="AI 응답에서 함께 추적할 경쟁사 브랜드명"
                value={competitors}
                onChange={setCompetitors}
                size="md"
              />

              <TagsInput
                label="마케팅 포인트"
                placeholder="USP·강점 입력 후 Enter (선택)"
                description="브랜드의 핵심 차별점이나 강점"
                value={marketingPoints}
                onChange={setMarketingPoints}
                size="md"
              />

              <TagsInput
                label="키워드"
                placeholder="키워드 입력 후 Enter (선택)"
                description="브랜드와 관련된 핵심 키워드"
                value={keywords}
                onChange={setKeywords}
                size="md"
              />

              {brandError && (
                <Text size="sm" c="red">{brandError}</Text>
              )}

              <Group justify="space-between">
                <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => setStep(0)}
                >
                  이전
                </Button>
                <Button
                  rightSection={<IconArrowRight size={16} />}
                  onClick={handleAddBrand}
                  loading={brandLoading}
                  disabled={!brandName.trim()}
                >
                  등록하고 다음 단계로
                </Button>
              </Group>
            </Stack>
          )}

          {/* Step 2: Query */}
          {step === 2 && (
            <Stack gap="lg">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="blue">
                  <IconMessageQuestion size={20} />
                </ThemeIcon>
                <div>
                  <Text size="lg">질문 추가</Text>
                  <Text size="xs" c="dimmed">약 20초</Text>
                </div>
              </Group>

              <Text size="sm" c="dimmed">
                AI에게 물어볼 질문을 선택하거나 직접 입력하세요.
                {createdBrand && ` "${createdBrand.name}" 브랜드에 자동 연결됩니다.`}
              </Text>

              {/* Template chips */}
              <Box>
                <Text size="xs" mb="xs">추천 질문 템플릿</Text>
                <Group gap="xs">
                  {QUERY_TEMPLATES.map((t) => (
                    <Button
                      key={t.id}
                      variant={queryText === applyTemplate(t.template, createdBrand?.name || '브랜드', createdBrand?.competitors[0]) ? 'filled' : 'light'}
                      size="xs"
                      radius="xl"
                      onClick={() => handleTemplateClick(t.template, t.category)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </Group>
              </Box>

              <TextInput
                label="질문"
                placeholder="AI에게 물어볼 질문을 입력하세요"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                required
                size="md"
              />

              <Select
                label="카테고리"
                placeholder="카테고리 선택"
                data={QUERY_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                value={queryCategory}
                onChange={setQueryCategory}
                required
                size="md"
              />

              {queryError && (
                <Text size="sm" c="red">{queryError}</Text>
              )}

              <Group justify="space-between">
                <Button
                  variant="subtle"
                  leftSection={<IconArrowLeft size={16} />}
                  onClick={() => setStep(1)}
                >
                  이전
                </Button>
                <Button
                  rightSection={<IconPlayerPlay size={16} />}
                  onClick={handleAddQuery}
                  loading={queryLoading}
                  disabled={!queryText.trim() || !queryCategory}
                >
                  질문 추가하고 테스트하기
                </Button>
              </Group>
            </Stack>
          )}

          {/* Step 3: Test result */}
          {step === 3 && (
            <Stack gap="lg">
              <Group gap="sm">
                <ThemeIcon size={40} radius="md" variant="light" color="grape">
                  <IconPlayerPlay size={20} />
                </ThemeIcon>
                <div>
                  <Text size="lg">테스트 결과</Text>
                  <Text size="xs" c="dimmed">ChatGPT 응답 확인</Text>
                </div>
              </Group>

              {testLoading && (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <Loader size="lg" color="brand" />
                    <Text>ChatGPT에게 물어보는 중...</Text>
                    <Text size="sm" c="dimmed">잠시만 기다려주세요</Text>
                  </Stack>
                </Center>
              )}

              {testError && (
                <Stack gap="md">
                  <Text c="red" size="sm">{testError}</Text>
                  <Button
                    variant="light"
                    onClick={() => {
                      if (createdQueryId && queryText && queryCategory) {
                        handleTestQuery(createdQueryId, queryText, queryCategory);
                      }
                    }}
                  >
                    다시 시도
                  </Button>
                </Stack>
              )}

              {testResult && !testLoading && (
                <Stack gap="md">
                  {/* Citation status */}
                  {testResult.cited ? (
                    <Paper p="md" radius="md" style={{ background: 'light-dark(var(--mantine-color-teal-0), var(--mantine-color-dark-6))', border: '1px solid light-dark(var(--mantine-color-teal-3), var(--mantine-color-dark-4))' }}>
                      <Group gap="sm">
                        <ThemeIcon size={32} radius="xl" color="teal">
                          <IconCheck size={18} />
                        </ThemeIcon>
                        <div>
                          <Text c="teal.7">축하합니다!</Text>
                          <Text size="sm" c="teal.6">AI가 브랜드를 인용하고 있습니다</Text>
                        </div>
                      </Group>
                    </Paper>
                  ) : (
                    <Paper p="md" radius="md" style={{ background: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-6))', border: '1px solid light-dark(var(--mantine-color-blue-3), var(--mantine-color-dark-4))' }}>
                      <Group gap="sm">
                        <ThemeIcon size={32} radius="xl" color="blue" variant="light">
                          <IconSparkles size={18} />
                        </ThemeIcon>
                        <div>
                          <Text c="blue.7">아직 인용되지 않았습니다</Text>
                          <Text size="sm" c="blue.6">이제부터 추적을 시작합니다. 시간이 지나면 변화를 확인할 수 있어요!</Text>
                        </div>
                      </Group>
                    </Paper>
                  )}

                  {/* Brand results */}
                  {testResult.brandResults && testResult.brandResults.length > 0 && (
                    <Stack gap="xs">
                      {testResult.brandResults.map((br, i) => (
                        <Group key={i} justify="space-between" p="xs" style={{ background: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))', borderRadius: 8 }}>
                          <Text size="sm">{br.brandName}</Text>
                          <Group gap="xs">
                            <Badge color={br.cited ? 'teal' : 'gray'} size="sm">
                              {br.cited ? '인용됨' : '미인용'}
                            </Badge>
                            {br.rank && <Badge variant="filled" size="sm">#{br.rank}</Badge>}
                          </Group>
                        </Group>
                      ))}
                    </Stack>
                  )}

                  {/* AI response */}
                  <Box>
                    <Text size="xs" c="dimmed" mb="xs">ChatGPT 응답</Text>
                    <ScrollArea h={200}>
                      <Code block style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                        {renderLinkifiedText(testResult.fullResponse)}
                      </Code>
                    </ScrollArea>
                  </Box>

                  {/* Feature preview */}
                  <Paper p="md" radius="md" withBorder bg="gray.0">
                    <Text size="sm" mb="sm">대시보드에서 할 수 있는 것들</Text>
                    <Stack gap="sm">
                      <Group gap="sm" align="flex-start">
                        <ThemeIcon size={28} radius="md" variant="light" color="blue">
                          <IconMessageQuestion size={14} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm">질문 관리 & 예약</Text>
                          <Text size="xs" c="dimmed">질문을 등록하고 일간·주간·월간 자동 테스트를 예약하세요</Text>
                        </Box>
                      </Group>

                      <Group gap="sm" align="flex-start">
                        <ThemeIcon size={28} radius="md" variant="light" color="teal">
                          <IconChartBar size={14} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm">성과 분석</Text>
                          <Text size="xs" c="dimmed">인용률·순위·엔진별 비교와 성장 추이를 추적하세요</Text>
                        </Box>
                      </Group>

                      <Group gap="sm" align="flex-start">
                        <ThemeIcon size={28} radius="md" variant="light" color="indigo">
                          <IconFileDescription size={14} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm">리포트 & 인사이트</Text>
                          <Text size="xs" c="dimmed">주간·월간 리포트 생성과 AI 기반 전략 인사이트를 확인하세요</Text>
                        </Box>
                      </Group>

                      <Group gap="sm" align="flex-start">
                        <ThemeIcon size={28} radius="md" variant="light" color="grape">
                          <IconTrophy size={14} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm">GEO 스코어</Text>
                          <Text size="xs" c="dimmed">웹사이트의 AI 검색 최적화 점수를 분석하고 경쟁사와 비교하세요</Text>
                        </Box>
                      </Group>
                    </Stack>
                  </Paper>

                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleFinish}
                    rightSection={<IconCheck size={18} />}
                  >
                    대시보드로 이동
                  </Button>
                </Stack>
              )}

              {/* If no test is running and no result (fallback) */}
              {!testLoading && !testResult && !testError && (
                <Stack gap="md" align="center">
                  <Text c="dimmed">테스트 결과가 없습니다.</Text>
                  <Button onClick={handleFinish}>대시보드로 이동</Button>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>

        {/* Step indicator */}
        <Group justify="center" mt="md" gap="xs">
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <Box
              key={i}
              w={8}
              h={8}
              style={{
                borderRadius: '50%',
                backgroundColor: i <= step
                  ? 'var(--mantine-color-brand-6)'
                  : 'var(--mantine-color-gray-3)',
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </Group>
      </Box>
    </Center>
  );
}



