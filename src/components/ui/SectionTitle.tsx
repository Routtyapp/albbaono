import { Title, Text, Stack, Badge, Box, Group } from '@mantine/core';
import type { ReactNode } from 'react';

interface SectionTitleProps {
  badge?: string;
  label?: string;
  title: ReactNode;
  description?: string;
  align?: 'left' | 'center';
  variant?: 'light' | 'dark';
}

export function SectionTitle({
  badge,
  label,
  title,
  description,
  align = 'center',
}: SectionTitleProps) {
  return (
    <Stack
      gap="md"
      align={align === 'center' ? 'center' : 'flex-start'}
      mb={72}
    >
      {badge && (
        <Badge
          size="lg"
          radius="xl"
          tt="uppercase"
          fw={600}
        >
          {badge}
        </Badge>
      )}
      {label && (
        <Group gap={8}>
          <Box
            w={6}
            h={6}
            style={{ borderRadius: '50%', background: 'var(--mantine-color-accent-4)' }}
          />
          <Text
            size="sm"
            fw={600}
            tt="uppercase"
            lts="0.15em"
            c="dimmed"
          >
            {label}
          </Text>
        </Group>
      )}
      <Title
        order={2}
        fz={{ base: 'calc(1.5rem + 0.5vw)', md: '2.2rem' }}
        fw={700}
        ta={align}
        lh={1.15}
        style={{ maxWidth: 720, letterSpacing: '-0.035em' }}
      >
        {title}
      </Title>
      {description && (
        <Text
          size="md"
          c="dimmed"
          ta={align}
          maw={560}
          lh={1.7}
          mt={4}
        >
          {description}
        </Text>
      )}
    </Stack>
  );
}
