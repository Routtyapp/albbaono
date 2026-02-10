import { IconArrowRight, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
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
    title: 'Free',
    type: '무료',
    description: '핵심 기능을 직접 체험하고 AI 가시성 현황을 진단합니다.',
    features: [
      'ChatGPT · Gemini 언급률 테스트',
      '브랜드 & 경쟁사 등록',
      '성과 대시보드 & 트렌드 분석',
      'GEO 점수 분석',
      'AI 인사이트 분석',
    ],
    cta: '무료로 시작하기',
    featured: false,
  },
  {
    title: 'Pro',
    type: '월간 구독',
    description: '자동화된 모니터링과 심층 리포트로 AI 가시성을 지속 개선합니다.',
    features: [
      'Free 플랜 전체 포함',
      '주간/월간 자동 리포트 (PDF)',
      '스케줄러 자동 테스트 실행',
      '무제한 쿼리 테스트',
      '경쟁사 GEO 점수 비교',
      '우선 기술 지원',
    ],
    cta: '프로 시작하기',
    featured: true,
  },
];

export function Pricing() {
  const navigate = useNavigate();
  return (
    <Box component="section" id="pricing" py={{ base: 80, md: 140 }} bg="#f0efed">
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <SectionTitle
          title={<>필요한 만큼<br />시작하세요</>}
          description="무료로 시작하고, 자동화가 필요할 때 업그레이드하세요."
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
                onClick={() => navigate('/register')}
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
