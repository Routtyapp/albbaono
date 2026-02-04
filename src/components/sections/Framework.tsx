import {
  Container,
  Title,
  Text,
  Box,
  SimpleGrid,
  ThemeIcon,
  Stack,
  Paper,
} from '@mantine/core';
import {
  IconNumber1,
  IconNumber2,
  IconNumber3,
} from '@tabler/icons-react';

const steps = [
  {
    icon: IconNumber1,
    title: '브랜드 & 쿼리 등록',
    description: '모니터링할 브랜드와 AI에게 물어볼 질문을 등록합니다. 경쟁사도 함께 등록하여 비교 분석이 가능합니다.',
  },
  {
    icon: IconNumber2,
    title: 'AI 테스트 실행',
    description: 'ChatGPT, Perplexity 등 주요 AI 플랫폼에 쿼리를 실행하고 브랜드 인용 여부를 자동으로 분석합니다.',
  },
  {
    icon: IconNumber3,
    title: '인사이트 확인',
    description: '대시보드에서 인용률, 트렌드, AI 인사이트를 확인하고 브랜드 가시성을 개선하세요.',
  },
];

export function Framework() {
  return (
    <Box
      py={80}
      style={{
        backgroundColor: '#f8f9fa',
      }}
    >
      <Container size="lg">
        <Stack align="center" gap="xl">
          <Box ta="center">
            <Text size="sm" fw={600} c="brand.6" mb="xs">
              사용 방법
            </Text>
            <Title order={2} size="2.2rem" fw={700} c="gray.9">
              3단계로 시작하세요
            </Title>
            <Text size="lg" c="gray.6" mt="md" maw={600} mx="auto">
              복잡한 설정 없이 바로 AI 가시성 측정을 시작할 수 있습니다.
            </Text>
          </Box>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt="xl" w="100%">
            {steps.map((step) => (
              <Paper
                key={step.title}
                p="xl"
                radius="lg"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e9ecef',
                  textAlign: 'center',
                }}
              >
                <Stack align="center" gap="md">
                  <ThemeIcon
                    size={64}
                    radius="xl"
                    color="brand"
                    variant="light"
                  >
                    <step.icon size={32} />
                  </ThemeIcon>
                  <Text size="lg" fw={600} c="gray.9">
                    {step.title}
                  </Text>
                  <Text size="sm" c="gray.6" lh={1.6}>
                    {step.description}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
