import { Paper, Group, Text, Badge, Stack, Box } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
import type { Brand } from '../../types';

interface BrandListItemProps {
  brand: Brand;
  citationRate?: number;
  queryCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function BrandListItem({
  brand,
  citationRate = 0,
  queryCount = 0,
  isSelected = false,
  onClick,
}: BrandListItemProps) {
  const isActive = brand.isActive !== false;

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      onClick={onClick}
      style={{
        cursor: 'pointer',
        backgroundColor: isSelected ? 'var(--mantine-color-blue-light)' : undefined,
        borderColor: isSelected ? 'var(--mantine-color-blue-filled)' : undefined,
        transition: 'all 0.15s ease',
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--mantine-radius-sm)',
              backgroundColor: 'var(--mantine-color-gray-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconBuilding size={18} stroke={1.5} />
          </Box>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text size="sm" truncate>
              {brand.name}
            </Text>
            <Group gap="xs">
              <Badge
                size="xs"
                variant="dot"
                color={isActive ? 'green' : 'gray'}
              >
                {isActive ? '활성' : '비활성'}
              </Badge>
              <Text size="xs" c="dimmed">
                {queryCount} 질문
              </Text>
            </Group>
          </Stack>
        </Group>
        <Badge
          variant="light"
          color={citationRate >= 70 ? 'green' : citationRate >= 40 ? 'yellow' : 'red'}
          size="sm"
        >
          {citationRate}%
        </Badge>
      </Group>
    </Paper>
  );
}
