import { AppShell } from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { ProfileModal, type SidebarPosition } from './ProfileModal';
import { OnboardingWizard } from '../../pages/dashboard/OnboardingWizard';
import { useAuth } from '../../contexts/AuthContext';

export function DashboardLayout() {
  const { user } = useAuth();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopCollapsed, { toggle: toggleDesktop }] = useDisclosure();
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure();
  const [sidebarPosition, setSidebarPosition] = useLocalStorage<SidebarPosition>({
    key: 'sidebar-position',
    defaultValue: 'right',
  });

  const isOnboarding = (user?.onboarding_step ?? 0) < 3;

  const sidebarWidth = desktopCollapsed ? 64 : 320;

  const sidebarContent = (
    <Sidebar
      collapsed={desktopCollapsed}
      onToggle={toggleDesktop}
      position={sidebarPosition}
      onSettingsOpen={openSettings}
    />
  );

  return (
    <AppShell
      layout="alt"
      header={{ height: 52 }}
      navbar={!isOnboarding && sidebarPosition === 'left' ? {
        width: sidebarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: false },
      } : undefined}
      aside={!isOnboarding && sidebarPosition === 'right' ? {
        width: sidebarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: false },
      } : undefined}
      padding="md"
      transitionDuration={300}
    >
      <AppShell.Header
        style={{
          backgroundColor: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <DashboardHeader opened={mobileOpened} toggle={toggleMobile} onSettingsOpen={openSettings} />
      </AppShell.Header>

      {!isOnboarding && sidebarPosition === 'left' && (
        <AppShell.Navbar
          style={{
            backgroundColor: 'var(--mantine-color-body)',
            borderRight: '1px solid var(--mantine-color-default-border)',
          }}
        >
          {sidebarContent}
        </AppShell.Navbar>
      )}

      {!isOnboarding && sidebarPosition === 'right' && (
        <AppShell.Aside
          style={{
            backgroundColor: 'var(--mantine-color-body)',
            borderLeft: '1px solid var(--mantine-color-default-border)',
          }}
        >
          {sidebarContent}
        </AppShell.Aside>
      )}

      <AppShell.Main
        style={{
          backgroundColor: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))',
          minHeight: '100vh',
        }}
      >
        {isOnboarding ? (
          <OnboardingWizard />
        ) : (
          <div style={{ paddingLeft: 24, paddingRight: 24 }}>
            <Outlet />
          </div>
        )}
      </AppShell.Main>
      <ProfileModal
        opened={settingsOpened}
        onClose={closeSettings}
        sidebarPosition={sidebarPosition}
        onSidebarPositionChange={setSidebarPosition}
      />
    </AppShell>
  );
}
