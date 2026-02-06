import {
  IconTrendingDown,
  IconChartBar,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  Box,
  Container,
  SimpleGrid,
  Paper,
  ThemeIcon,
  Stack,
  Text,
} from '@mantine/core';
import { SectionTitle } from '../ui/SectionTitle';

const problems = [
  {
    icon: IconAlertTriangle,
    title: '개선 우선순위 불명확',
    description: 'FAQ, 스키마, 콘텐츠 중 무엇을 먼저 해야 하는지 판단 기준이 없습니다.',
    gradient: 'linear-gradient(135deg, #f5f0dc 0%, #e5c4b2 100%)',
  },
  {
    icon: IconTrendingDown,
    title: '언급률 하락을 체감하기 어려움',
    description: '기존 SEO 지표만으로는 AI 언급 변화를 정량적으로 보기 어렵습니다.',
    gradient: 'linear-gradient(135deg, #b6cde0 0%, #c9b8bd 100%)',
  },
  {
    icon: IconChartBar,
    title: '엔진·쿼리별 성과 편차',
    description: 'ChatGPT, Gemini, Perplexity마다 결과가 달라 대응 우선순위를 놓칩니다.',
    gradient: 'linear-gradient(135deg, #d0d0ce 0%, #0a0a0a 100%)',
  },
];

export function Problem() {
  return (
    <Box component="section" id="problem" py={{ base: 80, md: 140 }} bg="#f0efed">
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <SectionTitle
          title={<>AI 검색 환경에서 발생하는<br />가시성 공백</>}
          description="AI 검색이 빠르게 확산되지만, 브랜드가 어떻게 추천되는지 보여주는 지표는 부족합니다."
        />

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={20}>
          {problems.map((item) => (
            <Paper
              key={item.title}
              radius="md"
              withBorder
              style={{ overflow: 'hidden' }}
              shadow="sm"
            >
              <Box h={180} style={{ background: item.gradient }} />
              <ThemeIcon
                size={48}
                radius="xl"
                variant="default"
                style={{
                  position: 'relative',
                  marginTop: -24,
                  marginLeft: 28,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <item.icon size={22} stroke={1.6} />
              </ThemeIcon>
              <Stack gap={8} p="20px 28px 28px">
                <Text fw={600} fz="md" style={{ letterSpacing: '-0.01em' }}>
                  {item.title}
                </Text>
                <Text fz="md" c="dimmed" lh={1.65}>
                  {item.description}
                </Text>
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
