import {
  Container,
  Title,
  Text,
  Box,
  Stack,
  Button,
  Group,
  Image,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function CTA() {
  const navigate = useNavigate();

  return (
    <Box
      py={80}
      style={{
        backgroundColor: '#ffffff',
      }}
    >
      <Container size="md">
        <Stack align="center" gap="xl" ta="center">
          <Image
            src="/YeogiJeogiFontLogo (1).png"
            alt="여기저기"
            h={40}
            w="auto"
            fit="contain"
          />

          <Title order={2} size="2rem" fw={700} c="gray.9">
            AI 시대의 브랜드 가시성,
            <br />
            지금 바로 측정하세요
          </Title>

          <Text size="lg" c="gray.6" maw={500}>
            무료로 시작하여 AI가 브랜드를 어떻게 인식하는지 확인하세요.
            <br />
            신용카드 없이 바로 시작할 수 있습니다.
          </Text>

          <Group gap="md" mt="md">
            <Button
              size="lg"
              color="dark"
              rightSection={<IconArrowRight size={18} />}
              onClick={() => navigate('/dashboard')}
            >
              무료로 시작하기
            </Button>
          </Group>

          <Text size="sm" c="gray.5" mt="xl">
            문의: contact@yeogieogi.com
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
