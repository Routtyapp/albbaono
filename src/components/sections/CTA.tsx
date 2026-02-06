import {
  Box,
  Container,
  Grid,
  Accordion,
  Stack,
  Title,
  Text,
} from '@mantine/core';

const faqs = [
  {
    q: 'GEO(Generative Engine Optimization)란 무엇인가요?',
    a: 'GEO는 ChatGPT, Gemini, Perplexity 같은 AI 검색 엔진에서 브랜드가 추천·인용되도록 최적화하는 전략입니다. 기존 SEO가 구글 검색 순위를 높이는 것이라면, GEO는 AI가 생성하는 답변 안에 브랜드가 포함되도록 하는 데 초점을 맞춥니다.',
  },
  {
    q: '기존 SEO와 어떻게 다른가요?',
    a: 'SEO는 검색 결과 페이지(SERP)에서의 링크 순위를 최적화합니다. GEO는 AI가 생성하는 자연어 응답 속에서 브랜드가 언급·추천되는 빈도와 맥락을 최적화합니다. 측정 지표, 개선 방법, 분석 대상 엔진이 모두 다릅니다.',
  },
  {
    q: '어떤 AI 엔진을 지원하나요?',
    a: '현재 ChatGPT, Google Gemini, Perplexity를 지원합니다. 각 엔진에 동일한 쿼리를 실행하고 브랜드 언급 여부, 인용 순서, 추천 맥락을 비교 분석합니다.',
  },
  {
    q: '무료로 사용할 수 있나요?',
    a: '기본 대시보드와 제한된 쿼리 테스트는 무료로 이용할 수 있습니다. 대량 쿼리 분석, 자동 리포트, 경쟁사 추적 등 고급 기능은 유료 플랜에서 제공됩니다.',
  },
  {
    q: '결과를 확인하기까지 얼마나 걸리나요?',
    a: '쿼리 등록 후 첫 번째 AI 가시성 리포트는 약 5분 내에 확인할 수 있습니다. GEO 점수 개선 효과는 콘텐츠 변경 후 보통 1~2주 내에 측정됩니다.',
  },
  {
    q: '팀원과 함께 사용할 수 있나요?',
    a: '네. GEO 성장 구독 플랜에서는 팀 공유용 대시보드를 제공합니다. 리포트 링크를 공유하거나, 팀 멤버를 초대하여 함께 데이터를 확인할 수 있습니다.',
  },
];

export function CTA() {
  return (
    <Box component="section" id="faq" py={{ base: 80, md: 140 }}>
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <Grid gutter={{ base: 40, md: 80 }} align="flex-start">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md" pos="sticky" top={100}>
              <Title
                order={2}
                fz={{ base: 'calc(1.5rem + 0.5vw)', md: '2.2rem' }}
                fw={700}
                lh={1.15}
                style={{ letterSpacing: '-0.035em' }}
              >
                자주 묻는 질문
              </Title>
              <Text fz="md" c="dimmed" lh={1.7} maw={320}>
                GEO와 서비스 이용에 대해 가장 많이 받는 질문들을 모았습니다.
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Accordion
              variant="default"
              styles={{
                control: {
                  paddingTop: 18,
                  paddingBottom: 18,
                  '&:hover': { backgroundColor: 'transparent' },
                },
                content: {
                  padding: 16,
                },
              }}
            >
              {faqs.map((faq, i) => (
                <Accordion.Item key={i} value={`faq-${i}`}>
                  <Accordion.Control>
                    <Text fw={600} fz="md">{faq.q}</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text fz="md" c="dimmed" lh={1.7}>
                      {faq.a}
                    </Text>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
