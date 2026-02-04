import {
  Container,
  Title,
  Text,
  Box,
  SimpleGrid,
  ThemeIcon,
  Stack,
  Paper,
  Group,
} from '@mantine/core';
import {
  IconEye,
  IconChartBar,
  IconBrain,
  IconFileDescription,
} from '@tabler/icons-react';

const features = [
  {
    icon: IconEye,
    title: 'AI 가시성 측정',
    description: 'ChatGPT, Perplexity, Claude 등 주요 AI 플랫폼에서 브랜드가 얼마나 언급되는지 실시간으로 추적합니다.',
  },
  {
    icon: IconChartBar,
    title: '인용률 분석',
    description: '등록한 쿼리에 대해 AI가 브랜드를 인용하는 비율을 측정하고 트렌드를 분석합니다.',
  },
  {
    icon: IconBrain,
    title: 'AI 인사이트',
    description: 'AI 응답 패턴을 분석하여 브랜드 가시성을 높이기 위한 실행 가능한 인사이트를 제공합니다.',
  },
  {
    icon: IconFileDescription,
    title: '상세 리포트',
    description: '주간/월간 리포트를 자동 생성하여 AI 가시성 변화와 개선 방향을 한눈에 파악합니다.',
  },
];

export function Solution() {
  return (
    <Box
      py={80}
      style={{
        backgroundColor: '#ffffff',
      }}
    >
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Box ta="center">
            <Text size="sm" fw={600} c="brand.6" mb="xs">
              솔루션
            </Text>
            <Title order={2} size="2.2rem" fw={700} c="gray.9">
              여기저기가 해결합니다
            </Title>
            <Text size="lg" c="gray.6" mt="md" maw={600} mx="auto">
              AI 시대의 브랜드 가시성을 측정하고,
              <br />
              최적화하기 위한 모든 도구를 제공합니다.
            </Text>
          </Box>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mt="xl" w="100%">
            {features.map((feature) => (
              <Paper
                key={feature.title}
                p="xl"
                radius="lg"
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e9ecef',
                }}
              >
                <Group align="flex-start" gap="md">
                  <ThemeIcon
                    size={48}
                    radius="md"
                    color="brand"
                    variant="light"
                  >
                    <feature.icon size={24} />
                  </ThemeIcon>
                  <Box style={{ flex: 1 }}>
                    <Text size="lg" fw={600} c="gray.9">
                      {feature.title}
                    </Text>
                    <Text size="sm" c="gray.6" mt="xs" lh={1.6}>
                      {feature.description}
                    </Text>
                  </Box>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
