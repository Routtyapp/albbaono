import { useState, useRef } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  PasswordInput,
  Button,
  Box,
  Alert,
  NavLink,
  ScrollArea,
  Title,
  CloseButton,
  SegmentedControl,
  Center,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUser,
  IconLock,
  IconInfoCircle,
  IconCheck,
  IconAlertCircle,
  IconCalendar,
  IconClock,
  IconSettings,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
  IconDeviceDesktop,
  IconMoon,
} from '@tabler/icons-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useAuth } from '../../contexts/AuthContext';
import { changePassword, deleteAccount } from '../../services/auth';
import { IconTrash } from '@tabler/icons-react';

export type SidebarPosition = 'left' | 'right';

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
  sidebarPosition: SidebarPosition;
  onSidebarPositionChange: (position: SidebarPosition) => void;
}

const menuItems = [
  { key: 'general', label: '일반', icon: IconSettings },
  { key: 'security', label: '보안', icon: IconLock },
  { key: 'account', label: '계정', icon: IconInfoCircle },
];

function DeleteAccountModal({ opened, onClose, onDeleted }: { opened: boolean; onClose: () => void; onDeleted: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await deleteAccount(password);
      if (!res.success) {
        setError(res.message);
        return;
      }
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : '계정 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} fz="lg" c="red">계정 삭제</Text>}
      size={420}
      centered
      lockScroll={false}
    >
      <Stack gap="md">
        <Text fz="sm" c="dimmed">
          브랜드, 쿼리, 테스트 결과, 리포트 등 모든 데이터가 삭제되며 복구할 수 없습니다.
        </Text>

        {error && (
          <Alert color="red" py="xs" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}

        <PasswordInput
          label="비밀번호 확인"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          size="sm"
        />

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>취소</Button>
          <Button
            color="red"
            onClick={handleSubmit}
            loading={loading}
            disabled={!password}
          >
            삭제
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function ChangePasswordModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async () => {
    setMessage(null);
    if (!currentPassword || !newPassword) {
      setMessage({ type: 'error', text: '모든 필드를 입력해주세요.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '새 비밀번호는 최소 6자 이상이어야 합니다.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: '비밀번호가 변경되었습니다.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '비밀번호 변경에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} fz="lg">비밀번호 변경</Text>}
      size={420}
      centered
      lockScroll={false}
    >
      <Stack gap="md">
        {message && (
          <Alert
            color={message.type === 'success' ? 'green' : 'red'}
            icon={message.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
            withCloseButton
            onClose={() => setMessage(null)}
            py="xs"
          >
            {message.text}
          </Alert>
        )}

        <PasswordInput
          label="현재 비밀번호"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
          size="sm"
        />
        <PasswordInput
          label="새 비밀번호"
          description="최소 6자 이상"
          value={newPassword}
          onChange={(e) => setNewPassword(e.currentTarget.value)}
          size="sm"
        />
        <PasswordInput
          label="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          size="sm"
        />

        <Group justify="flex-end" mt="xs">
          <Button variant="default" onClick={handleClose}>취소</Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            변경
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export function ProfileModal({ opened, onClose, sidebarPosition, onSidebarPositionChange }: ProfileModalProps) {
  useBodyScrollLock(opened);
  const { user, logout } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const [active, setActive] = useState('general');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pwModalOpened, { open: openPwModal, close: closePwModal }] = useDisclosure(false);
  const [delModalOpened, { open: openDelModal, close: closeDelModal }] = useDisclosure(false);

  const handleClose = () => {
    onClose();
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleTabChange = (key: string) => {
    setActive(key);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      size={700}
      centered
      lockScroll={false}
      styles={{
        header: { display: 'none' },
        body: { padding: 0, overflow: 'hidden' },
      }}
    >
      <Box style={{ display: 'flex', height: 620 }}>
        {/* Left nav */}
        <Box
          w={180}
          miw={180}
          py="md"
          style={{
            borderRight: '1px solid var(--mantine-color-default-border)',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <Box px="md" pb="sm">
            <CloseButton onClick={handleClose} />
          </Box>
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              label={item.label}
              leftSection={<item.icon size={16} />}
              active={active === item.key}
              onClick={() => handleTabChange(item.key)}
              variant="light"
              styles={{ root: { borderRadius: 0 } }}
            />
          ))}
        </Box>

        {/* Right content */}
        <ScrollArea style={{ flex: 1 }} h={620} viewportRef={scrollRef}>
          <Box p="xl">
            {active === 'general' && (
              <Stack gap="lg">
                <Title order={4} fz="md" fw={700}>일반</Title>

                <Box>
                  <Text fz="sm" fw={500} mb="xs">보기</Text>
                  <SegmentedControl
                    value={colorScheme}
                    onChange={(value) => setColorScheme(value as 'auto' | 'dark')}
                    fullWidth
                    data={[
                      {
                        value: 'auto',
                        label: (
                          <Center>
                            <Group gap={8}>
                              <IconDeviceDesktop size={16} />
                              <span>시스템</span>
                            </Group>
                          </Center>
                        ),
                      },
                      {
                        value: 'dark',
                        label: (
                          <Center>
                            <Group gap={8}>
                              <IconMoon size={16} />
                              <span>다크</span>
                            </Group>
                          </Center>
                        ),
                      },
                    ]}
                  />
                </Box>

                <Box>
                  <Text fz="sm" fw={500} mb="xs">사이드바 위치</Text>
                  <SegmentedControl
                    value={sidebarPosition}
                    onChange={(value) => onSidebarPositionChange(value as SidebarPosition)}
                    fullWidth
                    data={[
                      {
                        value: 'left',
                        label: (
                          <Center>
                            <Group gap={8}>
                              <IconLayoutSidebarLeftCollapse size={16} />
                              <span>왼쪽</span>
                            </Group>
                          </Center>
                        ),
                      },
                      {
                        value: 'right',
                        label: (
                          <Center>
                            <Group gap={8}>
                              <IconLayoutSidebarRightCollapse size={16} />
                              <span>오른쪽</span>
                            </Group>
                          </Center>
                        ),
                      },
                    ]}
                  />
                </Box>
              </Stack>
            )}

            {active === 'security' && (
              <Stack gap="lg">
                <Title order={4} fz="md" fw={700}>보안</Title>

                <Group justify="space-between">
                  <Text fz="sm" fw={500}>비밀번호</Text>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconLock size={14} />}
                    onClick={openPwModal}
                  >
                    변경
                  </Button>
                </Group>
              </Stack>
            )}

            {active === 'account' && (
              <Stack gap="lg">
                <Title order={4} fz="md" fw={700}>계정</Title>

                <Box
                  p="md"
                  style={{
                    borderRadius: 8,
                    backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))',
                  }}
                >
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Group gap={6}>
                        <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                        <Text fz="sm" c="dimmed">가입일</Text>
                      </Group>
                      <Text fz="sm" fw={500}>{formatDate(user?.created_at)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Group gap={6}>
                        <IconClock size={14} color="var(--mantine-color-dimmed)" />
                        <Text fz="sm" c="dimmed">마지막 로그인</Text>
                      </Group>
                      <Text fz="sm" fw={500}>{formatDate(user?.last_login)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Group gap={6}>
                        <IconUser size={14} color="var(--mantine-color-dimmed)" />
                        <Text fz="sm" c="dimmed">역할</Text>
                      </Group>
                      <Text fz="sm" fw={500} tt="capitalize">{user?.role || '-'}</Text>
                    </Group>
                  </Stack>
                </Box>

                <Group justify="space-between" mt="md">
                  <Text fz="sm" fw={500} c="red">계정 삭제</Text>
                  <Button
                    variant="light"
                    color="red"
                    size="xs"
                    leftSection={<IconTrash size={14} />}
                    onClick={openDelModal}
                  >
                    탈퇴
                  </Button>
                </Group>
              </Stack>
            )}
          </Box>
        </ScrollArea>
      </Box>
      <ChangePasswordModal opened={pwModalOpened} onClose={closePwModal} />
      <DeleteAccountModal opened={delModalOpened} onClose={closeDelModal} onDeleted={logout} />
    </Modal>
  );
}
