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
  IconTrendingDown,
  IconRobot,
  IconQuestionMark,
  IconEyeOff,
} from '@tabler/icons-react';

const problems = [
  {
    icon: IconTrendingDown,
    title: '검색 트래픽 감소',
    description: 'AI 검색으로 인해 기존 SEO 전략의 효과가 급격히 감소하고 있습니다.',
  },
  {
    icon: IconRobot,
    title: 'AI가 경쟁사를 추천',
    description: 'ChatGPT, Perplexity가 고객 질문에 경쟁사 브랜드만 언급합니다.',
  },
  {
    icon: IconEyeOff,
    title: '측정 불가',
    description: 'AI에서 브랜드가 얼마나 노출되는지 파악할 방법이 없습니다.',
  },
  {
    icon: IconQuestionMark,
    title: '최적화 방법 부재',
    description: 'AI 추천을 받기 위해 무엇을 해야 하는지 알 수 없습니다.',
  },
];

export function Problem() {
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
              문제 인식
            </Text>
            <Title order={2} size="2.2rem" fw={700} c="gray.9">
              AI 시대, 브랜드가 사라지고 있습니다
            </Title>
            <Text size="lg" c="gray.6" mt="md" maw={600} mx="auto">
              소비자의 40%가 이제 AI에게 제품 추천을 요청합니다.
              <br />
              당신의 브랜드는 AI의 답변에 포함되어 있나요?
            </Text>
          </Box>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mt="xl" w="100%">
            {problems.map((problem) => (
              <Paper
                key={problem.title}
                p="xl"
                radius="lg"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e9ecef',
                }}
              >
                <ThemeIcon
                  size={48}
                  radius="md"
                  variant="light"
                  color="gray"
                >
                  <problem.icon size={24} />
                </ThemeIcon>
                <Text size="lg" fw={600} c="gray.9" mt="md">
                  {problem.title}
                </Text>
                <Text size="sm" c="gray.6" mt="xs" lh={1.6}>
                  {problem.description}
                </Text>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
