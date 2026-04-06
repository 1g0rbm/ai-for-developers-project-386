import { expect, test, type Locator, type Page } from '@playwright/test'

/**
 * Два клика по дням в открытом календаре Mantine (aria-label вида «9 апреля 2026»).
 * Работает, когда оба числа попадают в видимый месяц одной сетки календаря.
 */
async function pickInclusiveRangeInOpenCalendar(page: Page, startDay: number, endDay: number) {
  const dayBtn = (d: number) =>
    page.locator(`button:not([data-outside]):not([data-hidden])[aria-label^="${d} "]`).first()

  await expect(dayBtn(startDay)).toBeVisible({ timeout: 10_000 })
  await dayBtn(startDay).click()
  await dayBtn(endDay).click()
}

async function chooseMeetingType(page: Page, meetingTypeSelect: Locator, typeId: string, typeName: string) {
  await meetingTypeSelect.click()
  await page.keyboard.press('Control+a')
  await page.keyboard.press('Backspace')
  await meetingTypeSelect.pressSequentially(typeId, { delay: 25 })
  const opt = page.getByRole('option', { name: `${typeName} (30 мин)`, exact: true })
  await expect(opt).toBeVisible({ timeout: 15_000 })
  await opt.click()
}

test.describe('Основной сценарий бронирования', () => {
  test.setTimeout(120_000)

  test('владелец создаёт тип, гость бронирует, бронь в списке', async ({ page }) => {
    const typeId = `e2e-${Date.now()}`
    const typeName = `Встреча ${typeId}`
    const guestName = 'Гость E2E'
    const guestEmail = 'e2e-guest@example.com'

    const start = new Date()
    start.setDate(start.getDate() + 2)
    const end = new Date(start)
    end.setDate(end.getDate() + 3)
    const startDay = start.getDate()
    const endDay = end.getDate()
    await page.goto('/owner')
    await expect(page.getByRole('heading', { name: 'Кабинет владельца' })).toBeVisible()

    await page.getByLabel('id (клиентский)').fill(typeId)
    await page.getByLabel('Название').fill(typeName)
    await page.getByLabel('Описание').fill('Описание для e2e')
    await page.getByLabel('Длительность (мин)').fill('30')
    await page.getByRole('button', { name: 'Создать тип' }).click()
    // Не полагаемся на toast: у Mantine autoClose 4s, при медленном API тост исчезает раньше, чем успеет expect (5s).
    await expect(page.locator('tbody tr').filter({ hasText: typeId })).toBeVisible({ timeout: 15_000 })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Новое бронирование' })).toBeVisible()
    const meetingTypeSelect = page.getByRole('combobox', { name: 'Тип встречи' })
    await expect(meetingTypeSelect).not.toBeDisabled({ timeout: 15_000 })

    await chooseMeetingType(page, meetingTypeSelect, typeId, typeName)

    await page.getByTestId('guest-date-range').click()
    await pickInclusiveRangeInOpenCalendar(page, startDay, endDay)
    await expect(page.getByTestId('guest-date-range')).toContainText(String(start.getFullYear()), { timeout: 10_000 })
    await page.keyboard.press('Escape')

    await chooseMeetingType(page, meetingTypeSelect, typeId, typeName)

    const loadSlots = page.getByRole('button', { name: 'Показать свободные слоты' })
    await loadSlots.scrollIntoViewIfNeeded()
    await loadSlots.click()
    await expect(page.getByText('Доступные начала слотов')).toBeVisible({ timeout: 45_000 })
    await page.getByRole('radio').first().click()

    await page.getByLabel('Имя').fill(guestName)
    await page.getByLabel('Email').fill(guestEmail)
    await page.getByRole('button', { name: 'Забронировать' }).click()
    await expect(page.getByLabel('Имя')).toHaveValue('', { timeout: 20_000 })

    await page.goto('/owner')
    await page.getByRole('button', { name: 'Обновить список' }).click()
    await expect(page.getByRole('cell', { name: new RegExp(guestEmail) })).toBeVisible()
  })
})
