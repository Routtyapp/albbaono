import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Avatar,
  Text,
  TextInput,
  Button,
  Box,
  Alert,
  CloseButton,
} from '@mantine/core';
import { IconCheck, IconAlertCircle, IconMail } from '@tabler/icons-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../services/auth';

interface ProfileEditModalProps {
  opened: boolean;
  onClose: () => void;
}

export function ProfileEditModal({ opened, onClose }: ProfileEditModalProps) {
  useBodyScrollLock(opened);
  const { user, checkAuth } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (opened) {
      setName(user?.name || '');
      setMessage(null);
    }
  }, [opened, user?.name]);

  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateProfile(name.trim());
      await checkAuth();
      setMessage({ type: 'success', text: '프로필이 저장되었습니다.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : '저장에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = name.trim() !== (user?.name || '');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      size={420}
      centered
      lockScroll={false}
      styles={{
        header: { display: 'none' },
      }}
    >
      <Stack gap="xl" align="center" py="md" px="md">
        <Group justify="space-between" w="100%">
          <CloseButton onClick={onClose} />
          <Text fz="lg">프로필 편집</Text>
          <Box w={28} />
        </Group>
        {/* Avatar */}
        <Avatar color="brand" radius="50%" size={100} style={{ fontSize: 36 }}>
          {getInitials()}
        </Avatar>

        {/* Fields */}
        <Stack gap="md" w="100%">
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

          <TextInput
            label="디스플레이 이름"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="이름을 입력하세요"
            size="md"
          />

          <Box>
            <TextInput
              label="이메일"
              value={user?.email || ''}
              disabled
              size="md"
              leftSection={<IconMail size={16} />}
            />
            <Text fz="xs" c="dimmed" mt={6}>
              이메일은 변경할 수 없습니다.
            </Text>
          </Box>
        </Stack>

        {/* Buttons */}
        <Group justify="flex-end" w="100%">
          <Button variant="default" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={!name.trim() || !hasChanges}
          >
            저장
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
