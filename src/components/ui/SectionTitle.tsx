import { Title, Text, Stack, Badge, Box } from '@mantine/core';
import type { ReactNode } from 'react';

interface SectionTitleProps {
  badge?: string;
  title: ReactNode;
  description?: string;
  align?: 'left' | 'center';
}

export function SectionTitle({
  badge,
  title,
  description,
  align = 'center',
}: SectionTitleProps) {
  return (
    <Stack
      gap="md"
      align={align === 'center' ? 'center' : 'flex-start'}
      mb="xl"
    >
      {badge && (
        <Badge
          variant="light"
          color="brand"
          size="lg"
          radius="sm"
          tt="uppercase"
          fw={600}
        >
          {badge}
        </Badge>
      )}
      <Title
        order={2}
        size="2.5rem"
        fw={800}
        ta={align}
        c="white"
        style={{ maxWidth: 700 }}
      >
        {title}
      </Title>
      {description && (
        <Text
          size="lg"
          c="dimmed"
          ta={align}
          maw={600}
          lh={1.7}
        >
          {description}
        </Text>
      )}
      <Box
        w={60}
        h={4}
        mt="xs"
        style={{
          background: 'linear-gradient(90deg, #3984fe 0%, #0969ff 100%)',
          borderRadius: 2,
        }}
      />
    </Stack>
  );
}
