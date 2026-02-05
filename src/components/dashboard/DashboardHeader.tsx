import {
  Group,
  TextInput,
  Avatar,
  Menu,
  Burger,
  Image,
  UnstyledButton,
  Text,
} from '@mantine/core';
import {
  IconSearch,
  IconUser,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardHeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function DashboardHeader({ opened, toggle }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
    <Group h="100%" px={24} justify="space-between">
      <Group gap="md">
        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
        <UnstyledButton onClick={() => navigate('/')}>
          <Image
            src="/YeogiJeogiFontLogo (1).png"
            alt="여기저기"
            h={28}
            w="auto"
            fit="contain"
          />
        </UnstyledButton>
      </Group>

      <Group gap="md">
        <TextInput
          placeholder="검색..."
          leftSection={<IconSearch size={16} />}
          w={300}
          visibleFrom="sm"
          styles={{
            input: {
              backgroundColor: 'var(--mantine-color-gray-1)',
              border: '1px solid var(--mantine-color-gray-3)',
            },
          }}
        />
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Avatar color="brand" radius="xl" size="sm" style={{ cursor: 'pointer' }}>
              {getInitials()}
            </Avatar>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              <Text size="xs" c="dimmed">로그인됨</Text>
              <Text size="sm" fw={500} truncate>
                {user?.name || user?.email}
              </Text>
            </Menu.Label>
            <Menu.Divider />
            <Menu.Item leftSection={<IconUser size={14} />}>프로필</Menu.Item>
            <Menu.Item leftSection={<IconSettings size={14} />}>설정</Menu.Item>
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
  );
}
