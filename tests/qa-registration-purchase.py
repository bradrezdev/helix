#!/usr/bin/env python3
"""
QA Test v4: Registro + Compra — Helix / ONANO Global
Giovann (QA Engineer)

v4 fix: No page.goto after KitBuilderSheet — CartSheet is already visible.
Use force_click for all bottom-sheet buttons (BottomNav z-index conflict).
"""
import os, sys, json, time, re, random, string, traceback
from datetime import datetime
from supabase import create_client
import requests as http

SUPABASE_URL = "https://elqonjnniophqdnwhtbo.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVscW9uam5uaW9waHFkbndodGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzODkxNzksImV4cCI6MjA5MTk2NTE3OX0.s-GAgS7INgaIMiZF-vbTh0kPiIRJGXReiHCfVz9KtuE"
ADMIN_EMAIL = "admin@onano.com"
ADMIN_PWD = "Onano1234$"
BASE_URL = "http://localhost:5173"
SPONSOR_ID = "11384"
HEADLESS = True

results = []
screenshots = []

def report(name, status, detail=""):
    results.append({"test": name, "status": status, "detail": detail[:300]})
    icons = {"PASS":"✅","FAIL":"❌","WARN":"⚠️","INFO":"ℹ️","SKIP":"⏭️"}
    print(f"  {icons.get(status,'❓')} {name}: {detail[:200]}")

def shot(page, name):
    path = f"/tmp/qa-{name}.png"
    page.screenshot(path=path, full_page=True)
    screenshots.append(path)
    print(f"  📸 {name}")
    return path

def rand(): return ''.join(random.choices(string.ascii_lowercase, k=6))

