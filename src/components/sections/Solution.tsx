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
    text: 'ChatGPT, Gemini에 쿼리를 실행하고 브랜드 언급 여부, 인용 순위, 경쟁사 노출까지 실시간으로 추적합니다.',
    link: '/dashboard/query-ops',
    linkLabel: '쿼리 운영 바로가기',
  },
  {
    title: '성과 대시보드',
    text: '인용률, 점유율, 엔진별 성과를 한눈에 파악합니다. 트렌드 분석으로 기간별 변화 추이를 시각적으로 확인하세요.',
    link: '/dashboard/performance',
    linkLabel: '성과 분석 바로가기',
  },
  {
    title: 'GEO 점수 분석',
    text: '웹사이트의 AI 검색 최적화 점수를 콘텐츠, 구조, 스키마, 메타태그, URL 5개 카테고리로 측정하고 경쟁사와 비교합니다.',
    link: '/dashboard/score',
    linkLabel: 'GEO 점수 바로가기',
  },
  {
    title: 'AI 인사이트',
    text: 'AI가 응답 패턴을 분석해 핵심 키워드, 인용 성공·실패 패턴, 콘텐츠 갭을 자동으로 도출합니다.',
    link: '/dashboard/reports',
    linkLabel: '인사이트 바로가기',
  },
];

const wideFeature = {
  title: '자동 리포트 & 스케줄러',
  text: '주간·월간 리포트를 자동 생성하고, 스케줄러로 테스트를 자동 반복 실행합니다. 인용률 추이, 점유율, 엔진별 성과를 PDF로 다운로드하세요.',
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
