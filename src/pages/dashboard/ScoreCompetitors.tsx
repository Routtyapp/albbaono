import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Title,
  Text,
  Paper,
  Center,
  Group,
  Badge,
  ThemeIcon,
  Select,
  SimpleGrid,
  Progress,
  Divider,
  Box,
  RingProgress,
  Alert,
} from '@mantine/core';
import {
  IconTargetArrow,
  IconArrowUp,
  IconArrowDown,
  IconMinus,
  IconAlertCircle,
  IconChartBar,
  IconFileText,
  IconCode,
  IconLink,
  IconFileAnalytics,
  IconTrophy,
  IconScale,
} from '@tabler/icons-react';
import type { GeoScoreResult } from '../../services/api';

interface HistoryEntry extends GeoScoreResult {
  savedAt: string;
}

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

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

interface ComparisonBarProps {
  label: string;
  icon: typeof IconCode;
  myScore: number;
  myMax: number;
  competitorScore: number;
  competitorMax: number;
}

function ComparisonBar({ label, icon: Icon, myScore, myMax, competitorScore, competitorMax }: ComparisonBarProps) {
  const myPercent = (myScore / myMax) * 100;
  const competitorPercent = (competitorScore / competitorMax) * 100;
  const diff = myPercent - competitorPercent;
  const isHigher = diff > 0;
  const isLower = diff < 0;

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <ThemeIcon size="sm" variant="light" color="gray">
            <Icon size={14} />
          </ThemeIcon>
          <Text fw={500} size="sm">{label}</Text>
        </Group>
        <Group gap="xs">
          {isHigher && (
            <Badge color="teal" size="sm" leftSection={<IconArrowUp size={12} />}>
              +{diff.toFixed(1)}%
            </Badge>
          )}
          {isLower && (
            <Badge color="red" size="sm" leftSection={<IconArrowDown size={12} />}>
              {diff.toFixed(1)}%
            </Badge>
          )}
          {!isHigher && !isLower && (
            <Badge color="gray" size="sm" leftSection={<IconMinus size={12} />}>
              동일
            </Badge>
          )}
        </Group>
      </Group>

      {/* 비교 바 */}
      <Stack gap={4}>
        {/* 자사 바 */}
        <Group gap="xs">
          <Text size="xs" c="dimmed" w={40}>자사</Text>
          <Box style={{ flex: 1 }}>
            <Progress value={myPercent} color="blue" size="lg" radius="sm" />
          </Box>
          <Text size="xs" fw={500} w={50} ta="right">{myScore}/{myMax}</Text>
        </Group>

        {/* 경쟁사 바 */}
        <Group gap="xs">
          <Text size="xs" c="dimmed" w={40}>경쟁</Text>
          <Box style={{ flex: 1 }}>
            <Progress value={competitorPercent} color="orange" size="lg" radius="sm" />
          </Box>
          <Text size="xs" fw={500} w={50} ta="right">{competitorScore}/{competitorMax}</Text>
        </Group>
      </Stack>
    </Paper>
  );
}

