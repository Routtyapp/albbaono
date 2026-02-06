import {
  Box,
  Container,
  SimpleGrid,
  ThemeIcon,
  Divider,
  Stack,
  Text,
  Group,
} from '@mantine/core';
import { SectionTitle } from '../ui/SectionTitle';

const steps = [
  {
    number: '01',
    title: '브랜드와 핵심 쿼리 등록',
    description: '브랜드명, 카테고리, 제품군 중심의 질의를 등록해 모니터링 범위를 설정합니다.',
  },
  {
    number: '02',
    title: 'AI 엔진별 테스트 실행',
    description: 'ChatGPT, Gemini, Perplexity에 동일한 쿼리를 실행하고 언급 결과를 수집합니다.',
  },
  {
    number: '03',
    title: '개선 액션 도출',
    description: '가시성 점수와 인사이트를 기반으로 콘텐츠 개선 우선순위를 즉시 확보합니다.',
  },
];

export function Framework() {
  return (
    <Box component="section" id="framework" py={{ base: 80, md: 140 }} bg="#f0efed">
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <SectionTitle
          title={<>3단계로 GEO 운영을<br />시작하세요</>}
          description="복잡한 설정 없이, 핵심 쿼리만 등록하면 바로 AI 가시성 분석을 시작합니다."
        />

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={0}>
          {steps.map((step, i) => (
            <Box key={step.number} px={{ base: 0, md: 28 }} style={{ ...(i === 0 && { paddingLeft: 0 }), ...(i === steps.length - 1 && { paddingRight: 0 }) }}>
              <Group gap={0} mb={20} align="center">
                <ThemeIcon
                  size={48}
                  radius="md"
                  color="dark"
                  variant="filled"
                >
                  <Text fw={700} fz="sm" style={{ letterSpacing: '-0.02em' }}>
                    {step.number}
                  </Text>
                </ThemeIcon>
                {i < steps.length - 1 && (
                  <Divider
                    style={{ flex: 1 }}
                    ml={16}
                    color="gray.3"
                    visibleFrom="md"
                  />
                )}
              </Group>
              <Stack gap={8}>
                <Text fw={600} fz="md" style={{ letterSpacing: '-0.01em' }}>
                  {step.title}
                </Text>
                <Text fz="md" c="dimmed" lh={1.65}>
                  {step.description}
                </Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
