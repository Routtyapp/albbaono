import {
  Box,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  Image,
  Stack,
  Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: '문제', href: '#problem' },
  { label: '솔루션', href: '#solution' },
  { label: '프로세스', href: '#framework' },
  { label: '사례', href: '#case-study' },
  { label: '요금', href: '#pricing' },
];

export function Header() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();

  const links = navLinks.map((link) => (
    <Anchor
      key={link.href}
      href={link.href}
      c="gray.6"
      fz="sm"
      fw={500}
      underline="never"
      style={{ letterSpacing: '-0.01em' }}
      onClick={close}
    >
      {link.label}
    </Anchor>
  ));

  return (
    <Box
      component="header"
      pos="fixed"
      top={0}
      left={0}
      right={0}
      style={{
        zIndex: 100,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <Container size={1440} px={{ base: 20, md: 40 }} h={72}>
        <Group h="100%" justify="space-between">
          <Image
            src="/YeogiJeogiFontLogo (1).png"
            alt="여기저기"
            h={26}
            w="auto"
          />

          <Group gap={36} visibleFrom="sm">
            {links}
            <Button
              radius="xl"
              color="accent.4"
              c="dark"
              fw={600}
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              시작하기
            </Button>
          </Group>

          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            aria-label="메뉴 열기"
          />
        </Group>
      </Container>

      <Drawer
        opened={opened}
        onClose={close}
        size="100%"
        padding="md"
        title={
          <Image
            src="/YeogiJeogiFontLogo (1).png"
            alt="여기저기"
            h={24}
            w="auto"
          />
        }
        hiddenFrom="sm"
        zIndex={200}
      >
        <Stack gap="lg" mt="xl" align="center">
          {links}
          <Button
            radius="xl"
            color="accent.4"
            c="dark"
            fw={600}
            fullWidth
            mt="md"
            onClick={() => {
              close();
              navigate('/dashboard');
            }}
          >
            시작하기
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}
