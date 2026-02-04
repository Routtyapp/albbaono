import {
  Container,
  SimpleGrid,
  Text,
  Box,
  Paper,
  Stack,
  ThemeIcon,
  Group,
  Badge,
  Progress,
} from '@mantine/core';
import {
  IconBuildingSkyscraper,
  IconArrowUpRight,
  IconCheck,
} from '@tabler/icons-react';
import { SectionTitle } from '../ui';

const caseData = {
  company: 'B2B SaaS A사',
  situation: '기술력 우수, 인지도 부족',
  results: [
    { label: 'AI 인용률', before: 12, after: 67, unit: '%' },
    { label: '경쟁사 대비 점유율', before: 8, after: 45, unit: '%' },
    { label: '파이프라인 가치', before: 100, after: 340, unit: 'M' },
  ],
};

const auditProcess = [
  {
    title: 'AI 가시성 검사',
    description: '5대 AI 엔진에서 브랜드 관련 핵심 질문 50~100개 테스트',
  },
  {
    title: '인용 점유율 도출',
    description: '경쟁사 대비 자사 브랜드가 답변에 포함되는 비율 측정',
  },
  {
    title: '오학습 정보 식별',
    description: 'AI가 브랜드에 대해 잘못 학습한 정보 발견 및 수정 방안 제시',
  },
  {
    title: '누락 원인 분석',
    description: '경쟁사는 인용되지만 자사는 누락되는 원인 파악',
  },
];

const reverseEngineering = [
  {
    title: '쿼리 재구성 추적',
    description:
      'AI가 사용자 질문을 백그라운드에서 어떤 검색어 조합으로 변환하는지 분석',
  },
  {
    title: '검색 의도 역추적',
    description:
      '변형된 쿼리를 기반으로 AI가 찾는 정보 유형을 파악하여 콘텐츠 매칭',
  },
  {
    title: '경쟁사 인용 소스 분석',
    description:
      '경쟁사가 답변에 노출될 때 참조된 원천 소스를 역추적하여 공략 대상 설정',
  },
];

export function CaseStudy() {
  return (
    <Box id="case-study" py={100}>
      <Container size="lg">
        <SectionTitle
          badge="사례 연구"
          title={
            <>
              실제 성과로{' '}
              <Text component="span" c="brand.4" inherit>
                증명
              </Text>
              합니다
            </>
          }
          description="기술력은 있지만 인지도가 부족했던 B2B SaaS 기업의 AI 가시성 개선 사례"
        />

        {/* Case Study Card */}
        <Paper
          p="xl"
          radius="lg"
          mt={60}
          style={{
            backgroundColor: 'rgba(57, 132, 254, 0.05)',
            border: '1px solid rgba(57, 132, 254, 0.2)',
          }}
        >
          <Stack gap="xl">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Group gap="md">
                <ThemeIcon
                  size={56}
                  radius="md"
                  variant="gradient"
                  gradient={{ from: 'brand.5', to: 'brand.7' }}
                >
                  <IconBuildingSkyscraper size={28} />
                </ThemeIcon>
                <div>
                  <Text size="xl" fw={700} c="white">
                    {caseData.company}
                  </Text>
                  <Badge variant="light" color="orange">
                    {caseData.situation}
                  </Badge>
                </div>
              </Group>
              <Badge
                variant="gradient"
                gradient={{ from: 'green.5', to: 'teal.5' }}
                size="lg"
                leftSection={<IconArrowUpRight size={14} />}
              >
                성과 달성
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
              {caseData.results.map((result) => (
                <Paper
                  key={result.label}
                  p="lg"
                  radius="md"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Stack gap="sm">
                    <Text size="sm" c="dimmed">
                      {result.label}
                    </Text>
                    <Group gap="xs" align="flex-end">
                      <Text size="sm" c="dimmed" td="line-through">
                        {result.before}
                        {result.unit}
                      </Text>
                      <Text
                        size="2rem"
                        fw={800}
                        variant="gradient"
                        gradient={{ from: 'green.4', to: 'teal.4' }}
                      >
                        {result.after}
                        {result.unit}
                      </Text>
                    </Group>
                    <Progress
                      value={(result.after / (result.before + result.after)) * 100}
                      color="teal"
                      size="sm"
                      radius="xl"
                    />
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Paper>

        {/* Audit Process */}
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
              <Group gap="sm">
                <Text size="lg" fw={700} c="white">
                  AUDIT 프로세스
                </Text>
                <Badge variant="light" color="brand">
                  4단계
                </Badge>
              </Group>
              <Stack gap="md">
                {auditProcess.map((item, index) => (
                  <Group key={item.title} gap="md" align="flex-start" wrap="nowrap">
                    <ThemeIcon size={28} radius="xl" color="brand" variant="light">
                      <Text size="xs" fw={700}>
                        {index + 1}
                      </Text>
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={600} c="white">
                        {item.title}
                      </Text>
                      <Text size="xs" c="dimmed" lh={1.6}>
                        {item.description}
                      </Text>
                    </div>
                  </Group>
                ))}
              </Stack>
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
              <Group gap="sm">
                <Text size="lg" fw={700} c="white">
                  리버스 엔지니어링
                </Text>
                <Badge variant="light" color="violet">
                  AI 알고리즘 추적
                </Badge>
              </Group>
              <Stack gap="md">
                {reverseEngineering.map((item) => (
                  <Group key={item.title} gap="md" align="flex-start" wrap="nowrap">
                    <ThemeIcon size={28} radius="xl" color="violet" variant="light">
                      <IconCheck size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" fw={600} c="white">
                        {item.title}
                      </Text>
                      <Text size="xs" c="dimmed" lh={1.6}>
                        {item.description}
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
