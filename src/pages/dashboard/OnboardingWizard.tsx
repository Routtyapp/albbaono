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
  Highlight,
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
  IconFileDescription,
  IconBrain,
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

export function OnboardingWizard() {
  const { user, checkAuth } = useAuth();
  const [step, setStep] = useState(user?.onboarding_step ?? 0);

  // Step 1 state
  const [brandName, setBrandName] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
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
      const brand = await addBrand({ name: brandName.trim(), competitors });
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
      setQueryError(err instanceof Error ? err.message : '쿼리 추가에 실패했습니다.');
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

              <Stack gap="sm">
                <Group gap="sm" align="flex-start">
                  <ThemeIcon size={36} radius="md" variant="light" color="teal">
                    <IconTags size={18} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} size="sm">브랜드 등록</Text>
                    <Text size="xs" c="dimmed">AI 검색에서 추적할 브랜드를 등록합니다</Text>
                  </Box>
                </Group>
                <Group gap="sm" align="flex-start">
                  <ThemeIcon size={36} radius="md" variant="light" color="blue">
                    <IconMessageQuestion size={18} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} size="sm">쿼리 추가</Text>
                    <Text size="xs" c="dimmed">AI에게 물어볼 질문을 작성합니다</Text>
                  </Box>
                </Group>
                <Group gap="sm" align="flex-start">
                  <ThemeIcon size={36} radius="md" variant="light" color="grape">
                    <IconPlayerPlay size={18} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text fw={600} size="sm">테스트 실행</Text>
                    <Text size="xs" c="dimmed">ChatGPT에 쿼리를 보내 결과를 확인합니다</Text>
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
                  <Text fw={700} size="lg">브랜드 등록</Text>
                  <Text size="xs" c="dimmed">약 30초</Text>
                </div>
              </Group>

              <Text size="sm" c="dimmed">
                대표적인 제품/서비스 브랜드명을 입력하세요. AI 응답에서 이 브랜드가 언급되는지 추적합니다.
              </Text>

              <TextInput
                label="브랜드명"
                placeholder="예: 율립, 삼성전자"
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
                  <Text fw={700} size="lg">쿼리 추가</Text>
                  <Text size="xs" c="dimmed">약 20초</Text>
                </div>
              </Group>

              <Text size="sm" c="dimmed">
                AI에게 물어볼 질문을 선택하거나 직접 입력하세요.
                {createdBrand && ` "${createdBrand.name}" 브랜드에 자동 연결됩니다.`}
              </Text>

              {/* Template chips */}
              <Box>
                <Text size="xs" fw={500} mb="xs">추천 쿼리 템플릿</Text>
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
                label="쿼리"
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
                  쿼리 추가하고 테스트하기
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
                  <Text fw={700} size="lg">테스트 결과</Text>
                  <Text size="xs" c="dimmed">ChatGPT 응답 확인</Text>
                </div>
              </Group>

              {testLoading && (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <Loader size="lg" color="brand" />
                    <Text fw={500}>ChatGPT에게 물어보는 중...</Text>
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
                    <Paper p="md" radius="md" style={{ background: 'var(--mantine-color-teal-0)', border: '1px solid var(--mantine-color-teal-3)' }}>
                      <Group gap="sm">
                        <ThemeIcon size={32} radius="xl" color="teal">
                          <IconCheck size={18} />
                        </ThemeIcon>
                        <div>
                          <Text fw={700} c="teal.7">축하합니다!</Text>
                          <Text size="sm" c="teal.6">AI가 브랜드를 인용하고 있습니다</Text>
                        </div>
                      </Group>
                    </Paper>
                  ) : (
                    <Paper p="md" radius="md" style={{ background: 'var(--mantine-color-blue-0)', border: '1px solid var(--mantine-color-blue-3)' }}>
                      <Group gap="sm">
                        <ThemeIcon size={32} radius="xl" color="blue" variant="light">
                          <IconSparkles size={18} />
                        </ThemeIcon>
                        <div>
                          <Text fw={700} c="blue.7">아직 인용되지 않았습니다</Text>
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
                          <Text size="sm" fw={500}>{br.brandName}</Text>
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
                        {createdBrand ? (
                          <Highlight
                            highlight={[createdBrand.name, ...createdBrand.competitors]}
                            highlightStyles={{ backgroundColor: 'var(--mantine-color-yellow-2)', fontWeight: 700 }}
                          >
                            {testResult.fullResponse}
                          </Highlight>
                        ) : (
                          testResult.fullResponse
                        )}
                      </Code>
                    </ScrollArea>
                  </Box>

                  {/* 다음 기능 프리뷰 */}
                  <Paper p="md" radius="md" withBorder bg="gray.0">
                    <Text size="sm" fw={600} mb="sm">대시보드에서 할 수 있는 것들</Text>
                    <Stack gap="sm">
                      <Group gap="sm" align="flex-start">
                        <ThemeIcon size={28} radius="md" variant="light" color="blue">
                          <IconMessageQuestion size={14} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>쿼리 추가</Text>
                          <Text size="xs" c="dimmed">더 많은 질문을 등록하고 다양한 AI 엔진에서 테스트하세요</Text>
                        </Box>
                      </Group>
                      <Group gap="sm" align="flex-start">
                        <ThemeIcon size={28} radius="md" variant="light" color="teal">
                          <IconFileDescription size={14} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>리포트</Text>
                          <Text size="xs" c="dimmed">5개 이상 테스트 시 인용률, 점유율 등 성과 리포트를 생성합니다</Text>
                        </Box>
                      </Group>
                      <Group gap="sm" align="flex-start">
                        <ThemeIcon size={28} radius="md" variant="light" color="grape">
                          <IconBrain size={14} />
                        </ThemeIcon>
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>AI 인사이트</Text>
                          <Text size="xs" c="dimmed">AI가 공략 키워드와 실행 가이드를 분석하여 전략을 제안합니다</Text>
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
