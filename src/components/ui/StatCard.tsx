import { Paper, Text, Group, ThemeIcon } from '@mantine/core';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  description?: string;
  color?: string;
}

export function StatCard({ icon, value, label, description, color = 'brand' }: StatCardProps) {
  return (
    <Paper
      p="xl"
      radius="lg"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Group gap="md" align="flex-start">
        <ThemeIcon
          size={48}
          radius="md"
          variant="gradient"
          gradient={{ from: `${color}.5`, to: `${color}.7` }}
        >
          {icon}
        </ThemeIcon>
        <div>
          <Text
            size="2rem"
            fw={800}
            variant="gradient"
            gradient={{ from: `${color}.4`, to: `${color}.6` }}
          >
            {value}
          </Text>
          <Text size="sm" fw={600} c="white" mt={4}>
            {label}
          </Text>
          {description && (
            <Text size="xs" c="dimmed" mt={4}>
              {description}
            </Text>
          )}
        </div>
      </Group>
    </Paper>
  );
}
