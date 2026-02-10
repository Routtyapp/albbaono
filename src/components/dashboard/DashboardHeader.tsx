import {
  Group,
  Avatar,
  Menu,
  Burger,
  Image,
  UnstyledButton,
  Text,
} from '@mantine/core';
import {
  IconUser,
  IconSettings,
  IconLogout,
  IconBook,
  IconRefresh,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { updateOnboardingStep } from '../../services/onboarding';
import { GuideModal } from './GuideModal';
import { ProfileEditModal } from './ProfileEditModal';

interface DashboardHeaderProps {
  opened: boolean;
  toggle: () => void;
  onSettingsOpen: () => void;
}

export function DashboardHeader({ opened, toggle, onSettingsOpen }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { user, logout, checkAuth } = useAuth();
  const [guideOpened, { open: openGuide, close: closeGuide }] = useDisclosure(false);
  const [profileEditOpened, { open: openProfileEdit, close: closeProfileEdit }] = useDisclosure(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleRestartOnboarding = async () => {
    try {
      await updateOnboardingStep(0);
      await checkAuth();
    } catch {
      // silent
    }
  };

  // 사용자 이니셜 가져오기
  const getInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <Group h="100%" px={24} justify="space-between">
        <Group gap="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <UnstyledButton onClick={() => navigate('/')}>
            <Image
              src="/YeogiJeogiFontLogo (1).png"
              alt="여기저기"
              h={20}
              w="auto"
              fit="contain"
            />
          </UnstyledButton>
          <Menu shadow="md" width={180}>
            <Menu.Target>
              <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8 }}>
                <IconBook size={18} color="var(--mantine-color-gray-7)" />
                <Text size="sm" c="gray.7">가이드</Text>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconBook size={14} />} onClick={openGuide}>
                사용 가이드
              </Menu.Item>
              <Menu.Item leftSection={<IconRefresh size={14} />} onClick={handleRestartOnboarding}>
                온보딩 다시 하기
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group gap="md">
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <UnstyledButton style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar color="brand" radius="xl" size="sm">
                  {getInitials()}
                </Avatar>
                <Text size="sm" fw={500} visibleFrom="sm">
                  {user?.name || user?.email || '사용자'}
                </Text>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>
                <Text size="xs" c="dimmed">로그인됨</Text>
                <Text size="sm" fw={500} truncate>
                  {user?.name || user?.email}
                </Text>
              </Menu.Label>
              <Menu.Divider />
              <Menu.Item leftSection={<IconUser size={14} />} onClick={openProfileEdit}>프로필</Menu.Item>
              <Menu.Item leftSection={<IconSettings size={14} />} onClick={onSettingsOpen}>설정</Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={14} />}
                onClick={handleLogout}
              >
                로그아웃
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <GuideModal opened={guideOpened} onClose={closeGuide} />
      <ProfileEditModal opened={profileEditOpened} onClose={closeProfileEdit} />
    </>
  );
}