# ── Admin session ──
def init_admin():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    sb.auth.sign_in_with_password({"email": ADMIN_EMAIL, "password": ADMIN_PWD})
    t = sb.auth.get_session().access_token
    print(f"  ✓ Admin: {ADMIN_EMAIL}")
    return {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {t}"}

AH = init_admin()

def get_user(email):
    r = http.get(f"{SUPABASE_URL}/rest/v1/users", headers=AH,
        params={"email": f"eq.{email}", "select": "id,user_id,email,membership,link_referido,kit_type"})
    return r.json()[0] if r.ok and len(r.json()) > 0 else None

def get_orders(uid):
    r = http.get(f"{SUPABASE_URL}/rest/v1/orders", headers=AH,
        params={"user_id": f"eq.{uid}", "select": "id,order_code,status,total_amount,is_kit,created_at",
                "order": "created_at.desc"})
    return r.json() if r.ok else []

def get_order_items(oid):
    r = http.get(f"{SUPABASE_URL}/rest/v1/order_items", headers=AH,
        params={"order_id": f"eq.{oid}", "select": "product_code,product_name,quantity,unit_price,pv,cv"})
    return r.json() if r.ok else []

def fund_wallet(uid, amt=10000):
    r = http.get(f"{SUPABASE_URL}/rest/v1/wallets", headers=AH,
        params={"user_id": f"eq.{uid}", "select": "id", "limit": "1"})
    if r.ok and r.json():
        wid = r.json()[0]["id"]
        return http.patch(f"{SUPABASE_URL}/rest/v1/wallets?id=eq.{wid}", headers=AH,
            json={"balance": amt}).ok
    return False

# ── Helper: force click (bypass BottomNav intercept) ──
def fc(page, selector, timeout=8000):
    try:
        page.locator(selector).wait_for(state="visible", timeout=timeout)
        page.locator(selector).click(force=True, timeout=timeout)
        return True
    except:
        return False

def wait_url(page, pattern, timeout=15000):
    try:
        page.wait_for_url(f"**{pattern}**", timeout=timeout)
        return True
    except:
        return False

# ── Register helper ──
def register(page, first, last, email, uname, pwd, membership):
    page.goto(f"{BASE_URL}/register?sponsor={SPONSOR_ID}")
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    page.fill('input[placeholder="Juan"]', first)
    page.fill('input[placeholder*="Pérez"]', last)
    page.locator("select").select_option("Masculino")
    page.fill('input[type="tel"]', "5512345678")
    page.locator('input[placeholder="juanperez123"]').fill(uname)
    page.fill('input[type="email"]', email)
    pw = page.locator('input[type="password"]')
    pw.nth(0).fill(pwd); pw.nth(1).fill(pwd)
    if membership == "cliente_preferente":
        page.locator('button:has-text("Cliente Preferente")').click()
        time.sleep(0.3)
    page.locator("div.flex.items-start.gap-3 button").first.click()
    time.sleep(0.3)
    page.locator('button[type="submit"]').click()
    ok = wait_url(page, "/tienda", 20000)
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    return ok

# ── Add membership via KitBuilderSheet ──
def add_membership_to_cart(page):
    """Click first 'Ver kit', confirm in KitBuilderSheet. CartSheet opens after."""
    vk = page.locator('button:has-text("Ver kit")')
    if vk.count() == 0:
        return "no_ver_kit"
    vk.first.click()
    time.sleep(2)
    if page.locator("text=Arma tu kit").count() == 0:
        return "no_sheet"
    # Scroll to see confirm button
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    time.sleep(0.5)
    if fc(page, 'button:has-text("Confirmar kit")'):
        time.sleep(1.5)
        # CartSheet should be visible now
        return "ok"
    return "confirm_failed"

# ═══════════════════════════════════════════════════════════════════════
# SUITE A: Socio — Sin kit
# ═══════════════════════════════════════════════════════════════════════

def suite_a(browser):
    print("\n" + "="*60 + "\nSUITE A: Socio — Sin kit\n" + "="*60)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="es-MX")
    page = ctx.new_page()
    suf = rand()
    email = f"qa.test.a.{suf}@correo.com"
    uname = f"qatestas{suf}"
    pwd = "Test1234$"

    # A1
    report("A1: Register", "PASS" if register(page,"QA A NoKit","Test",email,uname,pwd,"socio") else "FAIL")
    # A2
    time.sleep(2); u = get_user(email)
    if u:
        report("A2: socio_pendiente", "PASS" if u["membership"]=="socio_pendiente" else "FAIL",
               f"mem={u['membership']}")
        report("A2: link=NULL", "PASS" if u.get("link_referido") is None else "FAIL",
               f"link={u.get('link_referido')}")
    else:
        report("A2: user found", "FAIL", "Not found")
    # A3: Banner
    report("A3: Banner", "PASS" if page.locator("text=Ya casi eres Socio").count()>0 else "FAIL")
    shot(page, "a02-banner")

    # A4: Add membership to cart
    print("\n--- A4: Add membership ---")
    res = add_membership_to_cart(page)
    report("A4: Add membership", "PASS" if res=="ok" else "FAIL",
           {"ok":"Via KitBuilderSheet → CartSheet open",
            "no_ver_kit":"No 'Ver kit' button",
            "no_sheet":"KitBuilderSheet didn't open",
            "confirm_failed":"Confirm button click failed"}[res])
    if res != "ok":
        shot(page, f"a04-{res}")

    # A5: Cart is already open — click "Ir a pagar"
    print("\n--- A5: Cart → Ir a pagar ---")
    if fc(page, 'button:has-text("Ir a pagar")'):
        time.sleep(1)
        report("A5: Ir a pagar", "PASS", "Clicked in CartSheet")

        # A6: Check upsell
        if page.locator("text=¿Quieres añadir un Paquete de Inicio?").count() > 0:
            report("A6: Upsell dialog", "PASS", "Visible")
            shot(page, "a03-alert-dialog")

            # A7: Continuar sin kit
            if fc(page, 'button:has-text("Continuar sin kit")'):
                time.sleep(1)
                report("A7: Continuar sin kit", "PASS", "Clicked → checkout")
        else:
            report("A6: Upsell dialog", "FAIL",
                   "Not shown (BUG: MEMBRESIA-SOCIO is_kit=true → hasKitProduct=true → blocks upsell)")
            report("A7: Continuar sin kit", "SKIP", "No upsell")
            shot(page, "a06-noupsell")
    else:
        report("A5: Ir a pagar", "FAIL", "Button not found in CartSheet")
        # Page structure debug
        shot(page, "a05-debug")

    # A8-A9: Checkout
    print("\n--- A8-A9: Checkout ---")
    if "/checkout" not in page.url:
        page.goto(f"{BASE_URL}/checkout")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
    shot(page, "a04-checkout")

    try:
        # Select CEDI
        if page.locator("text=Recoger en CEDI").count() > 0:
            page.locator("text=Recoger en CEDI").click(force=True)
            time.sleep(0.5)
            # Find and click CEDI selector
            for btn_text in ["Seleccionar CEDI", "Seleccionar", "Elegir CEDI"]:
                if page.locator(f'button:has-text("{btn_text}")').count() > 0:
                    page.locator(f'button:has-text("{btn_text}")').first.click(force=True)
                    time.sleep(0.5)
                    break
            # Click first CEDI option
            cedi_opts = page.locator("text=CEDI Monterrey, text=CEDI Colima")
            if cedi_opts.count() > 0:
                cedi_opts.first.click(force=True)
                time.sleep(0.5)

        time.sleep(1)
        # Confirm payment
        if fc(page, 'button:has-text("Confirmar y pagar")'):
            time.sleep(3)
            if page.locator("text=¡Orden confirmada!").count() > 0:
                report("A9: Purchase", "PASS", "Order confirmed!")
                shot(page, "a09-success")
            elif page.locator("text=Saldo insuficiente").count() > 0:
                report("A9: Purchase", "FAIL", "Insufficient wallet balance")
                shot(page, "a09-insufficient")
            else:
                report("A9: Purchase", "WARN", "Check screenshot")
                shot(page, "a09-unknown")
        else:
            report("A9: Purchase", "FAIL", "No confirm button")
            shot(page, "a09-noconfirm")
    except Exception as e:
        report("A8-A9: Checkout", "FAIL", str(e)[:200])

    # A10: SQL post
    print("\n--- A10: Post-purchase SQL ---")
    time.sleep(3); u2 = get_user(email)
    if u2:
        report("A10: membership=socio", "PASS" if u2["membership"]=="socio" else "FAIL",
               f"mem={u2['membership']}")
        report("A10: link_referido", "PASS" if u2.get("link_referido") else "FAIL",
               "SET" if u2.get("link_referido") else "NULL")
        ords = get_orders(u2["id"])
        report("A10: orders", "PASS" if len(ords)>0 else "FAIL", f"{len(ords)} order(s)")
        for o in ords:
            print(f"    #{o['order_code']}: {o['status']} ${o['total_amount']}")
            for it in get_order_items(o["id"]):
                print(f"      {it['product_name']} x{it['quantity']} ${it['unit_price']}")
    else:
        report("A10: user found", "FAIL", "Not found")

    print(f"\n✅ Suite A: {email}")
    ctx.close()
    return email

