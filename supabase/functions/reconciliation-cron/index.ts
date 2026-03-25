import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // Run reconciliation
    const { data: reconcResult, error: recErr } = await admin.rpc("run_reconciliation");
    if (recErr) throw recErr;

    const issueCount = (reconcResult as any)?.issue_count ?? 0;

    // Auto-approve expired deliveries
    const { data: expiredOrders } = await admin
      .from("orders").select("id, title, publisher_id, buyer_id, proof_url, delivered_at")
      .eq("status", "delivered")
      .lt("auto_approve_at", new Date().toISOString())
      .not("auto_approve_at", "is", null);

    let autoApproved = 0;
    if (expiredOrders) {
      for (const order of expiredOrders) {
        if (!order.delivered_at) continue;

        const { error } = await admin.rpc("release_escrow", { _order_id: order.id });
        if (!error) {
          autoApproved++;
          // Send pre-approval notification was already sent at delivery; this is final
          await admin.from("notifications").insert([
            { user_id: order.buyer_id, type: "order" as const, title: "Order Auto-Approved",
              message: `Order "${order.title}" auto-approved after 72h.`, link: "/buyer/orders" },
            { user_id: order.publisher_id, type: "payment" as const, title: "Payment Released",
              message: `Payment for "${order.title}" auto-released.`, link: "/publisher/earnings" },
          ]);

          await admin.rpc("write_audit_log", {
            _actor_id: null, _actor_type: "cron",
            _action: "auto_approve", _entity_type: "order", _entity_id: order.id,
            _previous_state: JSON.stringify({ status: "delivered" }),
            _new_state: JSON.stringify({ status: "completed" }),
            _metadata: JSON.stringify({ trigger: "cron_72h" }),
          });
        } else {
          console.error(`Cron auto-approve failed for ${order.id}:`, error);
        }
      }
    }

    // Send pre-approval warnings (orders delivered >48h but <72h ago, not yet warned)
    const { data: warningOrders } = await admin
      .from("orders").select("id, title, buyer_id, auto_approve_at")
      .eq("status", "delivered")
      .not("auto_approve_at", "is", null)
      .gt("auto_approve_at", new Date().toISOString())
      .lt("auto_approve_at", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

    let warnings = 0;
    if (warningOrders) {
      for (const order of warningOrders) {
        // Check if warning already sent
        const { data: existingNotif } = await admin
          .from("notifications").select("id")
          .eq("user_id", order.buyer_id)
          .eq("title", "Auto-Approval Reminder")
          .ilike("message", `%${order.id.slice(0, 8)}%`)
          .limit(1);
        
        if (!existingNotif || existingNotif.length === 0) {
          await admin.from("notifications").insert({
            user_id: order.buyer_id, type: "order",
            title: "Auto-Approval Reminder",
            message: `Order "${order.title}" will be auto-approved soon. Review now if needed. [${order.id.slice(0, 8)}]`,
            link: "/buyer/orders",
          });
          warnings++;
        }
      }
    }

    const summary = {
      reconciliation_issues: issueCount,
      auto_approved: autoApproved,
      warnings_sent: warnings,
      run_at: new Date().toISOString(),
    };

    console.log("Cron summary:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Cron error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
