import type { ReactNode } from 'react';
import { Box } from '@mantine/core';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <Box bg="#f0efed" mih="100vh">
      <Header />
      <Box component="main" pt={68} maw={1440} mx="auto" px={32}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
