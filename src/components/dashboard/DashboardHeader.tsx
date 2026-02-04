import {
  Group,
  TextInput,
  Avatar,
  Menu,
  Burger,
  Image,
  UnstyledButton,
} from '@mantine/core';
import {
  IconSearch,
  IconUser,
  IconSettings,
  IconLogout,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function DashboardHeader({ opened, toggle }: DashboardHeaderProps) {
  const navigate = useNavigate();

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
              <IconUser size={18} />
            </Avatar>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>계정</Menu.Label>
            <Menu.Item leftSection={<IconUser size={14} />}>프로필</Menu.Item>
            <Menu.Item leftSection={<IconSettings size={14} />}>설정</Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconLogout size={14} />}>
              로그아웃
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
}