export function ScoreCompetitors() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mySelection, setMySelection] = useState<string | null>(null);
  const [competitorSelection, setCompetitorSelection] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('geoScoreHistory');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        // 첫 번째와 두 번째를 기본 선택
        if (parsed.length >= 2) {
          setMySelection(parsed[0].url);
          setCompetitorSelection(parsed[1].url);
        } else if (parsed.length === 1) {
          setMySelection(parsed[0].url);
        }
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const selectOptions = useMemo(() => {
    return history.map((h) => ({
      value: h.url,
      label: `${getDomainFromUrl(h.url)} (${h.grade} - ${h.totalScore}점)`,
    }));
  }, [history]);

  const myData = useMemo(() => {
    return history.find((h) => h.url === mySelection) || null;
  }, [history, mySelection]);

  const competitorData = useMemo(() => {
    return history.find((h) => h.url === competitorSelection) || null;
  }, [history, competitorSelection]);

  const totalDiff = useMemo(() => {
    if (!myData || !competitorData) return 0;
    return myData.totalScore - competitorData.totalScore;
  }, [myData, competitorData]);

  if (history.length === 0) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>경쟁사 비교</Title>
            <Text c="dimmed" size="sm">
              GEO Score를 기반으로 경쟁사와 비교합니다
            </Text>
          </div>
        </Group>

        <Paper p="xl" radius="md" withBorder>
          <Center py={60}>
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="xl" variant="light" color="grape">
                <IconTargetArrow size={40} />
              </ThemeIcon>
              <Title order={3}>분석 기록이 없습니다</Title>
              <Text c="dimmed" ta="center" maw={400}>
                GEO Score 분석을 먼저 진행해주세요.
                자사 사이트와 경쟁사 사이트를 각각 분석하면 비교가 가능합니다.
              </Text>
              <Badge variant="outline" size="lg">
                GEO Score 분석 → 경쟁사 비교
              </Badge>
            </Stack>
          </Center>
        </Paper>
      </Stack>
    );
  }

  if (history.length === 1) {
    return (
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>경쟁사 비교</Title>
            <Text c="dimmed" size="sm">
              GEO Score를 기반으로 경쟁사와 비교합니다
            </Text>
          </div>
        </Group>

        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          비교를 위해 최소 2개 사이트의 GEO Score 분석이 필요합니다.
          경쟁사 사이트도 분석해주세요.
        </Alert>

        <Paper p="md" radius="md" withBorder>
          <Text size="sm" c="dimmed" mb="xs">현재 분석된 사이트</Text>
          <Group>
            <Badge size="lg" color={GRADE_COLORS[history[0].grade]}>
              {history[0].grade}
            </Badge>
            <Text fw={500}>{getDomainFromUrl(history[0].url)}</Text>
            <Text c="dimmed">({history[0].totalScore}점)</Text>
          </Group>
        </Paper>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>경쟁사 비교</Title>
          <Text c="dimmed" size="sm">
            GEO Score를 기반으로 경쟁사와 비교합니다
          </Text>
        </div>
        {myData && competitorData && (
          <Badge
            size="lg"
            color={totalDiff > 0 ? 'teal' : totalDiff < 0 ? 'red' : 'gray'}
            leftSection={
              totalDiff > 0 ? <IconArrowUp size={14} /> :
              totalDiff < 0 ? <IconArrowDown size={14} /> :
              <IconMinus size={14} />
            }
          >
            {totalDiff > 0 ? '+' : ''}{totalDiff}점
          </Badge>
        )}
      </Group>

      {/* 사이트 선택 영역 */}
      <SimpleGrid cols={2} spacing="md">
        <Paper p="md" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-blue-6)', borderWidth: 2 }}>
          <Group gap="xs" mb="sm">
            <ThemeIcon size="sm" color="blue">
              <IconTrophy size={14} />
            </ThemeIcon>
            <Text fw={600} size="sm" c="blue">자사 브랜드</Text>
          </Group>
          <Select
            placeholder="자사 사이트 선택"
            data={selectOptions}
            value={mySelection}
            onChange={setMySelection}
            searchable
          />
        </Paper>

        <Paper p="md" radius="md" withBorder style={{ borderColor: 'var(--mantine-color-orange-6)', borderWidth: 2 }}>
          <Group gap="xs" mb="sm">
            <ThemeIcon size="sm" color="orange">
              <IconScale size={14} />
            </ThemeIcon>
            <Text fw={600} size="sm" c="orange">비교 경쟁사</Text>
          </Group>
          <Select
            placeholder="경쟁사 사이트 선택"
            data={selectOptions}
            value={competitorSelection}
            onChange={setCompetitorSelection}
            searchable
          />
        </Paper>
      </SimpleGrid>

      {myData && competitorData && (
        <>
          {/* 총점 비교 */}
          <Paper p="lg" radius="md" withBorder>
            <Group justify="center" gap={60}>
              {/* 자사 */}
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">자사</Text>
                <RingProgress
                  size={120}
                  thickness={12}
                  roundCaps
                  sections={[{ value: myData.totalScore, color: 'blue' }]}
                  label={
                    <Center>
                      <Stack gap={0} align="center">
                        <Text fw={700} size="xl">{myData.totalScore}</Text>
                        <Badge size="sm" color={GRADE_COLORS[myData.grade]}>{myData.grade}</Badge>
                      </Stack>
                    </Center>
                  }
                />
                <Text size="xs" c="dimmed" maw={120} ta="center" lineClamp={1}>
                  {getDomainFromUrl(myData.url)}
                </Text>
              </Stack>

              {/* VS */}
              <Stack align="center" gap="xs">
                <ThemeIcon size={50} radius="xl" variant="light" color={totalDiff > 0 ? 'teal' : totalDiff < 0 ? 'red' : 'gray'}>
                  {totalDiff > 0 ? <IconArrowUp size={24} /> : totalDiff < 0 ? <IconArrowDown size={24} /> : <IconMinus size={24} />}
                </ThemeIcon>
                <Text fw={700} size="lg" c={totalDiff > 0 ? 'teal' : totalDiff < 0 ? 'red' : 'dimmed'}>
                  {totalDiff > 0 ? '+' : ''}{totalDiff}점
                </Text>
              </Stack>

              {/* 경쟁사 */}
              <Stack align="center" gap="xs">
                <Text size="sm" c="dimmed">경쟁사</Text>
                <RingProgress
                  size={120}
                  thickness={12}
                  roundCaps
                  sections={[{ value: competitorData.totalScore, color: 'orange' }]}
                  label={
                    <Center>
                      <Stack gap={0} align="center">
                        <Text fw={700} size="xl">{competitorData.totalScore}</Text>
                        <Badge size="sm" color={GRADE_COLORS[competitorData.grade]}>{competitorData.grade}</Badge>
                      </Stack>
                    </Center>
                  }
                />
                <Text size="xs" c="dimmed" maw={120} ta="center" lineClamp={1}>
                  {getDomainFromUrl(competitorData.url)}
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Divider label="카테고리별 비교" labelPosition="center" />

          {/* 카테고리별 비교 바 */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
              const myCategory = myData.categories[key as keyof typeof myData.categories];
              const competitorCategory = competitorData.categories[key as keyof typeof competitorData.categories];

              return (
                <ComparisonBar
                  key={key}
                  label={label}
                  icon={CATEGORY_ICONS[key]}
                  myScore={myCategory.score}
                  myMax={myCategory.maxScore}
                  competitorScore={competitorCategory.score}
                  competitorMax={competitorCategory.maxScore}
                />
              );
            })}
          </SimpleGrid>

          {/* 우위/열위 요약 */}
          <SimpleGrid cols={2} spacing="md">
            <Paper p="md" radius="md" withBorder bg="teal.9" style={{ opacity: 0.9 }}>
              <Group gap="xs" mb="sm">
                <IconArrowUp size={18} />
                <Text fw={600}>자사 우위 항목</Text>
              </Group>
              <Stack gap="xs">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                  const myCategory = myData.categories[key as keyof typeof myData.categories];
                  const competitorCategory = competitorData.categories[key as keyof typeof competitorData.categories];
                  const myPercent = (myCategory.score / myCategory.maxScore) * 100;
                  const competitorPercent = (competitorCategory.score / competitorCategory.maxScore) * 100;
                  const diff = myPercent - competitorPercent;

                  if (diff > 0) {
                    return (
                      <Group key={key} justify="space-between">
                        <Text size="sm">{label}</Text>
                        <Badge color="teal" variant="light">+{diff.toFixed(1)}%</Badge>
                      </Group>
                    );
                  }
                  return null;
                }).filter(Boolean)}
                {Object.entries(CATEGORY_LABELS).every(([key]) => {
                  const myCategory = myData.categories[key as keyof typeof myData.categories];
                  const competitorCategory = competitorData.categories[key as keyof typeof competitorData.categories];
                  return (myCategory.score / myCategory.maxScore) <= (competitorCategory.score / competitorCategory.maxScore);
                }) && (
                  <Text size="sm" c="dimmed" fs="italic">우위 항목 없음</Text>
                )}
              </Stack>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="red.9" style={{ opacity: 0.9 }}>
              <Group gap="xs" mb="sm">
                <IconArrowDown size={18} />
                <Text fw={600}>개선 필요 항목</Text>
              </Group>
              <Stack gap="xs">
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                  const myCategory = myData.categories[key as keyof typeof myData.categories];
                  const competitorCategory = competitorData.categories[key as keyof typeof competitorData.categories];
                  const myPercent = (myCategory.score / myCategory.maxScore) * 100;
                  const competitorPercent = (competitorCategory.score / competitorCategory.maxScore) * 100;
                  const diff = myPercent - competitorPercent;

                  if (diff < 0) {
                    return (
                      <Group key={key} justify="space-between">
                        <Text size="sm">{label}</Text>
                        <Badge color="red" variant="light">{diff.toFixed(1)}%</Badge>
                      </Group>
                    );
                  }
                  return null;
                }).filter(Boolean)}
                {Object.entries(CATEGORY_LABELS).every(([key]) => {
                  const myCategory = myData.categories[key as keyof typeof myData.categories];
                  const competitorCategory = competitorData.categories[key as keyof typeof competitorData.categories];
                  return (myCategory.score / myCategory.maxScore) >= (competitorCategory.score / competitorCategory.maxScore);
                }) && (
                  <Text size="sm" c="dimmed" fs="italic">열위 항목 없음</Text>
                )}
              </Stack>
            </Paper>
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
