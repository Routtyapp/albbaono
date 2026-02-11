import { IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Stack,
  Title,
  Text,
  Group,
  Button,
  Image,
} from '@mantine/core';

export function Hero() {
  const navigate = useNavigate();

  return (
    <Box component="section" className="hero">
      <Container size={1440} px={{ base: 20, md: 80 }} py={{ base: 60, md: 100 }} pos="relative" style={{ zIndex: 1 }}>
        <Group align="center" wrap="wrap" gap={40} style={{ minHeight: 400 }}>
        {/* 왼쪽: 텍스트 */}
        <Stack align="flex-start" gap="lg" style={{ flex: 1, minWidth: 320 }}>
          <Title
            order={1}
            fz={{ base: 'calc(1.8rem + 1vw)', md: '2.8rem' }}
           
            lh={1.2}
            className="reveal"
            style={{ animationDelay: '0.1s', letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}
          >
            내 브랜드를 더 눈에 띄게
            <Image
              src="/YeogiJeogiFontLogo (1).png"
              alt="여기저기"
              h="1.6em"
              w="auto"
              my={4}
            />
          </Title>

          <Text
            size="md"
            c="dimmed"
            lh={1.75}
            className="reveal"
            style={{ animationDelay: '0.18s' }}
          >
            에이전시에 맡기지 않고 전 과정을 쉽게.
            <br />
            등록부터 설정까지 한눈에!
          </Text>

          <Group gap={14} className="reveal" style={{ animationDelay: '0.24s' }} wrap="wrap">
            <Button
              radius="xl"
              color="dark"
              size="md"
             
              rightSection={<IconArrowRight size={16} />}
              onClick={() => navigate('/dashboard')}
            >
              지금 시작하기
            </Button>
            <Button
              radius="xl"
              variant="outline"
              color="gray"
              size="md"
             
              onClick={() => {
                document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              사용 안내
            </Button>
          </Group>
        </Stack>

        {/* 오른쪽: 데모 영상 영역 (추후 추가) */}
        <Box
          style={{ flex: 1, minWidth: 320, borderRadius: 'var(--mantine-radius-md)' }}
          visibleFrom="md"
        />
        </Group>
      </Container>
    </Box>
  );
}
