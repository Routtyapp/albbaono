import type { ReactNode } from 'react';
import { Box } from '@mantine/core';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  maxWidth?: number;
  bg?: string;
}

export function Layout({ children, maxWidth, bg }: LayoutProps) {
  return (
    <Box bg={bg ?? '#f0efed'} mih="100vh">
      <Header maxWidth={maxWidth} />
      <Box component="main" pt={68} maw={maxWidth ?? 1440} mx="auto" px={32}>
        {children}
      </Box>
      <Footer maxWidth={maxWidth} />
    </Box>
  );
}
