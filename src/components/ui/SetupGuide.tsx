import {
  Paper,
  Stack,
  Text,
  Group,
  Stepper,
  Button,
  Badge,
  ThemeIcon,
} from '@mantine/core';
import {
  IconTags,
  IconMessageQuestion,
  IconPlayerPlay,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface SetupGuideProps {
  brandsCount: number;
  queriesCount: number;
  resultsCount: number;
}

export function SetupGuide({ brandsCount, queriesCount, resultsCount }: SetupGuideProps) {
  const navigate = useNavigate();

  const activeStep = brandsCount === 0 ? 0 : queriesCount === 0 ? 1 : resultsCount === 0 ? 2 : 3;

  if (activeStep >= 3) return null;

  const steps = [
    {
      label: '브랜드 등록',
      desc: 'AI 검색에서 추적할 브랜드와 경쟁사를 등록하세요.',
      example: '예: "삼성전자", "율립" 등 제품/서비스 브랜드명',
      action: () => navigate('/dashboard/brands'),
      actionLabel: '브랜드 등록하기',
      icon: IconTags,
      color: 'teal' as const,
      time: '약 30초',
    },
    {
      label: '쿼리 추가',
      desc: 'AI에게 테스트할 질문을 작성하고 브랜드에 연결하세요.',
      example: '예: "최고의 스킨케어 추천해줘", "삼성 vs LG 비교"',
      action: () => navigate('/dashboard/query-ops'),
      actionLabel: '쿼리 추가하기',
      icon: IconMessageQuestion,
      color: 'blue' as const,
      time: '약 30초',
    },
    {
      label: '테스트 실행',
      desc: '쿼리 운영에서 테스트를 실행하면 대시보드가 채워집니다.',
      example: 'ChatGPT에게 질문을 보내고 브랜드 인용 여부를 확인합니다',
      action: () => navigate('/dashboard/query-ops'),
      actionLabel: '테스트 실행하기',
      icon: IconPlayerPlay,
      color: 'grape' as const,
      time: '약 10초',
    },
  ];

  const current = steps[activeStep];

  return (
    <Paper p="xl" radius="md" withBorder>
      <Stack gap="lg">
        <Group justify="space-between">
          <Group gap="xs">
            <Text fw={700} size="lg">시작하기</Text>
            <Badge variant="light" size="sm">단계 {activeStep + 1}/3</Badge>
          </Group>
        </Group>

        <Stepper
          active={activeStep}
          size="sm"
          completedIcon={<IconCheck size={14} />}
        >
          {steps.map((step, i) => (
            <Stepper.Step
              key={i}
              icon={<step.icon size={14} />}
              label={
                <Group gap={4}>
                  <Text size="xs" fw={500}>{step.label}</Text>
                  {i < activeStep && (
                    <Badge size="xs" variant="filled" color="teal">완료</Badge>
                  )}
                </Group>
              }
              description={
                i === activeStep ? (
                  <Group gap={4}>
                    <IconClock size={10} />
                    <Text size="10px" c="dimmed">{step.time}</Text>
                  </Group>
                ) : undefined
              }
            />
          ))}
        </Stepper>

        {/* Current step details */}
        <Paper p="md" radius="md" style={{ background: `var(--mantine-color-${current.color}-0)`, border: `1px solid var(--mantine-color-${current.color}-2)` }}>
          <Group justify="space-between" align="flex-start">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Group gap="xs">
                <ThemeIcon size={28} radius="md" color={current.color} variant="light">
                  <current.icon size={16} />
                </ThemeIcon>
                <Text fw={600}>{current.desc}</Text>
              </Group>
              <Text size="sm" c="dimmed">{current.example}</Text>
              <Group gap="xs">
                <IconClock size={12} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed">{current.time}</Text>
              </Group>
            </Stack>
            <Button
              size="md"
              color={current.color}
              onClick={current.action}
              leftSection={<current.icon size={16} />}
            >
              {current.actionLabel}
            </Button>
          </Group>
        </Paper>
      </Stack>
    </Paper>
  );
}
