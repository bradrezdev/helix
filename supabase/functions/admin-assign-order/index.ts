import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssignRequest {
  mode: "single" | "network" | "all";
  type: "kit" | "repurchase";
  user_id?: string;
  quantity: number;
  dry_run: boolean;
}

const STARTERKIT_CODE = "STARTERKIT";
const REPURCHASE_CODE = "O5MAX";

// Count network size (via sponsor_id — Fix C: use sponsor tree not placement tree)
async function getSponsorNetworkIds(
  supabase: ReturnType<typeof createClient>,
  rootUserId: string,
): Promise<{ id: string; user_id: number; name: string }[]> {
  // Get root user's numeric ID first (sponsor_id is BIGINT, referencing user_id)
  const { data: rootUser, error: rootErr } = await supabase
    .from("users")
    .select("user_id, name")
    .eq("id", rootUserId)
    .single();
  if (rootErr || !rootUser) throw new Error(`Root user not found: ${rootErr?.message ?? "unknown"}`);

  // Recursive CTE via sponsor_id
  const { data, error } = await supabase.rpc("get_sponsor_downline_ids", {
    p_root_user_id: rootUser.user_id,
  });
  if (error) throw new Error(`Failed to get sponsor downline: ${error.message}`);
  return [rootUser, ...(data as { id: string; user_id: number; name: string }[])];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verify admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { data: caller } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!caller?.is_admin) throw new Error("Forbidden: admin only");

    const body: AssignRequest = await req.json();
    const { mode, type, user_id, quantity, dry_run } = body;

    if (!quantity || quantity < 1) throw new Error("quantity must be >= 1");
    if (mode !== "all" && !user_id) throw new Error("user_id required for single/network mode");

    const productCode = type === "kit" ? STARTERKIT_CODE : REPURCHASE_CODE;
    const isKit = type === "kit";

    // Get target users based on mode
    let targetUsers: { id: string; user_id: number; name: string }[] = [];

    if (mode === "single" && user_id) {
      const { data: u, error: uErr } = await supabaseAdmin
        .from("users")
        .select("id, user_id, name")
        .eq("id", user_id)
        .single();
      if (uErr || !u) throw new Error("User not found");
      targetUsers = [u];
    } else if (mode === "network" && user_id) {
      // Fix C: use sponsor downline (sponsor_id) — NOT unilevel_parent_id
      targetUsers = await getSponsorNetworkIds(supabaseAdmin, user_id);
    } else if (mode === "all") {
      const { data: allUsers, error: allErr } = await supabaseAdmin
        .from("users")
        .select("id, user_id, name")
        .limit(10000);
      if (allErr) throw new Error("Failed to fetch users");
      targetUsers = allUsers ?? [];
    }

    // Get product info for the chosen product
    const { data: product, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, code, pv, cv, price_mxn")
      .eq("code", productCode)
      .single();
    if (prodErr || !product) throw new Error(`Product ${productCode} not found`);

    const ordersToCreate = targetUsers.flatMap((u) =>
      Array.from({ length: quantity }, () => ({
        user_id: u.id,
        user_num_id: u.user_id,
        product_id: product.id,
        product_code: product.code,
        unit_price: product.price_mxn,
        pv: product.pv,
        cv: product.cv,
        is_kit: isKit,
        price_type: isKit ? null : "socio",
      }))
    );

    if (dry_run) {
      return new Response(JSON.stringify({
        users_count: targetUsers.length,
        total_pv: ordersToCreate.reduce((s, o) => s + Number(o.pv), 0),
        total_amount: ordersToCreate.reduce((s, o) => s + Number(o.unit_price), 0),
        dry_run: true,
        type,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create orders — insert each order + order_items in a loop
    let createdCount = 0;
    for (const o of ordersToCreate) {
      // Insert order
      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: o.user_id,
          total_pv: o.pv,
          total_cv: o.cv,
          total_amount: o.unit_price,
          currency: "MXN",
          status: "pending",
          is_kit: o.is_kit,
          price_type: o.price_type,
          shipping_data: { type: "domicilio" },
          payment_method: "admin_set",
        })
        .select("id, total_pv, total_amount")
        .single();
      if (orderErr) {
        console.error(`Failed to create order for user ${o.user_num_id}: ${orderErr.message}`);
        continue;
      }

      // Insert order item
      const { error: itemErr } = await supabaseAdmin
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: o.product_id,
          product_code: o.product_code,
          quantity: 1,
          unit_price: o.unit_price,
          total_amount: o.unit_price,
          pv: o.pv,
          cv: o.cv,
        });
      if (itemErr) {
        console.error(`Failed to create order_item for order ${order.id}: ${itemErr.message}`);
        continue;
      }

      createdCount++;
    }

    return new Response(JSON.stringify({
      users_count: targetUsers.length,
      orders_created: createdCount,
      total_pv: ordersToCreate.reduce((s, o) => s + Number(o.pv), 0),
      total_amount: ordersToCreate.reduce((s, o) => s + Number(o.unit_price), 0),
      type,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
