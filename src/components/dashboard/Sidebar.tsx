import { Box, Divider, Stack, Text, Tooltip, UnstyledButton } from '@mantine/core';
import {
  IconChartBar,
  IconFileDescription,
  IconMessageQuestion,
  IconSettings,
  IconTags,
  IconTrophy,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebarData } from '../../hooks/useSidebarData';

const trackerMenuItems = [
  { label: '브랜드', shortLabel: '브랜드', icon: IconTags, path: '/dashboard/brands' },
  { label: '질문 관리', shortLabel: '질문', icon: IconMessageQuestion, path: '/dashboard/query-ops' },
  { label: '성과 개요', shortLabel: '성과', icon: IconChartBar, path: '/dashboard/performance' },
  { label: '리포트/인사이트', shortLabel: '리포트', icon: IconFileDescription, path: '/dashboard/reports' },
];

const scoreMenuItems = [
  { label: 'GEO 스코어', shortLabel: '스코어', icon: IconTrophy, path: '/dashboard/score' },
];


export type SidebarPosition = 'left' | 'right';

interface SidebarProps {
  position: SidebarPosition;
  onSettingsOpen: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ position, onSettingsOpen, onNavigate }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarData = useSidebarData();

  const tooltipPosition = position === 'right' ? 'left' : 'right';

  // 온보딩 진행 상태에 따른 dot 표시 대상 경로
  const onboardingDotPath = (() => {
    if (sidebarData.brands.length === 0) return '/dashboard/brands';
    if (sidebarData.queries.length === 0) return '/dashboard/query-ops';
    if (sidebarData.results.length === 0) return '/dashboard/query-ops';
    return null;
  })();

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const handleSettingsOpen = () => {
    onSettingsOpen();
    onNavigate?.();
  };

  // 데스크톱: 아이콘 전용 레일 (64px)
  const desktopMenu = (
    <Box h="100%" px={8} visibleFrom="sm">
      <Stack gap={0} align="center" h="100%" py="xs">
        {trackerMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const showDot = onboardingDotPath === item.path;
          return (
            <Tooltip key={item.path} label={item.label} position={tooltipPosition} withArrow>
              <UnstyledButton
                onClick={() => handleNavigate(item.path)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 48, height: 64, position: 'relative' }}
              >
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: isActive ? 'light-dark(var(--mantine-color-brand-1), var(--mantine-color-dark-5))' : 'transparent',
                    position: 'relative',
                  }}
                >
                  <item.icon size={20} stroke={1.5} color={isActive ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-text)'} />
                  {showDot && (
                    <Box
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'var(--mantine-color-blue-5)',
                        border: '2px solid var(--mantine-color-body)',
                      }}
                    />
                  )}
                </Box>
                <Text size="12px" mt={4} c={isActive ? 'brand.6' : undefined} fw={isActive ? 600 : 400}>
                  {item.shortLabel}
                </Text>
              </UnstyledButton>
            </Tooltip>
          );
        })}

        <Divider w="80%" my="xs" />

        {scoreMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Tooltip key={item.path} label={item.label} position={tooltipPosition} withArrow>
              <UnstyledButton
                onClick={() => handleNavigate(item.path)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 48, height: 64 }}
              >
                <Box
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: isActive ? 'light-dark(var(--mantine-color-brand-1), var(--mantine-color-dark-5))' : 'transparent',
                  }}
                >
                  <item.icon size={20} stroke={1.5} color={isActive ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-text)'} />
                </Box>
                <Text size="12px" mt={4} c={isActive ? 'brand.6' : undefined} fw={isActive ? 600 : 400}>
                  {item.shortLabel}
                </Text>
              </UnstyledButton>
            </Tooltip>
          );
        })}

        <Box style={{ flex: 1 }} />

        <Divider w="80%" my="xs" />

        <Tooltip label="설정" position={tooltipPosition} withArrow>
          <UnstyledButton
            onClick={handleSettingsOpen}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 48, height: 64 }}
          >
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, backgroundColor: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-5))' }}>
              <IconSettings size={20} stroke={1.5} color="var(--mantine-color-text)" />
            </Box>
            <Text size="12px" mt={4}>설정</Text>
          </UnstyledButton>
        </Tooltip>
      </Stack>
    </Box>
  );

  // 모바일: 아이콘 + 라벨 (220px 드로어)
  const mobileMenu = (
    <Box h="100%" px="sm" hiddenFrom="sm">
      <Stack gap={2} h="100%" py="sm">
        {trackerMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const showDot = onboardingDotPath === item.path;
          return (
            <UnstyledButton
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: isActive ? 'light-dark(var(--mantine-color-brand-1), var(--mantine-color-dark-5))' : 'transparent',
                position: 'relative',
              }}
            >
              <Box style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <item.icon size={20} stroke={1.5} color={isActive ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-text)'} />
                {showDot && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--mantine-color-blue-5)',
                      border: '2px solid var(--mantine-color-body)',
                    }}
                  />
                )}
              </Box>
              <Text size="sm" c={isActive ? 'brand.6' : undefined} fw={isActive ? 600 : 400}>
                {item.label}
              </Text>
            </UnstyledButton>
          );
        })}

        <Divider my="xs" />

        {scoreMenuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <UnstyledButton
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: isActive ? 'light-dark(var(--mantine-color-brand-1), var(--mantine-color-dark-5))' : 'transparent',
              }}
            >
              <item.icon size={20} stroke={1.5} color={isActive ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-text)'} />
              <Text size="sm" c={isActive ? 'brand.6' : undefined} fw={isActive ? 600 : 400}>
                {item.label}
              </Text>
            </UnstyledButton>
          );
        })}

        <Box style={{ flex: 1 }} />

        <Divider my="xs" />

        <UnstyledButton
          onClick={handleSettingsOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 12px',
            borderRadius: 8,
          }}
        >
          <IconSettings size={20} stroke={1.5} color="var(--mantine-color-text)" />
          <Text size="sm">설정</Text>
        </UnstyledButton>
      </Stack>
    </Box>
  );

  return (
    <>
      {desktopMenu}
      {mobileMenu}
    </>
  );
}
