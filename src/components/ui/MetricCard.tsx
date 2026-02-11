import { Paper, Group, Text, ThemeIcon, Stack, Badge } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight } from '@tabler/icons-react';
import type { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: number;
  suffix?: string;
  color?: string;
}

export function MetricCard({
  title,
  value,
  icon,
  change,
  suffix,
  color = 'brand',
}: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed">
          {title}
        </Text>
        <ThemeIcon variant="light" color={color} size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>

      <Stack gap={4}>
        <Group gap="xs" align="baseline">
          <Text size="xl">
            {value}
          </Text>
          {suffix && (
            <Text size="sm" c="dimmed">
              {suffix}
            </Text>
          )}
        </Group>

        {change !== undefined && (
          <Badge
            variant="light"
            color={isPositive ? 'teal' : 'red'}
            leftSection={
              isPositive ? (
                <IconArrowUpRight size={12} />
              ) : (
                <IconArrowDownRight size={12} />
              )
            }
            size="sm"
          >
            {isPositive ? '+' : ''}
            {change}% 전월 대비
          </Badge>
        )}
      </Stack>
    </Paper>
  );
}
