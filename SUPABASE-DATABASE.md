# 🏗️ Helix — Arquitectura de Base de Datos Supabase

> **Proyecto:** Helix — Oficina Virtual ONANO Global
> **Stack:** React 19 + TypeScript 5.9 + Vite 7 + Tailwind 4 + Zustand 5 + TanStack Query + TanStack Router
> **Base de datos:** PostgreSQL 15+ en Supabase
> **Supabase ref:** `elqonjnniophqdnwhtbo`
> **Extensiones:** `pgcrypto`, `ltree`, `pg_cron`

---

## Tabla de Contenidos

1. [Stack Tecnológico](#1-stack-tecnológico)
2. [Esquema de Base de Datos](#2-esquema-de-base-de-datos)
3. [Enums](#3-enums)
4. [Triggers](#4-triggers)
5. [Funciones y RPCs](#5-funciones-y-rpcs)
6. [pg_cron Jobs](#6-pg_cron-jobs)
7. [Edge Functions de Supabase](#7-edge-functions-de-supabase)
8. [RLS Policies](#8-rls-policies)
9. [Flujo de Comisiones](#9-flujo-de-comisiones)
10. [Conexión Frontend → Supabase](#10-conexión-frontend--supabase)
11. [Hooks de Datos (Frontend)](#11-hooks-de-datos-frontend)
12. [Stores de Estado (Zustand)](#12-stores-de-estado-zustand)
13. [Rutas y Navegación](#13-rutas-y-navegación)
14. [Flujo de Compra Completo](#14-flujo-de-compra-completo)
15. [Ranks System](#15-ranks-system)

---

## 1. Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Base de datos | PostgreSQL 15+ |
| Hosting DB | Supabase (proyecto `elqonjnniophqdnwhtbo`) |
| Extensiones | `pgcrypto` (hash bcrypt), `ltree` (árbol uninivel), `pg_cron` (tareas programadas) |
| Backend lógico | PL/pgSQL — 60+ funciones y RPCs |
| Edge Functions | Supabase Edge Functions (Deno/TypeScript) — 8 funciones |
| Tareas programadas | pg_cron — 5 jobs |
| ORM (frontend) | Supabase JS Client v2 + TanStack Query |
| Tipos compartidos | `supabase gen types typescript --linked` → `src/lib/database.types.ts` |
| Frontend | React 19 + TypeScript 5.9 + Vite 7 |
| Estado | Zustand 5 + TanStack Query |

---

## 2. Esquema de Base de Datos

27 tablas en schema `public`. A continuación se listan con propósito y columnas clave.

### 2.1 Tabla: `users` (~7,688 registros)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid PK` | Mismo UUID que `auth.users` (Supabase Auth) |
| `user_id` | `bigint` | ID numérico auto-generado via secuencia `users_user_id_seq` |
| `name` | `varchar` | Nombre(s) |
| `apellidos` | `text` | Apellidos |
| `email` | `varchar` | Correo electrónico |
| `membership` | `membership_type` | `'socio'` o `'cliente_preferente'` |
| `rank` | `rank_type` | Rango actual (default `'Socio'`) |
| `sponsor_id` | `bigint` | Patrocinador (FK a `users.user_id`) |
| `personal_pv` | `numeric` | PV personal acumulado |
| `personal_cv` | `numeric` | CV personal acumulado |
| `group_vg` | `numeric` | VG grupal (pre-calculado) |
| `is_active` | `boolean` | ¿Activo este mes? |
| `is_admin` | `boolean` | ¿Es administrador? |
| `kit_type` | `kit_type` | Tipo de kit adquirido |
| `achieved_ranks` | `text[]` | Array de rangos alcanzados alguna vez |
| `promotor_bonos` | `integer` | Bonos promotor acumulados |
| `fidelity_points` | `integer` | Puntos de fidelidad |
| `enrollment_date` | `date` | Fecha de inscripción |
| `ltp_points` | `integer` | Puntos Leadership Trip |
| `ltp_rank_bonuses_received` | `text[]` | Bonos de rango recibidos para LTP |
| `link_referido` | `text` | Link de referido único |
| `country` | `varchar` | País (default 'MX') |
| `unilevel_parent_id` | `uuid` | Padre en árbol uninivel |
| `created_at` / `updated_at` | `timestamptz` | Timestamps |

**Relaciones:**
- `sponsor_id` → `users.user_id` (árbol de patrocinio)
- `id` → `auth.users.id` (identidad de autenticación)
- `unilevel_parent_id` → `users.id` (árbol uninivel)

**RLS:** 7 políticas (select propia, select admin, insert propia, insert admin, update propia, update admin, delete admin).

---

### 2.2 Tabla: `orders`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid PK` | ID único de orden |
| `order_code` | `varchar` | Código legible de orden |
| `user_id` | `uuid FK → users.id` | Quien hizo la orden |
| `status` | `order_status` | `pending_payment`, `paid`, `cancelled`, `refunded`, `failed` |
| `total_amount` | `numeric` | Monto total |
| `pv` | `numeric` | PV total de la orden |
| `cv` | `numeric` | CV total de la orden |
| `payment_method` | `text` | `wallet` o `card` |
| `shipping_data` | `jsonb` | Datos de envío (tipo, dirección/CEDI) |
| `tax_amount` | `numeric` | Monto de impuesto |
| `is_kit` | `boolean` | ¿Es compra de kit de registro? |
| `product_code` | `text` | Código del producto principal (kit) |
| `kit_type` | `text` | Tipo de kit |
| `paid_at` | `timestamptz` | Cuándo se pagó |
| `created_at` / `updated_at` | `timestamptz` | Timestamps |

**Relaciones:**
- `user_id` → `users.id`
- `order_items.order_id` → `orders.id` (detalle)

**Índices:** `(user_id, status)`, `(paid_at)`, `(is_kit)`

---

### 2.3 Tabla: `order_items`

| Columna | Tipo |
|---------|------|
| `id` | `uuid PK` |
| `order_id` | `uuid FK → orders.id` |
| `product_code` | `text` |
| `product_name` | `text` |
| `quantity` | `integer` |
| `unit_price` | `numeric` |
| `pv` | `numeric` |
| `cv` | `numeric` |

---

### 2.4 Tabla: `products`

| Columna | Tipo |
|---------|------|
| `code` | `text PK` |
| `name` | `text` |
| `description` | `text` |
| `price_mxn` | `numeric` |
| `price_usd` | `numeric` |
| `pv` | `numeric` |
| `cv` | `numeric` |
| `image_url` | `text` |
| `stock` | `integer` |
| `is_kit` | `boolean` |
| `is_recommended` | `boolean` |
| `category_id` | `uuid FK → categorias.id` |
| `launched_at` | `date` |
| `product_status` | `product_status` |

---

### 2.5 Tabla: `commissions`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid PK` | |
| `user_id` | `uuid FK → users.id` | Quien recibe la comisión |
| `bono_type` | `text` | Tipo de bono (`patrocinio`, `unilevel`, `match`, `infinito_patrocinio`, `infinito_uninivel`, `fidelidad`, `promotor`, `avance_rango`) |
| `amount` | `numeric` | Monto de la comisión |
| `level` | `smallint` | Nivel en el árbol |
| `period_month` | `int` | Mes del período |
| `period_year` | `int` | Año del período |
| `source_user_id` | `uuid FK → users.id` | Usuario que generó la comisión |
| `source_order_id` | `uuid FK → orders.id` | Orden que generó la comisión |
| `calculated_at` | `timestamptz` | Cuándo se calculó |
| `paid_at` | `timestamptz` | Cuándo se pagó |
| `process_verified` | `boolean` | Verificado por el proceso FSM |

**Índices:** `(user_id, period_month, period_year)`, `(source_order_id)`, `(source_user_id)`

---

### 2.6 Tabla: `wallets`

| Columna | Tipo |
|---------|------|
| `id` | `uuid PK` |
| `user_id` | `uuid FK → users.id` |
| `balance` | `numeric` |
| `wallet_type` | `wallet_type` (`disponible`, `acumulado`) |
| `created_at` / `updated_at` | `timestamptz` |

---

### 2.7 Tabla: `wallet_transactions`

| Columna | Tipo |
|---------|------|
| `id` | `uuid PK` |
| `wallet_id` | `uuid FK → wallets.id` |
| `type` | `text` (allow: `commission_payout`, `order_payment`, `manual_credit`, `refund`, `bonus`) |
| `amount` | `numeric` |
| `reference_type` | `text` |
| `reference_id` | `uuid` |
| `description` | `text` |
| `created_at` | `timestamptz` |

---

### 2.8 Tabla: `unilevel_tree`

| Columna | Tipo |
|---------|------|
| `user_id` | `uuid PK FK → users.id` |
| `path` | `ltree` — path jerárquico ej: `root.A.B.C` |
| `parent_id` | `uuid` (derivado de path con `subpath()`) |

**Extensión:** `ltree` — permite consultas como:
```sql
-- Todos los descendientes de un usuario
SELECT * FROM unilevel_tree WHERE path <@ 'root.A.B'
-- Todos los ancestros
SELECT * FROM unilevel_tree WHERE 'root.A.B.C' <@ path
-- Nivel de profundidad
SELECT nlevel(path) FROM unilevel_tree
```

---

### 2.9 Tabla: `holding_tank`

| Columna | Tipo |
|---------|------|
| `member_id` | `uuid PK FK → users.id` |
| `sponsor_id` | `uuid FK → users.id` |
| `entered_at` | `timestamptz` |

Usuarios registrados pero aún no colocados en el árbol uninivel.

---

### 2.10 Tabla: `periodos`

| Columna | Tipo |
|---------|------|
| `id` | `uuid PK` |
| `period_name` | `text` (ej: `May 2026`) |
| `period_month` | `int` |
| `period_year` | `int` |
| `start_date` | `date` |
| `end_date` | `date` |
| `status` | `text` (`active`, `closed`) |

---

### 2.11 Tabla: `ranks`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `int PK GENERATED ALWAYS AS IDENTITY` | |
| `name` | `text UNIQUE` | Nombre del rango |
| `slug` | `text UNIQUE` | Slug |
| `level` | `int UNIQUE` | Orden (0=Socio → 11=Triple Diamante Embajador) |
| `min_pv` | `numeric` | PV mínimo requerido |
| `min_group_vg` | `numeric` | VG grupal mínimo |
| `min_longest_leg` | `numeric` | Pierna más grande |
| `min_other_legs` | `numeric` | Otras piernas |
| `bonus_amount` | `numeric` | Bono por alcanzar el rango |
| `is_bronze_time_window` | `boolean` | Bronce tiene ventana de 2 meses |
| `image_url` | `text` | Ruta de imagen |
| `description` | `text` | Descripción |
| `created_at` | `timestamptz` | |

**Seed:** 12 rows — todos los rangos del plan de compensación ONANO.

---

### 2.12 Tabla: `rank_advance_bonus_claims`

| Columna | Tipo |
|---------|------|
| `id` | `uuid PK` |
| `user_id` | `uuid FK → users.id` |
| `rank_name` | `text` |
| `bonus_amount` | `numeric` |
| `claimed_at` | `timestamptz` |
| `period_month` | `int` |
| `period_year` | `int` |

**Constraint:** `UNIQUE (user_id, rank_name)` — un bono por rango por usuario (una vez).

---

### 2.13 Otras Tablas (resumen)

| Tabla | Propósito |
|-------|-----------|
| `monthly_closure` | Registro de cierres mensuales ejecutados |
| `fidelity_ledger` | Puntos de fidelidad por período |
| `ltp_entries` | Puntos Leadership Trip |
| `ltp_semester_rewards` | Recompensas semestrales LTP |
| `promotor_bonus_tracking` | Tracking de bonos promotor |
| `commission_payout_batches` | Lotes de pago de comisiones |
| `shipments` | Envíos de órdenes |
| `cedis` | Centros de distribución |
| `direcciones` | Direcciones de envío de usuarios |
| `taxes` | Configuración de impuestos por país |
| `exchange_rates` | Tipos de cambio |
| `internal_transfers` | Transferencias internas |
| `product_private_access` | Acceso privado a productos |
| `categorias` | Categorías de productos |
| `admin_settings` | Configuraciones de administrador |
| `holding_tank_reset_config` | Configuración de reset del holding tank |

---

## 3. Enums

7 enums definidos en PostgreSQL:

### `rank_type` (12 valores)

```sql
Socio, Ejecutivo, Bronce, Plata, Oro, Platino, Diamante,
Doble Diamante, Triple Diamante, Diamante Embajador,
Doble Diamante Embajador, Triple Diamante Embajador
```

### `order_status` (5 valores)
`pending_payment`, `paid`, `cancelled`, `refunded`, `failed`

### `kit_type` (3 valores)
`basico`, `intermedio`, `superior`

### `wallet_type` (2 valores)
`disponible`, `acumulado`

### `price_type` (2 valores)
`publico`, `socio`

### `country_type`
Países soportados.

### `product_status` (2 valores)
`active`, `inactive`

---

## 4. Triggers

20 triggers en total. Los más importantes:

### `on_auth_user_created` — AFTER INSERT on `auth.users`

**Función:** `handle_new_user()`
**Propósito:** Cuando un usuario se registra en Supabase Auth, crea automáticamente su perfil en `public.users` y lo inserta en `holding_tank`. También auto-confirma el email.

```sql
BEGIN
  INSERT INTO public.users (id, email, name, apellidos, ...)
  VALUES (NEW.id, NEW.email, ...);
  INSERT INTO holding_tank (member_id, sponsor_id)
  VALUES (NEW.id, v_sponsor_id);
  -- Auto-confirm email
  UPDATE auth.users SET email_confirmed_at = now() WHERE id = NEW.id;
  RETURN NEW;
END;
```

### `trg_orders_commissions_before_update` — BEFORE UPDATE OF status on `orders`

**Función:** `process_instant_commissions()`
**Propósito:** Cuando una orden cambia a `paid`, calcula y paga comisiones instantáneas:
- Bono Patrocinio (3 niveles ascendentes: 25%, 15%, 5% del CV)
- Bono Infinito Patrocinio (L4+ según rango)
- Bono Venta Directa
- Activación de Compra Preferente (50% CV atribuible, 20% comisión)

### `trg_orders_commissions_after_insert` — AFTER INSERT on `orders`

**Función:** `process_instant_commissions_after()`
**Propósito:** Procesa bono patrocinio DFS 3 niveles y acredita a wallet instantáneamente. Corre en AFTER INSERT para evitar FK violations.

### `trg_orders_after_update` — AFTER UPDATE OF status on `orders`

**Función:** `orders_after_update_handler()`
**Propósito:** Handler consolidado que orquesta:
1. Actualizar PV/CV personal del usuario
2. Upgrade de membresía si aplica
3. Liberar acumulado al activarse

### `trg_update_personal_pv_cv_insert` — AFTER INSERT on `orders`

**Función:** `update_user_personal_pv_cv()`
**Propósito:** Actualiza PV/CV personal del usuario cuando se inserta una orden pagada.

### `trg_recalc_rank_on_vg_change` — AFTER UPDATE on `users`

**Función:** `recalc_rank()`
**Propósito:** Recalcula el rango del usuario cuando cambia su VG grupal.

### `trg_propagate_pv_to_ancestors` — AFTER INSERT/UPDATE on `orders`

**Función:** `propagate_pv_up_tree()`
**Propósito:** Propaga el PV/CV hacia arriba en el árbol de patrocinio.

---

## 5. Funciones y RPCs

Más de 60 funciones PL/pgSQL. Aquí las más importantes agrupadas por dominio.

### 5.1 Comisiones Instantáneas (Triggers)

#### `process_instant_commissions()`

| Aspecto | Detalle |
|---------|---------|
| **Evento** | BEFORE UPDATE OF status ON orders |
| **Parámetros** | Ninguno (NEW/OLD implícito) |
| **Propósito** | Procesa comisiones al pagar una orden |
| **Bonos que calcula** | Patrocinio (3 niveles 25/15/5%), Infinito Patrocinio (L4+ diferencial por rango), Venta Directa, Activación CP |

**Lógica resumida:**
1. Si `NEW.status != 'paid'` o `OLD.status = 'paid'`, sale
2. Obtiene el CV de la orden y el `user_id`
3. Recorre 3 niveles ascendentes de patrocinio (`sponsor_id` chain):
   - Nivel 1: 25% del CV del kit
   - Nivel 2: 15%
   - Nivel 3: 5%
4. Para Infinito Patrocinio: usuarios con rango Plata+ reciben % diferencial recursivo
5. Para Venta Directa: si el comprador es Cliente Preferente, 20% del CV
6. Inserta filas en `commissions` con `bono_type` y `process_verified = true`

#### `process_instant_commissions_after()`

| Aspecto | Detalle |
|---------|---------|
| **Evento** | AFTER INSERT ON orders |
| **Parámetros** | Ninguno (NEW implícito) |
| **Propósito** | Procesa comisiones post-insert + acredita wallet |

**Lógica:**
1. Obtiene sponsor del usuario via `SELECT u.sponsor_id INTO v_sponsor_id FROM users WHERE id = NEW.user_id`
2. Recorre 3 niveles de patrocinio
3. Para cada nivel, inserta en `commissions` + acredita a `wallet` vía `credit_wallet()`
4. `type = 'bonus'` (permitido por check constraint de `wallet_transactions.type`)

**Diferencia con `process_instant_commissions()`:** Corre AFTER INSERT (no BEFORE UPDATE). Está separada para evitar FK violations en `commissions.source_order_id`.

---

### 5.2 Bonos del Plan de Compensación

#### `calculate_unilevel_bonus()`

| Aspecto | Detalle |
|---------|---------|
| **Firma** | `(p_user_id uuid, p_period_id uuid)` |
| **Propósito** | Calcula Bono Uninivel para un usuario en un período |
| **Porcentajes** | N1: 6%, N2: 8%, N3: 10%, N4: 12%, N5: 5%, N6: 4%, N7: 3%, N8: 2%, N9: 2% |
| **Incluye Holding Tank** | Sí (holding tank depth 1) |

**Lógica:**
1. Obtiene el árbol uninivel via `get_unilevel_downline(p_user_id, 9)`
2. Para cada descendiente en niveles 1-9, calcula el CV del período
3. Multiplica por el porcentaje correspondiente al nivel
4. Inserta en `commissions` con `bono_type = 'unilevel'`

#### `calculate_infinito_unilevel_bonus()`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Bono Infinito Uninivel (Platino+) |
| **Depth** | >= 10 niveles |
| **Lógica** | Diferencial sobre el tope del rango. Platino=0.5%, hasta Triple Diamante Embajador=2% |

#### `calculate_match_bonus()`

| Aspecto | Detalle |
|---------|---------|
| **Frecuencia** | Mensual |
| **Rangos** | Plata+ |
| **Niveles** | 5 niveles según rango del usuario |
| **%** | Varía por rango (definido en bono-match.md) |

#### `calculate_diferencial_patrocinio()`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Diferencial sobre patrocinio al cierre mensual |
| **Lógica** | Calcula la diferencia entre el % del usuario y el % de su patrocinado directo, aplicado al CV de la organización del patrocinado |

#### `calculate_infinito_patrocinio()`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Diferencial recursivo L4+ por rango |
| **Lógica** | Similar a diferencial pero para niveles 4+ y basado en rango |

#### `calculate_promotor_bonus()`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Bono Promotor (tracking, amount=0) |
| **Regla** | Cada 200 CV acumulados → +1 Bono Promotor |

#### `calculate_rank_advance_bonus()`

| Aspecto | Detalle |
|---------|---------|
| **Propósito** | Calcula bono por avance de rango |
| **Lógica** | Lee `bonus_amount` de la tabla `ranks`, verifica que no haya sido reclamado antes via `rank_advance_bonus_claims` |

---

### 5.3 Cierres Programados

#### `process_monthly_closure()` — Cierre Mensual (12 pasos)

**Ejecutado por:** pg_cron el día 1 de cada mes
**Propósito:** Procesa todos los bonos del mes completo.

**Pasos:**
1. Crear período si no existe
2. Calcular Bono Uninivel (`calculate_unilevel_bonus`)
3. Calcular Bono Infinito Uninivel (`calculate_infinito_unilevel_bonus`)
4. Calcular Bono Match (`calculate_match_bonus`)
5. Calcular Diferencial Patrocinio (`calculate_diferencial_patrocinio`)
6. Calcular Infinito Patrocinio (`calculate_infinito_patrocinio`)
7. Calcular Bono Promotor (`calculate_promotor_bonus`)
8. Calcular Bono Avance de Rango (`calculate_rank_advance_bonus`)
9. Recalcular VG grupal (`recalc_group_vg`)
10. Recalcular rangos (`recalc_rank` para todos los usuarios)
11. Marcar período como cerrado
12. Registrar en `monthly_closure`

#### `run_midmonth_unilevel()` — Cierre Quincenal

**Ejecutado por:** pg_cron el día 15 de cada mes
**Propósito:** Calcula Bono Uninivel a mitad de mes.
- Llama a `calculate_unilevel_bonus()` para todos los usuarios activos
- No incluye holding tank en el cálculo (limitación conocida)

---

### 5.4 Árboles y Consultas de Red

#### `get_unilevel_downline(root_id uuid, max_depth int DEFAULT 9)`

**Retorna:** `TABLE(user_id uuid, depth int, name text, apellidos text)`
**SECURITY DEFINER** (bypassea RLS)
**Propósito:** Obtiene todos los descendientes en el árbol uninivel.

**Lógica:**
```sql
-- Incluye root user
SELECT root_id, 0, u.name, u.apellidos FROM users WHERE id = root_id
UNION ALL
-- Descendientes via ltree
SELECT ut.user_id, (nlevel(ut.path) - nlevel(r.path))::INT AS depth,
       u2.name, u2.apellidos
FROM unilevel_tree ut, unilevel_tree r
LEFT JOIN users u2 ON u2.id = ut.user_id
WHERE r.user_id = root_id
  AND ut.path <@ r.path
  AND nlevel(ut.path) - nlevel(r.path) BETWEEN 1 AND max_depth
```

#### `get_unilevel_tree(p_root_id uuid, p_max_depth int DEFAULT 99)`

**Retorna:** Árbol completo con `parent_id` derivado de ltree path.
**SECURITY DEFINER**
**Uso:** Visualización D3 del árbol uninivel.

#### `get_sponsor_tree(p_root_id uuid)`

**Retorna:** Árbol de patrocinio DFS recursivo.
**Lógica:** Recursión CTE sobre `sponsor_id` chain.

#### `get_network_orders(p_root_id uuid, p_page int, p_page_size int, ...)`

**Retorna:** Órdenes del downline paginadas.
**Lógica:** Usa `get_unilevel_downline(p_root_id, 99)` para obtener descendientes y luego joinea con `orders`.

#### `get_comisiones_nivel_all(p_user_id uuid, p_month int, p_year int)`

**Retorna:** `TABLE(level int, total_socios bigint, total_pv numeric, total_cv numeric, total_amount numeric)`
**Propósito:** Comisiones agrupadas por nivel para todos los bonos.

#### `get_socios_nivel_all(p_user_id uuid, p_level int, p_month int, p_year int)`

**Retorna:** Detalle de socios por nivel.
**Nota:** LEFT JOIN on users, COALESCE para nombres nulos (usuarios huérfanos).

---

### 5.5 Órdenes y Pagos

#### `place_order_with_membership()`

**Propósito:** Transacción ACID para compra con membresía.
**Parámetros:** user_id, items, total_amount, payment_method, shipping_data, tax_amount, with_membership
**Lógica:**
1. Inicia transacción
2. Valida saldo de wallet (si payment_method='wallet')
3. Crea orden en `orders`
4. Crea `order_items`
5. Descuenta de wallet
6. Upgrade de membresía si aplica
7. Si kit: actualiza `kit_type` del usuario
8. Si todo ok → COMMIT, si no → ROLLBACK

#### `place_order()`

**Propósito:** Crear orden individual (sin membresía).

---

### 5.6 Holding Tank

#### `place_user_from_tank(p_member_id uuid, p_parent_id uuid)`

**Propósito:** Coloca un usuario del holding tank en el árbol uninivel.
**Lógica:**
1. Elimina de `holding_tank`
2. Asigna `unilevel_parent_id` del usuario
3. Reconstruye subárbol uninivel
4. Si es el sponsor, actualiza su rango

#### `handle_new_user()`

**Trigger function** (crea usuario + holding tank + auto-confirm email)
**Propósito:** Maneja la creación de nuevo usuario desde `auth.users`.

---

### 5.7 Utilidades

| Función | Propósito |
|---------|-----------|
| `recalc_rank()` | Recalcula rango leyendo de `ranks` table |
| `recalc_group_vg()` | Recalcula VG grupal (unilevel_tree + holding_tank) |
| `determine_rank()` | Determina rango de un usuario según PV/VG |
| `is_user_active_this_month()` | Verifica si usuario tiene 100+ PV en el mes |
| `get_periodos_volumen()` | Obtiene períodos con PV/CV personal y VG grupal |
| `recalc_rank()` | Recalcula rank |
| `get_sponsor_ancestors()` | Ancestros en árbol de patrocinio |
| `transfer_sponsorship()` | Transferir patrocinio |
| `validate_sponsor_exists()` | Validar sponsor existe |
| `fsm_process_commissions()` | Gateway FSM: validar comisiones generadas |
| `fsm_evaluate_activation_rules()` | Gateway FSM: evaluar activación + compresión |
| `ensure_acumulado_wallet()` | Crear wallet acumulado si no existe |
| `release_acumulado_on_activation()` | Liberar acumulado al activarse (>=100 PV) |
| `upgrade_membership_on_kit_purchase()` | Upgradear membresía a socio |

---

## 6. pg_cron Jobs

| Job | Schedule | Función | Propósito |
|-----|----------|---------|-----------|
| `unilevel_midmonth` | `0 0 15 * *` (día 15, 00:00) | `run_midmonth_unilevel()` | Cálculo quincenal de Bono Uninivel |
| `monthly_closure` | `0 0 1 * *` (día 1, 00:00) | `process_monthly_closure()` | Cierre mensual completo (12 pasos) |
| `expire_fidelity` | `0 0 1 * *` (día 1) | Expira puntos de fidelidad vencidos | Mantenimiento de fidelidad |
| `semester_bonus_h1` | `0 0 1 Jul *` (1 de julio) | Procesa LTP semestre H1 | Bono Viaje de Liderazgo |
| `semester_bonus_h2` | `0 0 1 Jan *` (1 de enero) | Procesa LTP semestre H2 | Bono Viaje de Liderazgo |

---

## 7. Edge Functions de Supabase

| Función | verify_jwt | Propósito |
|---------|-----------|-----------|
| `register-user` | ❌ false | Registrar usuario sin session takeover (Admin API). Crea en auth.users + public.users + holding_tank |
| `create-admin-user` | ❌ false | Crear admin inicial (one-time setup) |
| `monthly-closure` | ✅ true | Ejecutar cierre mensual manualmente |
| `payout-commissions` | ✅ true | Pagar comisiones a wallets (procesa commissions pendientes) |
| `wallet-deposit` | ✅ true | Depositar fondos a wallet manualmente |
| `get-wallet-details` | ✅ true | Obtener detalle de wallet |
| `admin-assign-order` | ✅ true | Asignar orden manualmente a un usuario |
| `reset-test-passwords` | ❌ false | Reset contraseñas de usuarios de test |

**Nota:** Estas funciones están deployadas en Supabase pero no hay archivos fuente locales en `supabase/functions/`.

---

## 8. RLS Policies

### Tabla `users` — 7 políticas

| Policy | Roles | Cmd | Qual/Check |
|--------|-------|-----|------------|
| `users_select` | `public` | SELECT | `auth.uid() = id OR auth_is_admin()` |
| `users_select_sponsor_link` | `anon, authenticated` | SELECT | `link_referido IS NOT NULL` |
| `users_insert_self` | `public` | INSERT | Check: `auth.uid() = id` |
| `users_insert_admin` | `public` | INSERT | Check: `is_admin()` |
| `users_update_own` | `public` | UPDATE | `auth.uid() = id AND NOT is_admin()` |
| `users_update_admin` | `public` | UPDATE | `is_admin()` |
| `users_delete_admin` | `public` | DELETE | `is_admin()` |

### Tabla `orders` — 2 políticas

| Policy | Roles | Cmd | Qual |
|--------|-------|-----|------|
| `orders_select` | `authenticated` | SELECT | `user_id = auth.uid() OR is_admin()` |
| `orders_insert` | `authenticated` | INSERT | `user_id = auth.uid()` |

### Tabla `commissions` — 2 políticas

| Policy | Roles | Cmd | Qual |
|--------|-------|-----|------|
| `commissions_select` | `authenticated` | SELECT | `user_id = auth.uid() OR is_admin()` |
| `commissions_insert` | `authenticated` | INSERT | Check: `is_admin()` |

### Tabla `wallets` — 2 políticas

| Policy | Roles | Cmd | Qual |
|--------|-------|-----|------|
| `wallets_select` | `authenticated` | SELECT | `user_id = auth.uid() OR is_admin()` |
| `wallets_update` | `authenticated` | UPDATE | Check: `is_admin()` |

### Tabla `holding_tank` — 2 políticas

| Policy | Roles | Cmd | Qual |
|--------|-------|-----|------|
| `holding_tank_select` | `authenticated` | SELECT | `sponsor_id = auth.uid() OR is_admin()` |
| `holding_tank_delete` | `authenticated` | DELETE | `is_admin()` |

### Tabla `ranks` — 1 política

| Policy | Roles | Cmd | Qual |
|--------|-------|-----|------|
| `ranks_select` | `authenticated` | SELECT | `true` (todos pueden ver) |

**⚠️ Tablas sin RLS:** `shipments`, `fidelity_ledger`, `ltp_semester_rewards` — no tienen RLS activada. Esto significa que cualquier usuario autenticado puede leer/escribir en estas tablas. Pendiente de corregir.

---

## 9. Flujo de Comisiones

Diagrama completo desde que un usuario hace una orden hasta que se paga la comisión:

```
1. USUARIO HACE ORDEN
   │
   ├── place_order_with_membership()  [transacción ACID]
   │     • Valida wallet
   │     • Crea orden (status='pending_payment')
   │     • Crea order_items
   │     • Descuenta wallet
   │     • Upgrade membresía si kit
   │
   └── Orden insertada en "orders" con status='pending_payment'
         │
         ▼
2. TRIGGER AFTER INSERT
   │
   ├── trg_orders_commissions_after_insert
   │     └── process_instant_commissions_after()
   │           • Bono Patrocinio DFS 3 niveles (25%, 15%, 5%)
   │           • Acredita a wallet instantáneamente
   │           • type = 'bonus' en wallet_transactions
   │
   └── trg_update_personal_pv_cv_insert
         └── update_user_personal_pv_cv()
               • Suma PV/CV de la orden al usuario
         │
         ▼
3. STATUS CAMBIA A 'paid'
   │
   └── trg_orders_commissions_before_update  [BEFORE UPDATE OF status]
         └── process_instant_commissions()
               • Bono Patrocinio (3 niveles)
               • Bono Infinito Patrocinio (L4+, según rango)
               • Bono Venta Directa (20% del CV si CP)
               • Activación CP (50% CV atribuible)
         │
         ▼
   └── trg_orders_after_update
         └── orders_after_update_handler()
               • Actualiza PV/CV personal
               • Upgrade membresía
               • Libera acumulado
         │
         ▼
4. CIERRE QUINCENAL (día 15)
   │
   └── pg_cron → run_midmonth_unilevel()
         └── calculate_unilevel_bonus()
               • 9 niveles [6,8,10,12,5,4,3,2,2]%
               • Incluye holding tank (depth 1)
         │
         ▼
5. CIERRE MENSUAL (día 1)
   │
   └── pg_cron → process_monthly_closure()
         │
         ├── Step 1: Crear período
         ├── Step 2: calculate_unilevel_bonus()
         ├── Step 3: calculate_infinito_unilevel_bonus()
         ├── Step 4: calculate_match_bonus()
         ├── Step 5: calculate_diferencial_patrocinio()
         ├── Step 6: calculate_infinito_patrocinio()
         ├── Step 7: calculate_promotor_bonus()
         ├── Step 8: calculate_rank_advance_bonus()
         ├── Step 9: recalc_group_vg()
         ├── Step 10: recalc_rank() para todos
         ├── Step 11: Marcar período cerrado
         └── Step 12: Registrar en monthly_closure
         │
         ▼
6. PAGO A WALLETS
   │
   └── Edge Function: payout-commissions
         • Procesa commissions pendientes
         • Acredita a wallets de usuarios
```

---

## 10. Conexión Frontend → Supabase

### 10.1 Configuración del Cliente

**Archivo:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**Environment Variables:**

| Variable | Propósito |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key (pública, safe-for-client) |

Definidas en `.env` (nunca en git — ya en `.gitignore`).

### 10.2 Typado con Database

El tipo `Database` se genera con `supabase gen types typescript --linked` y se guarda en `src/lib/database.types.ts` (~1954 líneas). Cubre:
- `Tables` — Row/Insert/Update para cada tabla
- `Enums` — tipos enum de Postgres
- `Relationships` — FK entre tablas
- `Functions` — RPCs con argumentos y retorno

### 10.3 Autenticación

**Archivo:** `src/hooks/useAuth.ts`

```typescript
export function useAuth(): AuthState
```

**Retorna:**
| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `user` | `User \| null` | Objeto user de Supabase Auth |
| `session` | `Session \| null` | Sesión completa |
| `loading` | `boolean` | `true` mientras se resuelve la sesión |
| `signIn(email, password)` | `() => Promise<void>` | Login |
| `signOut()` | `() => Promise<void>` | Logout (tolera 403) |

**Flujo:**
1. Al montar: `supabase.auth.getSession()` recupera sesión existente
2. Se suscribe a `onAuthStateChange` para reaccionar a login/logout/refresh
3. Limpia suscripción al desmontar

### 10.4 Perfil de Usuario

**Archivo:** `src/hooks/useProfile.ts`

```typescript
export function useProfile(userId: string) {
  return useQuery<UserProfile | null>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('users')
        .select('id, user_id, name, apellidos, email, rank, membership, sponsor_id, is_admin, country...')
        .eq('id', userId)
        .maybeSingle()
      ...
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
```

**Relación `auth.users` → `public.users`:** Cuando un usuario se registra en `auth.users`, el trigger `on_auth_user_created` inserta automáticamente una fila en `public.users` con el mismo `id` (UUID).

**Admin check:** `profile?.is_admin === true`. No hay rol en JWT — se verifica contra BD.

---

## 11. Hooks de Datos (Frontend)

### 11.1 Tabla General de Hooks

| Hook | Archivo | Tabla/RPC | Query Key |
|------|---------|-----------|-----------|
| `useProfile` | `useProfile.ts` | `users` (select) | `['profile', userId]` |
| `useSponsor` | `useProfile.ts` | `users` (select) | `['profile', 'sponsor', sponsorId]` |
| `usePedidos` | `usePedidos.ts` | `orders` + `order_items` | `['pedidos', userId, filter, isAdmin]` |
| `useNetworkPedidos` | `useNetworkPedidos.ts` | `get_network_orders` (RPC) | `['network-orders', userId, page, status, dateFrom, dateTo]` |
| `useOrderDetail` | `useOrderDetail.ts` | `orders` + 5 sub-queries | `['orderDetail', orderId]` |
| `useCommissions` | `useCommissions.ts` | `commissions` (select) | `['commissions', userId, month, year]` |
| `useComisionesNivel` | `useComisionesNivel.ts` | `get_comisiones_nivel_all` (RPC) | `['comisiones-nivel', userId, month, year]` |
| `useSociosNivel` | `useSociosNivel.ts` | `get_socios_nivel_all` (RPC) | `['socios-nivel', userId, level, month, year]` |
| `usePeriodos` | `usePeriodos.ts` | `get_periodos_volumen` (RPC) | `['periodos-volumen', userId]` |
| `useVolumeAudit` | `useVolumeAudit.ts` | `map_reduce_volume` (RPC) | `['volume-audit', month, year]` |
| `useWallet` | `useWallet.ts` | `wallets` (select, manual) | N/A |
| `useWalletTransactions` | `useWalletTransactions.ts` | `wallet_transactions` (select, manual) | N/A |
| `useHoldingTank` | `useHoldingTank.ts` | `holding_tank` (select + FK join) | `['holding-tank', userId]` |
| `useProductWhitelist` | `useProductWhitelist.ts` | `products` + `orders` | `['products-whitelist', userId]`, `['user-has-kit', userId]` |
| `useKitEligibility` | `useKitEligibility.ts` | `orders` (count) | `['kit-eligibility', userId]` |
| `useStoreProducts` | `useStoreProducts.ts` | `products` (select) | `['store-products', { kitOnly }]` |
| `useStoreSections` | `useStoreSections.ts` | `products` × 4 + `order_items` + `categorias` | `['store-sections', resolvedMonths]` |
| `useTier` | `useTier.ts` | Función pura (no DB) | N/A |
| `useDirecciones` | `useDirecciones.ts` | `direcciones` (select, manual) | N/A |
| `useDefaultDireccion` | `useDirecciones.ts` | Compuesto de `useDirecciones` | N/A |
| `useLegVolumes` | `useNegocio.ts` | `get_leg_volumes` (RPC) | `['leg-volumes', userId]` |
| `useNetworkStats` | `useNegocio.ts` | `get_network_stats` (RPC) | `['network-stats', userId]` |
| `useCommissionBreakdown` | `useNegocio.ts` | Compuesto de `useCommissions` | N/A |
| `useVgTrend` | `useNegocio.ts` | `commissions` (select) | `['vg-trend', userId, months]` |
| `useRecentUsers` | `useNegocio.ts` | `users` (select) | `['recent-users', limit]` |
| `useDashboard` | `useDashboard.ts` | `get_user_dashboard` (RPC) | `['dashboard', userId]` |
| `useTopRankos` | `useDashboardTops.ts` | `users` (select) | `['top-rankos', userId, isAdmin]` |
| `useTopConsumers` | `useDashboardTops.ts` | `orders` + `order_items` + `users` | `['top-consumers', userId, month, year, isAdmin]` |
| `useTopRecruiters` | `useDashboardTops.ts` | `users` (select × 2) | `['top-recruiters', userId, month, year, isAdmin]` |
| `useFirstVsRepurchase` | `useDashboardTops.ts` | `orders` (select) | `['first-vs-repurchase', userId, month, year, isAdmin]` |
| `useEarnings` | `useDashboardTops.ts` | `commissions` (select) | `['earnings', userId, month, year, isAdmin]` |
| `useAdminSettings` | `useAdminSettings.ts` | `admin_settings` (select) | `['admin-settings']` |

### 11.2 Hooks Clave en Detalle

#### `useOrderDetail(orderId)` — La más compleja

```typescript
// 5 sub-queries paralelas via Promise.allSettled()
const [orderResult, itemsResult, productsResult, shipmentsResult, commissionsResult] =
  await Promise.allSettled([...])
```

- Resuelve UUID vs order_code (regex `8-4-4-4-12`)
- Sub-queries: `order_items`, `products`, `shipments`, `commissions` (con join a users), `cedis`/`direcciones`
- Graceful degradation: cada sub-query falla silenciosamente

#### `useStoreSections(novedadesMonths?)`

Ejecuta **4 queries en paralelo**:
1. Novedades: `products` donde `launched_at >= cutoff`
2. Recomendados: `products` donde `is_recommended = true`
3. Más pedidos: `order_items` join `orders` donde `status = 'paid'`
4. Categorías + todos los productos

#### `useHoldingTank(userId)`

Usa FK join sintáctico de Supabase:
```typescript
supabase.from('holding_tank').select(`
  member_id, sponsor_id, entered_at,
  member:users!holding_tank_member_id_fkey(user_id, name, email)
`)
```

Post-procesa: calcula `days_waiting` client-side.

### 11.3 Patrón de staleTime

| Tiempo | Dónde se usa |
|--------|--------------|
| 5 min (default global) | Perfiles, comisiones, productos, dashboard |
| 2 min | Órdenes, pedidos, carrito, holding tank |
| 10 min | Admin settings |
| 30 min | Volume audit (solo admin) |
| 60 s | VG Trend (Tier 3) |

### 11.4 Invalidación de Caché

**Patrón: flag `purchaseCompleted` + efecto**

1. CheckoutPage completa compra → limpia carrito (`clear()`)
2. Carrito persiste `purchaseCompleted = true`
3. Al regresar a `TiendaPage`:
   ```typescript
   useEffect(() => {
     if (purchaseCompleted) {
       invalidateCache()  // refresca whitelist + kit eligibility
       useCart.getState().resetPurchaseFlag()
     }
   }, [purchaseCompleted])
   ```

**`invalidateCache()`:**
```typescript
qc.invalidateQueries({ queryKey: ['products-whitelist', userId] })
qc.invalidateQueries({ queryKey: ['user-has-kit', userId] })
qc.invalidateQueries({ queryKey: ['kit-eligibility', userId] })
```

---

## 12. Stores de Estado (Zustand)

### 12.1 `cartStore.ts` — Carrito de Compras

```typescript
export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isKitMode: false,
      kitType: null,
      purchaseCompleted: false,
      add(product), remove(code),
      increment(code), decrement(code),
      clear(),
      validateCart(freshProducts),
      total(), totalPV(), totalCV(),
      markPurchaseCompleted(), resetPurchaseFlag(),
      setKitMode(isKit, kitType),
    }),
    { name: 'helix-cart' }
  )
)
```

**Persistencia:** localStorage bajo `helix-cart`.

**Reglas de negocio:**
- Kit limit: solo **1 kit por orden**
- Decrement-to-zero en kit mode → limpia todo
- `validateCart()` se llama al montar TiendaPage para refrescar precios/stock

### 12.2 `layoutStore.ts` — Sidebar y Navegación

```typescript
export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      negocioExpanded: false,
      tiendaExpanded: false,
      toggleSidebar, setSidebarCollapsed,
      toggleNegocio, setNegocioExpanded,
      toggleTienda, setTiendaExpanded,
    }),
    { name: 'helix-layout' }
  )
)
```

**Persistencia:** localStorage bajo `helix-layout`.

---

## 13. Rutas y Navegación

**Archivo:** `src/lib/router.tsx` — basado en **TanStack Router**.

### Árbol de Rutas (22 rutas)

```
Root (Outlet)
├── /login                          (LoginPage, público)
├── /registro/$username             (RegisterByLinkPage, público)
└── authenticated (DashboardLayout wrapper, requireAuth)
    ├── /                           → DashboardPage
    ├── /red                        → NegocioPage
    ├── /network                    → NetworkPage (árbol)
    ├── /ordenes                    → PedidosPage
    ├── /ordenes/$orderId           → OrdenDetailPage
    ├── /tienda                     → TiendaPage
    ├── /checkout                   → CheckoutPage
    ├── /tienda/metodos-pago        → PaymentMethodsPage
    ├── /tienda/direcciones         → AddressesPage
    ├── /register                   → RegisterPage (autenticado)
    ├── /admin                      → AdminPage (AdminGuard)
    ├── /admin/ordenes              → AdminOrdersPage (AdminGuard)
    ├── /pedidos → redirect to /ordenes
    ├── /simulador                  → SimuladorPage
    ├── /viaje                      → HerramientasPage
    ├── /herramientas → redirect to /viaje
    ├── /retiros                    → RetirosPage
    ├── /billetera                  → BilleteraPage
    ├── /comisiones                 → ComisionesNivelPage
    ├── /ganancias                  → GananciasPage
    ├── /ganancias/$bonoType        → BonoDetail
    ├── /historial-volumen          → HistorialVolumenPage
    └── /inscripciones              → HoldingTankPage
```

### Auth Guard

```typescript
async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw redirect({ to: '/login' })
}

async function requireGuest() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) throw redirect({ to: '/' })
}
```

### Layout Anidado

```typescript
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: requireAuth,
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
})
```

---

## 14. Flujo de Compra Completo

```
TiendaPage                   CheckoutPage                  Supabase
   |                            |                            |
   |— add to cart ────────────> |                            |
   |  (useCart.add)             |                            |
   |                            |— review items              |
   |                            |— select shipping           |
   |                            |— select payment            |
   |                            |— confirm ────────────────> |
   |                            |  supabase.rpc(             |
   |                            |    'place_order_with_      |
   |                            |     membership', payload) ──>|
   |                            |                            |— Transacción ACID
   |                            |                            |   • Valida wallet
   |                            |                            |   • Crea orden
   |                            |                            |   • Crea items
   |                            |                            |   • Descuenta wallet
   |                            |                            |   • Upgrade membresía
   |                            |<── orderResult ─────────── |
   |                            |— clear() cart              |
   |                            |— set purchaseCompleted     |
   |                            |— navigate(/ordenes)        |
   |                            |                            |
   |<── navigate(/tienda)       |                            |
   |— purchaseCompleted →       |                            |
   |   invalidateCache()        |                            |
   |   resetPurchaseFlag()      |                            |
```

### CheckoutPage: 3 Pasos

| Paso | Descripción |
|------|-------------|
| `review` | Resumen de items, subtotal, impuestos, total |
| `payment` | Selección: Wallet vs Tarjeta (card = próximamente) |
| `confirm` | Post-pago: CheckCircle2 + order_code + botones |

### Shipping Options

| Opción | Descripción |
|--------|-------------|
| `nueva` | Abre `NuevaDireccionSheet` → guarda → selecciona |
| `default` | Usa `useDefaultDireccion()`, botón "Cambiar" |
| `cedi` | Abre `CediSelectorSheet`, guarda `selectedCedi` |

---

## 15. Ranks System

**Archivo:** `src/lib/ranks.ts` — Single Source of Truth.

### `RANK_ORDER` (12 ranks)

```typescript
['Socio', 'Ejecutivo', 'Bronce', 'Plata', 'Oro', 'Platino',
 'Diamante', 'Doble Diamante', 'Triple Diamante',
 'Diamante Embajador', 'Doble Diamante Embajador', 'Triple Diamante Embajador']
```

### `RANK_REQUIREMENTS`

| Rango | PV | VG | Longest Leg | Rest Legs |
|-------|-----|-----|-------------|-----------|
| Socio | 0 | — | — | — |
| Ejecutivo | 100 | — | — | — |
| Bronce | 100 | 1,000 | — | — |
| Plata | 100 | 3,000 | 1,800 | 1,200 |
| Oro | 100 | 5,000 | 3,000 | 2,000 |
| Platino | 100 | 10,000 | 6,000 | 4,000 |
| Diamante | 100 | 25,000 | 15,000 | 10,000 |
| Doble Diamante | 100 | 50,000 | 30,000 | 20,000 |
| Triple Diamante | 100 | 100,000 | 60,000 | 40,000 |
| Diamante Embajador | 100 | 250,000 | 150,000 | 100,000 |
| Doble Diamante Embajador | 100 | 500,000 | 300,000 | 200,000 |
| Triple Diamante Embajador | 100 | 1,000,000 | 600,000 | 400,000 |

### `RANK_COLORS`

```typescript
Socio: '#9CA3AF' | Ejecutivo: '#6B7280' | Bronce: '#CD7F32'
Plata: '#C0C0C0' | Oro: '#FFD700' | Platino: '#E5E4E2'
Diamante: '#00BFFF' | Doble Diamante: '#4169E1' | Triple Diamante: '#6A0DAD'
Diamante Embajador: '#8B0000' | Doble Diamante Embajador: '#DC143C' | Triple Diamante Embajador: '#FFD700'
```

### Helpers

| Función | Descripción |
|---------|-------------|
| `getNextRank(current)` | Próximo rango en progresión, o `null` si es el máximo |
| `getTier(rank)` | 1 = Socio-Ejecutivo-Bronce-Plata, 2 = Oro-Platino-Diamante, 3 = Doble Diamante+ |

### Uso en la App

- **Dashboard:** `getTier(rank)` decide qué Tier renderizar (T1/T2/T3)
- **Árbol:** `RANK_COLORS` colorea nodos en NetworkNode, OrgChartTree
- **Simulador:** `RANK_REQUIREMENTS` para proyecciones
- **Imágenes:** `RANK_IMAGES` asigna rutas SVG/PNG a cada rango

---

## Resumen de Patrones Arquitectónicos

| Patrón | Descripción |
|--------|-------------|
| **useQuery + staleTime** | Estándar para toda data fetching. Default 5 min. |
| **Query keys correlacionadas** | `['profile', userId]`, `['pedidos', userId, filter, isAdmin]` |
| **Admin amplification** | Misma query key + `isAdmin` cambia scope de la query |
| **FK joins sintácticos** | `users!holding_tank_member_id_fkey(user_id, name, email)` |
| **Promise.allSettled** | Queries paralelas con graceful degradation |
| **RPC para lógica compleja** | `get_network_orders`, `get_comisiones_nivel_all`, `get_user_dashboard` |
| **Zustand persist** | Carrito y layout sobreviven a refrescos |
| **Auth guard en router** | `beforeLoad: requireAuth` con throw `redirect` |
| **Compra → flag → invalidación** | `purchaseCompleted` flag → efecto → invalida queries |
| **Lazy loading** | `useSociosNivel` con `enabled: level !== null` |
| **Single Source of Truth** | `src/lib/ranks.ts` — todos los componentes importan de ahí |
| **Comisiones duales** | Instantáneas (trigger) + Batch (pg_cron mensual) |

---

> **Documento generado el 10/Mayo/2026** — basado en código fuente, base de datos Supabase, migraciones SQL y documentación del plan de compensación ONANO.
> 
> **Autores:** Jazmin (Backend Architect) + Adrián (Full-Stack Developer) — ATLAS/ONANO