# ═══════════════════════════════════════════════════════════════════════
# SUITE B: Socio + Kit (aceptar upsell)
# ═══════════════════════════════════════════════════════════════════════

def suite_b(browser):
    print("\n" + "="*60 + "\nSUITE B: Socio + Kit\n" + "="*60)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="es-MX")
    page = ctx.new_page()
    suf = rand()
    email = f"qa.test.b.{suf}@correo.com"
    uname = f"qatestbs{suf}"
    pwd = "Test1234$"

    report("B1: Register", "PASS" if register(page,"QA B Kit","Test",email,uname,pwd,"socio") else "FAIL")
    u = get_user(email)
    report("B1: SQL", "PASS" if u else "FAIL", f"mem={u.get('membership','?') if u else 'N/A'}")

    res = add_membership_to_cart(page)
    report("B2: Add membership", "PASS" if res=="ok" else "FAIL",
           {"ok":"In cart","no_ver_kit":"No kit button","no_sheet":"No sheet","confirm_failed":"Click fail"}[res])

    # CartSheet is open — click "Ir a pagar"
    print("\n--- B3-B7: Upsell flow ---")
    if fc(page, 'button:has-text("Ir a pagar")'):
        time.sleep(1)
        upsell = page.locator("text=¿Quieres añadir un Paquete de Inicio?")
        if upsell.count() > 0:
            report("B3-B4: Upsell", "PASS", "Dialog visible")
            shot(page, "b03-upsell")

            if fc(page, 'button:has-text("Añadir Paquete de Inicio")'):
                time.sleep(1.5)
                report("B5: Añadir kit", "PASS", "Clicked")
                shot(page, "b01-kit-view")

                # Select kit
                try:
                    page.wait_for_selector("text=Selecciona tu Paquete de Inicio", timeout=5000)
                    vk2 = page.locator('button:has-text("Ver kit")')
                    if vk2.count() > 0:
                        vk2.first.click()
                        time.sleep(2)
                        if page.locator("text=Arma tu kit").count() > 0:
                            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                            time.sleep(0.5)
                            confirm2 = page.locator('button:has-text("Confirmar kit")')
                            added = 0
                            while confirm2.is_disabled() and added < 20:
                                plus = page.locator('button:has(svg.lucide-plus)')
                                if plus.count() > 0:
                                    fc(page, 'button:has(svg.lucide-plus)')
                                    time.sleep(0.3)
                                    added += 1
                                else: break
                            if fc(page, 'button:has-text("Confirmar kit")'):
                                time.sleep(1)
                                report("B6-B7: Build kit", "PASS", f"Built with {added} items")
                            else:
                                report("B6-B7: Build kit", "FAIL", "Confirm failed")
                                shot(page, "b07-fail")
                        else:
                            report("B6-B7: Build kit", "FAIL", "No KitBuilderSheet for kit")
                            shot(page, "b07-nosheet")
                    else:
                        report("B6-B7: Build kit", "FAIL", "No 'Ver kit' in selection")
                        shot(page, "b07-nokit")
                except Exception as e:
                    report("B6-B7: Build kit", "FAIL", str(e)[:200])
        else:
            report("B3-B4: Upsell", "FAIL",
                   "Not shown (BUG: is_kit=true on membership blocks upsell condition)")
            report("B5-B7: Kit flow", "SKIP", "No upsell")
            shot(page, "b04-noupsell")
    else:
        report("B3-B4: Upsell", "FAIL", "Ir a pagar not found")
        shot(page, "b04-nopay")

    print(f"\n✅ Suite B: {email}")
    ctx.close()
    return email

