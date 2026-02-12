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
    a: 'GEO는 ChatGPT, Gemini 같은 AI 검색 엔진에서 브랜드가 추천·인용되도록 최적화하는 전략입니다. 기존 SEO가 구글 검색 순위를 높이는 것이라면, GEO는 AI가 생성하는 답변 안에 브랜드가 포함되도록 하는 데 초점을 맞춥니다.',
  },
  {
    q: '기존 SEO와 어떻게 다른가요?',
    a: 'SEO는 검색 결과 페이지(SERP)에서의 링크 순위를 최적화합니다. GEO는 AI가 생성하는 자연어 응답 속에서 브랜드가 언급·추천되는 빈도와 맥락을 최적화합니다. 측정 지표, 개선 방법, 분석 대상 엔진이 모두 다릅니다.',
  },
  {
    q: '어떤 AI 엔진을 지원하나요?',
    a: '현재 ChatGPT(GPT-5-mini)와 Google Gemini(2.0 Flash)를 지원합니다. 각 엔진에 동일한 질문을 실행하고 브랜드 언급 여부, 인용 순위, 경쟁사 노출을 비교 분석합니다.',
  },
  {
    q: '무료로 사용할 수 있나요?',
    a: '네. 회원가입 후 브랜드 등록, 질문 테스트, 성과 대시보드, GEO 점수 분석, AI 인사이트까지 기본 기능을 무료로 이용할 수 있습니다.',
  },
  {
    q: '결과를 확인하기까지 얼마나 걸리나요?',
    a: '질문 등록 후 테스트 결과는 즉시 확인할 수 있습니다. GEO 점수 분석은 URL 입력 후 약 1분 내에 완료됩니다. 콘텐츠 개선 효과는 보통 1~2주 내에 측정됩니다.',
  },
  {
    q: 'GEO 점수는 어떻게 산출되나요?',
    a: '웹사이트 URL을 입력하면 콘텐츠, 구조, 스키마 마크업, 메타태그, URL 구조 5가지 카테고리를 분석해 100점 만점으로 점수를 산출합니다. 각 항목별 통과/실패 여부와 개선 방안도 함께 제공됩니다.',
  },
];

export function CTA() {
  return (
    <Box component="section" id="faq" py={{ base: 80, md: 140 }}>
      <Container fluid px={0}>
        <Grid gutter={{ base: 40, md: 32 }} align="flex-start">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md" pos="sticky" top={100} align="flex-end" ta="right">
              <Title
                order={2}
                fz={{ base: 'calc(1.2rem + 0.5vw)', md: '1.6rem' }}

                lh={1.15}
                style={{ letterSpacing: '-0.035em' }}
              >
                자주 묻는 질문
              </Title>
              <Text fz="sm" c="dimmed" lh={1.7} maw={320}>
                GEO와 서비스 이용에 대해<br />가장 많이 받는 질문들을 모았습니다.
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <Accordion
              variant="default"
              styles={{
                control: {
                  paddingTop: 12,
                  paddingBottom: 12,
                  '&:hover': { backgroundColor: 'transparent' },
                },
                content: {
                  padding: '8px 16px 12px',
                },
              }}
            >
              {faqs.map((faq, i) => (
                <Accordion.Item key={i} value={`faq-${i}`}>
                  <Accordion.Control>
                    <Text fz="sm">{faq.q}</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Text fz="sm" c="dimmed" lh={1.7}>
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
