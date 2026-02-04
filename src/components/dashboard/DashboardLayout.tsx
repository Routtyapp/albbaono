import { AppShell } from '@mantine/core';
import { useDisclosure, useLocalStorage } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';

type SidebarPosition = 'left' | 'right';

export function DashboardLayout() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopCollapsed, { toggle: toggleDesktop }] = useDisclosure();
  const [sidebarPosition, setSidebarPosition] = useLocalStorage<SidebarPosition>({
    key: 'sidebar-position',
    defaultValue: 'right',
  });

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
  );
}
