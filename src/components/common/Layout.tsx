import { Box } from '@mantine/core';
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
      }}
    >
      <Header />
      <Box component="main" pt={60}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
