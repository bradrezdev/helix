import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForNotification(): Promise<void> {
    await this.page.waitForSelector('[role="status"]', { timeout: 5000 }).catch(() => {});
  }

  async loginAsAdmin(): Promise<void> {
    // Login as admin user
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
    await this.page.getByPlaceholder('tu@correo.com').fill('admin@onano.com');
    await this.page.getByPlaceholder('••••••••').fill('Onano1234$');
    await this.page.getByRole('button', { name: /iniciar sesión|ingresar|entrar/i }).click();
    await this.page.waitForLoadState('networkidle');
  }
}

export class AdminPage extends BasePage {
  readonly cierreTab: Locator;
  readonly pagosTab: Locator;
  readonly billeteraTab: Locator;
  readonly statsTab: Locator;
  readonly asignarTab: Locator;
  readonly patrocinioTab: Locator;
  readonly holdingTab: Locator;
  readonly datosTab: Locator;
  readonly exportarTab: Locator;
  readonly ordenTab: Locator;
  readonly cambioTab: Locator;
  readonly header: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.getByRole('heading', { name: 'Panel Administrador' });
    this.cierreTab = page.getByRole('button', { name: 'Cierre Mes' });
    this.pagosTab = page.getByRole('button', { name: 'Comisiones' });
    this.billeteraTab = page.getByRole('button', { name: 'Billetera' });
    this.statsTab = page.getByRole('button', { name: 'Estadísticas' });
    this.asignarTab = page.getByRole('button', { name: 'Asignar Orden' });
    this.patrocinioTab = page.getByRole('button', { name: 'Patrocinio' });
    this.holdingTab = page.getByRole('button', { name: 'Holding Tank' });
    this.datosTab = page.getByRole('button', { name: 'Datos Usuario' });
    this.exportarTab = page.getByRole('button', { name: 'Exportar' });
    this.ordenTab = page.getByRole('button', { name: 'Editar Orden' });
    this.cambioTab = page.getByRole('button', { name: 'Tipo Cambio' });
  }

  async goto(): Promise<void> {
    await this.loginAsAdmin();
    await super.goto('/admin');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.header).toBeVisible();
  }
}

export class NetworkPage extends BasePage {
  readonly header: Locator;
  readonly unilevelTab: Locator;
  readonly patrocinioTab: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.header = page.getByRole('heading', { name: 'Mi Red' });
    this.unilevelTab = page.getByRole('button', { name: 'Uninivel' });
    this.patrocinioTab = page.getByRole('button', { name: 'Patrocinio' });
    this.searchInput = page.getByPlaceholder('Buscar por nombre');
  }

  async goto(): Promise<void> {
    await this.loginAsAdmin();
    await super.goto('/network');
  }

  async verifyPageLoaded(): Promise<void> {
    await expect(this.header).toBeVisible();
  }
}