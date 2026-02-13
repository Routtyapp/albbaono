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
      <Container fluid px={0} py={{ base: 22, md: 36 }} pos="relative" style={{ zIndex: 1 }}>
        <Group align="center" wrap="wrap" gap={48} style={{ minHeight: 420 }}>
        {/* 왼쪽: 텍스트 */}
        <Stack align="flex-start" gap="lg" style={{ flex: '0 1 520px', minWidth: 320 }}>
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
              c="white"
              onClick={() => {
                document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              사용 안내
            </Button>
          </Group>
        </Stack>

        {/* 오른쪽: 데모 이미지 */}
        <Box
          className="reveal"
          style={{
            flex: '1.35 1 700px',
            minWidth: 420,
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--mantine-color-gray-3)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.14)',
          }}
        >
          <Box
            component="img"
            src="/images/landing_achievment.png"
            alt="서비스 대시보드 미리보기"
            style={{
              width: '100%',
              height: '100%',
              minHeight: 380,
              maxHeight: 620,
              display: 'block',
              objectFit: 'cover',
            }}
          />
        </Box>
        </Group>
      </Container>
    </Box>
  );
}


