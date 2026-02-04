import {
  Container,
  Text,
  Box,
  Paper,
  Stack,
  ThemeIcon,
  Group,
  List,
  Timeline,
} from '@mantine/core';
import {
  IconSearch,
  IconSettings,
  IconShield,
  IconCheck,
} from '@tabler/icons-react';
import { SectionTitle } from '../ui';

const roadmapSteps = [
  {
    icon: IconSearch,
    title: '진단',
    subtitle: 'AI 가시성 현황 파악',
    items: [
      'AI 답변 점유율 분석',
      '리스닝마인드 활용 경쟁사/CEP 분석',
      'AI 가시성 감사 리포트',
      '브랜드 관련 핵심 질문 50~100개 테스트',
    ],
    color: 'blue',
  },
  {
    icon: IconSettings,
    title: '최적화',
    subtitle: 'CITABLE 프레임워크 적용',
    items: [
      'CITABLE 프레임워크 기반 콘텐츠 재구조화',
      'RAG 최적화 및 테크니컬 스키마 적용',
      '200-400단어 의미론적 블록 구성',
      '두괄식 답변 전방 배치',
    ],
    color: 'indigo',
  },
  {
    icon: IconShield,
    title: '디지털 권위',
    subtitle: '지속적인 브랜드 방어',
    items: [
      '디지털 PR 및 지식 베이스 등록',
      '지속적인 인용률 모니터링 및 방어',
      '경쟁사 인용 소스 분석 및 공략',
      '쿼리 재구성 추적 및 검색 의도 역추적',
    ],
    color: 'violet',
  },
];

export function Roadmap() {
  return (
    <Box id="roadmap" py={100}>
      <Container size="lg">
        <SectionTitle
          badge="서비스 로드맵"
          title={
            <>
              체계적인{' '}
              <Text component="span" c="brand.4" inherit>
                3단계
              </Text>{' '}
              프로세스
            </>
          }
          description="진단부터 최적화, 그리고 지속적인 방어까지. 브랜드의 AI 가시성을 체계적으로 구축합니다."
        />

        <Box mt={60}>
          <Timeline
            active={-1}
            bulletSize={60}
            lineWidth={2}
            styles={{
              itemBullet: {
                backgroundColor: 'transparent',
                border: 'none',
              },
            }}
          >
            {roadmapSteps.map((step, index) => (
              <Timeline.Item
                key={step.title}
                bullet={
                  <ThemeIcon
                    size={60}
                    radius="xl"
                    variant="gradient"
                    gradient={{
                      from: `${step.color}.5`,
                      to: `${step.color}.7`,
                    }}
                  >
                    <step.icon size={28} />
                  </ThemeIcon>
                }
              >
                <Paper
                  p="xl"
                  radius="lg"
                  ml="md"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Stack gap="md">
                    <Group gap="md">
                      <Text
                        size="xs"
                        fw={700}
                        c={`${step.color}.4`}
                        tt="uppercase"
                        style={{ letterSpacing: 1 }}
                      >
                        Step {index + 1}
                      </Text>
                    </Group>
                    <div>
                      <Text size="xl" fw={700} c="white">
                        {step.title}
                      </Text>
                      <Text size="sm" c="dimmed">
                        {step.subtitle}
                      </Text>
                    </div>
                    <List
                      spacing="sm"
                      size="sm"
                      icon={
                        <ThemeIcon
                          size={20}
                          radius="xl"
                          color={step.color}
                          variant="light"
                        >
                          <IconCheck size={12} />
                        </ThemeIcon>
                      }
                    >
                      {step.items.map((item) => (
                        <List.Item key={item}>
                          <Text size="sm" c="gray.4">
                            {item}
                          </Text>
                        </List.Item>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              </Timeline.Item>
            ))}
          </Timeline>
        </Box>
      </Container>
    </Box>
  );
}
