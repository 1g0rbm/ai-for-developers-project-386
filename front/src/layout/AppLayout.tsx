import { AppShell, Anchor, Container, Group, Text } from '@mantine/core'
import { Link, Outlet } from 'react-router-dom'

export function AppLayout() {
  return (
    <AppShell header={{ height: 52 }} padding="md">
      <AppShell.Header px="md" py="xs">
        <Group h="100%" justify="space-between">
          <Text fw={700} size="sm">
            Календарь бронирований
          </Text>
          <Group gap="md">
            <Anchor component={Link} to="/" size="sm">
              Бронирование (гость)
            </Anchor>
            <Anchor component={Link} to="/owner" size="sm">
              Кабинет владельца
            </Anchor>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="md" py="lg">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
