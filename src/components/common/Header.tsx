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
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: '피드', href: '/feed' },
];

export function Header({ maxWidth }: { maxWidth?: number }) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();

  const links = navLinks.map((link) => (
    <Anchor
      key={link.href}
      href={link.href}
      c="gray.7"
      fz="sm"
      fw={500}
      underline="never"
      style={{ letterSpacing: '-0.01em' }}
      onClick={(e) => {
        close();
        if (link.href.startsWith('/')) {
          e.preventDefault();
          navigate(link.href);
        }
      }}
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
      <Container size={maxWidth ?? undefined} fluid={!maxWidth} px={{ base: 'sm', sm: 36 }} h={52}>
        <Group h="100%" justify="space-between">
          <Group gap={36} visibleFrom="sm">
            <UnstyledButton onClick={() => navigate('/')}>
              <Image
                src="/YeogiJeogiFontLogo (1).png"
                alt="여기저기"
                h={20}
                w="auto"
              />
            </UnstyledButton>
            {links}
          </Group>
          <UnstyledButton onClick={() => navigate('/')} hiddenFrom="sm">
            <Image
              src="/YeogiJeogiFontLogo (1).png"
              alt="여기저기"
              h={20}
              w="auto"
            />
          </UnstyledButton>

          <Group gap="md" visibleFrom="sm">
            <Button
              radius="xl"
              color="dark"
              c="white"
              size="xs"
              onClick={() => navigate('/dashboard/brands')}
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
            h={20}
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
            color="dark"
            c="dark"
           
            fullWidth
            mt="md"
            onClick={() => {
              close();
              navigate('/dashboard/brands');
            }}
          >
            시작하기
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}


