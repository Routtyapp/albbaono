import { IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  SimpleGrid,
  Stack,
  Title,
  Text,
  Button,
} from '@mantine/core';
import { SectionTitle } from '../ui/SectionTitle';

const features = [
  {
    title: 'AI 언급 모니터링',
    text: 'ChatGPT, Gemini, Perplexity에 쿼리를 실행하고 브랜드가 언급되는 맥락을 실시간으로 추적합니다.',
    link: '/dashboard/queries',
    linkLabel: '쿼리 관리 바로가기',
  },
  {
    title: 'AI 인사이트',
    text: 'AI가 응답 패턴을 분석해 핵심 키워드, 인용 성공·실패 패턴, 콘텐츠 갭을 자동으로 도출합니다.',
    link: '/dashboard/insights',
    linkLabel: '인사이트 바로가기',
  },
  {
    title: 'GEO 점수 분석',
    text: '웹사이트의 AI 검색 최적화 점수를 구조, 스키마, URL, 메타태그, 콘텐츠 5개 카테고리로 측정합니다.',
    link: '/dashboard/geo-score',
    linkLabel: 'GEO 점수 바로가기',
  },
  {
    title: '경쟁사 벤치마크',
    text: '같은 질의에서 경쟁사가 어떻게 노출되는지 비교하고 GEO 점수 격차를 시각적으로 확인합니다.',
    link: '/dashboard/geo-score/competitors',
    linkLabel: '경쟁사 분석 바로가기',
  },
];

const wideFeature = {
  title: '자동 리포트 & 스케줄러',
  text: '주간·월간 리포트를 자동 생성하고, 스케줄러로 테스트를 자동 반복 실행합니다. 인용률 추이, 점유율, 엔진별 성과를 한 눈에 공유하세요.',
  link: '/dashboard/reports',
  linkLabel: '리포트 바로가기',
};

function FeatureCard({
  title,
  text,
  link,
  linkLabel,
  imageH = 280,
}: {
  title: string;
  text: string;
  link: string;
  linkLabel: string;
  imageH?: number;
}) {
  const navigate = useNavigate();
  return (
    <Stack gap={0}>
      <Box
        h={imageH}
        bg="#e2e0de"
        style={{ borderRadius: 'var(--mantine-radius-md)' }}
      />
      <Stack gap={10} pt={24}>
        <Title order={3} fz="lg" fw={700} style={{ letterSpacing: '-0.02em' }}>
          {title}
        </Title>
        <Text fz="md" c="dimmed" lh={1.7}>
          {text}
        </Text>
        <Button
          radius="xl"
          color="dark"
          size="sm"
          fw={600}
          w="fit-content"
          mt={6}
          rightSection={<IconArrowRight size={14} />}
          onClick={() => navigate(link)}
        >
          {linkLabel}
        </Button>
      </Stack>
    </Stack>
  );
}

export function Solution() {
  return (
    <Box component="section" id="solution" py={{ base: 80, md: 140 }}>
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <SectionTitle
          title={<>AI 가시성의 모든 것을<br />하나의 대시보드에서</>}
          description="브랜드 모니터링부터 경쟁사 분석, GEO 점수까지. AI 검색 성과를 한눈에 파악하고 개선합니다."
        />

        {/* Row 1 */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={20} mb={64}>
          {features.slice(0, 2).map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </SimpleGrid>

        {/* Row 2 */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={20} mb={64}>
          {features.slice(2).map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </SimpleGrid>

        {/* Row 3 — wide card */}
        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
            gap: 40,
            alignItems: 'end',
          }}
        >
          <Box
            h={{ base: 200, md: 260 }}
            bg="#e2e0de"
            style={{ borderRadius: 'var(--mantine-radius-md)', minHeight: 260 }}
          />
          <Stack gap={10}>
            <Title order={3} fz="lg" fw={700} style={{ letterSpacing: '-0.02em' }}>
              {wideFeature.title}
            </Title>
            <Text fz="md" c="dimmed" lh={1.7}>
              {wideFeature.text}
            </Text>
            <WideFeatureLink link={wideFeature.link} label={wideFeature.linkLabel} />
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}

function WideFeatureLink({ link, label }: { link: string; label: string }) {
  const navigate = useNavigate();
  return (
    <Button
      radius="xl"
      color="dark"
      size="sm"
      fw={600}
      w="fit-content"
      mt={6}
      rightSection={<IconArrowRight size={14} />}
      onClick={() => navigate(link)}
    >
      {label}
    </Button>
  );
}
