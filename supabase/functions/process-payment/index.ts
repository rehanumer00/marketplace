import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-idempotency-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400) {
  return json({ error: message }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return err("Unauthorized", 401);

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !authUser) return err("Unauthorized", 401);
    const userId = authUser.id;

    // ── Parse body ──
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return err("Invalid JSON body"); }

    const { action, ...params } = body;
    if (!action || typeof action !== "string") return err("action is required");

    const admin = createClient(supabaseUrl, serviceKey);

    // ── Helper: write audit log ──
    async function audit(
      act: string, entityType: string, entityId: string | null,
      prev: Record<string, unknown> | null, next: Record<string, unknown> | null,
      meta: Record<string, unknown> = {}
    ) {
      await admin.rpc("write_audit_log", {
        _actor_id: userId,
        _actor_type: "user",
        _action: act,
        _entity_type: entityType,
        _entity_id: entityId,
        _previous_state: prev ? JSON.stringify(prev) : null,
        _new_state: next ? JSON.stringify(next) : null,
        _metadata: JSON.stringify(meta),
      }).catch((e: unknown) => console.error("Audit log error:", e));
    }

    // ── Idempotency ──
    const idempotencyKey = req.headers.get("x-idempotency-key");
    if (idempotencyKey) {
      await admin.rpc("cleanup_idempotency_keys").catch(() => {});
      const { data: existing } = await admin
        .from("idempotency_keys").select("result")
        .eq("key", idempotencyKey).maybeSingle();
      if (existing?.result) {
        console.log(`Idempotent replay for key=${idempotencyKey}`);
        return json(existing.result);
      }
    }

    let result: unknown;

    switch (action) {
      // ━━━━ PLACE ORDER ━━━━
      case "place_order": {
        const { website_id, title, description, target_url, anchor_text } = params as Record<string, string>;
        if (!website_id || !title) return err("website_id and title required");

        const { data: isBuyer } = await admin.rpc("has_role", { _user_id: userId, _role: "buyer" });
        if (!isBuyer) return err("Only buyers can place orders", 403);

        const { data: website } = await admin
          .from("websites").select("*")
          .eq("id", website_id).eq("status", "approved").single();
        if (!website) return err("Website not found or not approved", 404);
        if (website.publisher_id === userId) return err("Cannot order from your own website");
        if (website.price <= 0) return err("Website has invalid price");

        // Prevent duplicate active orders
        const { data: dup } = await admin
          .from("orders").select("id")
          .eq("buyer_id", userId).eq("website_id", website_id)
          .in("status", ["pending", "in_progress"]).limit(1);
        if (dup && dup.length > 0) return err("You already have an active order for this website");

        const { data: order, error: orderErr } = await admin
          .from("orders").insert({
            buyer_id: userId, website_id: website.id, publisher_id: website.publisher_id,
            title, description: description || null, target_url: target_url || null,
            anchor_text: anchor_text || null, price: website.price, status: "pending",
          }).select().single();
        if (orderErr) { console.error("Order insert:", orderErr); return err("Failed to create order", 500); }

        // Create escrow (unique index prevents double-escrow)
        const { error: escrowErr } = await admin.rpc("create_escrow", {
          _order_id: order.id, _buyer_id: userId,
          _publisher_id: website.publisher_id, _amount: website.price,
        });
        if (escrowErr) {
          console.error("Escrow error:", escrowErr);
          await admin.from("orders").delete().eq("id", order.id);
          return err("Escrow creation failed", 500);
        }

        await audit("place_order", "order", order.id, null,
          { status: "pending", price: website.price },
          { website_id, publisher_id: website.publisher_id });

        admin.from("notifications").insert({
          user_id: website.publisher_id, type: "order", title: "New Order Received",
          message: `New order "${title}" for ${website.domain} – $${website.price}`,
          link: "/publisher/orders",
        }).then(() => {});

        result = { order };
        break;
      }

      // ━━━━ ACCEPT ORDER ━━━━
      case "accept_order": {
        const { order_id } = params as Record<string, string>;
        if (!order_id) return err("order_id required");

        const { data: order } = await admin
          .from("orders").select("*")
          .eq("id", order_id).eq("publisher_id", userId).eq("status", "pending").single();
        if (!order) return err("Order not found or not pending", 404);

        const { error: upErr } = await admin
          .from("orders").update({ status: "in_progress" }).eq("id", order_id);
        if (upErr) return err(upErr.message, 500);

        await audit("accept_order", "order", order_id,
          { status: "pending" }, { status: "in_progress" });

        admin.from("notifications").insert({
          user_id: order.buyer_id, type: "order", title: "Order Accepted",
          message: `Your order "${order.title}" is now in progress.`,
          link: "/buyer/orders",
        }).then(() => {});

        result = { success: true };
        break;
      }

      // ━━━━ DELIVER ORDER ━━━━
      case "deliver_order": {
        const { order_id, proof_url, article_content } = params as Record<string, string>;
        if (!order_id) return err("order_id required");

        const { data: order } = await admin
          .from("orders").select("*")
          .eq("id", order_id).eq("publisher_id", userId)
          .in("status", ["in_progress", "revision"]).single();
        if (!order) return err("Order not found or not in progress/revision", 404);

        const autoApproveAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

        const { error: upErr } = await admin
          .from("orders").update({
            status: "delivered", delivered_at: new Date().toISOString(),
            auto_approve_at: autoApproveAt,
            proof_url: proof_url || order.proof_url || null,
            article_content: article_content || order.article_content || null,
          }).eq("id", order_id);
        if (upErr) return err(upErr.message, 500);

        await audit("deliver_order", "order", order_id,
          { status: order.status }, { status: "delivered", auto_approve_at: autoApproveAt },
          { has_proof: !!proof_url });

        admin.from("notifications").insert({
          user_id: order.buyer_id, type: "order", title: "Order Delivered",
          message: `Order "${order.title}" delivered. Review within 72h or auto-approved.`,
          link: "/buyer/orders",
        }).then(() => {});

        result = { success: true, auto_approve_at: autoApproveAt };
        break;
      }

      // ━━━━ COMPLETE ORDER (buyer approves) ━━━━
      case "complete_order": {
        const { order_id } = params as Record<string, string>;
        if (!order_id) return err("order_id required");

        const { data: order } = await admin
          .from("orders").select("*")
          .eq("id", order_id).eq("buyer_id", userId).eq("status", "delivered").single();
        if (!order) return err("Order not found or not in delivered status", 404);

        const { error: releaseErr } = await admin.rpc("release_escrow", { _order_id: order_id });
        if (releaseErr) { console.error("Release escrow:", releaseErr); return err(releaseErr.message, 500); }

        await audit("complete_order", "order", order_id,
          { status: "delivered" }, { status: "completed" },
          { price: order.price });

        admin.from("notifications").insert({
          user_id: order.publisher_id, type: "payment", title: "Payment Released",
          message: `Payment for "${order.title}" released to your wallet.`,
          link: "/publisher/earnings",
        }).then(() => {});

        result = { success: true };
        break;
      }

      // ━━━━ REQUEST REVISION ━━━━
      case "request_revision": {
        const { order_id, reason } = params as Record<string, string>;
        if (!order_id) return err("order_id required");

        const { data: order } = await admin
          .from("orders").select("*")
          .eq("id", order_id).eq("buyer_id", userId).eq("status", "delivered").single();
        if (!order) return err("Order not found or not delivered", 404);

        const { error: upErr } = await admin
          .from("orders").update({ status: "revision", auto_approve_at: null }).eq("id", order_id);
        if (upErr) return err(upErr.message, 500);

        await audit("request_revision", "order", order_id,
          { status: "delivered" }, { status: "revision" }, { reason });

        admin.from("notifications").insert({
          user_id: order.publisher_id, type: "order", title: "Revision Requested",
          message: `Revision requested for "${order.title}"${reason ? ': ' + reason : ''}`,
          link: "/publisher/orders",
        }).then(() => {});

        result = { success: true };
        break;
      }

      // ━━━━ CANCEL ORDER ━━━━
      case "cancel_order": {
        const { order_id } = params as Record<string, string>;
        if (!order_id) return err("order_id required");

        const { data: order } = await admin
          .from("orders").select("*")
          .eq("id", order_id).in("status", ["pending"]).single();
        if (!order) return err("Order not found or not cancellable", 404);
        if (order.publisher_id !== userId && order.buyer_id !== userId) return err("Not authorized", 403);

        const cancelReason = order.publisher_id === userId
          ? "Publisher declined order" : "Buyer cancelled order";

        const { error: refundErr } = await admin.rpc("refund_escrow", {
          _order_id: order_id, _reason: cancelReason,
        });
        if (refundErr) { console.error("Refund error:", refundErr); return err(refundErr.message, 500); }

        await audit("cancel_order", "order", order_id,
          { status: "pending" }, { status: "cancelled" }, { reason: cancelReason });

        const notifyId = order.publisher_id === userId ? order.buyer_id : order.publisher_id;
        admin.from("notifications").insert({
          user_id: notifyId, type: "order", title: "Order Cancelled",
          message: `Order "${order.title}" cancelled. ${cancelReason}. Payment refunded.`,
          link: order.publisher_id === userId ? "/buyer/orders" : "/publisher/orders",
        }).then(() => {});

        result = { success: true };
        break;
      }

      // ━━━━ DISPUTE ORDER ━━━━
      case "dispute_order": {
        const { order_id, reason } = params as Record<string, string>;
        if (!order_id || !reason) return err("order_id and reason required");

        const { data: order } = await admin
          .from("orders").select("*").eq("id", order_id).single();
        if (!order) return err("Order not found", 404);
        if (order.buyer_id !== userId && order.publisher_id !== userId) return err("Not authorized", 403);
        if (!["pending", "in_progress", "delivered", "revision"].includes(order.status)) {
          return err(`Cannot dispute order in "${order.status}" status`);
        }

        const { data: existingDispute } = await admin
          .from("disputes").select("id").eq("order_id", order_id).eq("status", "open").limit(1);
        if (existingDispute && existingDispute.length > 0) return err("Dispute already exists");

        const { error: dErr } = await admin.rpc("dispute_escrow", { _order_id: order_id });
        if (dErr) { console.error("Dispute escrow:", dErr); return err(dErr.message, 500); }

        const { error: insErr } = await admin.from("disputes").insert({
          order_id, initiated_by: userId, reason, status: "open",
        });
        if (insErr) { console.error("Dispute insert:", insErr); return err(insErr.message, 500); }

        await audit("dispute_order", "order", order_id,
          { status: order.status }, { status: "disputed" }, { reason });

        const otherParty = order.buyer_id === userId ? order.publisher_id : order.buyer_id;
        admin.from("notifications").insert({
          user_id: otherParty, type: "dispute", title: "Dispute Filed",
          message: `Dispute filed for "${order.title}": ${reason}`,
          link: order.buyer_id === userId ? "/publisher/orders" : "/buyer/orders",
        }).then(() => {});

        result = { success: true };
        break;
      }

      // ━━━━ RESOLVE DISPUTE (admin) ━━━━
      case "resolve_dispute": {
        const { dispute_id, resolution_type, resolution } = params as Record<string, string>;
        if (!dispute_id || !resolution_type) return err("dispute_id and resolution_type required");
        if (!["refund_buyer", "release_publisher"].includes(resolution_type)) return err("Invalid resolution_type");

        const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userId });
        if (!isAdmin) return err("Admin access required", 403);

        const { data: dispute } = await admin
          .from("disputes").select("*, orders(*)").eq("id", dispute_id).eq("status", "open").single();
        if (!dispute) return err("Open dispute not found", 404);

        if (resolution_type === "refund_buyer") {
          const { error } = await admin.rpc("refund_escrow", {
            _order_id: dispute.order_id, _reason: resolution || "Dispute resolved - refund",
          });
          if (error) return err(error.message, 500);
        } else {
          const { error } = await admin.rpc("release_escrow", { _order_id: dispute.order_id });
          if (error) return err(error.message, 500);
        }

        await admin.from("disputes").update({
          status: "resolved", resolution_type,
          resolution: resolution || `Resolved: ${resolution_type}`,
          resolved_at: new Date().toISOString(),
        }).eq("id", dispute_id);

        await audit("resolve_dispute", "dispute", dispute_id,
          { status: "open" }, { status: "resolved", resolution_type },
          { order_id: dispute.order_id });

        const order = dispute.orders as any;
        if (order) {
          admin.from("notifications").insert([
            { user_id: order.buyer_id, type: "dispute" as const, title: "Dispute Resolved",
              message: `Dispute for "${order.title}": ${resolution_type === "refund_buyer" ? "Refund issued" : "Payment released"}`,
              link: "/buyer/orders" },
            { user_id: order.publisher_id, type: "dispute" as const, title: "Dispute Resolved",
              message: `Dispute for "${order.title}": ${resolution_type === "release_publisher" ? "Payment released" : "Refund issued"}`,
              link: "/publisher/orders" },
          ]).then(() => {});
        }

        result = { success: true };
        break;
      }

      // ━━━━ APPROVE PAYOUT (admin) ━━━━
      case "approve_payout": {
        const { payout_id } = params as Record<string, string>;
        if (!payout_id) return err("payout_id required");

        const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userId });
        if (!isAdmin) return err("Admin access required", 403);

        const { data: payout } = await admin
          .from("payouts").select("*").eq("id", payout_id).eq("status", "pending").single();
        if (!payout) return err("Pending payout not found", 404);

        const { error: upErr } = await admin
          .from("payouts").update({ status: "approved" }).eq("id", payout_id).eq("status", "pending");
        if (upErr) return err(upErr.message, 500);

        const { error: debitErr } = await admin.rpc("process_payout_debit", { _payout_id: payout_id });
        if (debitErr) {
          console.error("Payout debit error:", debitErr);
          // Revert on failure (transition validation allows approved → pending)
          await admin.from("payouts").update({ status: "pending" }).eq("id", payout_id);
          return err(debitErr.message, 500);
        }

        await audit("approve_payout", "payout", payout_id,
          { status: "pending" }, { status: "paid" },
          { amount: payout.amount, publisher_id: payout.publisher_id });

        admin.from("notifications").insert({
          user_id: payout.publisher_id, type: "payment", title: "Payout Approved",
          message: `Your payout of $${payout.amount} has been processed.`,
          link: "/publisher/earnings",
        }).then(() => {});

        result = { success: true };
        break;
      }

      // ━━━━ REJECT PAYOUT (admin) ━━━━
      case "reject_payout": {
        const { payout_id, notes } = params as Record<string, string>;
        if (!payout_id) return err("payout_id required");

        const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userId });
        if (!isAdmin) return err("Admin access required", 403);

        const { data: payout } = await admin
          .from("payouts").select("*").eq("id", payout_id).eq("status", "pending").single();
        if (!payout) return err("Pending payout not found", 404);

        await admin.from("payouts").update({
          status: "rejected", notes: notes || "Rejected by admin",
        }).eq("id", payout_id);

        await audit("reject_payout", "payout", payout_id,
          { status: "pending" }, { status: "rejected" },
          { amount: payout.amount, notes });

        admin.from("notifications").insert({
          user_id: payout.publisher_id, type: "payment", title: "Payout Rejected",
          message: `Your payout of $${payout.amount} was rejected. ${notes || ''}`,
          link: "/publisher/earnings",
        }).then(() => {});

        result = { success: true };
        break;
      }

      // ━━━━ AUTO-APPROVE EXPIRED DELIVERIES ━━━━
      case "auto_approve_expired": {
        // Can be called by admin or system cron
        const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userId });
        if (!isAdmin) return err("Admin access required", 403);

        const { data: expiredOrders } = await admin
          .from("orders").select("id, title, publisher_id, buyer_id, proof_url, delivered_at")
          .eq("status", "delivered")
          .lt("auto_approve_at", new Date().toISOString())
          .not("auto_approve_at", "is", null);

        if (!expiredOrders || expiredOrders.length === 0) {
          result = { auto_approved: 0 };
          break;
        }

        let approved = 0;
        const skipped: string[] = [];

        for (const order of expiredOrders) {
          // Validate delivery proof exists before auto-approving
          if (!order.proof_url && !order.delivered_at) {
            skipped.push(order.id);
            await audit("auto_approve_skipped", "order", order.id,
              null, null, { reason: "missing_proof_or_delivery_date" });
            continue;
          }

          const { error } = await admin.rpc("release_escrow", { _order_id: order.id });
          if (!error) {
            approved++;
            await audit("auto_approve", "order", order.id,
              { status: "delivered" }, { status: "completed" },
              { trigger: "72h_timeout" });

            admin.from("notifications").insert([
              { user_id: order.buyer_id, type: "order" as const, title: "Order Auto-Approved",
                message: `Order "${order.title}" auto-approved after 72 hours.`, link: "/buyer/orders" },
              { user_id: order.publisher_id, type: "payment" as const, title: "Payment Released",
                message: `Payment for "${order.title}" auto-released.`, link: "/publisher/earnings" },
            ]).then(() => {});
          } else {
            console.error(`Auto-approve failed for ${order.id}:`, error);
            await audit("auto_approve_failed", "order", order.id,
              null, null, { error: error.message });
          }
        }

        result = { auto_approved: approved, skipped: skipped.length };
        break;
      }

      // ━━━━ RECONCILIATION (admin) ━━━━
      case "run_reconciliation": {
        const { data: isAdmin } = await admin.rpc("is_admin", { _user_id: userId });
        if (!isAdmin) return err("Admin access required", 403);

        const { data: reconcResult, error: recErr } = await admin.rpc("run_reconciliation");
        if (recErr) return err(recErr.message, 500);

        await audit("run_reconciliation", "system", null, null, null,
          { issue_count: (reconcResult as any)?.issue_count });

        result = reconcResult;
        break;
      }

      default:
        return err(`Unknown action: ${action}`);
    }

    // ── Store idempotency ──
    if (idempotencyKey && result) {
      await admin.from("idempotency_keys").upsert({
        key: idempotencyKey, action: action as string, user_id: userId, result,
      }).catch(() => {});
    }

    return json(result);
  } catch (e) {
    console.error("Payment function error:", e);
    return err(e instanceof Error ? e.message : "Internal error", 500);
  }
});
