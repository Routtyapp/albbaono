import {
  Box,
  Container,
  Grid,
  Stack,
  Anchor,
  Divider,
  Group,
  Text,
  Image,
} from '@mantine/core';

const footerLinks = {
  제품: ['AI 가시성 측정', '인용률 분석', 'AI 인사이트', '리포트'],
  리소스: ['블로그', '가이드', 'FAQ'],
  회사: ['소개', '연락처'],
};

export function Footer() {
  return (
    <Box component="footer" py={60} bg="light-dark(#f0efed, var(--mantine-color-dark-7))" style={{ borderTop: '1px solid light-dark(var(--mantine-color-gray-2), var(--mantine-color-dark-4))' }}>
      <Container size={1440} px={{ base: 20, md: 40 }}>
        <Grid gutter={{ base: 32, md: 48 }}>
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <Image
              src="/YeogiJeogiFontLogo (1).png"
              alt="여기저기"
              h={24}
              w="auto"
            />
            <Text fz="md" c="gray.5" lh={1.6} maw={260} mt={12}>
              AI 시대의 브랜드 가시성을 측정하고 최적화하세요
            </Text>
          </Grid.Col>

          {Object.entries(footerLinks).map(([title, links]) => (
            <Grid.Col key={title} span={{ base: 6, sm: 3, md: 'auto' }}>
              <Text fz="sm" tt="uppercase" lts="0.1em" mb={16}>
                {title}
              </Text>
              <Stack gap={4}>
                {links.map((link) => (
                  <Anchor
                    key={link}
                    href="#"
                    fz="md"
                    c="dimmed"
                    underline="never"
                  >
                    {link}
                  </Anchor>
                ))}
              </Stack>
            </Grid.Col>
          ))}
        </Grid>

        <Divider my="xl" color="gray.2" />

        <Group justify="space-between" wrap="wrap" gap={12}>
          <Text fz="sm" c="gray.5">
            © 2026 여기저기. All rights reserved.
          </Text>
          <Group gap={20}>
            <Anchor href="#" fz="sm" c="gray.5" underline="never">
              개인정보처리방침
            </Anchor>
            <Anchor href="#" fz="sm" c="gray.5" underline="never">
              이용약관
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
