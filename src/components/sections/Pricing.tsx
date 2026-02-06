import { IconArrowRight, IconCheck } from '@tabler/icons-react';
import {
  Box,
  Container,
  SimpleGrid,
  Paper,
  Stack,
  Group,
  ThemeIcon,
  Text,
  Button,
} from '@mantine/core';
import { SectionTitle } from '../ui/SectionTitle';

const plans = [
  {
    title: 'GEO 진단 리포트',
    type: '1회성',
    description: '핵심 쿼리 기반으로 AI 가시성 현황과 개선 포인트를 진단합니다.',
    features: [
      '주요 LLM 5종 언급률 점검',
      '핵심 쿼리 50~100개 테스트',
      '경쟁사 대비 가시성 분석',
      '우선 개선 항목 제안',
      'AI 가시성 요약 리포트 제공',
    ],
    cta: '진단 요청하기',
    featured: false,
  },
  {
    title: 'GEO 성장 구독',
    type: '월간 구독',
    description: '지속적으로 AI 검색 성과를 모니터링하고 개선 액션을 실행합니다.',
    features: [
      '진단 리포트 전체 포함',
      '주간/월간 자동 리포트',
      'CITABLE 콘텐츠 개선 제안',
      '스키마/FAQ 최적화 가이드',
      '경쟁사 추적 및 알림',
      '팀 공유용 대시보드 제공',
    ],
    cta: '상담 요청하기',
    featured: false,
  },
];

export function Pricing() {
  return (
    <Box component="section" id="pricing" py={{ base: 80, md: 140 }} bg="#f0efed">
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <SectionTitle
          title={<>브랜드 상황에 맞춘<br />GEO 플랜</>}
          description="단기 진단부터 지속 성장까지, 팀 규모와 목표에 맞게 선택할 수 있습니다."
        />

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={20} maw={800} mx="auto">
          {plans.map((plan) => (
            <Paper
              key={plan.title}
              radius="md"
              withBorder
              p={40}
              style={{
                display: 'flex',
                flexDirection: 'column',
                ...(plan.featured && {
                  borderColor: 'var(--mantine-color-dark-9)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                }),
              }}
            >
              <Text fz="lg" fw={700} style={{ letterSpacing: '-0.02em' }}>
                {plan.title}
              </Text>
              <Text fz="sm" c="gray.5" mt={4}>
                {plan.type}
              </Text>
              <Text fz="md" c="dimmed" lh={1.6} mt={20} mb={24}>
                {plan.description}
              </Text>

              <Stack gap={12} mb={32} style={{ flex: 1 }}>
                {plan.features.map((f) => (
                  <Group key={f} gap={10} wrap="nowrap">
                    <ThemeIcon
                      size={18}
                      radius="xl"
                      variant="light"
                      color="accent.4"
                      c="dark"
                    >
                      <IconCheck size={11} stroke={2.5} />
                    </ThemeIcon>
                    <Text fz="md">{f}</Text>
                  </Group>
                ))}
              </Stack>

              <Button
                radius="xl"
                color={plan.featured ? 'dark' : 'gray'}
                variant={plan.featured ? 'filled' : 'outline'}
                size="md"
                fw={600}
                fullWidth
                rightSection={<IconArrowRight size={15} />}
              >
                {plan.cta}
              </Button>
            </Paper>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