# ═══════════════════════════════════════════════════════════════════════
# SUITE C: Cliente Preferente
# ═══════════════════════════════════════════════════════════════════════

def suite_c(browser):
    print("\n" + "="*60 + "\nSUITE C: Cliente Preferente\n" + "="*60)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="es-MX")
    page = ctx.new_page()
    suf = rand()
    email = f"qa.test.c.{suf}@correo.com"
    uname = f"qatestcs{suf}"
    pwd = "Test1234$"

    report("C1: Register CP", "PASS" if register(page,"QA C CP","Test",email,uname,pwd,"cliente_preferente") else "FAIL")
    time.sleep(2); u = get_user(email)
    if u:
        report("C2: cliente_preferente", "PASS" if u["membership"]=="cliente_preferente" else "FAIL",
               f"mem={u['membership']}")
        report("C2: link=NULL", "PASS" if u.get("link_referido") is None else "FAIL")
    else:
        report("C2: user found", "FAIL", "Not found")

    # C3: For new CP without kit → KitListView (no "Hazte Socio" card)
    page.goto(f"{BASE_URL}/tienda")
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    hs = page.locator("text=Hazte Socio").count()
    report("C3: 'Hazte Socio' card",
           "PASS" if hs > 0 else "FAIL",
           "Visible" if hs > 0 else
           "Not shown (CP without kit sees KitListView — expected; kit purchase needed first)")
    shot(page, "c03-tienda")

    # C4: Buy starter kit as CP → then check for "Hazte Socio"
    print("\n--- C4: Buy kit as CP ---")
    res = add_membership_to_cart(page)  # This adds first kit (MEMBRESIA-SOCIO or STARTERKIT)
    report("C4: Add kit", "PASS" if res=="ok" else "FAIL",
           {"ok":"Added","no_ver_kit":"No kit","no_sheet":"No sheet","confirm_failed":"Fail"}[res])

    # Cart is open, fund wallet and go to checkout
    if u and res == "ok":
        # Wait for CartSheet, click Ir a pagar
        if fc(page, 'button:has-text("Ir a pagar")'):
            time.sleep(1)
            # Upsell won't show for CP (not membership purchase), navigate to checkout
            if "/checkout" not in page.url:
                if fc(page, 'button:has-text("Continuar sin kit")'):
                    time.sleep(1)
            # Should be at checkout now
            print(f"  URL: {page.url}")
            if "/checkout" not in page.url:
                page.goto(f"{BASE_URL}/checkout")
                page.wait_for_load_state("networkidle")
                time.sleep(1)

            # Fund wallet
            funded = fund_wallet(u["id"], 10000)
            report("C4: Fund wallet", "PASS" if funded else "FAIL")

            # Select CEDI + confirm
            if page.locator("text=Recoger en CEDI").count() > 0:
                page.locator("text=Recoger en CEDI").click(force=True)
                time.sleep(0.5)
                for bt in ["Seleccionar CEDI", "Seleccionar"]:
                    if page.locator(f'button:has-text("{bt}")').count() > 0:
                        page.locator(f'button:has-text("{bt}")').first.click(force=True)
                        time.sleep(0.5)
                        break
                ci = page.locator("text=CEDI Monterrey")
                if ci.count() > 0:
                    ci.first.click(force=True)
                    time.sleep(0.5)

            time.sleep(1)
            if fc(page, 'button:has-text("Confirmar y pagar")'):
                time.sleep(3)
                if page.locator("text=¡Orden confirmada!").count() > 0:
                    report("C4: Kit purchase", "PASS", "Confirmed!")
                    shot(page, "c04-kit-bought")

                    # Now CP has hasKit=true — check for "Hazte Socio" on tienda reload
                    time.sleep(3)
                    page.goto(f"{BASE_URL}/tienda")
                    page.wait_for_load_state("networkidle")
                    time.sleep(2)
                    if page.locator("text=Hazte Socio").count() > 0:
                        report("C3b: 'Hazte Socio' after kit", "PASS",
                               "Now visible after kit purchase!")
                    else:
                        report("C3b: 'Hazte Socio' after kit", "FAIL",
                               "Still not visible after kit (BUG?)")
                        shot(page, "c04-no-membresia")
                else:
                    report("C4: Kit purchase", "FAIL", "Check screenshot")
                    shot(page, "c04-fail")
            else:
                report("C4: Confirm", "FAIL", "Button not found")
        else:
            report("C4: Ir a pagar", "FAIL", "Not in CartSheet")
    else:
        report("C4: Kit purchase", "SKIP" if not u else "FAIL",
               "No user data" if not u else "Cart add failed")

    # C5: Restricted pages
    print("\n--- C5: Access control ---")
    for path, name in [("/red","Red"),("/comisiones","Comisiones"),("/billetera","Billetera")]:
        page.goto(f"{BASE_URL}{path}")
        page.wait_for_load_state("networkidle")
        time.sleep(1)
        if page.url.rstrip("/") == BASE_URL:
            report(f"C5: {name} blocked", "PASS", "CP → /dashboard")
        elif path in page.url:
            report(f"C5: {name} blocked", "FAIL", f"CP accessed {path}!")
        else:
            report(f"C5: {name} blocked", "WARN", f"→ {page.url.replace(BASE_URL,'')}")

    # CP can access /ordenes
    page.goto(f"{BASE_URL}/ordenes")
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    report("C5: /ordenes allowed", "PASS" if "/ordenes" in page.url else "WARN",
           "OK" if "/ordenes" in page.url else page.url.replace(BASE_URL,''))

    print(f"\n✅ Suite C: {email}")
    ctx.close()
    return email

