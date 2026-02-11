import {
  Box,
  Container,
  SimpleGrid,
  Paper,
  Stack,
  Text,
  Group,
} from '@mantine/core';
import { SectionTitle } from '../ui/SectionTitle';

const metrics = [
  { label: 'AI 추천 언급률', before: 12, after: 67, unit: '%' },
  { label: '경쟁사 대비 점유율', before: 9, after: 41, unit: '%' },
  { label: '보고서 생성 시간', before: 300, after: 30, unit: '분', invert: true },
];

const steps = [
  { num: '01', title: 'AI 가시성 진단' },
  { num: '02', title: '쿼리별 점수 산출' },
  { num: '03', title: '콘텐츠 개선' },
  { num: '04', title: '성과 추적' },
];

function MetricBar({ label, before, after, unit, invert }: {
  label: string;
  before: number;
  after: number;
  unit: string;
  invert?: boolean;
}) {
  const maxVal = invert ? before : Math.max(before, after);
  const beforeWidth = (before / maxVal) * 100;
  const afterWidth = (after / maxVal) * 100;
  const improved = invert ? after < before : after > before;
  const beforeLabel = invert ? `${Math.floor(before / 60)}시간` : `${before}${unit}`;

  return (
    <Paper radius="sm" bg="gray.0" p={20}>
      <Group justify="space-between" mb={12}>
        <Text fz="sm">{label}</Text>
        <Group gap={6}>
          <Text fz="xs" c="dimmed" td="line-through">{beforeLabel}</Text>
          <Text fz="md" c={improved ? 'teal.6' : 'red.6'}>
            {after}{unit}
          </Text>
        </Group>
      </Group>
      <Box h={6} bg="gray.2" style={{ borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <Box
          h="100%"
          bg="gray.3"
          style={{
            width: `${beforeWidth}%`,
            borderRadius: 3,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
        <Box
          h="100%"
          style={{
            width: `${afterWidth}%`,
            borderRadius: 3,
            position: 'absolute',
            top: 0,
            left: 0,
            background: improved
              ? 'linear-gradient(90deg, #20c997, #12b886)'
              : 'linear-gradient(90deg, #ff6b6b, #fa5252)',
          }}
        />
      </Box>
    </Paper>
  );
}

export function CaseStudy() {
  return (
    <Box component="section" id="case-study" py={{ base: 80, md: 140 }}>
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <SectionTitle
          title={<>실제 고객사 성과로<br />증명합니다</>}
          description="AI 검색 유입이 감소하던 B2B SaaS 브랜드가 GEO 최적화 후 달라진 수치입니다."
        />

        <Group gap={12} mb={20}>
          <Text fz="md">B2B SaaS 브랜드 A</Text>
          <Box
            px={10}
            py={3}
            style={{
              borderRadius: 20,
              background: 'linear-gradient(90deg, #20c997, #12b886)',
            }}
          >
            <Text fz={11} c="white">3개월 후</Text>
          </Box>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={12} mb={20}>
          {metrics.map((m) => (
            <MetricBar key={m.label} {...m} />
          ))}
        </SimpleGrid>

        {/* Process — inline steps */}
        <Group gap={0} justify="center" mt={8}>
          {steps.map((s, i) => (
            <Group key={s.num} gap={0} align="center">
              <Group gap={8}>
                <Box
                  w={28}
                  h={28}
                  style={{
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #20c997, #12b886)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Text fz={10} c="white">{s.num}</Text>
                </Box>
                <Text fz="sm">{s.title}</Text>
              </Group>
              {i < steps.length - 1 && (
                <Box
                  w={40}
                  h={2}
                  bg="teal.2"
                  mx={12}
                  style={{ borderRadius: 1, flexShrink: 0 }}
                  visibleFrom="md"
                />
              )}
            </Group>
          ))}
        </Group>
      </Container>
    </Box>
  );
}
