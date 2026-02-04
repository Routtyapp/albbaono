import {
  Container,
  Group,
  Text,
  Stack,
  Anchor,
  Divider,
  SimpleGrid,
  Box,
  Image,
} from '@mantine/core';
import { IconBrandLinkedin, IconBrandTwitter, IconMail } from '@tabler/icons-react';

const footerLinks = {
  제품: [
    { label: 'AI 가시성 측정', href: '#' },
    { label: '인용률 분석', href: '#' },
    { label: 'AI 인사이트', href: '#' },
    { label: '리포트', href: '#' },
  ],
  리소스: [
    { label: '블로그', href: '#' },
    { label: '가이드', href: '#' },
    { label: 'FAQ', href: '#' },
  ],
  회사: [
    { label: '소개', href: '#' },
    { label: '연락처', href: '#' },
  ],
};

export function Footer() {
  return (
    <Box
      component="footer"
      style={{
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
      }}
    >
      <Container size="lg" py={60}>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="xl">
          <Stack gap="md">
            <Image
              src="/YeogiJeogiFontLogo (1).png"
              alt="여기저기"
              h={32}
              w="auto"
              fit="contain"
              style={{ alignSelf: 'flex-start' }}
            />
            <Text size="sm" c="gray.6" maw={250}>
              AI 시대의 브랜드 가시성을 측정하고 최적화하세요
            </Text>
            <Group gap="md" mt="sm">
              <Anchor href="#" c="gray.5">
                <IconBrandLinkedin size={20} />
              </Anchor>
              <Anchor href="#" c="gray.5">
                <IconBrandTwitter size={20} />
              </Anchor>
              <Anchor href="mailto:contact@yeogieogi.com" c="gray.5">
                <IconMail size={20} />
              </Anchor>
            </Group>
          </Stack>

          {Object.entries(footerLinks).map(([title, links]) => (
            <Stack key={title} gap="sm">
              <Text fw={600} c="gray.8" mb="xs">
                {title}
              </Text>
              {links.map((link) => (
                <Anchor
                  key={link.label}
                  href={link.href}
                  c="gray.6"
                  size="sm"
                  underline="never"
                  style={{ transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#212529')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '')}
                >
                  {link.label}
                </Anchor>
              ))}
            </Stack>
          ))}
        </SimpleGrid>

        <Divider my="xl" color="gray.3" />

        <Group justify="space-between" wrap="wrap" gap="md">
          <Text size="xs" c="gray.5">
            © 2025 여기저기. All rights reserved.
          </Text>
          <Group gap="md">
            <Anchor href="#" size="xs" c="gray.5" underline="never">
              개인정보처리방침
            </Anchor>
            <Anchor href="#" size="xs" c="gray.5" underline="never">
              이용약관
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
