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
  Anchor,
  Tooltip,
  Collapse,
  TextInput,
  Pagination,
  UnstyledButton,
  Select,
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
import { getResultsPaginated, type PaginatedResults } from '../../services/results';
import type { TestResult } from '../../types';
import { VisibilitySkeleton } from '../../components/ui';

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

function EngineIcon({ engine }: { engine: string }) {
  if (engine === 'gpt') {
    return <IconBrandOpenai size={14} />;
  }
  return <IconSparkles size={14} />;
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

export function Visibility() {
  const [results, setResults] = useState<PaginatedResults | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResponseExpanded, setIsResponseExpanded] = useState(false);

  // List state
  const [listPage, setListPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEngine, setFilterEngine] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resultsData = await getResultsPaginated(1, 100);
      setResults(resultsData);
      if (resultsData.results.length > 0 && !selectedResult) {
        setSelectedResult(resultsData.results[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered results
  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results.results.filter((r) => {
      const matchesSearch = !searchQuery || r.query.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEngine = !filterEngine || r.engine === filterEngine;
      return matchesSearch && matchesEngine;
    });
  }, [results, searchQuery, filterEngine]);

  const LIST_PAGE_SIZE = 15;
  const listTotalPages = Math.ceil(filteredResults.length / LIST_PAGE_SIZE);
  const paginatedResults = filteredResults.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE);

  useEffect(() => {
    setListPage(1);
  }, [searchQuery, filterEngine]);

  const keywords = useMemo(() => {
    if (!selectedResult) return [];
    return extractKeywords(selectedResult.fullResponse || selectedResult.response);
  }, [selectedResult]);

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
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>상세 인용 여부</Title>
          <Text c="dimmed" size="sm">질문별 AI 응답 및 인용 분석</Text>
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

      {!results || results.results.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Center py={60}>
            <Stack align="center" gap="md">
              <ThemeIcon size={60} variant="light" color="gray">
                <IconSearch size={30} />
              </ThemeIcon>
              <Text>테스트 결과가 없습니다</Text>
              <Text size="sm" c="dimmed" ta="center">
                질문 관리에서 테스트를 실행하면 이곳에서 상세 분석을 확인할 수 있습니다.
              </Text>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <div className="visibility-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'var(--mantine-spacing-md)', alignItems: 'start' }}>
          {/* Left: Result List */}
          <Paper p="xs" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 180px)' }}>
            <Stack gap="xs" p="xs" pb={0}>
              <TextInput
                placeholder="질문 검색..."
                leftSection={<IconSearch size={14} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="xs"
              />
              <Select
                placeholder="엔진 필터"
                data={[
                  { value: '', label: '전체' },
                  { value: 'gpt', label: 'ChatGPT' },
                  { value: 'gemini', label: 'Gemini' },
                ]}
                value={filterEngine || ''}
                onChange={(v) => setFilterEngine(v || null)}
                size="xs"
                clearable
              />
            </Stack>

            <Group justify="space-between" px="xs" py={6}>
              <Text size="xs" c="dimmed">{filteredResults.length}개 결과</Text>
              <ActionIcon variant="subtle" color="gray" size="xs" onClick={loadData} title="새로고침">
                <IconRefresh size={12} />
              </ActionIcon>
            </Group>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <Stack gap={2}>
                {paginatedResults.map((result) => {
                  const isSelected = selectedResult?.id === result.id;
                  return (
                    <UnstyledButton
                      key={result.id}
                      onClick={() => {
                        setSelectedResult(result);
                        setIsResponseExpanded(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 'var(--mantine-radius-sm)',
                        backgroundColor: isSelected
                          ? 'light-dark(var(--mantine-color-brand-0), var(--mantine-color-brand-9))'
                          : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <Text
                        size="sm"
                        fw={isSelected ? 600 : 400}
                        c={isSelected ? 'brand' : undefined}
                        lineClamp={1}
                      >
                        {result.query}
                      </Text>
                      <Group gap={4} mt={4}>
                        <Badge
                          size="xs"
                          color={result.engine === 'gpt' ? 'teal' : 'blue'}
                          variant="light"
                        >
                          {result.engine === 'gpt' ? 'GPT' : 'Gemini'}
                        </Badge>
                        {result.brandResults && result.brandResults.length > 0 && (
                          <Badge
                            size="xs"
                            color={result.brandResults.some(br => br.cited) ? 'teal' : 'gray'}
                            variant="light"
                          >
                            {result.brandResults.some(br => br.cited) ? '인용' : '미인용'}
                          </Badge>
                        )}
                        <Text size="xs" c="dimmed">
                          {new Date(result.testedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  );
                })}
                {filteredResults.length === 0 && (
                  <Text c="dimmed" ta="center" py="md" size="sm">검색 결과 없음</Text>
                )}
              </Stack>
            </div>

            {listTotalPages > 1 && (
              <Group justify="center" py="xs">
                <Pagination value={listPage} onChange={setListPage} total={listTotalPages} size="xs" />
              </Group>
            )}
          </Paper>

          {/* Right: Detail */}
          <Paper p={{ base: 'md', sm: 'xl' }} radius="md" withBorder>
            {selectedResult ? (
              <div>
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
                            <Text size="xs" c="dimmed" tt="uppercase">테스트 질문</Text>
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
                        <Badge variant="light" size="sm">{selectedResult.category}</Badge>
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
                                  <Badge size="xs" variant="filled" color="blue">#{br.rank}위</Badge>
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
                              <Badge key={idx} color="teal" variant="light">{keyword}</Badge>
                            ))}
                          </Group>
                        </div>
                      )}
                      <div>
                        <Text size="xs" c="dimmed" mb="xs">응답 내 주요 단어</Text>
                        <Group gap="xs">
                          {keywords.length > 0 ? (
                            keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="outline" color="gray">{keyword}</Badge>
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
                          <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {renderLinkifiedText(selectedResult.response || '응답 요약이 없습니다.')}
                          </Text>
                        </Paper>
                      </Collapse>

                      <Collapse in={isResponseExpanded}>
                        <Paper p="md" radius="sm" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))">
                          <Text style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                            {renderLinkifiedText(selectedResult.fullResponse || selectedResult.response || '응답 내용이 없습니다.')}
                          </Text>
                        </Paper>
                      </Collapse>
                    </Stack>
                  </Paper>
                </Stack>
              </div>
            ) : (
              <Center style={{ minHeight: 400 }}>
                <Stack align="center" gap="md">
                  <ThemeIcon size={60} variant="light" color="gray">
                    <IconSearch size={30} />
                  </ThemeIcon>
                  <Text>좌측에서 테스트 결과를 선택하세요</Text>
                  <Text size="sm" c="dimmed" ta="center">
                    질문을 선택하면 AI 응답 및 인용 분석을 확인할 수 있습니다
                  </Text>
                </Stack>
              </Center>
            )}
          </Paper>
        </div>
      )}
    </Stack>
  );
}