# ═══════════════════════════════════════════════════════════════════════
# SUITE D: CP + Membresía + Productos
# ═══════════════════════════════════════════════════════════════════════

def suite_d(browser):
    """CP buys kit first → full store → add membership + products → checkout → upgrade to socio."""
    print("\n" + "="*60 + "\nSUITE D: CP → Socio upgrade\n" + "="*60)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="es-MX")
    page = ctx.new_page()
    suf = rand()
    email = f"qa.test.d.{suf}@correo.com"
    uname = f"qatestds{suf}"
    pwd = "Test1234$"

    report("D1: Register CP", "PASS" if register(page,"QA D CP","Test",email,uname,pwd,"cliente_preferente") else "FAIL")
    u = get_user(email)
    if u: report("D1: SQL", "PASS", f"mem={u['membership']}")

    # Buy kit first (needed for full store access)
    res = add_membership_to_cart(page)
    if res == "ok" and u:
        fund_wallet(u["id"], 10000)
        if fc(page, 'button:has-text("Ir a pagar")'):
            time.sleep(1)
            # Might be upsell or direct checkout
            if page.locator("text=Continuar sin kit").count() > 0:
                fc(page, 'button:has-text("Continuar sin kit")')
                time.sleep(1)
            if "/checkout" not in page.url:
                page.goto(f"{BASE_URL}/checkout")
                page.wait_for_load_state("networkidle")
                time.sleep(1)

            # Select CEDI
            if page.locator("text=Recoger en CEDI").count() > 0:
                page.locator("text=Recoger en CEDI").click(force=True)
                time.sleep(0.5)
                for bt in ["Seleccionar CEDI", "Seleccionar"]:
                    if page.locator(f'button:has-text("{bt}")').count() > 0:
                        page.locator(f'button:has-text("{bt}")').first.click(force=True)
                        time.sleep(0.5); break
                ci = page.locator("text=CEDI Monterrey")
                if ci.count() > 0:
                    ci.first.click(force=True)
                    time.sleep(0.5)

            time.sleep(1)
            if fc(page, 'button:has-text("Confirmar y pagar")'):
                time.sleep(3)
                if page.locator("text=¡Orden confirmada!").count() > 0:
                    report("D1: Kit purchase", "PASS", "Kit bought, hasKit=true now")
                else:
                    report("D1: Kit purchase", "FAIL", "Check screenshot")
                    shot(page, "d01-kit-fail")
            else:
                report("D1: Kit purchase", "FAIL", "No confirm button")
        else:
            report("D1: Ir a pagar", "FAIL", "Not found")
    elif res != "ok":
        report("D1: Add kit", "FAIL", f"add result={res}")

    # Now full store should be visible with "Hazte Socio" card
    time.sleep(3)
    page.goto(f"{BASE_URL}/tienda")
    page.wait_for_load_state("networkidle")
    time.sleep(2)

    if page.locator("text=Hazte Socio").count() > 0:
        report("D2: 'Hazte Socio' visible", "PASS", "Card shown after kit purchase")

        # Click "Activar →" on the membership card
        if fc(page, 'button:has-text("Activar")'):
            time.sleep(2)
            # This opens KitBuilderSheet for MEMBRESIA-SOCIO
            if page.locator("text=Arma tu kit").count() > 0:
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                time.sleep(0.5)
                if fc(page, 'button:has-text("Confirmar kit")'):
                    time.sleep(1.5)
                    report("D2: Membership added", "PASS", "Via KitBuilderSheet")
                else:
                    report("D2: Membership added", "FAIL", "Confirm failed")
            else:
                report("D2: Membership added", "FAIL", "No KitBuilderSheet after activate")
                shot(page, "d02-activate-fail")

            # Cart is open, add individual products
            print("  (Individual products would be added in full test)")
        else:
            report("D2: Activate click", "FAIL", "Button not found")
    else:
        report("D2: 'Hazte Socio' visible", "FAIL", "Not shown (BUG or kit not purchased)")
        shot(page, "d02-no-membresia")

    print(f"\n✅ Suite D partial: {email}")
    ctx.close()
    return email

