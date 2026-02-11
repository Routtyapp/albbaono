import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Alert,
  Button,
  Center,
  ThemeIcon,
  ActionIcon,
  Highlight,
  Tooltip,
  Collapse,
  ScrollArea,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconSearch,
  IconQuote,
  IconTag,
  IconRobot,
  IconBrandOpenai,
  IconSparkles,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { getResultById } from '../../services/api';
import type { TestResult } from '../../types';
import { VisibilitySkeleton } from '../../components/ui';

// 응답에서 키워드 추출하는 함수
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    '그', '이', '저', '것', '수', '등', '및', '또한', '하는', '있는', '되는',
    '의', '를', '을', '에', '가', '는', '은', '로', '으로', '와', '과', '도',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'must', 'shall', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'this',
    'that', 'these', 'those', 'it', 'its', 'you', 'your', 'we', 'our',
    'they', 'their', 'he', 'she', 'him', 'her', 'his', 'hers', 'i', 'me', 'my',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// 엔진 아이콘 컴포넌트
function EngineIcon({ engine }: { engine: string }) {
  if (engine === 'gpt') {
    return <IconBrandOpenai size={14} />;
  }
  return <IconSparkles size={14} />;
}

export function Visibility() {
  const [searchParams] = useSearchParams();
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResponseExpanded, setIsResponseExpanded] = useState(false);

  // URL에서 선택된 결과 ID 읽기
  const selectedResultId = searchParams.get('resultId');

  // 선택된 결과 로드
  useEffect(() => {
    const loadSelectedResult = async () => {
      if (!selectedResultId) {
        setSelectedResult(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await getResultById(selectedResultId);
        setSelectedResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load result');
        setSelectedResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSelectedResult();
  }, [selectedResultId]);

  const loadData = async () => {
    if (selectedResultId) {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getResultById(selectedResultId);
        setSelectedResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // 선택된 결과의 키워드 추출
  const keywords = useMemo(() => {
    if (!selectedResult) return [];
    return extractKeywords(selectedResult.fullResponse || selectedResult.response);
  }, [selectedResult]);

  // 브랜드 관련 키워드 (인용된 브랜드명)
  const brandKeywords = useMemo(() => {
    if (!selectedResult) return [];
    return selectedResult.brandResults
      ?.filter(br => br.cited)
      .map(br => br.brandName) || [];
  }, [selectedResult]);

  if (isLoading) {
    return <VisibilitySkeleton />;
  }

  return (
    <Stack gap="lg" h="calc(100vh - 120px)">
      <Group justify="space-between">
        <div>
          <Title order={2}>AI 가시성 상세</Title>
          <Text c="dimmed" size="sm">
            쿼리별 AI 응답 및 인용 분석
          </Text>
        </div>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={loadData}
        >
          새로고침
        </Button>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="오류" color="red">
          {error}
        </Alert>
      )}

      {/* 선택된 쿼리 상세 정보 */}
      {selectedResult ? (
        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Stack gap="md">
            {/* 쿼리 헤더 */}
            <Paper p="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Group gap="xs">
                      <ThemeIcon size="sm" variant="light" color="blue">
                        <IconSearch size={14} />
                      </ThemeIcon>
                      <Text size="xs" c="dimmed" tt="uppercase">
                        테스트 쿼리
                      </Text>
                    </Group>
                    <Title order={3} style={{ wordBreak: 'break-word' }}>
                      "{selectedResult.query}"
                    </Title>
                  </Stack>
                  <Badge
                    size="lg"
                    color={selectedResult.cited ? 'teal' : 'gray'}
                    leftSection={selectedResult.cited ? <IconCheck size={14} /> : <IconX size={14} />}
                  >
                    {selectedResult.cited ? '인용됨' : '미인용'}
                  </Badge>
                </Group>

                <Group gap="md">
                  <Badge variant="light" size="sm">
                    {selectedResult.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    size="sm"
                    leftSection={<EngineIcon engine={selectedResult.engine} />}
                  >
                    {selectedResult.engine === 'gpt' ? 'ChatGPT' : 'Gemini'}
                  </Badge>
                  <Text size="sm" c="dimmed">
                    {new Date(selectedResult.testedAt).toLocaleString('ko-KR')}
                  </Text>
                </Group>
              </Stack>
            </Paper>

            {/* 브랜드별 인용 결과 */}
            {selectedResult.brandResults && selectedResult.brandResults.length > 0 && (
              <Paper p="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="violet">
                      <IconQuote size={14} />
                    </ThemeIcon>
                    <Text>브랜드별 인용 결과</Text>
                  </Group>
                  <Group gap="sm">
                    {selectedResult.brandResults.map((br) => (
                      <Paper
                        key={br.brandId}
                        p="sm"
                        radius="md"
                        withBorder
                        style={{
                          borderColor: br.cited ? 'var(--mantine-color-teal-4)' : undefined,
                          backgroundColor: br.cited ? 'light-dark(var(--mantine-color-teal-0), var(--mantine-color-teal-9))' : undefined,
                        }}
                      >
                        <Group gap="xs">
                          {br.cited ? (
                            <ThemeIcon size="xs" color="teal" variant="filled">
                              <IconCheck size={10} />
                            </ThemeIcon>
                          ) : (
                            <ThemeIcon size="xs" color="gray" variant="light">
                              <IconX size={10} />
                            </ThemeIcon>
                          )}
                          <Text size="sm">{br.brandName}</Text>
                          {br.rank && (
                            <Badge size="xs" variant="filled" color="blue">
                              #{br.rank}위
                            </Badge>
                          )}
                        </Group>
                        {br.competitorMentions && br.competitorMentions.length > 0 && (
                          <Text size="xs" c="dimmed" mt={4}>
                            경쟁사 언급: {br.competitorMentions.join(', ')}
                          </Text>
                        )}
                      </Paper>
                    ))}
                  </Group>
                </Stack>
              </Paper>
            )}

            {/* 키워드 분석 */}
            <Paper p="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="sm" variant="light" color="orange">
                    <IconTag size={14} />
                  </ThemeIcon>
                  <Text>주요 키워드</Text>
                </Group>
                {brandKeywords.length > 0 && (
                  <div>
                    <Text size="xs" c="dimmed" mb="xs">인용된 브랜드</Text>
                    <Group gap="xs">
                      {brandKeywords.map((keyword, idx) => (
                        <Badge key={idx} color="teal" variant="light">
                          {keyword}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                )}
                <div>
                  <Text size="xs" c="dimmed" mb="xs">응답 내 주요 단어</Text>
                  <Group gap="xs">
                    {keywords.length > 0 ? (
                      keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" color="gray">
                          {keyword}
                        </Badge>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed">키워드를 추출할 수 없습니다</Text>
                    )}
                  </Group>
                </div>
              </Stack>
            </Paper>

            {/* AI 응답 내용 */}
            <Paper p="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon size="sm" variant="light" color="cyan">
                      <IconRobot size={14} />
                    </ThemeIcon>
                    <Text>AI 응답 내용</Text>
                  </Group>
                  <Tooltip label={isResponseExpanded ? '접기' : '전체 보기'}>
                    <ActionIcon
                      variant="subtle"
                      onClick={() => setIsResponseExpanded(!isResponseExpanded)}
                    >
                      {isResponseExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </ActionIcon>
                  </Tooltip>
                </Group>

                <Collapse in={!isResponseExpanded}>
                  <Paper p="md" radius="sm" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))">
                    <Highlight
                      highlight={brandKeywords}
                      highlightStyles={{
                        backgroundColor: 'light-dark(var(--mantine-color-teal-1), var(--mantine-color-teal-9))',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontWeight: 400,
                      }}
                    >
                      {selectedResult.response || '응답 요약이 없습니다.'}
                    </Highlight>
                  </Paper>
                </Collapse>

                <Collapse in={isResponseExpanded}>
                  <Paper p="md" radius="sm" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))">
                    <Highlight
                      highlight={brandKeywords}
                      highlightStyles={{
                        backgroundColor: 'light-dark(var(--mantine-color-teal-1), var(--mantine-color-teal-9))',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontWeight: 400,
                      }}
                      style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}
                    >
                      {selectedResult.fullResponse || selectedResult.response || '응답 내용이 없습니다.'}
                    </Highlight>
                  </Paper>
                </Collapse>
              </Stack>
            </Paper>
          </Stack>
        </ScrollArea>
      ) : (
        <Paper p="xl" radius="md" withBorder style={{ flex: 1 }}>
          <Center h="100%">
            <Stack align="center" gap="md">
              <ThemeIcon size={60} variant="light" color="gray">
                <IconSearch size={30} />
              </ThemeIcon>
              {!selectedResultId ? (
                <>
                  <Text>쿼리를 선택하세요</Text>
                  <Text size="sm" c="dimmed">
                    사이드바에서 쿼리를 클릭하면 상세 정보를 볼 수 있습니다
                  </Text>
                </>
              ) : (
                <>
                  <Text>결과를 찾을 수 없습니다</Text>
                  <Text size="sm" c="dimmed">
                    다른 쿼리를 선택해주세요
                  </Text>
                </>
              )}
            </Stack>
          </Center>
        </Paper>
      )}
    </Stack>
  );
}
