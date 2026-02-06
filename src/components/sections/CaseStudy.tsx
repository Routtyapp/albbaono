import { IconCheck } from '@tabler/icons-react';
import {
  Box,
  Container,
  SimpleGrid,
  Paper,
  Badge,
  Group,
  Stack,
  ThemeIcon,
  Text,
} from '@mantine/core';
import { SectionTitle } from '../ui/SectionTitle';

const results = [
  { label: 'AI 추천 언급률', before: '12%', after: '67%' },
  { label: '경쟁사 대비 점유율', before: '9%', after: '41%' },
  { label: '보고서 생성 시간', before: '5시간', after: '30분' },
];

const auditProcess = [
  { title: 'AI 가시성 진단', desc: '주요 LLM 질의 50~100개를 실행해 브랜드 언급 현황을 점검합니다.' },
  { title: '쿼리별 점수 산출', desc: '쿼리군별로 GEO 점수를 계산하고 개선 난이도를 분류합니다.' },
  { title: '콘텐츠 개선 우선순위', desc: 'FAQ, 스키마, 제품 페이지 중 영향도가 큰 항목을 먼저 제안합니다.' },
  { title: '경쟁사 비교 리포트', desc: '동일한 질의에서 경쟁사가 어떻게 노출되는지 비교합니다.' },
];

const reverseEng = [
  { title: '질의 의도 리버스 엔지니어링', desc: 'AI가 어떤 문맥에서 브랜드를 추천하는지 질문 구조를 분석합니다.' },
  { title: '근거 콘텐츠 매핑', desc: 'AI가 인용하는 근거 콘텐츠를 추적하고 누락 영역을 보완합니다.' },
  { title: '성과 추적 자동화', desc: '변경 사항이 GEO 점수에 미친 영향을 자동으로 기록합니다.' },
];

export function CaseStudy() {
  return (
    <Box component="section" id="case-study" py={{ base: 80, md: 140 }}>
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <SectionTitle
          title={<>실제 고객사 성과로<br />증명합니다</>}
          description="AI 검색 유입이 감소하던 B2B SaaS 브랜드가 GEO 점수를 개선한 사례입니다."
        />

        {/* Metrics */}
        <Paper radius="md" withBorder p={{ base: 24, md: 48 }} mb={24}>
          <Group gap={12} mb={32}>
            <Text fz="lg" fw={700}>B2B SaaS 브랜드 A</Text>
            <Badge
              size="sm"
              radius="xl"
              variant="outline"
              color="gray"
              fw={600}
            >
              AI 검색 유입 감소
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={16}>
            {results.map((r) => (
              <Paper
                key={r.label}
                radius="sm"
                withBorder
                p={28}
                ta="center"
                bg="#f0efed"
              >
                <Text fz="sm" c="gray.5" mb={8}>{r.label}</Text>
                <Text fz="md" c="gray.5" td="line-through" mb={4}>{r.before}</Text>
                <Text fz={32} fw={700} lh={1} style={{ letterSpacing: '-0.03em' }}>{r.after}</Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Paper>

        {/* Process cards */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={20}>
          <Paper radius="md" withBorder p={32}>
            <Text fz="lg" fw={700} mb={20} style={{ letterSpacing: '-0.01em' }}>
              GEO Audit 프로세스
            </Text>
            {auditProcess.map((item, i) => (
              <Group
                key={item.title}
                gap={14}
                align="flex-start"
                py={16}
                style={{
                  borderBottom: i < auditProcess.length - 1 ? '1px solid var(--mantine-color-gray-2)' : 'none',
                }}
              >
                <ThemeIcon size={28} radius="xl" variant="light" color="gray">
                  <Text fz={11} fw={700}>{i + 1}</Text>
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text fz="md" fw={600}>{item.title}</Text>
                  <Text fz="md" c="dimmed" lh={1.5}>{item.desc}</Text>
                </Stack>
              </Group>
            ))}
          </Paper>

          <Paper radius="md" withBorder p={32}>
            <Text fz="lg" fw={700} mb={20} style={{ letterSpacing: '-0.01em' }}>
              리버스 엔지니어링
            </Text>
            {reverseEng.map((item, i) => (
              <Group
                key={item.title}
                gap={14}
                align="flex-start"
                py={16}
                style={{
                  borderBottom: i < reverseEng.length - 1 ? '1px solid var(--mantine-color-gray-2)' : 'none',
                }}
              >
                <ThemeIcon size={28} radius="xl" variant="light" color="accent.4" c="dark">
                  <IconCheck size={12} stroke={2.5} />
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1 }}>
                  <Text fz="md" fw={600}>{item.title}</Text>
                  <Text fz="md" c="dimmed" lh={1.5}>{item.desc}</Text>
                </Stack>
              </Group>
            ))}
          </Paper>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