# ═══════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════

def main():
    from playwright.sync_api import sync_playwright

    print("="*60 + f"\nHELIX QA v4 — {datetime.now():%Y-%m-%d %H:%M:%S}\n" + "="*60)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=HEADLESS, slow_mo=100,
            args=["--disable-web-security"])

        suites = [("A", suite_a), ("B", suite_b), ("C", suite_c)]
        # Suite D requires wallet funding — uncomment if wallet-deposit available
        # suites.append(("D", suite_d))

        for name, func in suites:
            try:
                func(browser)
            except Exception as e:
                report(f"SUITE {name} FATAL", "FAIL", f"{type(e).__name__}: {str(e)[:300]}")
                traceback.print_exc()
        browser.close()

    # ── Summary ──
    print("\n\n" + "="*60 + "\nFINAL QA REPORT\n" + "="*60)
    ps = sum(1 for r in results if r["status"]=="PASS")
    fs = sum(1 for r in results if r["status"]=="FAIL")
    ws = sum(1 for r in results if r["status"]=="WARN")
    ss = sum(1 for r in results if r["status"]=="SKIP")
    for r in results:
        ic = {"PASS":"✅","FAIL":"❌","WARN":"⚠️","SKIP":"⏭️","INFO":"ℹ️"}.get(r["status"],"❓")
        print(f"  {ic} {r['test']}: {r['detail']}")
    print(f"\n📊 {ps} ✅ / {fs} ❌ / {ws} ⚠️ / {ss} ⏭️ = {len(results)}")
    print(f"📸 {len(screenshots)} screenshots")
    json.dump({"ts":datetime.now().isoformat(),"summary":{"pass":ps,"fail":fs,"warn":ws,"skip":ss,"total":len(results)},
               "results":results,"screenshots":screenshots},
              open("/tmp/qa-helix-report.json","w"),indent=2)
    print("📄 /tmp/qa-helix-report.json")

if __name__ == "__main__":
    main()
