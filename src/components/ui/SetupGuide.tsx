import {
  Paper,
  Stack,
  Text,
  Group,
  Stepper,
  Button,
} from '@mantine/core';
import {
  IconTags,
  IconMessageQuestion,
  IconPlayerPlay,
  IconCheck,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface SetupGuideProps {
  brandsCount: number;
  queriesCount: number;
  resultsCount: number;
}

export function SetupGuide({ brandsCount, queriesCount, resultsCount }: SetupGuideProps) {
  const navigate = useNavigate();

  // 현재 단계 계산 (0-indexed for Stepper)
  const activeStep = brandsCount === 0 ? 0 : queriesCount === 0 ? 1 : resultsCount === 0 ? 2 : 3;

  // 모든 단계 완료 시 표시하지 않음
  if (activeStep >= 3) return null;

  const steps = [
    {
      label: '브랜드 등록',
      desc: 'AI 검색에서 추적할 브랜드를 등록하세요.',
      action: () => navigate('/dashboard/brands'),
      actionLabel: '브랜드 등록하기',
      icon: IconTags,
    },
    {
      label: '쿼리 추가',
      desc: 'AI에게 테스트할 질문을 작성하고 브랜드에 연결하세요.',
      action: () => navigate('/dashboard/query-ops'),
      actionLabel: '쿼리 추가하기',
      icon: IconMessageQuestion,
    },
    {
      label: '테스트 실행',
      desc: '쿼리 운영에서 테스트를 실행하면 대시보드가 채워집니다.',
      action: () => navigate('/dashboard/query-ops'),
      actionLabel: '테스트 실행하기',
      icon: IconPlayerPlay,
    },
  ];

  const current = steps[activeStep];

  return (
    <Paper p="xl" radius="md" withBorder>
      <Stack gap="lg">
        <Group gap="xs">
          <Text fw={700} size="lg">시작하기</Text>
          <Text size="sm" c="dimmed">— 단계 {activeStep + 1}/3</Text>
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
              label={<Text size="xs" fw={500}>{step.label}</Text>}
            />
          ))}
        </Stepper>

        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">{current.desc}</Text>
          <Button size="sm" onClick={current.action}>
            {current.actionLabel}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
