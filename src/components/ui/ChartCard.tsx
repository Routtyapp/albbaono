import { Paper, Text, Group, ActionIcon, Menu } from '@mantine/core';
import { IconDots, IconDownload, IconMaximize } from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: boolean;
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions = true,
}: ChartCardProps) {
  return (
    <Paper p="md" radius="md" withBorder h="100%">
      <Group justify="space-between" mb="md">
        <div>
          <Text fw={600}>{title}</Text>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
        </div>

        {actions && (
          <Menu shadow="md" width={160}>
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item leftSection={<IconDownload size={14} />}>
                다운로드
              </Menu.Item>
              <Menu.Item leftSection={<IconMaximize size={14} />}>
                전체 화면
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      {children}
    </Paper>
  );
}
