import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Box,
  SimpleGrid,
  Stack,
  Image,
} from '@mantine/core';
import { IconArrowRight, IconPlayerPlay } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

const stats = [
  { value: '54.5%', label: '평균 AI 인용률 달성' },
  { value: '3.2x', label: '브랜드 노출 증가' },
  { value: '127+', label: '분석된 AI 응답' },
];

export function Hero() {
  const navigate = useNavigate();

  return (
    <Box
      style={{
        backgroundColor: '#ffffff',
        paddingTop: 80,
        paddingBottom: 80,
      }}
    >
      <Container size="lg">
        <Stack align="center" gap="xl">
          {/* Logo */}
          <Image
            src="/YeogiJeogiFontLogo (1).png"
            alt="여기저기"
            h={48}
            w="auto"
            fit="contain"
          />

          {/* Badge */}
          <Box
            px="md"
            py={6}
            style={{
              backgroundColor: '#f1f3f4',
              borderRadius: 20,
            }}
          >
            <Text size="sm" fw={500} c="gray.7">
              AI 시대의 새로운 브랜드 가시성 솔루션
            </Text>
          </Box>

          {/* Main Title */}
          <Title
            order={1}
            size="3.2rem"
            fw={700}
            ta="center"
            lh={1.3}
            maw={800}
            c="gray.9"
          >
            AI가 당신의 브랜드를
            <br />
            <Text component="span" inherit c="brand.6">
              추천
            </Text>
            하게 만드세요
          </Title>

          {/* Subtitle */}
          <Text
            size="lg"
            c="gray.6"
            ta="center"
            maw={600}
            lh={1.7}
          >
            ChatGPT, Perplexity, Claude가 고객에게 브랜드를 추천하도록
            <br />
            AI 가시성을 측정하고 최적화하세요
          </Text>

          {/* CTA Buttons */}
          <Group gap="md" mt="md">
            <Button
              size="lg"
              color="dark"
              rightSection={<IconArrowRight size={18} />}
              onClick={() => navigate('/dashboard')}
            >
              무료로 시작하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              color="gray"
              leftSection={<IconPlayerPlay size={18} />}
            >
              데모 보기
            </Button>
          </Group>

          {/* Stats */}
          <SimpleGrid
            cols={{ base: 1, sm: 3 }}
            spacing="xl"
            mt={60}
            w="100%"
            maw={700}
          >
            {stats.map((stat) => (
              <Box key={stat.label} ta="center">
                <Text size="2.5rem" fw={700} c="gray.9">
                  {stat.value}
                </Text>
                <Text size="sm" c="gray.5" mt={4}>
                  {stat.label}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
