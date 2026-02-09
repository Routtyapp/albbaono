import { useState, useEffect } from 'react';
import { AppShell } from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';
import { WelcomeModal } from './WelcomeModal';
import { useAuth } from '../../contexts/AuthContext';

type SidebarPosition = 'left' | 'right';

export function DashboardLayout() {
  const { user } = useAuth();
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopCollapsed, { toggle: toggleDesktop }] = useDisclosure();
  const [sidebarPosition, setSidebarPosition] = useLocalStorage<SidebarPosition>({
    key: 'sidebar-position',
    defaultValue: 'right',
  });

  const [welcomeDismissed, setWelcomeDismissed] = useLocalStorage<boolean>({
    key: 'welcome-dismissed',
    defaultValue: false,
  });
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    if (!welcomeDismissed) {
      setWelcomeOpen(true);
    }
  }, [welcomeDismissed]);

  const handleCloseWelcome = () => {
    setWelcomeOpen(false);
    setWelcomeDismissed(true);
  };

  const sidebarWidth = desktopCollapsed ? 64 : 320;

  const sidebarContent = (
    <Sidebar
      collapsed={desktopCollapsed}
      onToggle={toggleDesktop}
      position={sidebarPosition}
      onPositionChange={setSidebarPosition}
    />
  );

  return (
    <>
    <WelcomeModal
      opened={welcomeOpen}
      onClose={handleCloseWelcome}
      userName={user?.name}
    />
    <AppShell
      layout="alt"
      header={{ height: 52 }}
      navbar={sidebarPosition === 'left' ? {
        width: sidebarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: false },
      } : undefined}
      aside={sidebarPosition === 'right' ? {
        width: sidebarWidth,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: false },
      } : undefined}
      padding="md"
      transitionDuration={300}
    >
      <AppShell.Header
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        <DashboardHeader opened={mobileOpened} toggle={toggleMobile} />
      </AppShell.Header>

      {sidebarPosition === 'left' ? (
        <AppShell.Navbar
          style={{
            backgroundColor: 'white',
            borderRight: '1px solid var(--mantine-color-gray-3)',
          }}
        >
          {sidebarContent}
        </AppShell.Navbar>
      ) : (
        <AppShell.Aside
          style={{
            backgroundColor: 'white',
            borderLeft: '1px solid var(--mantine-color-gray-3)',
          }}
        >
          {sidebarContent}
        </AppShell.Aside>
      )}

      <AppShell.Main
        style={{
          backgroundColor: 'var(--mantine-color-gray-0)',
          minHeight: '100vh',
        }}
      >
        <div style={{ paddingLeft: 24, paddingRight: 24 }}>
          <Outlet />
        </div>
      </AppShell.Main>
    </AppShell>
    </>
  );
}
