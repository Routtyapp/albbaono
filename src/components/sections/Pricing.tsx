import {
  Container,
  SimpleGrid,
  Text,
  Box,
  Paper,
  Stack,
  ThemeIcon,
  Group,
  List,
  Button,
  Badge,
} from '@mantine/core';
import {
  IconFileAnalytics,
  IconRefresh,
  IconCheck,
  IconArrowRight,
} from '@tabler/icons-react';
import { SectionTitle } from '../ui';

const pricingPlans = [
  {
    icon: IconFileAnalytics,
    title: '진단 리포트',
    type: '1회성',
    description: '기업 규모 및 분석 범위에 따른 맞춤 진단',
    features: [
      '5대 AI 엔진 브랜드 가시성 검사',
      '핵심 질문 50~100개 테스트',
      '경쟁사 대비 인용 점유율 분석',
      '잘못된 학습 정보 식별',
      'AI 가시성 감사 리포트 제공',
    ],
    cta: '진단 신청하기',
    popular: false,
  },
  {
    icon: IconRefresh,
    title: '월 구독 서비스',
    type: '월간 구독',
    description: '지속적인 콘텐츠 업데이트와 방어가 필요한 고부가가치 시장',
    features: [
      '진단 리포트 모든 기능 포함',
      'CITABLE 프레임워크 기반 최적화',
      'RAG 최적화 및 스키마 적용',
      '디지털 PR 및 지식 베이스 등록',
      '월간 인용률 모니터링 리포트',
      '경쟁사 동향 분석 및 방어 전략',
    ],
    cta: '상담 신청하기',
    popular: true,
  },
];

const metrics = [
  {
    label: '인용률',
    description: 'AI 답변 포함 비율',
  },
  {
    label: '점유율',
    description: '경쟁사 대비 추천 빈도',
  },
  {
    label: '파이프라인 가치',
    description: '일반 검색 대비 전환율',
  },
];

const targets = [
  {
    type: 'B2B',
    items: ['SaaS', '핀테크', '엔터프라이즈 솔루션'],
  },
  {
    type: 'B2C',
    items: ['헬스케어', '전문직 서비스', '고가 가전'],
  },
];

export function Pricing() {
  return (
    <Box
      id="pricing"
      py={100}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }}
    >
      <Container size="lg">
        <SectionTitle
          badge="수익 모델"
          title={
            <>
              비즈니스에 맞는{' '}
              <Text component="span" c="brand.4" inherit>
                플랜
              </Text>
              을 선택하세요
            </>
          }
          description="일회성 진단부터 지속적인 구독 서비스까지, 브랜드의 상황에 맞는 최적의 솔루션을 제공합니다."
        />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mt={60}>
          {pricingPlans.map((plan) => (
            <Paper
              key={plan.title}
              p="xl"
              radius="lg"
              style={{
                backgroundColor: plan.popular
                  ? 'rgba(57, 132, 254, 0.08)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: plan.popular
                  ? '2px solid rgba(57, 132, 254, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
              }}
            >
              {plan.popular && (
                <Badge
                  variant="gradient"
                  gradient={{ from: 'brand.5', to: 'brand.7' }}
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 24,
                  }}
                >
                  추천
                </Badge>
              )}
              <Stack gap="lg">
                <Group gap="md">
                  <ThemeIcon
                    size={56}
                    radius="md"
                    variant="gradient"
                    gradient={{ from: 'brand.5', to: 'brand.7' }}
                  >
                    <plan.icon size={28} />
                  </ThemeIcon>
                  <div>
                    <Text size="xl" fw={700} c="white">
                      {plan.title}
                    </Text>
                    <Badge variant="light" color="gray" size="sm">
                      {plan.type}
                    </Badge>
                  </div>
                </Group>

                <Text size="sm" c="dimmed">
                  {plan.description}
                </Text>

                <List
                  spacing="sm"
                  size="sm"
                  icon={
                    <ThemeIcon size={20} radius="xl" color="brand" variant="light">
                      <IconCheck size={12} />
                    </ThemeIcon>
                  }
                >
                  {plan.features.map((feature) => (
                    <List.Item key={feature}>
                      <Text size="sm" c="gray.4">
                        {feature}
                      </Text>
                    </List.Item>
                  ))}
                </List>

                <Button
                  size="md"
                  variant={plan.popular ? 'gradient' : 'outline'}
                  gradient={{ from: 'brand.5', to: 'brand.7' }}
                  color={plan.popular ? undefined : 'gray'}
                  rightSection={<IconArrowRight size={16} />}
                  fullWidth
                  mt="auto"
                >
                  {plan.cta}
                </Button>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>

        {/* Target Markets & Metrics */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mt={60}>
          <Paper
            p="xl"
            radius="lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Stack gap="lg">
              <Text size="lg" fw={700} c="white">
                타겟 시장
              </Text>
              <SimpleGrid cols={2}>
                {targets.map((target) => (
                  <Stack key={target.type} gap="xs">
                    <Badge variant="light" color="brand" w="fit-content">
                      {target.type}
                    </Badge>
                    {target.items.map((item) => (
                      <Text key={item} size="sm" c="gray.4">
                        {item}
                      </Text>
                    ))}
                  </Stack>
                ))}
              </SimpleGrid>
            </Stack>
          </Paper>

          <Paper
            p="xl"
            radius="lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Stack gap="lg">
              <Text size="lg" fw={700} c="white">
                성과 측정 지표
              </Text>
              <Stack gap="md">
                {metrics.map((metric) => (
                  <Group key={metric.label} gap="md">
                    <ThemeIcon size={32} radius="md" color="brand" variant="light">
                      <IconCheck size={16} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={600} c="white">
                        {metric.label}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {metric.description}
                      </Text>
                    </div>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
