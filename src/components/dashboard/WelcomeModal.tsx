import {
  Modal,
  Stack,
  Title,
  Text,
  Button,
  Group,
  ThemeIcon,
  Stepper,
  Box,
} from '@mantine/core';
import {
  IconTags,
  IconMessageQuestion,
  IconPlayerPlay,
  IconRocket,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface WelcomeModalProps {
  opened: boolean;
  onClose: () => void;
  userName?: string | null;
}

const STEPS = [
  {
    icon: IconTags,
    label: '브랜드 등록',
    desc: 'AI 검색에서 추적할 브랜드와 경쟁사를 등록합니다.',
  },
  {
    icon: IconMessageQuestion,
    label: '쿼리 추가',
    desc: '사용자가 AI에게 물어볼 질문을 작성하고 브랜드에 연결합니다.',
  },
  {
    icon: IconPlayerPlay,
    label: '테스트 실행',
    desc: 'ChatGPT, Gemini에 쿼리를 보내 브랜드 인용 여부를 확인합니다.',
  },
];

export function WelcomeModal({ opened, onClose, userName }: WelcomeModalProps) {
  useBodyScrollLock(opened);
  const navigate = useNavigate();

  const handleStart = () => {
    onClose();
    navigate('/dashboard/brands');
  };

  const greeting = userName ? `${userName}님, 환영합니다!` : '환영합니다!';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      withCloseButton={false}
      lockScroll={false}
      overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
      radius="lg"
      padding={0}
    >
      {/* Header */}
      <Box
        p="xl"
        style={{
          background: 'linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-brand-8) 100%)',
          borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0',
        }}
      >
        <Stack align="center" gap="sm">
          <ThemeIcon size={56} radius="xl" variant="white" color="brand">
            <IconRocket size={28} />
          </ThemeIcon>
          <Title order={2} c="white" ta="center">{greeting}</Title>
          <Text c="white" ta="center" size="sm" opacity={0.9}>
            AI 검색에서 브랜드가 어떻게 언급되는지 추적하고 분석해 보세요.
          </Text>
        </Stack>
      </Box>

      {/* Content */}
      <Stack p="xl" gap="xl">
        <div>
          <Text fw={600} mb="md">3단계로 시작할 수 있습니다</Text>
          <Stepper
            active={-1}
            orientation="vertical"
            size="sm"
            styles={{
              stepIcon: { cursor: 'default' },
              stepBody: { cursor: 'default' },
              step: { pointerEvents: 'none' },
            }}
          >
            {STEPS.map((step, i) => (
              <Stepper.Step
                key={i}
                icon={<step.icon size={16} />}
                label={
                  <Text fw={600} size="sm">{step.label}</Text>
                }
                description={
                  <Text size="xs" c="dimmed" lh={1.5}>{step.desc}</Text>
                }
              />
            ))}
          </Stepper>
        </div>

        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onClose}>
            나중에 하기
          </Button>
          <Button onClick={handleStart} leftSection={<IconTags size={16} />}>
            브랜드 등록하기
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
