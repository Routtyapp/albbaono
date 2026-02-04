import {
  Group,
  Button,
  Container,
  Burger,
  Drawer,
  Stack,
  Anchor,
  Box,
  Image,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';

const navLinks = [
  { label: '문제점', href: '#problem' },
  { label: '솔루션', href: '#solution' },
  { label: '사용방법', href: '#framework' },
];

export function Header() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const navigate = useNavigate();

  return (
    <Box
      component="header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e9ecef',
      }}
    >
      <Container size="lg" py="sm">
        <Group justify="space-between">
          <UnstyledButton onClick={() => navigate('/')}>
            <Image
              src="/YeogiJeogiFontLogo (1).png"
              alt="여기저기"
              h={32}
              w="auto"
              fit="contain"
            />
          </UnstyledButton>

          <Group gap="xl" visibleFrom="sm">
            {navLinks.map((link) => (
              <Anchor
                key={link.label}
                href={link.href}
                c="gray.6"
                size="sm"
                fw={500}
                underline="never"
                style={{ transition: 'color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#212529')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '')}
              >
                {link.label}
              </Anchor>
            ))}
          </Group>

          <Group gap="sm">
            <Button
              variant="subtle"
              color="gray"
              visibleFrom="sm"
              onClick={() => navigate('/dashboard')}
            >
              로그인
            </Button>
            <Button
              color="dark"
              onClick={() => navigate('/dashboard')}
            >
              시작하기
            </Button>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              color="#212529"
              size="sm"
            />
          </Group>
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
            h={28}
            w="auto"
            fit="contain"
          />
        }
        styles={{
          header: { backgroundColor: '#ffffff' },
          body: { backgroundColor: '#ffffff' },
        }}
      >
        <Stack gap="lg" mt="xl">
          {navLinks.map((link) => (
            <Anchor
              key={link.label}
              href={link.href}
              c="gray.7"
              size="lg"
              fw={500}
              underline="never"
              onClick={close}
            >
              {link.label}
            </Anchor>
          ))}
          <Button
            variant="subtle"
            color="gray"
            fullWidth
            mt="md"
            onClick={() => {
              close();
              navigate('/dashboard');
            }}
          >
            로그인
          </Button>
          <Button
            color="dark"
            fullWidth
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
