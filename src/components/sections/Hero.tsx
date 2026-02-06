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
  Divider,
  Image,
} from '@mantine/core';

export function Hero() {
  const navigate = useNavigate();

  return (
    <Box component="section" className="hero">
      <Container size={720} px={{ base: 20, md: 40 }} py={{ base: 40, md: 60 }} pos="relative" style={{ zIndex: 1 }}>
        <Stack align="center" ta="center" gap="lg">
          <Title
            order={1}
            fz={{ base: 'calc(1.3rem + 1vw)', md: '1.8rem' }}
            fw={700}
            lh={1}
            className="reveal"
            style={{ animationDelay: '0.1s', letterSpacing: '-0.03em', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <span style={{ textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>내 브랜드</span>
            <Image
              src="/YeogiJeogiFontLogo (1).png"
              alt="여기저기"
              h="2.2em"
              w="auto"
            />
            <span style={{ textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>뜨고 있을까?</span>
          </Title>

          <Text
            size="md"
            c="dimmed"
            lh={1.75}
            maw={480}
            className="reveal"
            style={{ animationDelay: '0.18s', textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}
          >
            ChatGPT, Gemini, Perplexity에서 브랜드가 어떻게 언급되는지
            추적하고, 경쟁사 대비 성과를 즉시 파악합니다.
          </Text>

          <Group gap={14} className="reveal" style={{ animationDelay: '0.24s' }} wrap="wrap" justify="center">
            <Button
              radius="xl"
              color="dark"
              size="md"
              fw={600}
              rightSection={<IconArrowRight size={16} />}
              onClick={() => navigate('/dashboard')}
            >
              GEO 분석 시작하기
            </Button>
            <Button
              radius="xl"
              variant="outline"
              color="gray"
              size="md"
              fw={600}
            >
              작동 방식 보기
            </Button>
          </Group>

          <Group gap={32} className="reveal" style={{ animationDelay: '0.3s' }} wrap="nowrap">
            <Stack gap={2} align="center">
              <Text fw={700} fz="lg" lh={1} style={{ letterSpacing: '-0.03em', textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>150+</Text>
              <Text fz="sm" c="gray.5" style={{ textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>추적 브랜드</Text>
            </Stack>
            <Divider orientation="vertical" h={36} color="gray.3" />
            <Stack gap={2} align="center">
              <Text fw={700} fz="lg" lh={1} style={{ letterSpacing: '-0.03em', textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>2.4M</Text>
              <Text fz="sm" c="gray.5" style={{ textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>분석 쿼리</Text>
            </Stack>
            <Divider orientation="vertical" h={36} color="gray.3" />
            <Stack gap={2} align="center">
              <Text fw={700} fz="lg" lh={1} style={{ letterSpacing: '-0.03em', textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>98%</Text>
              <Text fz="sm" c="gray.5" style={{ textShadow: '0 1px 3px rgba(255,255,255,0.8)' }}>고객 유지율</Text>
            </Stack>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}
