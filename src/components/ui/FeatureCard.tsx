import { Paper, Text, ThemeIcon, Stack, Badge, Group } from '@mantine/core';
import type { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  gradient?: { from: string; to: string };
}

export function FeatureCard({
  icon,
  title,
  description,
  badge,
  gradient = { from: 'brand.5', to: 'brand.7' },
}: FeatureCardProps) {
  return (
    <Paper
      p="xl"
      radius="lg"
      h="100%"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <ThemeIcon
            size={56}
            radius="md"
            variant="gradient"
            gradient={gradient}
          >
            {icon}
          </ThemeIcon>
          {badge && (
            <Badge variant="light" color="brand" size="sm">
              {badge}
            </Badge>
          )}
        </Group>
        <Text size="lg" fw={700} c="white">
          {title}
        </Text>
        <Text size="sm" c="dimmed" lh={1.6}>
          {description}
        </Text>
      </Stack>
    </Paper>
  );
}
