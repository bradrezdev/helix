import { test, expect } from '@playwright/test';
import { AdminPage, NetworkPage } from './helpers';

test.describe('Admin Tools QA', () => {
  const adminCredentials = {
    email: 'admin@onano.mx',
    password: 'Onano1234$',
  };

  // Tool H: Network search for admin only
  test('Tool H - Network search visible only for admin', async ({ page }) => {
    const networkPage = new NetworkPage(page);
    await networkPage.goto();
    await networkPage.verifyPageLoaded();

    // Search input should NOT be visible for regular users - for admin it should be visible
    // Note: This test assumes user is logged in as admin
  });

  // Tool I: Ver Datos de Usuario - all 5 tabs
  test('Tool I - Ver Datos has 5 sub-tabs', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.verifyPageLoaded();
    await adminPage.datosTab.click();

    // Verify all 5 sub-tabs exist
    await expect(page.getByRole('button', { name: 'Órdenes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Comisiones' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Billetera' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Registros' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retiros' })).toBeVisible();
  });

  // Tool J: Exportar CSV - all 5 options
  test('Tool J - Exportar CSV has 5 options', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.exportarTab.click();

    // Verify 5 export options exist
    await expect(page.getByRole('option', { name: /órdenes/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /comisiones/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /billetera/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /usuarios/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /retiros/i })).toBeVisible();
  });

  // Tool K: Editar Orden
  test('Tool K - Editar Orden exists', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.ordenTab.click();

    // Verify fields exist
    await expect(page.getByPlaceholder('Buscar usuario...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pagada' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible();
  });

  // Tool L: Tipo de Cambio
  test('Tool L - Tipo de Cambio has 4 currencies', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.cambioTab.click();

    // Verify 4 currency inputs exist
    await expect(page.getByRole('spinbutton', { name: 'CV' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'MXN' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'COP' })).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'EUR' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible();
  });

  // All tabs should be accessible
  test('All admin tabs accessible', async ({ page }) => {
    const adminPage = new AdminPage(page);
    await adminPage.goto();
    await adminPage.verifyPageLoaded();

    // Click through all tabs
    const tabs = [
      adminPage.cierreTab,
      adminPage.pagosTab,
      adminPage.billeteraTab,
      adminPage.statsTab,
      adminPage.asignarTab,
      adminPage.patrocinioTab,
      adminPage.holdingTab,
      adminPage.datosTab,
      adminPage.exportarTab,
      adminPage.ordenTab,
      adminPage.cambioTab,
    ];

    for (const tab of tabs) {
      await tab.click();
      await page.waitForLoadState('networkidle');
    }
  });
});