import { useState, useEffect } from 'react';
import { Paper, Text, Group, ActionIcon, Menu, Box } from '@mantine/core';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <Paper p="md" radius="md" withBorder miw={0}>
      <Group justify="space-between" mb="md">
        <div>
          <Text>{title}</Text>
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

      <Box miw={0} style={{ overflow: 'hidden' }}>
        {mounted ? children : null}
      </Box>
    </Paper>
  );
}
