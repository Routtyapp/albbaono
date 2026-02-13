import { useState, useEffect } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import {
  Stack,
  Title,
  Text,
  Paper,
  Table,
  Badge,
  Group,
  Button,
  Select,
  Modal,
  Alert,
  Code,
  ScrollArea,
  Divider,
  Pagination,
  Loader,
  Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
} from '@tabler/icons-react';
import { AI_ENGINES, type TestResult } from '../../types';
import { getResultsPaginated, type PaginatedResults } from '../../services/results';
import { TableSkeleton } from '../../components/ui';

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

export function QueryHistoryPanel() {
  const [data, setData] = useState<PaginatedResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [engineFilter, setEngineFilter] = useState<string | null>(null);

  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  useBodyScrollLock(detailOpened);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getResultsPaginated(page, 20);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (result: TestResult) => {
    setSelectedResult(result);
    openDetail();
  };

  const filteredResults = data?.results.filter((r) => {
    if (!engineFilter) return true;
    return r.engine === engineFilter;
  }) || [];

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  if (isLoading && !data) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>테스트 이력</Title>
          <Text c="dimmed" size="sm">
            전체 {data?.total ?? 0}건의 테스트 결과
          </Text>
        </div>
        <Group wrap="wrap">
          <Select
            placeholder="엔진 필터"
            data={[
              { value: '', label: '전체 엔진' },
              { value: 'gpt', label: 'ChatGPT' },
              { value: 'gemini', label: 'Gemini' },
            ]}
            value={engineFilter || ''}
            onChange={(v) => setEngineFilter(v || null)}
            w={{ base: 120, sm: 140 }}
            clearable
          />
          <Button variant="subtle" leftSection={<IconRefresh size={16} />} onClick={loadData} size="sm">새로고침</Button>
        </Group>
      </Group>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="오류" color="red" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper p="md" radius="md" withBorder>
        {isLoading ? (
          <Group justify="center" py="xl"><Loader /></Group>
        ) : filteredResults.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">테스트 결과가 없습니다</Text>
        ) : (
          <>
            <ScrollArea type="auto">
            <Table striped highlightOnHover style={{ minWidth: 500 }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>질문</Table.Th>
                  <Table.Th ta="center">엔진</Table.Th>
                  <Table.Th ta="center">브랜드별 인용</Table.Th>
                  <Table.Th>테스트 시간</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredResults.map((result) => (
                  <Table.Tr
                    key={result.id}
                    onClick={() => handleRowClick(result)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Table.Td>
                      <Text size="sm" lineClamp={1}>{result.query}</Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Badge
                        color={result.engine === 'gemini' ? 'blue' : 'teal'}
                        variant="light"
                        size="sm"
                      >
                        {AI_ENGINES.find((e) => e.value === result.engine)?.label || result.engine}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" justify="center">
                        {result.brandResults?.map((br) => (
                          <Badge
                            key={br.brandId}
                            color={br.cited ? 'teal' : 'gray'}
                            variant="light"
                            size="sm"
                            leftSection={br.cited ? <IconCheck size={10} /> : <IconX size={10} />}
                          >
                            {br.brandName}
                            {br.rank && ` #${br.rank}`}
                          </Badge>
                        ))}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(result.testedAt).toLocaleString('ko-KR')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            </ScrollArea>

            {totalPages > 1 && (
              <Group justify="center" mt="md">
                <Pagination value={page} onChange={setPage} total={totalPages} />
              </Group>
            )}
          </>
        )}
      </Paper>

      {/* Detail modal */}
      <Modal opened={detailOpened} onClose={closeDetail} title="테스트 결과 상세" size="lg" centered lockScroll={false}>
        {selectedResult && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" c="dimmed">질문</Text>
                <Text>{selectedResult.query}</Text>
              </div>
              <Badge color={selectedResult.engine === 'gemini' ? 'blue' : 'teal'} variant="filled" size="lg">
                {AI_ENGINES.find((e) => e.value === selectedResult.engine)?.label || selectedResult.engine}
              </Badge>
            </Group>

            <div>
              <Text size="sm" c="dimmed" mb="xs">브랜드별 인용 여부</Text>
              <Stack gap="xs">
                {selectedResult.brandResults?.map((br) => (
                  <Group key={br.brandId} justify="space-between" p="xs" style={{ background: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))', borderRadius: 8 }}>
                    <Text>{br.brandName}</Text>
                    <Group gap="xs">
                      {br.cited ? (
                        <>
                          <Badge color="teal" leftSection={<IconCheck size={12} />}>인용됨</Badge>
                          {br.rank && <Badge variant="filled">#{br.rank}</Badge>}
                        </>
                      ) : (
                        <Badge color="gray" leftSection={<IconX size={12} />}>미인용</Badge>
                      )}
                      {br.competitorMentions && br.competitorMentions.length > 0 && (
                        <Badge color="orange" variant="light" size="sm">경쟁사: {br.competitorMentions.join(', ')}</Badge>
                      )}
                    </Group>
                  </Group>
                ))}
              </Stack>
            </div>

            <Divider />

            <div>
              <Text size="sm" c="dimmed" mb="xs">
                {AI_ENGINES.find((e) => e.value === selectedResult.engine)?.label || selectedResult.engine} 응답
              </Text>
              <ScrollArea h={250}>
                <Code block style={{ whiteSpace: 'pre-wrap' }}>
                  {renderLinkifiedText(selectedResult.fullResponse || selectedResult.response)}
                </Code>
              </ScrollArea>
            </div>

            <Group justify="flex-end">
              <Button onClick={closeDetail}>닫기</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

