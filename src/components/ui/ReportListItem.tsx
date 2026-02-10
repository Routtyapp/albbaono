import { Paper, Group, Text, Badge, Stack, Box } from '@mantine/core';
import { IconCalendarWeek, IconCalendarMonth } from '@tabler/icons-react';
import type { Report } from '../../types';

interface ReportListItemProps {
  report: Report;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export function ReportListItem({
  report,
  isSelected = false,
  onClick,
  compact = false,
}: ReportListItemProps) {
  const isWeekly = report.type === 'weekly';

  if (compact) {
    return (
      <Paper
        p="6px 8px"
        radius="md"
        withBorder
        onClick={onClick}
        style={{
          cursor: 'pointer',
          backgroundColor: isSelected ? 'var(--mantine-color-brand-0)' : undefined,
          borderColor: isSelected ? 'var(--mantine-color-brand-3)' : '1px solid transparent',
          transition: 'all 0.15s ease',
        }}
      >
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
            <Text size="xs" fw={isSelected ? 600 : 400} lineClamp={1}>
              {report.title}
            </Text>
            <Group gap={4} mt={2}>
              <Badge size="xs" variant="light" color={isWeekly ? 'blue' : 'teal'}>
                {isWeekly ? '주간' : '월간'}
              </Badge>
              <Text size="10px" c="dimmed">{report.period}</Text>
            </Group>
          </Stack>
          <Badge
            variant="light"
            color={report.metrics.citationRate >= 70 ? 'green' : report.metrics.citationRate >= 40 ? 'yellow' : 'red'}
            size="xs"
            style={{ flexShrink: 0 }}
          >
            {report.metrics.citationRate}%
          </Badge>
        </Group>
      </Paper>
    );
  }

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
              backgroundColor: isWeekly
                ? 'var(--mantine-color-blue-light)'
                : 'var(--mantine-color-teal-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isWeekly ? (
              <IconCalendarWeek size={18} stroke={1.5} color="var(--mantine-color-blue-filled)" />
            ) : (
              <IconCalendarMonth size={18} stroke={1.5} color="var(--mantine-color-teal-filled)" />
            )}
          </Box>
          <Stack gap={2} style={{ minWidth: 0 }}>
            <Text fw={500} size="sm" truncate>
              {report.title}
            </Text>
            <Group gap="xs">
              <Badge
                size="xs"
                variant="light"
                color={isWeekly ? 'blue' : 'teal'}
              >
                {isWeekly ? '주간' : '월간'}
              </Badge>
              <Text size="xs" c="dimmed">
                {report.period}
              </Text>
            </Group>
          </Stack>
        </Group>
        <Badge
          variant="light"
          color={report.metrics.citationRate >= 70 ? 'green' : report.metrics.citationRate >= 40 ? 'yellow' : 'red'}
          size="sm"
        >
          {report.metrics.citationRate}%
        </Badge>
      </Group>
    </Paper>
  );
}
