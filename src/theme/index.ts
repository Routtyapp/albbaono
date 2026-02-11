import { createTheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';

const brand: MantineColorsTuple = [
  '#e6f9ee',
  '#cef2dc',
  '#9de5b9',
  '#67d692',
  '#3bca72',
  '#1fc15c',
  '#00b34a',
  '#009a40',
  '#008837',
  '#00752e'
];

const accent: MantineColorsTuple = [
  '#f5fce8',
  '#ebf8d1',
  '#d9f1a3',
  '#c6e96f',
  '#b6e63a',
  '#a4d52e',
  '#8fba24',
  '#799e1d',
  '#638216',
  '#4d6610'
];

const dark: MantineColorsTuple = [
  '#d5d7da',
  '#b8babe',
  '#9a9da3',
  '#5c5f66',
  '#373A40',
  '#2C2E33',
  '#25262b',
  '#1A1B1E',
  '#141517',
  '#101113'
];

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand,
    dark,
    accent,
  },
  fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  headings: {
    fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
    fontWeight: '500',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        fw: 500,
      },
    },
    Title: {
      defaultProps: {
        fw: 500,
      },
    },
    Table: {
      styles: {
        th: { fontWeight: 500 },
      },
    },
  },
});
